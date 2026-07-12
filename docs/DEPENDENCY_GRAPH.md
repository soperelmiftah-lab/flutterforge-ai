# Dependency Graph

The dependency graph models relationships between files in the project. It powers the Dependencies tab, the Knowledge Graph views, and the Context Engine's importance ranking.

## Edge kinds

| Kind | From → To | Source |
|------|-----------|--------|
| `import` | file → file | `import` statements (relative + package:) |
| `widget-usage` | file → file | A widget class referenced via `show` combinator |
| `class-reference` | file → file | A class name referenced via `show` combinator |
| `provider-consumer` | file → file | A provider symbol referenced |
| `service-usage` | file → file | A service symbol referenced |
| `route-target` | file → file | A route/page/screen symbol referenced |
| `asset-reference` | file → asset | An asset path string literal (planned) |

## Node importance

Each node has an `importance` score (0–1) computed via a lightweight PageRank:

```
importance(node) = (1 - d) / N + d * Σ(importance(in) / outdeg(in))
```

- `d` = 0.85 (damping factor)
- `N` = total nodes
- 5 iterations
- Normalized to 0–1 (max importance = 1)

Files with high importance are "hub" files — many other files depend on them. The Context Engine uses this to boost relevance.

## Graph views

The Dependencies tab offers 5 views:

| View | Edges shown |
|------|-------------|
| File Graph | `import` edges + all files as nodes |
| Widget Graph | `widget-usage` edges |
| Provider Graph | `provider-consumer` edges |
| Service Graph | `service-usage` + `class-reference` edges |
| Navigation Graph | `route-target` edges |

## Visualization

The graph renders as an SVG with:

- **Circular layout** — nodes arranged in a circle, centered
- **Color-coded edges** — each edge kind has a distinct color
- **Arrow markers** — edges are directed
- **Zoom** — +/- buttons or scroll (0.4× to 2×)
- **Pan** — click and drag to move the view
- **Click a node** — opens a detail sidebar with outgoing + incoming edges
- **Legend** — bottom-left corner shows edge colors

## Knowledge Graph views

The Knowledge Graph tab provides category-based browsing:

- **Widgets** — all widget symbols (StatelessWidget, StatefulWidget, ConsumerWidget…)
- **Providers** — all provider symbols
- **Services** — all service symbols
- **Repositories** — all repository symbols
- **Models** — all model symbols
- **Navigation** — all route symbols
- **Themes** — all theme symbols
- **Assets** — from pubspec.yaml

Each category lists symbols with file path, line number, doc comments, and widget archetypes.

## API

```bash
# Full graph
GET /api/v1/workspace/dependencies

# Filtered
GET /api/v1/workspace/dependencies?from=lib/main.dart
GET /api/v1/workspace/dependencies?to=lib/main.dart
GET /api/v1/workspace/dependencies?kind=import
```

Response:
```json
{
  "data": {
    "nodes": [
      { "path": "lib/main.dart", "inDegree": 0, "outDegree": 2, "importance": 1.0 }
    ],
    "edges": [
      { "from": "lib/main.dart", "to": "lib/features/home/home_screen.dart", "kind": "import" }
    ]
  }
}
```

## Future enhancements

- **Widget hierarchy** — parent → child widget edges (requires AST parsing)
- **Asset references** — string literal asset paths in code
- **Force-directed layout** — for larger graphs
- **Minimap** — overview of the full graph when zoomed in
