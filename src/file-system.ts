import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Gets the root of the current workspace.
 * Throws an error if no workspace is open.
 */
export function getWorkspaceRoot(): vscode.WorkspaceFolder {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        // This error is critical and should stop execution.
        const errorMessage = 'No workspace folder is open. Please open your project folder to use this extension.';
        vscode.window.showErrorMessage(errorMessage);
        throw new Error(errorMessage);
    }
    return folders[0];
}

/**
 * Creates a single glob pattern string for exclusions from configuration.
 * @returns A glob string suitable for vscode.workspace.findFiles, or null if no exclusions are set.
 */
function getExclusionPattern(): string | null {
    const config = vscode.workspace.getConfiguration();

    // Fetch exclusion patterns from both user settings and our extension's settings
    const filesExclude = config.get<Record<string, boolean>>('files.exclude', {});
    const customExclude = config.get<string[]>('pro-file-copier.ignorePatterns', []);
    
    // Combine enabled patterns from 'files.exclude' with our custom patterns
    const combinedPatterns = [
        ...Object.entries(filesExclude)
            .filter(([, enabled]) => enabled)
            .map(([pattern]) => pattern),
        ...customExclude
    ];

    // If there are no patterns, we return null, which is the correct value for 'no exclusions'.
    if (combinedPatterns.length === 0) {
        return null;
    }

    // A valid glob pattern for multiple items is a single string with items separated by commas, enclosed in braces.
    // e.g., "{**/node_modules,**/.git,**/.DS_Store}"
    return `{${combinedPatterns.join(',')}}`;
}

/**
 * Recursively gets all file paths from a selection of URIs, respecting ignore settings.
 * @param uris An array of URIs from the explorer context menu.
 * @returns A promise that resolves to an array of absolute file paths.
 */
export async function getFilePaths(uris: vscode.Uri[]): Promise<string[]> {
    const fileSet = new Set<string>();
    const excludeGlob = getExclusionPattern();

    for (const uri of uris) {
        try {
            const stats = await fs.promises.stat(uri.fsPath);
            if (stats.isDirectory()) {
                const searchPattern = new vscode.RelativePattern(uri, '**/*');
                const files = await vscode.workspace.findFiles(searchPattern, excludeGlob);
                files.forEach(file => fileSet.add(file.fsPath));
            } else {
                fileSet.add(uri.fsPath);
            }
        } catch (error) {
            console.error(`Error processing ${uri.fsPath}:`, error);
        }
    }
    return Array.from(fileSet);
}
