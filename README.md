# Pro File Copier - VS Code Extension

[![VS Code Version](https://img.shields.io/badge/vscode-^1.85.0-blue.svg)](https://code.visualstudio.com/)

**Pro File Copier** is a powerful utility extension for Visual Studio Code that enhances developer productivity by providing advanced context menu commands in the file explorer. Easily copy file paths, file contents, and even associated linter and type-checking errors directly to your clipboard.

This tool is perfect for creating prompts for AI models, generating documentation, or quickly sharing code snippets with complete context.

![Pro File Copier in Action](https://i.imgur.com/your-demo-image.gif)  <!-- Optional: Replace with a GIF of your extension -->

---

## Features

Right-click on any file or folder in the VS Code Explorer to access the following commands:

### 1. Copy Relative Paths
- **Command:** `Copy Relative Paths`
- **Description:** Quickly copies the relative paths of all selected files (and all files within selected folders) to your clipboard, with each path on a new line.

### 2. Copy Content with Headers
- **Command:** `Copy Content with Headers`
- **Description:** Copies the entire content of the selected files. Each file's content is prefixed with a customizable header that includes its relative path. This is ideal for consolidating multiple files into a single block of text.

### 3. Copy Content with Diagnostics
- **Command:** `Copy Content with Diagnostics`
- **Description:** This is the most powerful feature. It does everything "Copy Content with Headers" does, but also intelligently runs your project's `lint` and `type-check` scripts (from your `package.json`). Any errors or warnings are appended neatly below the corresponding file's content.

---

## Requirements

- **Visual Studio Code**: Version 1.85.0 or newer.
- **Node.js**: Required for the extension's internal command execution.
- **Project Scripts**: For the "Copy with Diagnostics" feature to work, your project's `package.json` should contain `lint` and/or `type-check` scripts that your package manager (`npm`, `pnpm`, `yarn`) can run.

---

## Extension Settings

You can customize the behavior of this extension via your VS Code settings (`settings.json`).

-   **`pro-file-copier.headerFormat`**: A string to format the header placed above each file's content. Use `{path}` as a placeholder for the file's relative path.
    -   **Default**: `"// File: {path}"`

-   **`pro-file-copier.ignorePatterns`**: An array of glob patterns for files and folders to ignore when processing a directory. This is in addition to the patterns in your global `files.exclude` setting.
    -   **Default**: `["**/node_modules/**", "**/.git/**"]`

**Example `settings.json` configuration:**

```json
{
  "pro-file-copier.headerFormat": "--- START OF {path} ---",
  "pro-file-copier.ignorePatterns": [
    "**/dist/**",
    "**/*.log"
  ]
}
