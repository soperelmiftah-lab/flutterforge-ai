/**
 * @module features/execution/patch
 *
 * Patch Engine — NEVER overwrites files. Every write operation generates a
 * Patch (before/after/diff/hunks), which must be explicitly applied.
 *
 * Supports: unified diff, patch preview, partial apply, patch merge,
 * conflict detection, conflict resolution, and patch validation.
 */

import type { Patch, DiffHunk, PatchConflict } from "../types";
import { computeDiff, applyDiff, detectConflicts } from "../diff";
import { uid } from "@/lib/utils";
import type { WorkspacePath } from "@/features/workspace-intelligence/types";

/** In-memory patch store (applied patches for undo). */
const patches = new Map<string, Patch>();

/** Generate a patch for a file change (before → after). Does NOT apply it. */
export function generatePatch(
  path: WorkspacePath,
  before: string,
  after: string
): Patch {
  const { hunks, diff } = computeDiff(before, after);
  const patch: Patch = {
    id: uid("patch"),
    path,
    before,
    after,
    diff,
    hunks,
    applied: false,
    partial: hunks.length > 1,
  };
  patches.set(patch.id, patch);
  return patch;
}

/** Get a stored patch by id. */
export function getPatch(id: string): Patch | undefined {
  return patches.get(id);
}

/** List all patches. */
export function listPatches(): Patch[] {
  return Array.from(patches.values());
}

/** Validate a patch — checks the before content still matches. */
export function validatePatch(patch: Patch, currentContent: string): {
  valid: boolean;
  conflicts?: PatchConflict[];
} {
  if (patch.before === currentContent) {
    return { valid: true };
  }
  // The file changed since the patch was generated — detect conflicts.
  const currentDiff = computeDiff(patch.before, currentContent);
  const conflicts = detectConflicts(patch.hunks, currentDiff.hunks).map((c) => ({
    line: c.line,
    message: c.message,
  }));
  return { valid: conflicts.length === 0, conflicts };
}

/** Apply a full patch to content. Returns the new content. */
export function applyPatch(patch: Patch, content: string): string {
  return applyDiff(content, patch.hunks);
}

/** Apply only specific hunks (partial apply). Returns the new content. */
export function applyHunks(
  content: string,
  hunks: DiffHunk[]
): string {
  return applyDiff(content, hunks);
}

/** Mark a patch as applied. */
export function markApplied(patchId: string): void {
  const patch = patches.get(patchId);
  if (patch) {
    patch.applied = true;
    patches.set(patchId, patch);
  }
}

/** Merge two patches targeting the same file. Returns a merged patch. */
export function mergePatches(
  path: WorkspacePath,
  original: string,
  patch1: Patch,
  patch2: Patch
): { merged: Patch; conflicts: PatchConflict[] } {
  const conflicts = detectConflicts(patch1.hunks, patch2.hunks);
  // Apply patch1 first, then patch2 on top (skipping conflicting hunks).
  let intermediate = applyPatch(patch1, original);
  if (conflicts.length === 0) {
    intermediate = applyPatch(patch2, intermediate);
  }
  const merged = generatePatch(path, original, intermediate);
  return { merged, conflicts };
}

/** Preview a patch — returns what the content would look like if applied. */
export function previewPatch(patch: Patch, currentContent: string): string {
  return applyPatch(patch, currentContent);
}

/** Generate a patch from a text insertion at a specific line. */
export function patchInsert(
  path: WorkspacePath,
  content: string,
  line: number,
  text: string
): Patch {
  const lines = content.split("\n");
  lines.splice(line - 1, 0, ...text.split("\n"));
  return generatePatch(path, content, lines.join("\n"));
}

/** Generate a patch from a text replacement in a line range. */
export function patchReplaceRange(
  path: WorkspacePath,
  content: string,
  startLine: number,
  endLine: number,
  text: string
): Patch {
  const lines = content.split("\n");
  lines.splice(startLine - 1, endLine - startLine + 1, ...text.split("\n"));
  return generatePatch(path, content, lines.join("\n"));
}

/** Generate a patch from a full file rewrite. */
export function patchRewrite(
  path: WorkspacePath,
  content: string,
  newContent: string
): Patch {
  return generatePatch(path, content, newContent);
}
