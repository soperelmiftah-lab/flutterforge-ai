# Command Palette

The command palette is the fastest way to navigate FlutterForge AI. It supports three modes and dozens of commands.

## Opening the palette

| Shortcut | Mode | Description |
|----------|------|-------------|
| `Ctrl+K` / `Cmd+K` | Everything | Files + commands + projects + templates |
| `Ctrl+P` / `Cmd+P` | Files | Quick open file |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Commands | Commands only |

## Navigation

Type to filter. Use ↑↓ to navigate, Enter to select, Esc to close.

### Quick Open (files mode)

- Lists all files in the project
- Select a file to open it in the workspace editor

### Navigate (everything mode)

- Dashboard, Workspace, Inspector, AI Chat, AI Settings, Projects, Templates, History, Settings

### Workspace commands

- **Reindex Workspace** — rebuild the project index + dependency graph
- **Analyze Workspace** — open the inspector for analysis
- **Open Inspector** — go to `/inspector`

### AI commands

- **Open AI Chat** — go to `/chat`
- **Open AI Settings** — go to `/ai-settings`
- **Switch AI Provider** — change provider (shows current)
- **Switch AI Model** — change model (shows current)

### Theme commands

- **Switch Theme: Light / Dark / System**

### Generate commands (Phase 4 placeholders)

- Generate Widget
- Generate Screen
- Generate Service
- Generate Riverpod Provider
- Generate Model
- Generate Repository
- New File

### Format commands (Phase 4 placeholders)

- Format File
- Format Project

## Footer hints

The palette footer shows the current mode and keyboard hints:

- `↑↓` navigate
- `↵` select
- `esc` close

## Extensibility

Commands are defined in `src/components/layout/command-palette.tsx`. To add a new command:

```typescript
{
  id: "my-command",
  label: "My Command",
  icon: MyIcon,
  group: "Workspace", // or "AI", "Theme", "Navigate", etc.
  action: () => { /* run */ },
  keywords: "searchable keywords",
}
```

Add it to the `commands` array and it appears in the palette automatically.
