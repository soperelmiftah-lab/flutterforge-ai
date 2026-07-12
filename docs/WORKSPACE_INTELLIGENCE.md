# Workspace Intelligence

The Workspace Intelligence layer is the brain that understands Flutter projects. It scans, indexes, analyzes, and contextualizes the codebase so every AI feature (chat, agents, generators) can reason about the actual project structure — not just the chat history.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Workspace Intelligence                         │
│                                                                  │
│   scanner/  ─→ indexer/  ─→ graph/  ─→ search/  ─→ context/      │
│   (files)     (symbols)   (edges)   (rank)    (top-N + tokens)   │
│        ↑           ↑          ↑         ↑           ↑            │
│        └───────────┴──────────┴─────────┴───────────┘            │
│                          memory/  ←  watcher/                    │
│                          (state)    (file changes)               │
│                                                                  │
│   knowledge/  ─→ Flutter detector (Riverpod, Bloc, GoRouter…)    │
│   actions/   ─→ Code action contracts (refactor, rename, …)      │
└──────────────────────────────────────────────────────────────────┘
        ↑                                   ↑
   Zustand stores                    API routes
   (workspace-index,                 /api/v1/workspace/
    search, dependency,               {index, search, context,
    context)                           files, dependencies}
        ↑                                   ↑
   Inspector UI (9 tabs)           Command Palette + Status Bar
```

## Pipeline

1. **Scan** — `InMemoryScanner` walks the project tree (pubspec, lib, test, platforms, README, docs)
2. **Index** — `buildIndex()` parses each Dart file for symbols, imports, exports
3. **Graph** — `buildGraph()` creates file→file edges + computes importance (PageRank-style)
4. **Search** — `search()` finds files/symbols by keyword with fuzzy matching + importance boosting
5. **Context** — `assembleContext()` ranks files by relevance, fits the token budget, keeps pinned + current files

## Key principles

- **Never send the whole project to the AI.** The Context Engine selects only the Top 5/10/20 most relevant files.
- **Token-aware.** Every file has a token estimate; the optimizer trims to fit the model's context window.
- **Pinned files always included.** Users pin critical files that should always be in context.
- **Provider-independent.** The intelligence layer doesn't know which AI model will consume the context.
- **Cached.** The index + graph are built once and cached server-side; re-indexing is explicit.

## Inspector tabs

| Tab | Purpose |
|-----|---------|
| Overview | Project summary, metrics, environment, platforms, index status |
| Inspector | Interactive file explorer with symbols/imports/exports/dependencies |
| Search | Universal search with filters, highlighting, keyboard navigation |
| Dependencies | Visual graph (file/widget/provider/service/navigation) with zoom/pan |
| Knowledge Graph | Relationships by category (widgets, providers, services, models, routes, themes, assets) |
| Context | Context Engine output — ranked files, token budget, pinned, trimmed |
| Statistics | Charts: symbols by kind, files by type, lines by language, largest files |
| Memory | Workspace state: current file, cursor, tabs, pinned, recents, searches |
| Logs | Event log: index, search, context, watcher, AI, tool calls |

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/workspace/index` | Full project index (files, folders, knowledge base, statistics) |
| POST | `/api/v1/workspace/search` | Semantic search (keyword/symbol/class/method/provider/route) |
| POST | `/api/v1/workspace/context` | Assemble AI context (ranked files, token budget) |
| GET | `/api/v1/workspace/files` | List indexed files (with optional symbols) |
| GET | `/api/v1/workspace/dependencies` | Dependency graph (nodes + edges) |

## Zustand stores

| Store | Purpose |
|-------|---------|
| `useWorkspaceIndexStore` | Project index, files, folders, knowledge base, statistics |
| `useSearchStore` | Search query, results, recent searches |
| `useDependencyStore` | Dependency graph, edges, node importance |
| `useContextStore` | Context result, Top-N, pinned files, current file |

See also: [INSPECTOR_GUIDE.md](./INSPECTOR_GUIDE.md), [SEARCH_ENGINE.md](./SEARCH_ENGINE.md), [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md), [COMMAND_PALETTE.md](./COMMAND_PALETTE.md), [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md).
