"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
var IntellisenseProvider;
(function (IntellisenseProvider) {
    IntellisenseProvider["SORBET"] = "sorbet";
    IntellisenseProvider["RUBY_LOCATE"] = "rubyLocate";
    IntellisenseProvider["NONE"] = "none";
})(IntellisenseProvider = exports.IntellisenseProvider || (exports.IntellisenseProvider = {}));
exports.INTELLISENSE_PROVIDER_SETTING = 'sorbet.intellisenseProvider';
exports.DEV_INTELLISENSE_PROVIDER_SETTING = 'sorbet.devIntellisenseProvider';
class SorbetExtensionConfig {
    constructor({ name, runWith, sorbetPath, logLevel, extraArgs, disableRubyLocateInSorbetMode, intellisenseProvider, revealOutputOnError, }) {
        this.name = name;
        this.runWith = runWith;
        this.sorbetPath = sorbetPath;
        this.logLevel = logLevel;
        this.extraArgs = extraArgs;
        this.disableRubyLocateInSorbetMode = disableRubyLocateInSorbetMode;
        this.intellisenseProvider = intellisenseProvider;
        this.revealOutputOnError = revealOutputOnError;
    }
    equal(other) {
        return JSON.stringify(this) === JSON.stringify(other);
    }
    get command() {
        if (this.runWith.length > 0) {
            return this.runWith[0];
        }
        else {
            return this.sorbetPath;
        }
    }
    get args() {
        const logLevelArgs = [];
        for (let i = 0; i < this.logLevel; i += 1) {
            logLevelArgs.push('-v');
        }
        const sorbetArgs = ['--lsp'].concat(logLevelArgs, this.extraArgs);
        if (this.runWith.length > 0) {
            return this.runWith.slice(1).concat(this.sorbetPath, sorbetArgs);
        }
        else {
            return sorbetArgs;
        }
    }
    toJSON() {
        return {
            name: this.name,
            runWith: this.runWith,
            sorbetPath: this.sorbetPath,
            logLevel: this.logLevel,
            extraArgs: this.extraArgs,
            disableRubyLocateInSorbetMode: this.disableRubyLocateInSorbetMode,
            intellisenseProvider: this.intellisenseProvider,
            revealOutputOnError: this.revealOutputOnError,
        };
    }
    toString() {
        return `${this.command} ${this.args.join(' ')}`;
    }
}
exports.SorbetExtensionConfig = SorbetExtensionConfig;
/**
 * Get the Sorbet configuration determined by the workspace's settings.
 */
function getWorkspaceConfig(workspaceState) {
    const sorbetConfig = vscode_1.workspace.getConfiguration('sorbet');
    return new SorbetExtensionConfig({
        name: 'Sorbet - Workspace Version',
        runWith: sorbetConfig.get('runWith', []),
        sorbetPath: sorbetConfig.get('sorbetPath', 'sorbet'),
        logLevel: sorbetConfig.get('logLevel', 0),
        extraArgs: sorbetConfig.get('extraArgs', []),
        disableRubyLocateInSorbetMode: sorbetConfig.get('disableRubyLocateInSorbetMode', false),
        // If the override is set, prefer the override over the hardcoded config.
        intellisenseProvider: workspaceState.get(exports.INTELLISENSE_PROVIDER_SETTING, sorbetConfig.get('intellisenseProvider', IntellisenseProvider.NONE)),
        revealOutputOnError: sorbetConfig.get('revealOutputOnError', false),
    });
}
/**
 * Get the Sorbet development configuration, which uses a locally-built Sorbet.
 */
function getDevelopmentConfig(workspaceState) {
    const sorbetConfig = vscode_1.workspace.getConfiguration('sorbet');
    return new SorbetExtensionConfig({
        name: 'Sorbet - Development Version',
        runWith: sorbetConfig.get('devRunWith', []),
        // ~ isn't supported in these paths, so we cheat a bit here.
        sorbetPath: sorbetConfig
            .get('devSorbetPath', `~/stripe/sorbet/bazel-bin/main/sorbet`)
            .replace('~', process.env.HOME || ''),
        logLevel: sorbetConfig.get('devLogLevel', 1),
        extraArgs: sorbetConfig.get('devExtraArgs', []),
        disableRubyLocateInSorbetMode: sorbetConfig.get('disableRubyLocateInSorbetMode', false),
        intellisenseProvider: workspaceState.get(exports.DEV_INTELLISENSE_PROVIDER_SETTING, IntellisenseProvider.SORBET),
        revealOutputOnError: sorbetConfig.get('revealOutputOnError', false),
    });
}
/**
 * Returns all available Sorbet configurations.
 */
function getAvailableConfigs(workspaceState) {
    return {
        workspace: getWorkspaceConfig(workspaceState),
        development: getDevelopmentConfig(workspaceState),
    };
}
exports.default = getAvailableConfigs;
//# sourceMappingURL=config.js.map