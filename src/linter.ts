import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { getWorkspaceRoot } from './file-system';

type PackageManager = 'npm' | 'pnpm' | 'yarn';
type DiagnosticsMap = { [filePath: string]: string };

/**
 * Detects the package manager used in the project by checking for lock files.
 * @param rootPath The root path of the workspace.
 * @returns The detected package manager or 'npm' as a default.
 */
async function detectPackageManager(rootPath: string): Promise<PackageManager> {
    // Check for lock files in order of precedence
    if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(rootPath, 'yarn.lock'))) return 'yarn';
    return 'npm';
}

/**
 * Executes a shell command within a given directory and returns its output.
 * @param command The command to execute.
 * @param cwd The working directory for the command.
 * @returns A promise resolving with the command's stdout and stderr combined.
 */
function runCommand(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            // Linters often report issues to stderr and exit with an error code.
            // We want to capture this output without treating it as a fatal execution error.
            if (error && stderr && !stdout) {
                // If there's an error and only stderr has output, it's likely a linter report.
                resolve(stderr);
                return;
            }
            if (error) {
                // For other errors, log it but still try to resolve with any output.
                console.error(`Execution error for command "${command}":`, error);
            }
            // Combine stdout and stderr to capture all possible output.
            resolve(stdout || stderr);
        });
    });
}

/**
 * Runs the 'lint' and 'type-check' scripts from package.json and maps errors to files.
 * @returns A promise that resolves to a map of file paths to their diagnostic messages.
 */
export async function getDiagnostics(): Promise<DiagnosticsMap> {
    const root = getWorkspaceRoot();
    const pkgJsonPath = path.join(root.uri.fsPath, 'package.json');

    if (!fs.existsSync(pkgJsonPath)) {
        vscode.window.showErrorMessage('`package.json` not found in workspace root.');
        return {};
    }

    try {
        const pkgJsonContent = await fs.promises.readFile(pkgJsonPath, 'utf-8');
        const pkgJson = JSON.parse(pkgJsonContent);
        const scripts = pkgJson.scripts || {};
        const lintScript = scripts['lint'];
        const typeCheckScript = scripts['type-check'];

        if (!lintScript && !typeCheckScript) {
            // Corrected: Removed typo and used clearer quotes.
            vscode.window.showWarningMessage('No "lint" or "type-check" script found in package.json.');
            return {};
        }

        const packageManager = await detectPackageManager(root.uri.fsPath);
        const runPrefix = packageManager === 'npm' ? 'npm run' : packageManager;
        const allDiagnostics: DiagnosticsMap = {};

        // --- Run Lint Command ---
 if (lintScript) {
    try {
        const command = `${runPrefix} lint`;
        const output = await runCommand(command, root.uri.fsPath);
        const lines = output.split('\n');
        lines.forEach(line => {
            // Improved regex for file paths
            const filePathMatch = line.match(/([a-zA-Z0-9\/\.\-_]+\.(ts|js|tsx|jsx))\b/);
            if (filePathMatch) {
                const potentialPath = filePathMatch[1].trim();
                const fullPath = path.resolve(root.uri.fsPath, potentialPath);
                if (fs.existsSync(fullPath)) {
                    allDiagnostics[fullPath] = (allDiagnostics[fullPath] || '') + line + '\n';
                }
            }
        });
    } catch (error) {
        console.error('Error running lint script:', error);
        vscode.window.showErrorMessage(`Failed to execute 'lint' script. See console for details.`);
    }
}

if (typeCheckScript) {
    try {
        const command = `${runPrefix} type-check`;
        const output = await runCommand(command, root.uri.fsPath);
        const lines = output.split('\n');
        lines.forEach(line => {
            // Improved regex for type errors
            const filePathMatch = line.match(/([a-zA-Z0-9\/\.\-_]+\.(ts|tsx))\((\d+),(\d+)\)/);
            if (filePathMatch) {
                const relativePath = filePathMatch[1].trim();
                const fullPath = path.resolve(root.uri.fsPath, relativePath);
                if (fs.existsSync(fullPath)) {
                    allDiagnostics[fullPath] = (allDiagnostics[fullPath] || '') + line + '\n';
                }
            }
        });
    } catch (error) {
        console.error('Error running type-check script:', error);
        vscode.window.showErrorMessage(`Failed to execute 'type-check' script. See console for details.`);
    }
}
        // --- Run Type-Check Command ---
        if (typeCheckScript) {
            try {
                // Corrected: Used backticks (`) for template literal string.
                const command = `${runPrefix} type-check`;
                const output = await runCommand(command, root.uri.fsPath);

                const lines = output.split('\n');
                lines.forEach(line => {
                    // This regex is specific to formats like "path/file.ts(line,col): error TS2345..."
                    const filePathMatch = line.match(/^([a-zA-Z0-9./\\_-]+)\(\d+,\d+\)/);
                    if (filePathMatch) {
                        const relativePath = filePathMatch[1].trim();
                        const fullPath = path.resolve(root.uri.fsPath, relativePath);
                        if (fs.existsSync(fullPath)) {
                            allDiagnostics[fullPath] = (allDiagnostics[fullPath] || '') + line + '\n';
                        }
                    }
                });
            } catch (error) {
                console.error('Error running type-check script:', error);
                vscode.window.showErrorMessage(`Failed to execute the 'type-check' script. See console for details.`);
            }
        }
        
        return allDiagnostics;
    } catch (e: any) {
        // Corrected: The error message is now a proper string and includes the specific error.
        vscode.window.showErrorMessage(`Failed to read or parse package.json: ${e.message}`);
        return {};
    }
}
