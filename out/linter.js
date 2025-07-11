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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiagnostics = getDiagnostics;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const file_system_1 = require("./file-system");
/**
 * Detects the package manager used in the project by checking for lock files.
 * @param rootPath The root path of the workspace.
 * @returns The detected package manager or 'npm' as a default.
 */
function detectPackageManager(rootPath) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for lock files in order of precedence
        if (fs.existsSync(path.join(rootPath, 'pnpm-lock.yaml')))
            return 'pnpm';
        if (fs.existsSync(path.join(rootPath, 'yarn.lock')))
            return 'yarn';
        return 'npm';
    });
}
/**
 * Executes a shell command within a given directory and returns its output.
 * @param command The command to execute.
 * @param cwd The working directory for the command.
 * @returns A promise resolving with the command's stdout and stderr combined.
 */
function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, { cwd }, (error, stdout, stderr) => {
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
function getDiagnostics() {
    return __awaiter(this, void 0, void 0, function* () {
        const root = (0, file_system_1.getWorkspaceRoot)();
        const pkgJsonPath = path.join(root.uri.fsPath, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
            vscode.window.showErrorMessage('`package.json` not found in workspace root.');
            return {};
        }
        try {
            const pkgJsonContent = yield fs.promises.readFile(pkgJsonPath, 'utf-8');
            const pkgJson = JSON.parse(pkgJsonContent);
            const scripts = pkgJson.scripts || {};
            const lintScript = scripts['lint'];
            const typeCheckScript = scripts['type-check'];
            if (!lintScript && !typeCheckScript) {
                // Corrected: Removed typo and used clearer quotes.
                vscode.window.showWarningMessage('No "lint" or "type-check" script found in package.json.');
                return {};
            }
            const packageManager = yield detectPackageManager(root.uri.fsPath);
            const runPrefix = packageManager === 'npm' ? 'npm run' : packageManager;
            const allDiagnostics = {};
            // --- Run Lint Command ---
            if (lintScript) {
                try {
                    const command = `${runPrefix} lint`;
                    const output = yield runCommand(command, root.uri.fsPath);
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
                }
                catch (error) {
                    console.error('Error running lint script:', error);
                    vscode.window.showErrorMessage(`Failed to execute 'lint' script. See console for details.`);
                }
            }
            if (typeCheckScript) {
                try {
                    const command = `${runPrefix} type-check`;
                    const output = yield runCommand(command, root.uri.fsPath);
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
                }
                catch (error) {
                    console.error('Error running type-check script:', error);
                    vscode.window.showErrorMessage(`Failed to execute 'type-check' script. See console for details.`);
                }
            }
            // --- Run Type-Check Command ---
            if (typeCheckScript) {
                try {
                    // Corrected: Used backticks (`) for template literal string.
                    const command = `${runPrefix} type-check`;
                    const output = yield runCommand(command, root.uri.fsPath);
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
                }
                catch (error) {
                    console.error('Error running type-check script:', error);
                    vscode.window.showErrorMessage(`Failed to execute the 'type-check' script. See console for details.`);
                }
            }
            return allDiagnostics;
        }
        catch (e) {
            // Corrected: The error message is now a proper string and includes the specific error.
            vscode.window.showErrorMessage(`Failed to read or parse package.json: ${e.message}`);
            return {};
        }
    });
}
//# sourceMappingURL=linter.js.map