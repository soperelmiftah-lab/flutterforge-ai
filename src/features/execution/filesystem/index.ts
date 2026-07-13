/**
 * @module features/execution/filesystem
 *
 * Virtual Filesystem — the in-memory file store that all filesystem tools
 * operate on. In Phase 4 this is backed by the mock project tree from
 * Phase 1; in a future phase it will map to a real Flutter project on disk.
 *
 * Every mutation is recorded so the Execution Engine can snapshot + rollback.
 */

import type { WorkspacePath } from "@/features/workspace-intelligence/types";
import { mockFileTree } from "@/lib/mock-data";
import type { ProjectFileNode } from "@/lib/types";

class VirtualFilesystem {
  private files = new Map<WorkspacePath, string>();
  private directories = new Set<WorkspacePath>(["."]);

  constructor() {
    this.hydrateFromTree(mockFileTree);
  }

  /** Populate the filesystem from a file tree. */
  private hydrateFromTree(nodes: ProjectFileNode[], parentPath = "") {
    for (const node of nodes) {
      if (node.type === "folder") {
        this.directories.add(node.path);
        if (node.children) this.hydrateFromTree(node.children, node.path);
      } else if (node.type === "file" && node.content !== undefined) {
        this.files.set(node.path, node.content);
      }
    }
  }

  // ─── Read operations ────────────────────────────────────────────────

  readFile(path: WorkspacePath): string | null {
    return this.files.get(path) ?? null;
  }

  listDirectory(path: WorkspacePath = "."): Array<{ name: string; type: "file" | "folder"; path: WorkspacePath }> {
    const prefix = path === "." ? "" : path + "/";
    const entries = new Map<string, { name: string; type: "file" | "folder"; path: WorkspacePath }>();

    for (const filePath of this.files.keys()) {
      if (path !== "." && !filePath.startsWith(prefix)) continue;
      const relative = path === "." ? filePath : filePath.slice(prefix.length);
      const parts = relative.split("/");
      if (parts.length === 1) {
        entries.set(parts[0], { name: parts[0], type: "file", path: filePath });
      } else {
        const dirName = parts[0];
        if (!entries.has(dirName)) {
          entries.set(dirName, { name: dirName, type: "folder", path: prefix + dirName });
        }
      }
    }
    for (const dirPath of this.directories) {
      if (dirPath === "." || dirPath === path) continue;
      if (path !== "." && !dirPath.startsWith(prefix)) continue;
      const relative = path === "." ? dirPath : dirPath.slice(prefix.length);
      const parts = relative.split("/");
      if (parts.length === 1 && !entries.has(parts[0])) {
        entries.set(parts[0], { name: parts[0], type: "folder", path: dirPath });
      }
    }
    return Array.from(entries.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  exists(path: WorkspacePath): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  isFile(path: WorkspacePath): boolean {
    return this.files.has(path);
  }

  isDirectory(path: WorkspacePath): boolean {
    return this.directories.has(path);
  }

  // ─── Write operations ───────────────────────────────────────────────

  writeFile(path: WorkspacePath, content: string): string {
    const previous = this.files.get(path) ?? "";
    this.files.set(path, content);
    return previous;
  }

  createFile(path: WorkspacePath, content: string): boolean {
    if (this.files.has(path)) return false;
    this.files.set(path, content);
    return true;
  }

  deleteFile(path: WorkspacePath): boolean {
    return this.files.delete(path);
  }

  renameFile(oldPath: WorkspacePath, newPath: WorkspacePath): boolean {
    const content = this.files.get(oldPath);
    if (content === undefined) return false;
    this.files.delete(oldPath);
    this.files.set(newPath, content);
    return true;
  }

  moveFile(oldPath: WorkspacePath, newPath: WorkspacePath): boolean {
    return this.renameFile(oldPath, newPath);
  }

  copyFile(source: WorkspacePath, destination: WorkspacePath): boolean {
    const content = this.files.get(source);
    if (content === undefined) return false;
    this.files.set(destination, content);
    return true;
  }

  duplicateFile(path: WorkspacePath): WorkspacePath | null {
    const content = this.files.get(path);
    if (content === undefined) return null;
    const dotIdx = path.lastIndexOf(".");
    const ext = dotIdx >= 0 ? path.slice(dotIdx) : "";
    const base = dotIdx >= 0 ? path.slice(0, dotIdx) : path;
    const copyPath = `${base}_copy${ext}`;
    this.files.set(copyPath, content);
    return copyPath;
  }

  createDirectory(path: WorkspacePath): boolean {
    if (this.directories.has(path)) return false;
    this.directories.add(path);
    return true;
  }

  deleteDirectory(path: WorkspacePath): number {
    let deleted = 0;
    const prefix = path + "/";
    for (const filePath of Array.from(this.files.keys())) {
      if (filePath.startsWith(prefix)) {
        this.files.delete(filePath);
        deleted++;
      }
    }
    for (const dirPath of Array.from(this.directories)) {
      if (dirPath === path || dirPath.startsWith(prefix)) {
        this.directories.delete(dirPath);
        deleted++;
      }
    }
    return deleted;
  }

  // ─── Snapshot / restore ─────────────────────────────────────────────

  snapshot(path: WorkspacePath): string {
    return this.files.get(path) ?? "";
  }

  restore(path: WorkspacePath, content: string): void {
    this.files.set(path, content);
  }

  /** Get all file paths (for search). */
  allFiles(): WorkspacePath[] {
    return Array.from(this.files.keys());
  }
}

/** Singleton virtual filesystem. */
export const vfs = new VirtualFilesystem();
