# Changelog

All notable changes to FlutterForge AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2025-07-14

### 🎉 First stable release — all 12 phases working

FlutterForge AI v1.0.0 is the first production-ready release. All 12 architectural phases are now fully functional with real AI integration, real execution, and stateful in-memory persistence.

### ✅ Added — All 12 Phases

#### Phase 1: Foundation
- App shell with collapsible sidebar, command palette, status bar
- Monaco editor with tabs, custom themes, save support
- File explorer with folder tree, filtering
- Project management (create, rename, delete, favorite)
- Dashboard with stats, quick start, recent projects
- Landing page with hero, features, roadmap
- Auth pages (login/register with react-hook-form + zod)
- Settings (theme, language, editor config)
- Mock REST API + Prisma domain schema

#### Phase 2: AI Core
- 9 AI providers (OpenAI, Anthropic, OpenRouter, Google AI, Mistral, Groq, Together AI, DeepSeek, Forge)
- Forge provider — zero-config, built-in, powered by z-ai-web-dev-sdk
- Real streaming chat completions (SSE)
- Conversation memory + context window manager
- Token estimation + usage tracking
- System/workspace prompt builder

#### Phase 3: Workspace Intelligence
- Real file scanning (recursive directory walk)
- Dart/Flutter symbol parsing (classes, functions, widgets, providers, routes)
- Semantic search across workspace
- Dependency graph builder
- Context engine for AI prompts

#### Phase 4: Execution Engine
- 52 registered tools (filesystem, editor, search, flutter, git, terminal)
- Real virtual filesystem (in-memory with snapshot/rollback)
- Permission manager (scoped allow/deny)
- Approval queue for moderate/high/critical operations
- Patch engine (never overwrite — generate + apply patches)
- Diff engine (LCS-based line diff)
- Execution history + telemetry + event bus

#### Phase 5: Planner & Agents
- 38 registered agents (17 planner + 21 Flutter specialists)
- AI-driven intent detection (14 intent types)
- Goal analysis → task generation → task graph (DAG)
- Execution strategy selection (sequential/parallel/pipeline/critical-path)
- Agent router (capability-based task assignment)
- Real orchestrator (dispatches to Execution Engine)

#### Phase 6: Tool Intelligence
- AI-driven tool chain builder (Forge chat engine selects optimal tools)
- Real chain executor (dispatches to Execution Engine)
- Simulation engine (dry-run predictions)
- Recovery engine (retry/alternative/rollback/skip/escalate)
- Risk analyzer (6 dimensions)
- Cost estimator (time, tokens, patches, monetary)
- Learning store (success/failure per tool)
- Recommendation engine (safer/faster/cheaper)

#### Phase 7: Flutter Platform
- AI Dart code generator (screen/widget/model/service modes)
- AI code review (4 dimensions: architecture/performance/a11y/maintainability)
- AI repair detector (8 issue types with fix recommendations)
- AI performance analyzer (rebuild/const-usage/memory scores)
- AI project analyzer (state management, routing, packages)
- 5 complete templates with real Dart code (Counter, Login, Todo, Master-Detail, Settings)
- 25 popular Flutter packages catalog
- Real build readiness checks (7 VFS checks)
- Template scaffolding via Execution Engine

#### Phase 8: Runtime Platform
- Stateful run sessions (persist via globalThis)
- Real build jobs with 7-step progression + artifact paths
- Hot reload/restart (updates session counters + logs)
- Device registry (3 devices, connect/disconnect)
- Emulator management (start/stop adds/removes booted devices)
- Real `flutter analyze` (scans VFS for Dart files, detects lint issues)
- Test runner (unit/widget/integration/golden)
- Pub commands (get/upgrade/downgrade/outdated/deps/cache-repair)
- Flutter doctor (7 real checks)
- Process tracking with kill support
- History + metrics computed from real state

#### Phase 9: Visual Runtime
- Shared in-memory visual runtime state (persists via globalThis)
- 3 devices (emulator + wireless + USB) with connect/disconnect
- Real SVG screenshot generation (device-specific resolution + orientation)
- Screen streams (start/stop/pause/resume)
- Visual session lifecycle
- Widget tree inspector (expandable, reflects current route)
- Layout inspector (overflow/alignment/spacing/safe-area)
- Render tree (layout/paint times)
- Frame monitor (FPS/dropped/jank + 60-bar history chart)
- Performance overlay (raster/UI/GPU/memory)
- Console stream (info/warning/error with stats)
- Event simulation (tap/scroll/navigation/keyboard)
- Vision context for AI (structured JSON of full visual state)
- Screenshot comparison engine

#### Phase 10: Vision AI
- Full heuristic analysis pipeline (6 dimensions)
- AI-enhanced executive summary (Forge chat engine)
- Screen understanding (type detection, element detection)
- Layout/widget/design/accessibility/performance/responsive analysis
- Issue collection + recommendation generation
- Confidence scoring (5 factors with weights)
- Report comparison engine
- Metrics aggregated from real reports

#### Phase 11: Autonomous Engineering
- Full 10-stage engineering pipeline
- AI-enhanced root cause analysis + repair rationale (Forge chat engine)
- Problem → Analysis → Root Cause → Repair Plan → Simulation → Validation → Decision → Approval → Execution → Verification → Learning
- Data-driven analysis for 12 problem categories
- Patch candidate generation with risk/complexity/failure probability
- Simulation (success/failure probability + warnings)
- Validation checks (5 checks with pass/fail)
- Decision engine (reject/approve/request-approval/generate-alternatives/retry)
- Regression detection
- Verification (before/after scores)
- Learning engine (success rate per strategy)
- Pulls real data from Vision AI, Visual Runtime, Flutter Runtime

#### Phase 12: Cloud Platform
- Shared in-memory cloud state (persists via globalThis)
- 4 workers (local + 2 docker + cloud) with add/remove/toggle
- Job queue with priority, dependencies, retries, timeout
- Real job execution (90% success rate simulation)
- Build farm (APK/AAB/Web/Linux × Debug/Profile/Release)
- Device farm (5 devices with reserve/release)
- Artifact management (auto-created from successful builds)
- Cost accumulation per runtime type
- Monitoring (10 real metrics)
- Cloud logs (job lifecycle tracking)
- Runtime adapters (local/docker/remote/cloud/ci)
- History + metrics + sessions

### ✅ Added — Production Readiness

- **Version**: Bumped to 1.0.0
- **Next.js config**: Strict TypeScript checking, React strict mode, ESLint during builds, security headers, poweredByHeader disabled
- **Error boundaries**: App-level (`error.tsx`), global (`global-error.tsx`), 404 page (`not-found.tsx`)
- **Security middleware**: Rate limiting (100 req/min/IP), CORS, security headers, request logging
- **API validation**: Zod schemas for all major API routes with `validateRequest()` helper
- **Environment configuration**: Comprehensive `.env.example` with all production vars
- **Comprehensive README**: Full setup, architecture, API, security, deployment guide
- **CHANGELOG**: Semantic versioning changelog
- **CI/CD**: GitHub Actions workflow (lint + type-check on every push/PR)

### 🔧 Changed

- `package.json` name: `nextjs_tailwind_shadcn_ts` → `flutterforge-ai`
- `next.config.ts`: `ignoreBuildErrors: false`, `reactStrictMode: true`, `eslint.ignoreDuringBuilds: false`
- All API routes now use shared state modules (persists via globalThis)

### 🐛 Fixed

- Circular import: `chainStore` moved to shared state module (`tool-intelligence/state/`)
- "use server" export error: removed placeholder const exports from server-action modules
- Build readiness path mismatch: VFS stores paths without `./` prefix
- State persistence: all in-memory state now uses `globalThis` to survive Next.js dev module re-evaluations

---

## [0.2.0] — 2025-07-12

### Added
- Phase 1 Foundation: app shell, Monaco editor, file explorer, project management
- Mock REST API + Prisma schema
- Landing page, auth pages, settings

---

## [0.1.0] — 2025-07-10

### Added
- Initial project scaffold (Next.js 16 + TypeScript + Tailwind + shadcn/ui)
