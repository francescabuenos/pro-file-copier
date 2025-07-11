"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const commands_1 = require("./commands");
/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
function activate(context) {
    // Register the commands defined in package.json
    context.subscriptions.push(vscode.commands.registerCommand('pro-file-copier.copyPaths', (uri, uris) => {
        (0, commands_1.copyPaths)(uris || [uri]);
    }), vscode.commands.registerCommand('pro-file-copier.copyContent', (uri, uris) => {
        (0, commands_1.copyContent)(uris || [uri]);
    }), vscode.commands.registerCommand('pro-file-copier.copyContentWithDiagnostics', (uri, uris) => {
        (0, commands_1.copyContentWithDiagnostics)(uris || [uri]);
    }));
}
/**
 * This method is called when your extension is deactivated.
 */
function deactivate() { }
//# sourceMappingURL=extension.js.map