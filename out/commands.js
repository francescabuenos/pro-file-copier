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
exports.copyPaths = copyPaths;
exports.copyContent = copyContent;
exports.copyContentWithDiagnostics = copyContentWithDiagnostics;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const file_system_1 = require("./file-system");
const linter_1 = require("./linter");
// Shared function to run operations with a progress indicator
async function runWithProgress(title, task) {
    let result = '';
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
    }, async (progress) => {
        result = await task(progress);
    });
    return result;
}
/**
 * Command 1: Copies the relative paths of selected files.
 */
async function copyPaths(uris) {
    const task = async (progress) => {
        progress.report({ message: 'Gathering file paths...' });
        const allFilePaths = await (0, file_system_1.getFilePaths)(uris);
        if (allFilePaths.length === 0)
            return '';
        const root = (0, file_system_1.getWorkspaceRoot)();
        return allFilePaths.map(p => path.relative(root.uri.fsPath, p)).join('\n');
    };
    const finalPaths = await runWithProgress('Copying File Paths', task);
    if (finalPaths) {
        await vscode.env.clipboard.writeText(finalPaths);
        // Corrected: Added dynamic count to the information message.
        const pathCount = finalPaths.split('\n').length;
        vscode.window.showInformationMessage(`Copied ${pathCount} file path(s) to clipboard.`);
    }
    else {
        vscode.window.showWarningMessage('No files found to copy.');
    }
}
/**
 * Command 2: Copies the content of selected files with headers.
 */
async function copyContent(uris) {
    const config = vscode.workspace.getConfiguration('pro-file-copier');
    const headerFormat = config.get('headerFormat', '// File: {path}');
    // We need to get the file paths once to use for the final message.
    const allFilePaths = await (0, file_system_1.getFilePaths)(uris);
    if (allFilePaths.length === 0) {
        vscode.window.showWarningMessage('No files found to copy.');
        return;
    }
    const task = async (progress) => {
        let combinedContent = '';
        const increment = 100 / allFilePaths.length;
        const root = (0, file_system_1.getWorkspaceRoot)();
        for (const filePath of allFilePaths) {
            const relativePath = path.relative(root.uri.fsPath, filePath);
            // Corrected: 'Processing' is now a string template.
            progress.report({ message: `Processing ${relativePath}`, increment });
            const header = headerFormat.replace('{path}', relativePath) + '\n';
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                // Corrected: Properly formatted the string concatenation with backticks and added the file content.
                combinedContent += `${header}${content}\n\n`;
            }
            catch (error) {
                // Corrected: Fixed console.error message formatting.
                console.error(`Error reading file ${filePath}:`, error);
                // Corrected: Fixed string concatenation.
                combinedContent += `${header}// Error: Could not read file.\n\n`;
            }
        }
        return combinedContent;
    };
    const finalContent = await runWithProgress('Copying File Contents', task);
    if (finalContent) {
        await vscode.env.clipboard.writeText(finalContent);
        // Corrected: Added dynamic count to the information message.
        vscode.window.showInformationMessage(`Copied content of ${allFilePaths.length} file(s).`);
    }
}
/**
 * Command 3: Copies content plus linter and type-checking errors.
 */
async function copyContentWithDiagnostics(uris) {
    const config = vscode.workspace.getConfiguration('pro-file-copier');
    const headerFormat = config.get('headerFormat', '// File: {path}');
    const task = async (progress) => {
        progress.report({ message: 'Gathering files...' });
        const allFilePaths = await (0, file_system_1.getFilePaths)(uris);
        if (allFilePaths.length === 0)
            return '';
        progress.report({ message: 'Running linters and type checkers...' });
        const diagnostics = await (0, linter_1.getDiagnostics)();
        let combinedContent = '';
        const root = (0, file_system_1.getWorkspaceRoot)();
        for (const filePath of allFilePaths) {
            const relativePath = path.relative(root.uri.fsPath, filePath);
            // Corrected: 'Processing' is now a string template.
            progress.report({ message: `Processing ${relativePath}` });
            const header = headerFormat.replace('{path}', relativePath) + '\n';
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const fileDiagnostics = diagnostics[filePath] || '';
            // Corrected: Properly added the file content.
            combinedContent += `${header}${content}\n\n`;
            if (fileDiagnostics) {
                // Corrected: Properly added the diagnostics block using a string template.
                combinedContent += `/*\n--- Diagnostics for ${relativePath} ---\n${fileDiagnostics}\n*/\n\n`;
            }
        }
        return combinedContent;
    };
    const finalContent = await runWithProgress('Copying Content with Diagnostics', task);
    if (finalContent) {
        await vscode.env.clipboard.writeText(finalContent);
        // Corrected: 'Copied...' is now a proper string literal.
        vscode.window.showInformationMessage('Copied content and diagnostics to clipboard.');
    }
    else {
        vscode.window.showWarningMessage('No files found to copy.');
    }
}
//# sourceMappingURL=commands.js.map