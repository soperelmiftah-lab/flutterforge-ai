# Inspector Guide

The Workspace Inspector (`/inspector`) is the command center for understanding a Flutter project. It exposes the full power of the Workspace Intelligence layer through 9 specialized tabs.

## Opening the Inspector

- Click **Inspector** in the left sidebar
- Or use the command palette: `Ctrl+K` → "Open Inspector"
- Or navigate directly to `/inspector`

## Tabs

### Overview

A dashboard summary of the project:

- **Project header** — name, kind, version, description, index status
- **Core metrics** — files, symbols, lines, tokens, packages, graph edges
- **Symbol breakdown** — widgets, classes, functions, providers, routes, tests
- **Environment** — project type, Flutter version, Dart SDK, state management, routing
- **Platform support** — Android, iOS, Web, Windows, Linux, macOS
- **Index status** — last indexed, index size, average file size
- **AI context** — active provider, model, streaming, context length, usage
- **Dependencies** — all packages from pubspec.yaml

### Inspector

An interactive file explorer with a detail panel:

- **Left:** project file tree (folders expand/collapse)
- **Right:** selected file's metadata, symbols, imports, exports, dependencies, and reverse references

Click any file to inspect its:
- Language, lines, size, token estimate
- Symbols (classes, widgets, functions, providers, routes — with line numbers and archetypes)
- Imports (relative vs package, with aliases)
- Exports
- Outgoing dependencies (from the graph)
- Incoming references (who imports this file)

Right-click a file in the workspace explorer (not inspector) for the context menu: Open, Pin, Favorite, Copy path, Reveal, New file/folder, Rename, Duplicate, Delete.

### Search

Universal search across the project:

- Search by file, symbol, class, function, widget, provider, method, route, asset, comment
- **Filters:** All, Widgets, Classes, Functions, Methods, Providers, Routes, Services
- **Highlighting:** matched substrings are highlighted in results
- **Keyboard:** ↑↓ navigate, Enter open, Esc clear
- **Recent searches** shown when the input is empty

### Dependencies

Visual dependency graph with 5 views:

- **File Graph** — file → file imports
- **Widget Graph** — widget usage edges
- **Provider Graph** — provider → consumer edges
- **Service Graph** — service/repository/class edges
- **Navigation Graph** — route target edges

Features:
- **Zoom** — scroll or use +/- buttons
- **Pan** — click and drag
- **Click a node** — see outgoing + incoming edges in the sidebar
- **Legend** — edge colors explained
- **Reset view** — the maximize button

### Knowledge Graph

Browse symbols by category:

- Widgets, Providers, Services, Repositories, Models, Navigation, Themes, Assets
- Each category lists all matching symbols with their file path, line, and doc comments
- Assets are read from pubspec.yaml

### Context

See exactly which files the Context Engine would send to the AI:

- Enter a natural-language query
- Choose Top 5 / 10 / 20
- Click **Analyze** to assemble the context
- View:
  - **Summary** — file count, total tokens, usage %
  - **Token budget bar** — green/amber/red based on usage
  - **Ranked files** — ordered by relevance score, with inclusion reasons
  - **Trimmed files** — those cut to fit the token budget
  - **Pinned files** — always included (toggle in the Inspector tab or file explorer)

### Statistics

Visual charts about the project:

- Top metrics (files, symbols, lines, tokens, avg size, languages)
- Symbols by kind (bar chart)
- Files by type (bar chart)
- Lines by language (bar chart)
- Largest files
- Most referenced files
- Architecture (state management, routing, project kind, complexity score)

### Memory

Workspace memory — what the user is currently doing:

- Current project, current file, cursor position
- Open tabs
- Pinned files
- Recent files
- Recent searches
- Workspace history (Phase 4 placeholder)

### Logs

Event log filtered by type:

- **Index** — scan and graph build events
- **Search** — search queries
- **Context** — context assembly events
- **Watcher** — file change events
- **AI** — AI requests (Phase 4)
- **Tool** — tool calls (Phase 4)

## Re-indexing

The index is cached for performance. To rebuild:

- Click **Re-index** in the inspector header
- Or use the command palette: `Ctrl+Shift+P` → "Reindex Workspace"

The dependency graph rebuilds alongside the index.
