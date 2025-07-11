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
function getFilePaths(uris) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileSet = new Set();
        const excludeGlob = getExclusionPattern();
        for (const uri of uris) {
            try {
                const stats = yield fs.promises.stat(uri.fsPath);
                if (stats.isDirectory()) {
                    const searchPattern = new vscode.RelativePattern(uri, '**/*');
                    const files = yield vscode.workspace.findFiles(searchPattern, excludeGlob);
                    files.forEach(file => fileSet.add(file.fsPath));
                }
                else {
                    fileSet.add(uri.fsPath);
                }
            }
            catch (error) {
                console.error(`Error processing ${uri.fsPath}:`, error);
            }
        }
        return Array.from(fileSet);
    });
}
//# sourceMappingURL=file-system.js.map