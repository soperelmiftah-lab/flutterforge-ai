/**
 * @module features/execution/diff
 *
 * Diff Engine — computes line-level diffs between two text contents using
 * the classic LCS (Longest Common Subsequence) algorithm. Produces unified
 * diff text + structured hunks for the Diff Viewer UI.
 */

import type { DiffHunk, DiffLine } from "../types";

/** Compute a structured diff between two strings. */
export function computeDiff(before: string, after: string): {
  hunks: DiffHunk[];
  diff: string;
  addedLines: number;
  removedLines: number;
} {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const lcs = buildLcs(beforeLines, afterLines);
  const diffLines = backtrack(lcs, beforeLines, afterLines);

  // Group into hunks (contiguous blocks of changes + context).
  const hunks = groupIntoHunks(diffLines);
  const diff = formatUnifiedDiff(hunks, beforeLines.length, afterLines.length);
  const added = diffLines.filter((l) => l.type === "add").length;
  const removed = diffLines.filter((l) => l.type === "delete").length;

  return { hunks, diff, addedLines: added, removedLines: removed };
}

/** Build the LCS dynamic-programming table. */
function buildLcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

/** Backtrack through the LCS table to produce diff lines. */
function backtrack(dp: number[][], a: string[], b: string[]): DiffLine[] {
  const lines: DiffLine[] = [];
  let i = a.length;
  let j = b.length;
  let oldNum = a.length;
  let newNum = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      lines.unshift({ type: "context", oldNumber: oldNum, newNumber: newNum, content: a[i - 1] });
      i--; j--; oldNum--; newNum--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.unshift({ type: "add", newNumber: newNum, content: b[j - 1] });
      j--; newNum--;
    } else if (i > 0) {
      lines.unshift({ type: "delete", oldNumber: oldNum, content: a[i - 1] });
      i--; oldNum--;
    }
  }
  return lines;
}

/** Group diff lines into hunks with up to 3 lines of context. */
function groupIntoHunks(lines: DiffLine[], contextSize = 3): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffLine[] = [];
  let oldStart = 0;
  let newStart = 0;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isChange = line.type !== "context";

    if (isChange && !inHunk) {
      // Start a new hunk — include preceding context.
      const contextStart = Math.max(0, i - contextSize);
      current = lines.slice(contextStart, i);
      oldStart = (current[0]?.oldNumber ?? lines[i].oldNumber ?? 1);
      newStart = (current[0]?.newNumber ?? lines[i].newNumber ?? 1);
      inHunk = true;
    }

    if (inHunk) {
      current.push(line);
    }

    if (inHunk && !isChange) {
      // Check if we've accumulated enough trailing context to close the hunk.
      const trailingContext = current.length - current.findIndex((l) => l.type !== "context") - 1;
      if (trailingContext >= contextSize) {
        hunks.push(buildHunk(current, oldStart, newStart));
        current = [];
        inHunk = false;
      }
    }
  }

  if (inHunk && current.length > 0) {
    // Trim trailing context.
    while (current.length > 0 && current[current.length - 1].type === "context") {
      current.pop();
    }
    if (current.length > 0) {
      hunks.push(buildHunk(current, oldStart, newStart));
    }
  }

  return hunks;
}

function buildHunk(lines: DiffLine[], oldStart: number, newStart: number): DiffHunk {
  const oldLines = lines.filter((l) => l.oldNumber !== undefined).length;
  const newLines = lines.filter((l) => l.newNumber !== undefined).length;
  return {
    oldStart,
    oldLines,
    newStart,
    newLines,
    lines,
  };
}

/** Format hunks as unified diff text. */
function formatUnifiedDiff(hunks: DiffHunk[], oldCount: number, newCount: number): string {
  const parts: string[] = [];
  for (const hunk of hunks) {
    parts.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    for (const line of hunk.lines) {
      const prefix = line.type === "add" ? "+" : line.type === "delete" ? "-" : " ";
      parts.push(`${prefix}${line.content}`);
    }
  }
  return parts.join("\n");
}

/** Apply a unified diff to original content. Returns the patched content. */
export function applyDiff(original: string, hunks: DiffHunk[]): string {
  const originalLines = original.split("\n");
  const result: string[] = [];
  let currentLine = 0;

  for (const hunk of hunks) {
    // Copy unchanged lines before the hunk.
    while (currentLine < hunk.oldStart - 1 && currentLine < originalLines.length) {
      result.push(originalLines[currentLine]);
      currentLine++;
    }
    // Apply hunk lines.
    for (const line of hunk.lines) {
      if (line.type === "context") {
        result.push(line.content);
        currentLine++;
      } else if (line.type === "add") {
        result.push(line.content);
      } else if (line.type === "delete") {
        currentLine++;
      }
    }
  }
  // Copy remaining lines.
  while (currentLine < originalLines.length) {
    result.push(originalLines[currentLine]);
    currentLine++;
  }
  return result.join("\n");
}

/** Detect conflicts between two patches targeting the same file. */
export function detectConflicts(
  hunks1: DiffHunk[],
  hunks2: DiffHunk[]
): Array<{ line: number; message: string }> {
  const conflicts: Array<{ line: number; message: string }> = [];
  for (const h1 of hunks1) {
    for (const h2 of hunks2) {
      // Conflict if the hunk ranges overlap.
      const h1End = h1.oldStart + h1.oldLines;
      const h2End = h2.oldStart + h2.oldLines;
      if (h1.oldStart < h2End && h2.oldStart < h1End) {
        conflicts.push({
          line: Math.max(h1.oldStart, h2.oldStart),
          message: `Overlapping edits at line ${Math.max(h1.oldStart, h2.oldStart)}`,
        });
      }
    }
  }
  return conflicts;
}
