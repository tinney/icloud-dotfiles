"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Spinner = require("elegant-spinner");
const vscode_1 = require("vscode");
const types_1 = require("./types");
const config_1 = require("./config");
// Removes "Sorbet: " prefix from string.
// TODO: Remove once server is updated.
function stripSorbetPrefix(s) {
    const prefix = 'Sorbet: ';
    if (s.startsWith(prefix)) {
        return s.slice(prefix.length);
    }
    return s;
}
var Action;
(function (Action) {
    Action["EnableSorbet"] = "Enable Sorbet (Beta)";
    Action["RestartSorbet"] = "Restart Sorbet";
    Action["SwitchToRubyLocate"] = "Disable Sorbet";
    Action["ViewOutput"] = "View Output";
    Action["RunPayUp"] = "Run Pay Up";
})(Action || (Action = {}));
class SorbetStatusBarEntry {
    constructor(_outputChannel, _configPicker, _restartSorbet) {
        this._outputChannel = _outputChannel;
        this._configPicker = _configPicker;
        this._restartSorbet = _restartSorbet;
        this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 10);
        this._operationStack = [];
        this._serverStatus = 1 /* RUBY_LOCATE */;
        this._lastError = '';
        this._spinner = Spinner();
        // Note: Internal command. Not advertised to users in `package.json`.
        const statusBarClickedCommand = 'sorbet.statusBarClicked';
        this._statusBarItem.command = statusBarClickedCommand;
        this._statusBarItem.show();
        vscode_1.commands.registerCommand(statusBarClickedCommand, this.handleStatusBarClicked.bind(this));
    }
    _runAction(action) {
        switch (action) {
            case Action.RunPayUp: {
                const terminal = vscode_1.window.createTerminal('pay up');
                terminal.show(true);
                terminal.sendText('pay up', true);
                setTimeout(() => {
                    if (this._serverStatus === 5 /* ERROR */) {
                        this._restartSorbet(types_1.RestartReason.PAY_UP);
                    }
                }, 10000);
                break;
            }
            case Action.ViewOutput:
                this._outputChannel.show();
                break;
            case Action.EnableSorbet:
                this._configPicker.overrideCurrentIntellisenseSetting(config_1.IntellisenseProvider.SORBET);
                break;
            case Action.SwitchToRubyLocate:
                this._configPicker.overrideCurrentIntellisenseSetting(config_1.IntellisenseProvider.RUBY_LOCATE);
                break;
            case Action.RestartSorbet:
                this._restartSorbet(types_1.RestartReason.CRASH);
                break;
            default:
                // Nothing selected.
                break;
        }
    }
    handleStatusBarClicked() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this._serverStatus) {
                case 0 /* NONE */:
                    return;
                case 5 /* ERROR */: {
                    const actions = [
                        Action.ViewOutput,
                        Action.SwitchToRubyLocate,
                        Action.RestartSorbet,
                    ];
                    if (this._lastError.indexOf('pay up') !== -1) {
                        actions.unshift(Action.RunPayUp);
                    }
                    this._runAction(yield vscode_1.window.showErrorMessage(this._lastError, ...actions));
                    return;
                }
                case 1 /* RUBY_LOCATE */: {
                    // Switch to Sorbet option.
                    this._runAction(yield vscode_1.window.showInformationMessage('Sorbet is currently disabled.', Action.EnableSorbet));
                    break;
                }
                default: {
                    this._runAction(yield vscode_1.window.showInformationMessage('What would you like to do?', Action.ViewOutput, Action.SwitchToRubyLocate, Action.RestartSorbet));
                    break;
                }
            }
        });
    }
    changeServerStatus(s, lastError = '') {
        const isError = this._serverStatus !== s && s === 5 /* ERROR */;
        this._serverStatus = s;
        this._lastError = lastError;
        this.render();
        if (isError) {
            // Show error to the user.
            this.handleStatusBarClicked();
        }
    }
    handleShowOperation(p) {
        if (p.status === 'end') {
            this._operationStack = this._operationStack.filter((otherP) => otherP.operationName !== p.operationName);
        }
        else {
            this._operationStack.push(p);
        }
        this.render();
    }
    clearOperations() {
        this._operationStack = [];
        this.render();
    }
    dispose() {
        this._statusBarItem.dispose();
    }
    _getSpinner() {
        if (this._spinnerTimer) {
            clearTimeout(this._spinnerTimer);
        }
        // Animate the spinner with setTimeout.
        this._spinnerTimer = setTimeout(this.render.bind(this), 100);
        return this._spinner();
    }
    render() {
        const numOperations = this._operationStack.length;
        let text = null;
        let tooltip = null;
        // Errors should suppress operation animations / feedback.
        if (this._serverStatus !== 5 /* ERROR */ && numOperations > 0) {
            const latestOp = this._operationStack[numOperations - 1];
            text = `${stripSorbetPrefix(latestOp.description)} ${this._getSpinner()}`;
            tooltip = latestOp.description;
        }
        else {
            switch (this._serverStatus) {
                case 0 /* NONE */:
                    return;
                case 5 /* ERROR */:
                    text = `Error.`;
                    tooltip = `${this._lastError} Click for remediation items.`;
                    break;
                case 3 /* INITIALIZING */:
                    text = `Initializing ${this._getSpinner()}`;
                    tooltip = 'The Sorbet server is initializing.';
                    break;
                case 2 /* RESTARTING */:
                    text = `Restarting ${this._getSpinner()}`;
                    tooltip = 'The Sorbet server is restarting.';
                    break;
                case 1 /* RUBY_LOCATE */:
                    text = 'Disabled.';
                    tooltip =
                        'Sorbet is disabled. Ruby language services are currently provided by Ruby Locate instead.';
                    break;
                case 4 /* RUNNING */:
                    text = `Idle.`;
                    tooltip = 'The Sorbet server is currently running.';
                    break;
                default:
                    this._outputChannel.appendLine(`Invalid ServerStatus: ${this._serverStatus}`);
                    text = '';
                    tooltip = '';
                    break;
            }
        }
        // Lean on the TypeScript compiler and assert that these are assigned on all paths above.
        const textString = text;
        const tooltipString = tooltip;
        const isDev = this._configPicker.currentConfig.name === 'Sorbet - Development Version';
        this._statusBarItem.text = `Sorbet${isDev ? ' (Dev)' : ''}: ${textString}`;
        this._statusBarItem.tooltip = tooltipString;
    }
}
exports.default = SorbetStatusBarEntry;
//# sourceMappingURL=SorbetStatusBarEntry.js.map