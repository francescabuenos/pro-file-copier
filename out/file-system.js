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
exports.getWorkspaceRoot = getWorkspaceRoot;
exports.getFilePaths = getFilePaths;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
/**
 * Gets the root of the current workspace.
 * Throws an error if no workspace is open.
 */
function getWorkspaceRoot() {
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
function getExclusionPattern() {
    const config = vscode.workspace.getConfiguration();
    // Fetch exclusion patterns from both user settings and our extension's settings
    const filesExclude = config.get('files.exclude', {});
    const customExclude = config.get('pro-file-copier.ignorePatterns', []);
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
async function getFilePaths(uris) {
    const fileSet = new Set();
    const excludeGlob = getExclusionPattern();
    for (const uri of uris) {
        // Use fs.promises.stat for modern async/await syntax
        const stats = await fs.promises.stat(uri.fsPath);
        if (stats.isDirectory()) {
            // Define the search pattern to find all files recursively within the directory
            const searchPattern = new vscode.RelativePattern(uri, '**/*');
            // Find files using the search pattern and the combined exclusion glob
            const files = await vscode.workspace.findFiles(searchPattern, excludeGlob);
            files.forEach((file) => fileSet.add(file.fsPath));
        }
        else {
            // If a single file is selected, add it directly.
            // This implicitly bypasses the exclusion, which is the desired behavior.
            fileSet.add(uri.fsPath);
        }
    }
    return Array.from(fileSet);
}
//# sourceMappingURL=file-system.js.map