import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getFilePaths, getWorkspaceRoot } from './file-system';
import { getDiagnostics } from './linter';

// Shared function to run operations with a progress indicator
async function runWithProgress(title: string, task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<string>) {
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
export async function copyPaths(uris: vscode.Uri[]) {
    const task = async (progress: vscode.Progress<{ message?: string }>) => {
        progress.report({ message: 'Gathering file paths...' });
        const allFilePaths = await getFilePaths(uris);
        if (allFilePaths.length === 0) return '';
        const root = getWorkspaceRoot();
        return allFilePaths.map(p => path.relative(root.uri.fsPath, p)).join('\n');
    };

    const finalPaths = await runWithProgress('Copying File Paths', task);
    if (finalPaths) {
        await vscode.env.clipboard.writeText(finalPaths);
        // Corrected: Added dynamic count to the information message.
        const pathCount = finalPaths.split('\n').length;
        vscode.window.showInformationMessage(`Copied ${pathCount} file path(s) to clipboard.`);
    } else {
        vscode.window.showWarningMessage('No files found to copy.');
    }
}

/**
 * Command 2: Copies the content of selected files with headers.
 */
export async function copyContent(uris: vscode.Uri[]) {
    const config = vscode.workspace.getConfiguration('pro-file-copier');
    const headerFormat = config.get<string>('headerFormat', '// File: {path}');

    // We need to get the file paths once to use for the final message.
    const allFilePaths = await getFilePaths(uris);
    if (allFilePaths.length === 0) {
        vscode.window.showWarningMessage('No files found to copy.');
        return;
    }

    const task = async (progress: vscode.Progress<{ message?: string, increment?: number }>) => {
        let combinedContent = '';
        const increment = 100 / allFilePaths.length;
        const root = getWorkspaceRoot();

        for (const filePath of allFilePaths) {
            const relativePath = path.relative(root.uri.fsPath, filePath);
            // Corrected: 'Processing' is now a string template.
            progress.report({ message: `Processing ${relativePath}`, increment });
            
            const header = headerFormat.replace('{path}', relativePath) + '\n';
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                // Corrected: Properly formatted the string concatenation with backticks and added the file content.
                combinedContent += `${header}${content}\n\n`;
            } catch (error) {
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
export async function copyContentWithDiagnostics(uris: vscode.Uri[]) {
    const config = vscode.workspace.getConfiguration('pro-file-copier');
    const headerFormat = config.get<string>('headerFormat', '// File: {path}');

    const task = async (progress: vscode.Progress<{ message?: string }>) => {
        progress.report({ message: 'Gathering files...' });
        const allFilePaths = await getFilePaths(uris);
        if (allFilePaths.length === 0) return '';
        
        progress.report({ message: 'Running linters and type checkers...' });
        const diagnostics = await getDiagnostics();
        
        let combinedContent = '';
        const root = getWorkspaceRoot();

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
    } else {
        vscode.window.showWarningMessage('No files found to copy.');
    }
}
