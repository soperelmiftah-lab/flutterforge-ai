/**
 * @module features/execution/registry/tools
 *
 * Tool definitions + executors for all 6 categories:
 *   filesystem, editor, search, flutter, git, terminal.
 *
 * Each tool is a ToolDescriptor (static metadata) paired with an executor
 * function that performs the actual work through the virtual filesystem,
 * Git, Flutter, or Terminal modules.
 *
 * Risk levels:
 *   safe      — read-only, no approval needed
 *   moderate  — write/create, needs approval
 *   high      — delete/build, needs approval
 *   critical  — git reset / destructive terminal, needs approval
 */

import type { ToolDescriptor, ExecutionResult, ExecutionRequest } from "../types";
import { vfs } from "../filesystem";
import { patchRewrite, patchInsert, patchReplaceRange } from "../patch";
import { createSnapshot } from "../rollback";
import type { WorkspacePath } from "@/features/workspace-intelligence/types";
import { parseSymbols as parseSymbolsInFile } from "@/features/workspace-intelligence/symbols";

// ─── Tool IDs ───────────────────────────────────────────────────────────

export const ToolIds = {
  // Filesystem
  readFile: "fs.read_file",
  writeFile: "fs.write_file",
  createFile: "fs.create_file",
  deleteFile: "fs.delete_file",
  renameFile: "fs.rename_file",
  moveFile: "fs.move_file",
  copyFile: "fs.copy_file",
  duplicateFile: "fs.duplicate_file",
  listDirectory: "fs.list_directory",
  createDirectory: "fs.create_directory",
  deleteDirectory: "fs.delete_directory",
  // Editor
  insertText: "editor.insert_text",
  replaceSelection: "editor.replace_selection",
  replaceRange: "editor.replace_range",
  applyPatch: "editor.apply_patch",
  formatFile: "editor.format_file",
  formatProject: "editor.format_project",
  openFile: "editor.open_file",
  closeFile: "editor.close_file",
  saveFile: "editor.save_file",
  // Search
  findFile: "search.find_file",
  findText: "search.find_text",
  findSymbol: "search.find_symbol",
  findWidget: "search.find_widget",
  findProvider: "search.find_provider",
  findRoute: "search.find_route",
  findAsset: "search.find_asset",
  findClass: "search.find_class",
  // Flutter
  flutterDoctor: "flutter.doctor",
  flutterPubGet: "flutter.pub_get",
  flutterPubUpgrade: "flutter.pub_upgrade",
  flutterAnalyze: "flutter.analyze",
  flutterTest: "flutter.test",
  flutterRun: "flutter.run",
  flutterHotReload: "flutter.hot_reload",
  flutterHotRestart: "flutter.hot_restart",
  flutterClean: "flutter.clean",
  flutterBuildAPK: "flutter.build_apk",
  flutterBuildAAB: "flutter.build_aab",
  // Git
  gitStatus: "git.status",
  gitDiff: "git.diff",
  gitCommit: "git.commit",
  gitCheckout: "git.checkout",
  gitBranch: "git.branch",
  gitUndo: "git.undo",
  gitReset: "git.reset",
  gitLog: "git.log",
  // Terminal
  executeCommand: "terminal.execute",
  killProcess: "terminal.kill",
  streamLogs: "terminal.stream_logs",
  environmentVariables: "terminal.env",
  listProcesses: "terminal.list_processes",
} as const;

// ─── Tool descriptors ───────────────────────────────────────────────────

export const toolDescriptors: ToolDescriptor[] = [
  // ── Filesystem ──────────────────────────────────────────────────────
  {
    id: ToolIds.readFile, name: "Read File", description: "Read the content of a file.",
    category: "filesystem", icon: "📄", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "path", type: "string", description: "File path to read", required: true }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.writeFile, name: "Write File", description: "Overwrite a file's content (generates a patch).",
    category: "filesystem", icon: "✏️", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path to write", required: true },
      { name: "content", type: "string", description: "New file content", required: true },
    ],
    timeoutMs: 10000, supportsRollback: true, supportsPreview: true, implemented: true,
  },
  {
    id: ToolIds.createFile, name: "Create File", description: "Create a new file with content.",
    category: "filesystem", icon: "➕", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path to create", required: true },
      { name: "content", type: "string", description: "Initial file content", required: false, default: "" },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.deleteFile, name: "Delete File", description: "Delete a file permanently.",
    category: "filesystem", icon: "🗑️", riskLevel: "high", permissions: ["filesystem:delete"],
    parameters: [{ name: "path", type: "string", description: "File path to delete", required: true }],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.renameFile, name: "Rename File", description: "Rename a file.",
    category: "filesystem", icon: "📝", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "oldPath", type: "string", description: "Current path", required: true },
      { name: "newPath", type: "string", description: "New path", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.moveFile, name: "Move File", description: "Move a file to a new location.",
    category: "filesystem", icon: "📁", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "oldPath", type: "string", description: "Current path", required: true },
      { name: "newPath", type: "string", description: "Destination path", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.copyFile, name: "Copy File", description: "Copy a file to a new location.",
    category: "filesystem", icon: "📋", riskLevel: "safe", permissions: ["filesystem:read", "filesystem:write"],
    parameters: [
      { name: "source", type: "string", description: "Source path", required: true },
      { name: "destination", type: "string", description: "Destination path", required: true },
    ],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.duplicateFile, name: "Duplicate File", description: "Create a copy of a file.",
    category: "filesystem", icon: "📇", riskLevel: "safe", permissions: ["filesystem:read", "filesystem:write"],
    parameters: [{ name: "path", type: "string", description: "File to duplicate", required: true }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.listDirectory, name: "List Directory", description: "List files and folders in a directory.",
    category: "filesystem", icon: "📂", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "path", type: "string", description: "Directory path (default: .)", required: false, default: "." }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.createDirectory, name: "Create Directory", description: "Create a new directory.",
    category: "filesystem", icon: "📁", riskLevel: "safe", permissions: ["filesystem:write"],
    parameters: [{ name: "path", type: "string", description: "Directory path to create", required: true }],
    timeoutMs: 3000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.deleteDirectory, name: "Delete Directory", description: "Delete a directory and all its contents.",
    category: "filesystem", icon: "🗑️", riskLevel: "critical", permissions: ["filesystem:delete"],
    parameters: [{ name: "path", type: "string", description: "Directory path to delete", required: true }],
    timeoutMs: 10000, supportsRollback: true, supportsPreview: false, implemented: true,
  },
  // ── Editor ──────────────────────────────────────────────────────────
  {
    id: ToolIds.insertText, name: "Insert Text", description: "Insert text at a specific line.",
    category: "editor", icon: "📍", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path", required: true },
      { name: "line", type: "number", description: "Line number (1-based)", required: true },
      { name: "text", type: "string", description: "Text to insert", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: true, implemented: true,
  },
  {
    id: ToolIds.replaceSelection, name: "Replace Selection", description: "Replace selected text with new text.",
    category: "editor", icon: "🔄", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path", required: true },
      { name: "oldText", type: "string", description: "Text to find", required: true },
      { name: "newText", type: "string", description: "Replacement text", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: true, implemented: true,
  },
  {
    id: ToolIds.replaceRange, name: "Replace Range", description: "Replace a line range with new text.",
    category: "editor", icon: "✂️", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path", required: true },
      { name: "startLine", type: "number", description: "Start line (1-based)", required: true },
      { name: "endLine", type: "number", description: "End line (1-based)", required: true },
      { name: "text", type: "string", description: "Replacement text", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: true, implemented: true,
  },
  {
    id: ToolIds.applyPatch, name: "Apply Patch", description: "Apply a pre-generated patch to a file.",
    category: "editor", icon: "🩹", riskLevel: "moderate", permissions: ["filesystem:write"],
    parameters: [
      { name: "path", type: "string", description: "File path", required: true },
      { name: "patchId", type: "string", description: "Patch id to apply", required: true },
    ],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: true, implemented: true,
  },
  {
    id: ToolIds.formatFile, name: "Format File", description: "Format a Dart file with dart format.",
    category: "editor", icon: "🎨", riskLevel: "safe", permissions: ["filesystem:read", "filesystem:write"],
    parameters: [{ name: "path", type: "string", description: "File to format", required: true }],
    timeoutMs: 30000, supportsRollback: true, supportsPreview: true, implemented: false,
  },
  {
    id: ToolIds.formatProject, name: "Format Project", description: "Format all Dart files in the project.",
    category: "editor", icon: "🎨", riskLevel: "safe", permissions: ["filesystem:read", "filesystem:write"],
    parameters: [],
    timeoutMs: 60000, supportsRollback: true, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.openFile, name: "Open File", description: "Open a file in the editor.",
    category: "editor", icon: "📂", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "path", type: "string", description: "File to open", required: true }],
    timeoutMs: 2000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.closeFile, name: "Close File", description: "Close a file tab in the editor.",
    category: "editor", icon: "✖️", riskLevel: "safe", permissions: [],
    parameters: [{ name: "path", type: "string", description: "File to close", required: true }],
    timeoutMs: 1000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.saveFile, name: "Save File", description: "Save a file to disk.",
    category: "editor", icon: "💾", riskLevel: "safe", permissions: ["filesystem:write"],
    parameters: [{ name: "path", type: "string", description: "File to save", required: true }],
    timeoutMs: 2000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  // ── Search ──────────────────────────────────────────────────────────
  {
    id: ToolIds.findFile, name: "Find File", description: "Find files by name.",
    category: "search", icon: "🔍", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "File name search", required: true }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findText, name: "Find Text", description: "Find text in all files.",
    category: "search", icon: "🔍", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Text to search for", required: true }],
    timeoutMs: 10000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findSymbol, name: "Find Symbol", description: "Find symbols by name.",
    category: "search", icon: "🔤", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Symbol name", required: true }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findWidget, name: "Find Widget", description: "Find Flutter widgets.",
    category: "search", icon: "🧩", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Widget name", required: false }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findProvider, name: "Find Provider", description: "Find Riverpod/Bloc providers.",
    category: "search", icon: "⚡", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Provider name", required: false }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findRoute, name: "Find Route", description: "Find routes/pages/screens.",
    category: "search", icon: "🛣️", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Route name", required: false }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findAsset, name: "Find Asset", description: "Find declared assets.",
    category: "search", icon: "🖼️", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Asset name", required: false }],
    timeoutMs: 3000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  {
    id: ToolIds.findClass, name: "Find Class", description: "Find Dart classes.",
    category: "search", icon: "🏛️", riskLevel: "safe", permissions: ["filesystem:read"],
    parameters: [{ name: "query", type: "string", description: "Class name", required: false }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: true,
  },
  // ── Flutter ─────────────────────────────────────────────────────────
  {
    id: ToolIds.flutterDoctor, name: "Flutter Doctor", description: "Run flutter doctor.",
    category: "flutter", icon: "🩺", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 30000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterPubGet, name: "Pub Get", description: "Run flutter pub get.",
    category: "flutter", icon: "📦", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 60000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterPubUpgrade, name: "Pub Upgrade", description: "Run flutter pub upgrade.",
    category: "flutter", icon: "⬆️", riskLevel: "moderate", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 120000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterAnalyze, name: "Flutter Analyze", description: "Run flutter analyze.",
    category: "flutter", icon: "🔬", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 60000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterTest, name: "Flutter Test", description: "Run flutter test.",
    category: "flutter", icon: "🧪", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 120000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterRun, name: "Flutter Run", description: "Run the app on a device.",
    category: "flutter", icon: "▶️", riskLevel: "moderate", permissions: ["flutter:run"],
    parameters: [{ name: "target", type: "string", description: "Target device", required: false, default: "chrome" }],
    timeoutMs: 120000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterHotReload, name: "Hot Reload", description: "Trigger a hot reload.",
    category: "flutter", icon: "🔥", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 10000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterHotRestart, name: "Hot Restart", description: "Trigger a hot restart.",
    category: "flutter", icon: "🔄", riskLevel: "safe", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 15000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterClean, name: "Flutter Clean", description: "Run flutter clean.",
    category: "flutter", icon: "🧹", riskLevel: "moderate", permissions: ["flutter:run"],
    parameters: [], timeoutMs: 30000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterBuildAPK, name: "Build APK", description: "Build a release APK.",
    category: "flutter", icon: "📱", riskLevel: "high", permissions: ["flutter:build"],
    parameters: [{ name: "flavor", type: "string", description: "Build flavor", required: false }],
    timeoutMs: 600000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.flutterBuildAAB, name: "Build AAB", description: "Build an Android App Bundle.",
    category: "flutter", icon: "📦", riskLevel: "high", permissions: ["flutter:build"],
    parameters: [{ name: "flavor", type: "string", description: "Build flavor", required: false }],
    timeoutMs: 600000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  // ── Git ─────────────────────────────────────────────────────────────
  {
    id: ToolIds.gitStatus, name: "Git Status", description: "Show working tree status.",
    category: "git", icon: "📊", riskLevel: "safe", permissions: ["git:read"],
    parameters: [], timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitDiff, name: "Git Diff", description: "Show changes in working tree.",
    category: "git", icon: "📝", riskLevel: "safe", permissions: ["git:read"],
    parameters: [], timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitCommit, name: "Git Commit", description: "Commit staged changes.",
    category: "git", icon: "✅", riskLevel: "moderate", permissions: ["git:write"],
    parameters: [{ name: "message", type: "string", description: "Commit message", required: true }],
    timeoutMs: 10000, supportsRollback: true, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitCheckout, name: "Git Checkout", description: "Switch branches.",
    category: "git", icon: "🔀", riskLevel: "high", permissions: ["git:write"],
    parameters: [{ name: "branch", type: "string", description: "Branch name", required: true }],
    timeoutMs: 15000, supportsRollback: true, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitBranch, name: "Git Branch", description: "Create a new branch.",
    category: "git", icon: "🌿", riskLevel: "moderate", permissions: ["git:write"],
    parameters: [{ name: "name", type: "string", description: "Branch name", required: true }],
    timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitUndo, name: "Git Undo", description: "Undo the last commit.",
    category: "git", icon: "↩️", riskLevel: "high", permissions: ["git:write"],
    parameters: [], timeoutMs: 5000, supportsRollback: true, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitReset, name: "Git Reset", description: "Reset to a specific commit.",
    category: "git", icon: "⚠️", riskLevel: "critical", permissions: ["git:write"],
    parameters: [{ name: "target", type: "string", description: "Commit hash or ref", required: true }],
    timeoutMs: 10000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.gitLog, name: "Git Log", description: "Show commit history.",
    category: "git", icon: "📜", riskLevel: "safe", permissions: ["git:read"],
    parameters: [{ name: "limit", type: "number", description: "Max commits", required: false, default: 20 }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  // ── Terminal ────────────────────────────────────────────────────────
  {
    id: ToolIds.executeCommand, name: "Execute Command", description: "Run a shell command.",
    category: "terminal", icon: "⌨️", riskLevel: "high", permissions: ["terminal:execute"],
    parameters: [{ name: "command", type: "string", description: "Command to execute", required: true }],
    timeoutMs: 60000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.killProcess, name: "Kill Process", description: "Kill a running process.",
    category: "terminal", icon: "🛑", riskLevel: "high", permissions: ["terminal:execute"],
    parameters: [{ name: "pid", type: "number", description: "Process ID", required: true }],
    timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.streamLogs, name: "Stream Logs", description: "Stream logs from a process.",
    category: "terminal", icon: "📡", riskLevel: "safe", permissions: ["terminal:execute"],
    parameters: [{ name: "pid", type: "number", description: "Process ID", required: true }],
    timeoutMs: 60000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.environmentVariables, name: "Environment Variables", description: "List environment variables.",
    category: "terminal", icon: "🌍", riskLevel: "safe", permissions: ["terminal:execute"],
    parameters: [], timeoutMs: 3000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
  {
    id: ToolIds.listProcesses, name: "List Processes", description: "List running processes.",
    category: "terminal", icon: "📋", riskLevel: "safe", permissions: ["terminal:execute"],
    parameters: [], timeoutMs: 5000, supportsRollback: false, supportsPreview: false, implemented: false,
  },
];

// ─── Tool executor ──────────────────────────────────────────────────────

/** Execute a tool by id. Returns the result. */
export async function executeTool(request: ExecutionRequest): Promise<ExecutionResult> {
  const descriptor = toolDescriptors.find((t) => t.id === request.toolId);
  if (!descriptor) {
    return failure(request.id, `Unknown tool: ${request.toolId}`);
  }
  if (!descriptor.implemented) {
    return failure(request.id, `Tool "${descriptor.name}" is not yet implemented.`);
  }
  const start = Date.now();
  try {
    const output = await runTool(descriptor, request);
    const durationMs = Date.now() - start;
    return {
      requestId: request.id,
      status: "success",
      output,
      durationMs,
      finishedAt: new Date().toISOString(),
    };
  } catch (e: unknown) {
    return failure(request.id, e instanceof Error ? e.message : String(e), Date.now() - start);
  }
}

function failure(requestId: string, error: string, durationMs = 0): ExecutionResult {
  return { requestId, status: "failed", error, durationMs, finishedAt: new Date().toISOString() };
}

/** Dispatch to the right tool implementation. */
async function runTool(desc: ToolDescriptor, request: ExecutionRequest): Promise<unknown> {
  const p = request.parameters;
  switch (desc.id) {
    // ── Filesystem ──
    case ToolIds.readFile: {
      const content = vfs.readFile(p.path as WorkspacePath);
      if (content === null) throw new Error(`File not found: ${p.path}`);
      return { path: p.path, content, lines: content.split("\n").length };
    }
    case ToolIds.writeFile: {
      const path = p.path as WorkspacePath;
      const content = p.content as string;
      const before = vfs.readFile(path) ?? "";
      const patch = patchRewrite(path, before, content);
      vfs.writeFile(path, content);
      return { path, patchId: patch.id, lines: content.split("\n").length };
    }
    case ToolIds.createFile: {
      const path = p.path as WorkspacePath;
      const content = (p.content as string) ?? "";
      if (!vfs.createFile(path, content)) throw new Error(`File already exists: ${path}`);
      return { path, created: true };
    }
    case ToolIds.deleteFile: {
      const path = p.path as WorkspacePath;
      const snapshot = createSnapshot(request.id, path);
      if (!vfs.deleteFile(path)) throw new Error(`File not found: ${path}`);
      return { path, deleted: true, snapshotId: snapshot.id };
    }
    case ToolIds.renameFile:
    case ToolIds.moveFile: {
      const oldPath = p.oldPath as WorkspacePath;
      const newPath = p.newPath as WorkspacePath;
      const snapshot = createSnapshot(request.id, oldPath);
      if (!vfs.renameFile(oldPath, newPath)) throw new Error(`File not found: ${oldPath}`);
      return { oldPath, newPath, moved: true, snapshotId: snapshot.id };
    }
    case ToolIds.copyFile: {
      const source = p.source as WorkspacePath;
      const destination = p.destination as WorkspacePath;
      if (!vfs.copyFile(source, destination)) throw new Error(`Source not found: ${source}`);
      return { source, destination, copied: true };
    }
    case ToolIds.duplicateFile: {
      const path = p.path as WorkspacePath;
      const copyPath = vfs.duplicateFile(path);
      if (!copyPath) throw new Error(`File not found: ${path}`);
      return { path, copyPath };
    }
    case ToolIds.listDirectory: {
      const path = (p.path as WorkspacePath) ?? ".";
      return { path, entries: vfs.listDirectory(path) };
    }
    case ToolIds.createDirectory: {
      const path = p.path as WorkspacePath;
      vfs.createDirectory(path);
      return { path, created: true };
    }
    case ToolIds.deleteDirectory: {
      const path = p.path as WorkspacePath;
      const deleted = vfs.deleteDirectory(path);
      return { path, deletedCount: deleted };
    }
    // ── Editor ──
    case ToolIds.insertText: {
      const path = p.path as WorkspacePath;
      const line = p.line as number;
      const text = p.text as string;
      const before = vfs.readFile(path) ?? "";
      const patch = patchInsert(path, before, line, text);
      vfs.writeFile(path, patch.after);
      return { path, patchId: patch.id };
    }
    case ToolIds.replaceSelection: {
      const path = p.path as WorkspacePath;
      const oldText = p.oldText as string;
      const newText = p.newText as string;
      const before = vfs.readFile(path) ?? "";
      if (!before.includes(oldText)) throw new Error("Text not found in file");
      const after = before.replace(oldText, newText);
      const patch = patchRewrite(path, before, after);
      vfs.writeFile(path, after);
      return { path, patchId: patch.id };
    }
    case ToolIds.replaceRange: {
      const path = p.path as WorkspacePath;
      const startLine = p.startLine as number;
      const endLine = p.endLine as number;
      const text = p.text as string;
      const before = vfs.readFile(path) ?? "";
      const patch = patchReplaceRange(path, before, startLine, endLine, text);
      vfs.writeFile(path, patch.after);
      return { path, patchId: patch.id };
    }
    case ToolIds.applyPatch: {
      // Handled by the patch engine directly.
      return { patchId: p.patchId, applied: true };
    }
    case ToolIds.openFile:
    case ToolIds.closeFile:
    case ToolIds.saveFile: {
      return { path: p.path, action: desc.name };
    }
    // ── Search ──
    case ToolIds.findFile: {
      const query = (p.query as string).toLowerCase();
      const matches = vfs.allFiles().filter((f) => f.toLowerCase().includes(query));
      return { query, matches };
    }
    case ToolIds.findText: {
      const query = p.query as string;
      const results: Array<{ path: string; line: number; content: string }> = [];
      for (const filePath of vfs.allFiles()) {
        const content = vfs.readFile(filePath) ?? "";
        content.split("\n").forEach((line, i) => {
          if (line.includes(query)) results.push({ path: filePath, line: i + 1, content: line.trim() });
        });
      }
      return { query, results: results.slice(0, 50) };
    }
    case ToolIds.findSymbol:
    case ToolIds.findClass:
    case ToolIds.findWidget:
    case ToolIds.findProvider:
    case ToolIds.findRoute: {
      const query = (p.query as string) ?? "";
      const symbols: Array<{ name: string; kind: string; path: string; line: number }> = [];
      for (const filePath of vfs.allFiles()) {
        if (!filePath.endsWith(".dart")) continue;
        const content = vfs.readFile(filePath) ?? "";
        const fileSymbols = parseSymbolsInFile(content, filePath);
        for (const s of fileSymbols) {
          if (!query || s.name.toLowerCase().includes(query.toLowerCase())) {
            if (desc.id === ToolIds.findWidget && s.kind !== "widget") continue;
            if (desc.id === ToolIds.findProvider && s.kind !== "provider") continue;
            if (desc.id === ToolIds.findRoute && s.kind !== "route") continue;
            if (desc.id === ToolIds.findClass && s.kind !== "class") continue;
            symbols.push({ name: s.name, kind: s.kind, path: filePath, line: s.line });
          }
        }
      }
      return { query, results: symbols.slice(0, 50) };
    }
    case ToolIds.findAsset: {
      return { query: p.query, assets: [] };
    }
    default:
      throw new Error(`Tool executor not implemented for ${desc.id}`);
  }
}

/** Get a tool descriptor by id. */
export function getToolDescriptor(id: string): ToolDescriptor | undefined {
  return toolDescriptors.find((t) => t.id === id);
}

/** List all tool descriptors, optionally filtered by category. */
export function listTools(category?: ToolDescriptor["category"]): ToolDescriptor[] {
  return category ? toolDescriptors.filter((t) => t.category === category) : toolDescriptors;
}
