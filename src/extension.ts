import * as vscode from 'vscode';
import { copyPaths, copyContent, copyContentWithDiagnostics } from './commands';

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
export function activate(context: vscode.ExtensionContext) {
    // Register the commands defined in package.json
    context.subscriptions.push(
        vscode.commands.registerCommand('pro-file-copier.copyPaths', (uri: vscode.Uri, uris: vscode.Uri[]) => {
            copyPaths(uris || [uri]);
        }),
        vscode.commands.registerCommand('pro-file-copier.copyContent', (uri: vscode.Uri, uris: vscode.Uri[]) => {
            copyContent(uris || [uri]);
        }),
        vscode.commands.registerCommand('pro-file-copier.copyContentWithDiagnostics', (uri: vscode.Uri, uris: vscode.Uri[]) => {
            copyContentWithDiagnostics(uris || [uri]);
        })
    );
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {}
