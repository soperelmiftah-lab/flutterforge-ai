/**
 * @module features/workspace-intelligence
 *
 * Workspace Intelligence — the brain that understands Flutter projects.
 *
 * Every future AI Agent imports from here to answer questions based on the
 * actual codebase, not just chat history.
 *
 * Pipeline:
 *   Scanner → Indexer → Graph + Symbols + Knowledge
 *                          ↓
 *   Search ← Context Engine (token optimizer) → API → AI Agents
 *                          ↑
 *   Memory (current file, tabs, pinned) + Watcher (file changes)
 *
 * Sub-modules:
 *   scanner/    Project scanner (pubspec, lib, test, platforms, README, docs)
 *   indexer/    Builds the structured project index
 *   graph/      Dependency graph + knowledge graph (widget/provider/service/nav)
 *   symbols/    Code symbol engine (parse Dart classes/widgets/functions)
 *   search/     Semantic search (keyword/symbol/class/method/provider/route)
 *   context/    Context engine + token optimizer (Top 5/10/20, never whole project)
 *   memory/     Workspace memory (current file, cursor, tabs, pinned, recents)
 *   watcher/    File watcher contract (create/delete/rename/modify/move)
 *   knowledge/  Flutter knowledge detector (Riverpod/Bloc/GoRouter/theme/assets)
 *   actions/    Code action contracts (refactor, rename, find-refs, go-to-def)
 */

export * from "./types";
export * from "./scanner";
export * from "./indexer";
export * from "./graph";
export * from "./symbols";
export * from "./search";
export * from "./context";
export * from "./memory";
export * from "./watcher";
export * from "./knowledge";
export * from "./actions";
