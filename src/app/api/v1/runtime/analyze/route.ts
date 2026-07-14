import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import { vfs } from "@/features/execution/filesystem";
import type { WorkspacePath } from "@/features/workspace-intelligence/types";

/**
 * POST /api/v1/runtime/analyze
 *
 * Runs `flutter analyze` (simulated) against all Dart files in the VFS.
 * Returns diagnostics (prefer_const, avoid_print, unused_import).
 */
export async function POST() {
  const files: Array<{ path: string; content: string }> = [];
  collectDartFiles("lib", files);
  const result = runtimeState.analyzeVfs(files);
  return NextResponse.json({ data: result });
}

/** Recursively walk the VFS and collect all .dart files. */
function collectDartFiles(dir: WorkspacePath, out: Array<{ path: string; content: string }>): void {
  const entries = vfs.listDirectory(dir);
  for (const entry of entries) {
    if (entry.type === "file" && entry.path.endsWith(".dart")) {
      const content = vfs.readFile(entry.path);
      if (content !== null) out.push({ path: entry.path, content });
    } else if (entry.type === "folder") {
      collectDartFiles(entry.path, out);
    }
  }
}
