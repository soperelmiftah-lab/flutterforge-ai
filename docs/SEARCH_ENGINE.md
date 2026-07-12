# Search Engine

The semantic search engine finds files, symbols, classes, methods, providers, routes, assets, and comments across the project — ranked by relevance.

## How it works

```
Query → scoreMatch(query, target) for every file/symbol/doc
      → boost by file importance (from dependency graph PageRank)
      → deduplicate by (path, kind, symbol)
      → sort by score descending
      → return top N
```

## Matching algorithm

`scoreMatch(query, target)` returns a relevance score (0–1):

| Condition | Score |
|-----------|-------|
| Exact match | 1.0 |
| Target starts with query | 0.9 |
| Target includes query | 0.75 |
| Query includes target (multi-word query) | 0.7 |
| Query token matches target | 0.55–0.85 |
| Target token starts with query | 0.6 |
| Target token includes query | 0.5 |
| Fuzzy subsequence match | 0.3 |
| No match | 0 |

The final score blends the match score (85%) with the file's graph importance (15%).

## Searchable fields

| Field | Kind | Example |
|-------|------|---------|
| File name | `file` | "main.dart" |
| File path | `file` | "lib/main.dart" |
| Symbol name | `symbol` | "HomeScreen" |
| Symbol doc | `comment` | "Builds the home screen" |
| Import URI | `import` | "package:flutter/material.dart" |

## Intent detection

The search engine detects intent from keywords:

- "widget" → filters to widget symbols
- "class" → filters to class symbols
- "function"/"fn"/"func" → filters to functions
- "provider" → filters to providers
- "route"/"page"/"screen" → filters to routes
- "service" → filters to services
- "repository"/"repo" → filters to repositories
- "model"/"dto"/"entity" → filters to models

## Inspector Search tab

The Inspector → Search tab provides a full search UI:

- **Input** — type and press Enter (or just type to search)
- **Kind filters** — All, Widgets, Classes, Functions, Methods, Providers, Routes, Services
- **Highlighting** — matched substrings are wrapped in `<mark>`
- **Keyboard** — ↑↓ navigate, Enter open, Esc clear
- **Recent searches** — shown when input is empty
- **Score** — each result shows a relevance percentage

## API

```bash
POST /api/v1/workspace/search
Content-Type: application/json

{
  "query": "HomeScreen",
  "limit": 50,
  "includeComments": true,
  "kinds": ["widget"],          // optional
  "extensions": ["dart"]        // optional
}
```

Response:
```json
{
  "data": [
    {
      "path": "lib/features/home/home_screen.dart",
      "name": "home_screen.dart",
      "kind": "symbol",
      "symbol": { "name": "HomeScreen", "kind": "widget", "line": 4, ... },
      "score": 1.0,
      "matchedFields": ["symbol:widget"]
    }
  ],
  "total": 1
}
```

## Performance

- The index is cached server-side (5-minute TTL)
- Search runs over the cached index — no file I/O per query
- Results are deduplicated to avoid showing the same file/symbol twice
- The default limit is 50 results
