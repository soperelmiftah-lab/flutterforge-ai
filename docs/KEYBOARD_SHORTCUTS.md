# Keyboard Shortcuts

FlutterForge AI supports VS Code-style keyboard shortcuts for fast navigation and editing.

## Global shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open command palette (everything mode) |
| `Ctrl+P` / `Cmd+P` | Quick open file (files mode) |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Command palette (commands mode) |
| `Ctrl+B` / `Cmd+B` | Toggle sidebar |
| `Ctrl+J` / `Cmd+J` | Toggle bottom panel |
| `Ctrl+S` / `Cmd+S` | Save active file |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Search across project (opens Inspector) |
| `Alt+Shift+F` | Format file (Phase 4) |
| `F2` | Rename symbol (Phase 4) |
| `F12` | Go to definition (Phase 4) |

## Command palette

When the palette is open:

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate results |
| `Enter` | Select / run command |
| `Esc` | Close palette |

## Inspector Search tab

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate results |
| `Enter` | Open selected result (or trigger search if no results) |
| `Esc` | Clear search |

## File explorer

| Action | Result |
|--------|--------|
| Click | Open file |
| Right-click | Context menu (Open, Pin, Copy path, Reveal, New, Rename, Duplicate, Delete) |

## Workspace panels

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` / `Cmd+B` | Toggle left sidebar (Explorer / Navigation) |
| `Ctrl+J` / `Cmd+J` | Toggle bottom panel (Terminal / Problems / Output) |
| Top bar buttons | Toggle right panel (Preview / Chat) |

## Theme

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` → "theme" | Open palette, type "theme" to see Light/Dark/System options |

## Tips

- **`Ctrl+P` is the fastest way to open a file** — just type part of the name.
- **`Ctrl+Shift+P` is for commands** — like "Reindex Workspace" or "Generate Widget".
- **`Ctrl+K` is the universal search** — files, commands, projects, templates in one place.
- **`Esc` closes any overlay** — palette, dialogs, context menus.
- The status bar at the bottom shows the current provider, model, file, and connection status at all times.

## Implementation

Shortcuts are handled in two places:

1. `src/components/layout/command-palette.tsx` — handles `K`, `P`, `Shift+P` (to manage palette mode)
2. `src/components/layout/keyboard-shortcuts.tsx` — handles `B`, `J`, `S`, `Shift+F`, `F2`, `F12`

Both are mounted in the `AppShell` and listen on `window` for `keydown` events.
