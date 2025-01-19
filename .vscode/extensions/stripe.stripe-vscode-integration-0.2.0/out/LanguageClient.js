"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const connections_1 = require("./connections");
const veneur_1 = require("./veneur");
const types_1 = require("./types");
function nop() { }
const VALID_STATE_TRANSITIONS = new Map();
VALID_STATE_TRANSITIONS.set(3 /* INITIALIZING */, new Set([5 /* ERROR */, 4 /* RUNNING */, 2 /* RESTARTING */]));
VALID_STATE_TRANSITIONS.set(4 /* RUNNING */, new Set([5 /* ERROR */, 2 /* RESTARTING */]));
// Restarting is a terminal state. The restart occurs by terminating this LanguageClient and creating a new one.
VALID_STATE_TRANSITIONS.set(2 /* RESTARTING */, new Set([]));
// Error is a terminal state for this class.
VALID_STATE_TRANSITIONS.set(5 /* ERROR */, new Set([]));
class SorbetLanguageClient {
    constructor(_configPicker, _outputChannel, _restart) {
        this._configPicker = _configPicker;
        this._outputChannel = _outputChannel;
        this._restart = _restart;
        this._status = 3 /* INITIALIZING */;
        // If status is ERROR, contains the last error message encountered.
        this._lastError = '';
        // Contains the Sorbet process.
        this._sorbetProcess = null;
        // Tracks disposable subscriptions so we can clean them up when language client is disposed.
        this._subscriptions = [];
        this.onStatusChange = nop;
        this._emitMetric = veneur_1.default.bind(null, this._configPicker, this._outputChannel);
        // Create the language client and start the client.
        this._languageClient = new vscode_languageclient_1.LanguageClient('ruby', 'Sorbet', this._startSorbetProcess.bind(this), {
            documentSelector: [{ language: 'ruby', scheme: 'file' }],
            outputChannel: this._outputChannel,
            initializationOptions: {
                // Opt in to sorbet/showOperation notifications.
                supportsOperationNotifications: true,
            },
            errorHandler: this,
            revealOutputChannelOn: this._configPicker.currentConfig
                .revealOutputOnError
                ? vscode_languageclient_1.RevealOutputChannelOn.Error
                : vscode_languageclient_1.RevealOutputChannelOn.Never,
        });
        this._languageClient.onReady().then(() => {
            // Note: It's possible for `onReady` to fire after `stop()` is called on the language client. :(
            if (this._status !== 5 /* ERROR */) {
                // Language client started successfully.
                this._updateStatus(4 /* RUNNING */);
            }
        });
        this._subscriptions.push(this._languageClient.start());
        this._checkPayUp();
    }
    get languageClient() {
        return this._languageClient;
    }
    get status() {
        return this._status;
    }
    get lastError() {
        return this._lastError;
    }
    _checkPayUp() {
        // If the user is running Sorbet via `pay exec`, regularly check that `pay up` is running.
        const payUpInterval = 60000; // 1 minute
        if (this._configPicker.currentConfig.command === 'pay') {
            const checkPayUp = () => {
                // Hacky, but it works.
                child_process_1.exec('pay exec true', (_err, stdout, stderr) => {
                    const output = stdout.toString() + stderr.toString();
                    const payIsRunning = output.indexOf('`pay up` is not running.') === -1;
                    if (!payIsRunning) {
                        this._emitMetric('error.pay_up', 1);
                        this._lastError =
                            '`pay up` is not running. Sorbet will not function correctly.';
                        this._updateStatus(5 /* ERROR */);
                        // Stop the language server.
                        this.dispose();
                    }
                });
            };
            this._payUpCheck = setInterval(checkPayUp, payUpInterval);
            checkPayUp();
        }
    }
    /**
     * Implements the disposable interface so this object can be added to the context's subscriptions
     * to keep it alive. Stops the language server and Sorbet processes, and removes UI items.
     */
    dispose() {
        this._subscriptions.forEach((s) => s.dispose());
        this._subscriptions = [];
        let stopped = false;
        /*
         * stop() only invokes the then() callback after the language server
         * ACKs the stop request.
         * Stopping can time out if the language client is repeatedly failing to
         * start (e.g. if network is down, or path to Sorbet is incorrect), or if
         * Sorbet never ACKs the stop request.
         * In the former case (which is the common case), VS code stops retrying
         * the connection after we call stop(), but never invokes our callback.
         * Thus, our solution is to wait 5 seconds for a callback, and stop the
         * process if we haven't heard back.
         */
        const stopTimer = setTimeout(() => {
            stopped = true;
            this._emitMetric('stop.timed_out', 1);
            connections_1.stopProcess(this._sorbetProcess);
            this._sorbetProcess = null;
        }, 5000);
        this._languageClient.stop().then(() => {
            if (!stopped) {
                clearTimeout(stopTimer);
                this._emitMetric('stop.success', 1);
                this._outputChannel.appendLine('Sorbet has stopped.');
            }
        });
        if (this._payUpCheck) {
            clearInterval(this._payUpCheck);
            this._payUpCheck = undefined;
        }
    }
    /**
     * Updates the language client's server status. Verifies that the transition is legal.
     */
    _updateStatus(newStatus) {
        if (this._status === newStatus) {
            return;
        }
        this._assertValid(this._status, newStatus);
        this._status = newStatus;
        this.onStatusChange(newStatus);
    }
    _assertValid(from, to) {
        const set = VALID_STATE_TRANSITIONS.get(from);
        if (!set || !set.has(to)) {
            this._outputChannel.appendLine(`Invalid Sorbet server transition: ${from} => ${to}`);
        }
    }
    /**
     * Runs a Sorbet process using the current active configuration. Debounced so that it runs Sorbet at most every 3 seconds.
     */
    _startSorbetProcess() {
        this._updateStatus(3 /* INITIALIZING */);
        const { currentConfig } = this._configPicker;
        this._outputChannel.appendLine('Running Sorbet with the following command:');
        this._outputChannel.appendLine(currentConfig.toString());
        this._sorbetProcess = child_process_1.spawn(currentConfig.command, currentConfig.args, {
            cwd: vscode_1.workspace.rootPath,
        });
        const onExit = (err) => {
            if (err &&
                this._status === 3 /* INITIALIZING */ &&
                err.code === 'ENOENT') {
                this._emitMetric('error.enoent', 1);
                // We failed to start the process. The path to Sorbet is likely incorrect.
                this._lastError = `Could not start Sorbet with command: '${currentConfig.toString()}'. Encountered error '${err.message}'. Is the path to Sorbet correct?`;
                this._updateStatus(5 /* ERROR */);
            }
            this._sorbetProcess = null;
        };
        // N.B.: 'exit' is sometimes not invoked if the process exits with an error/fails to start, as per the Node.js docs.
        // So, we need to handle both events. ¯\_(ツ)_/¯
        this._sorbetProcess.on('exit', onExit);
        this._sorbetProcess.on('error', onExit);
        return Promise.resolve(this._sorbetProcess);
    }
    /** ErrorHandler interface */
    /**
     * LanguageClient has built-in restart capabilities, but it's broken:
     * * It drops all `onNotification` subscriptions after restarting, so we'll miss ShowNotification updates.
     * * It drops all `onReady` subscriptions after restarting, so we won't know when the Sorbet server is running.
     * * It doesn't reset `onReady` state, so we can't even reset our `onReady` callback.
     */
    error() {
        if (this._status !== 5 /* ERROR */) {
            this._updateStatus(2 /* RESTARTING */);
            this._restart(types_1.RestartReason.CRASH);
        }
        return vscode_languageclient_1.ErrorAction.Shutdown;
    }
    /**
     * Note: If the VPN is disconnected, then Sorbet will repeatedly fail to start.
     */
    closed() {
        if (this._status !== 5 /* ERROR */) {
            this._updateStatus(2 /* RESTARTING */);
            this._restart(types_1.RestartReason.CRASH);
        }
        return vscode_languageclient_1.CloseAction.DoNotRestart;
    }
}
exports.default = SorbetLanguageClient;
//# sourceMappingURL=LanguageClient.js.map