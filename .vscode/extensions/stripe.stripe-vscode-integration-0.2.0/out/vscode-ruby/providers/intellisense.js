"use strict";
// Adapted from https://github.com/rubyide/vscode-ruby/blob/5c8f5970b081cdf1a3a3f98d155b28295b6dd2e7/src/providers/intellisense.ts
// Having this file allows us to gracefully fallback to the `vscode-ruby` behaviour when Sorbet go-to-definition / symbol lookup is disabled.
// Both vscode-ruby intellisense and sorbet LSP cannot be enabled together, without producing duplicate results.
// We disable intellisense in vscode-ruby and import the code here so we can selectively enable it.
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const locate_1 = require("../locate/locate");
class RubyLocateIntellisenseProvider {
    constructor(_config) {
        this._config = _config;
        this._subscriptions = [];
        this._locate = null;
        this.restart();
    }
    dispose() {
        this._subscriptions.forEach((s) => s.dispose());
        this._subscriptions = [];
        if (this._locate) {
            // Stop indexing.
            this._locate.kill();
            this._locate = null;
        }
    }
    /**
     * If config has changed, restart RubyLocate with new config..
     */
    refreshConfig(newConfig) {
        if (newConfig.goToDefinition !== this._config.goToDefinition ||
            newConfig.documentSymbol !== this._config.documentSymbol ||
            newConfig.workspaceSymbol !== this._config.workspaceSymbol) {
            this._config = newConfig;
            this.restart();
        }
    }
    /**
     * Restart RubyLocate. Disposes of all previous subscriptions and creates new ones.
     */
    restart() {
        this.dispose();
        if (!this._config.goToDefinition &&
            !this._config.documentSymbol &&
            !this._config.workspaceSymbol) {
            // No features enabled.
            return;
        }
        const settings = vscode_1.workspace.getConfiguration('ruby.locate') || {};
        this._locate = new locate_1.Locate(vscode_1.workspace.rootPath, settings);
        const refreshLocate = () => {
            const progressOptions = {
                location: vscode_1.ProgressLocation.Window,
                title: '[RubyLocate] Indexing Ruby source files',
            };
            vscode_1.window.withProgress(progressOptions, () => this._locate.walk());
        };
        refreshLocate();
        const watch = vscode_1.workspace.createFileSystemWatcher(settings.include);
        this._subscriptions.push(watch);
        this._subscriptions.push(watch.onDidChange((uri) => this._locate.parse(uri.fsPath)));
        this._subscriptions.push(watch.onDidCreate((uri) => this._locate.parse(uri.fsPath)));
        this._subscriptions.push(watch.onDidDelete((uri) => this._locate.rm(uri.fsPath)));
        const locationConverter = (match) => new vscode_1.Location(vscode_1.Uri.file(match.file), new vscode_1.Position(match.line, match.char));
        const defProvider = {
            provideDefinition: (doc, pos) => {
                const txt = doc.getText(doc.getWordRangeAtPosition(pos));
                return this._locate.find(txt).then((matches) => matches.map(locationConverter));
            },
        };
        if (this._config.goToDefinition) {
            this._subscriptions.push(vscode_1.languages.registerDefinitionProvider(['ruby', 'erb'], defProvider));
        }
        const symbolKindTable = {
            class: () => vscode_1.SymbolKind.Class,
            module: () => vscode_1.SymbolKind.Module,
            method: (symbolInfo) => symbolInfo.name === 'initialize'
                ? vscode_1.SymbolKind.Constructor
                : vscode_1.SymbolKind.Method,
            classMethod: () => vscode_1.SymbolKind.Method,
        };
        const defaultSymbolKind = (symbolInfo) => {
            console.warn(`Unknown symbol kind: ${symbolInfo.kind}`);
            return vscode_1.SymbolKind.Variable;
        };
        // NOTE: Workaround for high CPU usage on IPC (channel.onread) when too many symbols returned.
        // For channel.onread see issue like this: https://github.com/Microsoft/vscode/issues/6026
        const numOfSymbolLimit = 3000;
        const symbolsConverter = (matches) => matches.slice(0, numOfSymbolLimit).map((match) => {
            const symbolKind = (symbolKindTable[match.type] ||
                defaultSymbolKind)(match);
            return new vscode_1.SymbolInformation(match.name, symbolKind, match.containerName, locationConverter(match));
        });
        const docSymbolProvider = {
            provideDocumentSymbols: (document, _) => {
                return this._locate.listInFile(document.fileName).then(symbolsConverter);
            },
        };
        if (this._config.documentSymbol) {
            this._subscriptions.push(vscode_1.languages.registerDocumentSymbolProvider(['ruby', 'erb'], docSymbolProvider));
        }
        const workspaceSymbolProvider = {
            provideWorkspaceSymbols: (query, _) => {
                return this._locate.query(query).then(symbolsConverter);
            },
        };
        if (this._config.workspaceSymbol) {
            this._subscriptions.push(vscode_1.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider));
        }
    }
}
exports.default = RubyLocateIntellisenseProvider;
//# sourceMappingURL=intellisense.js.map