"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const child_process_1 = require("child_process");
const METRIC_PREFIX = 'ruby_typer.lsp.extension.';
/**
 * Emit a metric via Veneur.
 */
function emitMetric(configPicker, outputChannel, metric, count) {
    const tags = new Map();
    // workspace or dev version.
    tags.set('config_type', configPicker.currentConfig.name);
    tags.set('vscode_version', vscode_1.version);
    const sorbetExtension = vscode_1.extensions.getExtension('stripe-vscode-integration');
    if (sorbetExtension) {
        tags.set('version', sorbetExtension.packageJSON.version);
    }
    rawEmitCountMetric(outputChannel, `${METRIC_PREFIX}${metric}`, tags, count);
}
exports.default = emitMetric;
// TODO: Put into a package that can be used by all VS Code extensions.
// This copies logic from the pay test extension.
function rawEmitCountMetric(channel, metric, tags, count) {
    const tagsArray = [];
    tags.forEach((value, key) => {
        tagsArray.push(`${key}:${value}`);
    });
    const tagsString = tagsArray.join(',');
    const veneurEmitProcess = child_process_1.spawn('veneur-emit', [
        '-hostport',
        'laptopstats.corp.stripe.com:8200',
        '-count',
        count.toString(),
        '-name',
        metric,
        '-tag',
        tagsString,
    ]);
    veneurEmitProcess.on('close', (code) => {
        if (code !== 0) {
            channel.appendLine(`Failed to upload metrics. Metric: ${metric}, Count: ${count.toString()}, Tags: ${tagsString}`);
        }
    });
}
exports.rawEmitCountMetric = rawEmitCountMetric;
//# sourceMappingURL=veneur.js.map