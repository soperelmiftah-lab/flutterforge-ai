# Diff Viewer

The Diff Viewer renders patches as GitHub/VS Code-style diffs. Supports inline and side-by-side modes with syntax highlighting and line numbers.

## Modes

### Inline
Single column with `+`/`-` prefixes:
```
  1  Hello world
+ 1  Hello FlutterForge
  2  This is line 2
+ 3  This is a new line
  3  This is line 3
```

### Split (side-by-side)
Two columns: before (left) | after (right):
```
Before              │ After
────────────────────┼────────────────────
1 | Hello world      │ 1 | Hello FlutterForge
2 | This is line 2   │ 2 | This is line 2
  |                  │ 3 | This is a new line
3 | This is line 3   │ 4 | This is line 3
```

## Component

```tsx
import { DiffViewer } from "@/components/execution/shared";

<DiffViewer patch={patch} mode="inline" />
<DiffViewer patch={patch} mode="split" />
```

## Features

- **Line numbers** — old (left) and new (right)
- **Color coding** — green for additions, red for deletions
- **Hunk headers** — `@@ -oldStart,oldLines +newStart,newLines @@`
- **Scrollable** — max height with custom scrollbar
- **File path header** — shows the target file + hunk count

## Diff Engine

The underlying diff is computed by the Diff Engine (`features/execution/diff`):

```typescript
import { computeDiff } from "@/features/execution/diff";

const { hunks, diff, addedLines, removedLines } = computeDiff(before, after);
```

### Algorithm
- **LCS (Longest Common Subsequence)** — classic DP algorithm
- Produces structured `DiffHunk[]` with `DiffLine[]` (context/add/delete)
- Groups changes into hunks with 3 lines of context
- Formats as unified diff text

### Apply diff
```typescript
import { applyDiff } from "@/features/execution/diff";

const newContent = applyDiff(originalContent, hunks);
```

## Try it

Visit **Execution → Diff Viewer** tab to experiment with before/after text and see the generated diff in both modes.
