# Patch Engine

The Patch Engine ensures write operations NEVER overwrite files directly. Instead, every mutation generates a `Patch` (before/after/diff) that can be previewed, validated, partially applied, or merged.

## How it works

```
Tool wants to write file X
        │
        ▼
1. Read current content of X  → "before"
2. Compute new content        → "after"
3. generatePatch(path, before, after)
        │
        ├─ computeDiff(before, after)  → hunks + unified diff
        ├─ Store patch in memory
        └─ Return Patch object
        │
        ▼
4. Apply patch (explicit)
        ├─ validatePatch(patch, currentContent)  → conflicts?
        └─ applyPatch(patch, content)             → new content
        │
        ▼
5. Write the patched content to the filesystem
```

## Patch structure

```typescript
interface Patch {
  id: string;
  path: WorkspacePath;
  before: string;      // original content
  after: string;       // new content
  diff: string;        // unified diff text
  hunks: DiffHunk[];   // structured hunks
  applied: boolean;
  partial: boolean;    // can be partially applied
  conflicts?: PatchConflict[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: "context" | "add" | "delete";
  oldNumber?: number;
  newNumber?: number;
  content: string;
}
```

## Operations

### Generate a patch
```typescript
const patch = generatePatch("lib/main.dart", beforeContent, afterContent);
```

### Validate (detect conflicts)
```typescript
const { valid, conflicts } = validatePatch(patch, currentContent);
if (!valid) {
  // File changed since patch was generated
  conflicts.forEach(c => console.log(c.line, c.message));
}
```

### Apply a full patch
```typescript
const newContent = applyPatch(patch, currentContent);
```

### Apply specific hunks (partial apply)
```typescript
const newContent = applyHunks(currentContent, patch.hunks.slice(0, 2));
```

### Merge two patches
```typescript
const { merged, conflicts } = mergePatches(path, original, patch1, patch2);
```

### Preview (without applying)
```typescript
const preview = previewPatch(patch, currentContent);
```

## Patch generators

Convenience functions for common edit patterns:

| Function | Description |
|----------|-------------|
| `patchInsert(path, content, line, text)` | Insert text at a line |
| `patchReplaceRange(path, content, start, end, text)` | Replace a line range |
| `patchRewrite(path, content, newContent)` | Full file rewrite |

## Conflict detection

Two patches conflict if their hunk line ranges overlap:

```typescript
const conflicts = detectConflicts(hunks1, hunks2);
// [{ line: 15, message: "Overlapping edits at line 15" }]
```

## API integration

The Execution Engine automatically generates patches for write operations. The patch ID is returned in the execution result:

```json
{
  "requestId": "exec_abc",
  "status": "success",
  "output": { "path": "lib/main.dart", "patchId": "patch_xyz" }
}
```

The Approval Queue UI renders the patch as a diff so users can review before approving.
