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
const config_1 = require("./config");
const useDevelopmentSorbetStorageKey = 'sorbet.useDevelopmentSorbet';
var SorbetMessageAction;
(function (SorbetMessageAction) {
    SorbetMessageAction[SorbetMessageAction["useWorkspace"] = 0] = "useWorkspace";
    SorbetMessageAction[SorbetMessageAction["useDevelopment"] = 1] = "useDevelopment";
})(SorbetMessageAction || (SorbetMessageAction = {}));
function nop() { }
class SorbetConfigPicker {
    constructor(workspaceState) {
        this.workspaceState = workspaceState;
        this.onConfigChange = nop;
        const availableConfigs = config_1.default(this.workspaceState);
        this._currentConfig = this.useDevelopmentSorbet
            ? availableConfigs.development
            : availableConfigs.workspace;
        vscode_1.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('sorbet')) {
                this._refreshConfig();
            }
        });
    }
    _refreshConfig() {
        const availableConfigs = config_1.default(this.workspaceState);
        this._updateConfig(this.useDevelopmentSorbet
            ? availableConfigs.development
            : availableConfigs.workspace);
    }
    overrideCurrentIntellisenseSetting(provider) {
        const setting = this.useDevelopmentSorbet
            ? config_1.DEV_INTELLISENSE_PROVIDER_SETTING
            : config_1.INTELLISENSE_PROVIDER_SETTING;
        this.workspaceState.update(setting, provider);
        this._refreshConfig();
    }
    get useDevelopmentSorbet() {
        const sorbetConfig = vscode_1.workspace.getConfiguration('sorbet');
        return this.workspaceState.get(useDevelopmentSorbetStorageKey, sorbetConfig.get('useDevelopmentSorbet', false));
    }
    get currentConfig() {
        return this._currentConfig;
    }
    _updateConfig(newConfig) {
        if (!this._currentConfig.equal(newConfig)) {
            const oldConfig = this._currentConfig;
            this._currentConfig = newConfig;
            this.onConfigChange(oldConfig, newConfig);
        }
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            const pickOptions = [];
            const { useDevelopmentSorbet } = this;
            const availableConfigs = config_1.default(this.workspaceState);
            pickOptions.push({
                label: `${!useDevelopmentSorbet ? '• ' : ''}Use Workspace version`,
                description: '',
                detail: availableConfigs.workspace.toString(),
                id: SorbetMessageAction.useWorkspace,
                config: availableConfigs.workspace,
            });
            pickOptions.push({
                label: `${useDevelopmentSorbet ? '• ' : ''}Use Development version`,
                description: '',
                detail: availableConfigs.development.toString(),
                id: SorbetMessageAction.useDevelopment,
                config: availableConfigs.development,
            });
            const selected = yield vscode_1.window.showQuickPick(pickOptions, {
                placeHolder: 'Select the Sorbet version used for Ruby language features',
                ignoreFocusOut: false,
            });
            if (!selected) {
                return;
            }
            const newConfig = selected.config;
            this.workspaceState.update(useDevelopmentSorbetStorageKey, newConfig === availableConfigs.development);
            this._updateConfig(newConfig);
        });
    }
}
exports.default = SorbetConfigPicker;
//# sourceMappingURL=ConfigPicker.js.map