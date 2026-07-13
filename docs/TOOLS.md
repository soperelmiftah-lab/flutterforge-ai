# Tools

The Tool Registry contains 52 tools across 6 categories. Every tool has a descriptor (metadata) and an executor (implementation).

## Tool descriptor

```typescript
interface ToolDescriptor {
  id: string;              // e.g. "fs.write_file"
  name: string;            // "Write File"
  description: string;
  category: ToolCategory;  // filesystem | editor | search | flutter | git | terminal
  icon: string;            // emoji
  riskLevel: RiskLevel;    // safe | moderate | high | critical
  permissions: PermissionScope[];
  parameters: ToolParameter[];
  timeoutMs: number;
  supportsRollback: boolean;
  supportsPreview: boolean;
  implemented: boolean;
}
```

## Risk levels

| Level | Approval | Examples |
|-------|----------|----------|
| `safe` | No | Read, list, search, copy |
| `moderate` | Yes | Write, create, rename, commit |
| `high` | Yes | Delete, build APK, checkout, execute command |
| `critical` | Yes | Delete directory, git reset |

## Categories

### Filesystem (11 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `fs.read_file` | Read File | safe | ✅ |
| `fs.write_file` | Write File | moderate | ✅ |
| `fs.create_file` | Create File | moderate | ✅ |
| `fs.delete_file` | Delete File | high | ✅ |
| `fs.rename_file` | Rename File | moderate | ✅ |
| `fs.move_file` | Move File | moderate | ✅ |
| `fs.copy_file` | Copy File | safe | ✅ |
| `fs.duplicate_file` | Duplicate File | safe | ✅ |
| `fs.list_directory` | List Directory | safe | ✅ |
| `fs.create_directory` | Create Directory | safe | ✅ |
| `fs.delete_directory` | Delete Directory | critical | ✅ |

### Editor (9 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `editor.insert_text` | Insert Text | moderate | ✅ |
| `editor.replace_selection` | Replace Selection | moderate | ✅ |
| `editor.replace_range` | Replace Range | moderate | ✅ |
| `editor.apply_patch` | Apply Patch | moderate | ✅ |
| `editor.format_file` | Format File | safe | stub |
| `editor.format_project` | Format Project | safe | stub |
| `editor.open_file` | Open File | safe | ✅ |
| `editor.close_file` | Close File | safe | ✅ |
| `editor.save_file` | Save File | safe | ✅ |

### Search (8 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `search.find_file` | Find File | safe | ✅ |
| `search.find_text` | Find Text | safe | ✅ |
| `search.find_symbol` | Find Symbol | safe | ✅ |
| `search.find_widget` | Find Widget | safe | ✅ |
| `search.find_provider` | Find Provider | safe | ✅ |
| `search.find_route` | Find Route | safe | ✅ |
| `search.find_asset` | Find Asset | safe | ✅ |
| `search.find_class` | Find Class | safe | ✅ |

### Flutter (11 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `flutter.doctor` | Flutter Doctor | safe | stub |
| `flutter.pub_get` | Pub Get | safe | stub |
| `flutter.pub_upgrade` | Pub Upgrade | moderate | stub |
| `flutter.analyze` | Flutter Analyze | safe | stub |
| `flutter.test` | Flutter Test | safe | stub |
| `flutter.run` | Flutter Run | moderate | stub |
| `flutter.hot_reload` | Hot Reload | safe | stub |
| `flutter.hot_restart` | Hot Restart | safe | stub |
| `flutter.clean` | Flutter Clean | moderate | stub |
| `flutter.build_apk` | Build APK | high | stub |
| `flutter.build_aab` | Build AAB | high | stub |

### Git (8 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `git.status` | Git Status | safe | stub |
| `git.diff` | Git Diff | safe | stub |
| `git.commit` | Git Commit | moderate | stub |
| `git.checkout` | Git Checkout | high | stub |
| `git.branch` | Git Branch | moderate | stub |
| `git.undo` | Git Undo | high | stub |
| `git.reset` | Git Reset | critical | stub |
| `git.log` | Git Log | safe | stub |

### Terminal (5 tools)
| ID | Name | Risk | Implemented |
|----|------|------|-------------|
| `terminal.execute` | Execute Command | high | stub |
| `terminal.kill` | Kill Process | high | stub |
| `terminal.stream_logs` | Stream Logs | safe | stub |
| `terminal.env` | Environment Variables | safe | stub |
| `terminal.list_processes` | List Processes | safe | stub |

## Adding a new tool

1. Add the tool ID to `ToolIds` in `registry/tools.ts`
2. Add the descriptor to `toolDescriptors` (with risk, permissions, parameters)
3. Add the executor case to `runTool()` switch statement
4. The tool automatically appears in the Tool Explorer UI and the command palette

## API

```bash
GET /api/v1/execution/tools
# Returns all tools with telemetry
```
