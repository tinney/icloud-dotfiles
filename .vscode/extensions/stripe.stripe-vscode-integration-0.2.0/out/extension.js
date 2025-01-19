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
const vscode_1 = require("vscode");
const intellisense_1 = require("./vscode-ruby/providers/intellisense");
const ConfigPicker_1 = require("./ConfigPicker");
const config_1 = require("./config");
const LanguageClient_1 = require("./LanguageClient");
const types_1 = require("./types");
const SorbetStatusBarEntry_1 = require("./SorbetStatusBarEntry");
const veneur_1 = require("./veneur");
/**
 * Extension entrypoint.
 */
function activate(context) {
    const configPicker = new ConfigPicker_1.default(context.workspaceState);
    configPicker.onConfigChange = handleConfigChange;
    const outputChannel = vscode_1.window.createOutputChannel('Sorbet');
    const statusBarEntry = new SorbetStatusBarEntry_1.default(outputChannel, configPicker, restartSorbet);
    const rubyLocate = new intellisense_1.default({
        goToDefinition: false,
        documentSymbol: false,
        workspaceSymbol: false,
    });
    const emitMetric = veneur_1.default.bind(null, configPicker, outputChannel);
    let activeSorbetLanguageClient = null;
    context.subscriptions.push(outputChannel, statusBarEntry, rubyLocate);
    function stopSorbet(newStatus) {
        if (activeSorbetLanguageClient) {
            activeSorbetLanguageClient.dispose();
            // Garbage collect the language client.
            const i = context.subscriptions.indexOf(activeSorbetLanguageClient);
            if (i !== -1) {
                context.subscriptions.splice(i, 1);
            }
            activeSorbetLanguageClient = null;
        }
        // Reset status bar state impacted by previous language client.
        statusBarEntry.clearOperations();
        statusBarEntry.changeServerStatus(newStatus);
    }
    let lastRestart = 0;
    let recentRestartCount = 0;
    const maxRestartCount = 10;
    function restartSorbet(reason) {
        if (configPicker.currentConfig.intellisenseProvider !==
            config_1.IntellisenseProvider.SORBET) {
            vscode_1.window.showErrorMessage(`Cannot restart the Sorbet server because Sorbet is disabled.`);
            return;
        }
        stopSorbet(2 /* RESTARTING */);
        // Prevent Sorbet from entering a crash loop for too long.
        const now = Date.now();
        // Clear if Sorbet successfully ran for more than 15 seconds.
        // (Note: This includes the time we spent sleeping to debounce restarts.)
        if (now - lastRestart > 15000) {
            recentRestartCount = 0;
        }
        recentRestartCount += 1;
        lastRestart = now;
        if (recentRestartCount >= maxRestartCount) {
            emitMetric('error.too_many_restarts', 1);
            statusBarEntry.changeServerStatus(5 /* ERROR */, `Unable to start Sorbet after ${maxRestartCount} attempts. Sorbet is disabled until you decide to restart it.`);
            recentRestartCount = 0;
            return;
        }
        // NOTE: `reason` is an enum type with a small and finite number of values.
        emitMetric(`restart.${reason}`, 1);
        startSorbet();
    }
    let lastSorbetRetryTime = 0;
    const minTimeBetweenRetries = 7000;
    // Mutex for startSorbet. Prevents us from starting multiple processes at once.
    let isStarting = false;
    function startSorbet() {
        return __awaiter(this, void 0, void 0, function* () {
            if (isStarting)
                return;
            const currentTime = Date.now();
            // Debounce by 7 seconds. Returns 0 if the calculated time to sleep is negative.
            const timeToSleep = Math.max(0, minTimeBetweenRetries - (currentTime - lastSorbetRetryTime));
            if (timeToSleep > 0) {
                console.log(`Waiting ${timeToSleep.toFixed(0)} ms before restarting Sorbet...`);
            }
            // Wait timeToSleep ms. Use mutex, as this yields the event loop for future events.
            isStarting = true;
            yield new Promise((res) => setTimeout(res, timeToSleep));
            isStarting = false;
            if (configPicker.currentConfig.intellisenseProvider !==
                config_1.IntellisenseProvider.SORBET) {
                // User disabled Sorbet during sleep period.
                return;
            }
            lastSorbetRetryTime = Date.now();
            const sorbet = new LanguageClient_1.default(configPicker, outputChannel, filterUpdatesFromOldClients(restartSorbet));
            activeSorbetLanguageClient = sorbet;
            context.subscriptions.push(activeSorbetLanguageClient);
            // Helper function. Drops any status updates and operations from old clients that are in the process of shutting down.
            function filterUpdatesFromOldClients(fn) {
                return (...args) => {
                    if (activeSorbetLanguageClient !== sorbet) {
                        return;
                    }
                    return fn(...args);
                };
            }
            // Pipe updates to status bar, and reset status bar state impacted by previous language client.
            statusBarEntry.changeServerStatus(sorbet.status, sorbet.lastError);
            sorbet.onStatusChange = filterUpdatesFromOldClients((status) => {
                statusBarEntry.changeServerStatus(status, sorbet.lastError);
            });
            sorbet.languageClient.onReady().then(filterUpdatesFromOldClients(() => {
                sorbet.languageClient.onNotification('sorbet/showOperation', filterUpdatesFromOldClients(statusBarEntry.handleShowOperation.bind(statusBarEntry)));
                const { initializeResult } = sorbet.languageClient;
                const rubyLocateDisabled = configPicker.currentConfig.disableRubyLocateInSorbetMode;
                if (initializeResult) {
                    const caps = initializeResult.capabilities;
                    rubyLocate.refreshConfig({
                        goToDefinition: !rubyLocateDisabled && !caps.definitionProvider,
                        documentSymbol: !rubyLocateDisabled && !caps.documentSymbolProvider,
                        workspaceSymbol: !rubyLocateDisabled && !caps.workspaceSymbolProvider,
                    });
                }
            }));
        });
    }
    context.subscriptions.push(vscode_1.commands.registerCommand('sorbet.restartServer', restartSorbet.bind(null, types_1.RestartReason.COMMAND)));
    context.subscriptions.push(vscode_1.commands.registerCommand('sorbet.selectConfig', configPicker.show.bind(configPicker)));
    context.subscriptions.push(vscode_1.commands.registerCommand('sorbet.enableSorbet', () => {
        configPicker.overrideCurrentIntellisenseSetting(config_1.IntellisenseProvider.SORBET);
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('sorbet.showOutput', () => {
        outputChannel.show();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('sorbet.disableSorbet', () => {
        configPicker.overrideCurrentIntellisenseSetting(config_1.IntellisenseProvider.RUBY_LOCATE);
    }));
    function handleConfigChange(oldConfig, newConfig) {
        if (oldConfig) {
            if (oldConfig.intellisenseProvider === config_1.IntellisenseProvider.SORBET) {
                if (newConfig.intellisenseProvider === config_1.IntellisenseProvider.SORBET) {
                    // We're still in Sorbet mode.
                    return restartSorbet(types_1.RestartReason.CONFIG_CHANGE);
                }
                // Switching from Sorbet => not sorbet. Stop Sorbet and fall through.
                stopSorbet(0 /* NONE */);
            }
            else if (oldConfig.intellisenseProvider === config_1.IntellisenseProvider.RUBY_LOCATE &&
                newConfig.intellisenseProvider !== config_1.IntellisenseProvider.RUBY_LOCATE) {
                // Stop RubyLocate.
                rubyLocate.refreshConfig({
                    goToDefinition: false,
                    documentSymbol: false,
                    workspaceSymbol: false,
                });
            }
        }
        switch (newConfig.intellisenseProvider) {
            case config_1.IntellisenseProvider.SORBET:
                startSorbet();
                break;
            case config_1.IntellisenseProvider.RUBY_LOCATE:
                statusBarEntry.changeServerStatus(1 /* RUBY_LOCATE */);
                rubyLocate.refreshConfig({
                    goToDefinition: true,
                    documentSymbol: true,
                    workspaceSymbol: true,
                });
                break;
            default:
                // None.
                break;
        }
    }
    // Start the extension.
    handleConfigChange(null, configPicker.currentConfig);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map