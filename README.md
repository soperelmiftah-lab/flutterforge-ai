# FlutterForge AI

> The AI-native studio for building Flutter apps in your browser.

[![Version](https://img.shields.io/badge/version-1.0.0-emerald.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)

FlutterForge AI is a browser-based, AI-powered development environment specialized for Flutter. It combines a Monaco-grade editor, an AI coding agent, live preview, visual runtime, autonomous engineering, and a cloud build pipeline into a single workspace — a Flutter-focused alternative to Google AI Studio.

---

## 🚀 Features (All 12 Phases Working)

| Phase | Module | Status | Highlights |
|-------|--------|--------|------------|
| 1 | Foundation | ✅ | App shell, Monaco editor, file explorer, project management, landing page |
| 2 | AI Core | ✅ | 9 providers, real streaming (z-ai SDK), conversation memory, token tracking |
| 3 | Workspace Intelligence | ✅ | Real file scanning, symbol parsing, semantic search, dependency graph |
| 4 | Execution Engine | ✅ | 52 tools, real FS operations, approval queue, patch engine, rollback |
| 5 | Planner & Agents | ✅ | 38 agents, AI-driven intent detection, task graph, real orchestration |
| 6 | Tool Intelligence | ✅ | AI-driven chain builder, real execution, learning store, recovery engine |
| 7 | Flutter Platform | ✅ | AI Dart code generator, code review, repair, 5 templates, 25 packages |
| 8 | Runtime Platform | ✅ | Stateful run sessions, build jobs, hot reload, real device registry |
| 9 | Visual Runtime | ✅ | Device bridge, screenshots, streams, widget inspector, frame monitor |
| 10 | Vision AI | ✅ | Heuristic + AI analysis, 6 dimensions, executive summary, comparison |
| 11 | Autonomous Engineering | ✅ | 10-stage pipeline, AI-enhanced root cause, verification, learning |
| 12 | Cloud Platform | ✅ | Workers, job queue, build farm, device farm, artifacts, cost tracking |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| State | Zustand (client) + in-memory server state |
| Database | Prisma ORM (SQLite dev / PostgreSQL prod) |
| AI | z-ai-web-dev-sdk (Forge provider, built-in) |
| Editor | Monaco Editor |
| Icons | Lucide React |
| Validation | Zod |
| Auth | NextAuth.js v4 (available) |

---

## 📦 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/soperelmiftah-lab/flutterforge-ai.git
cd flutterforge-ai

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Initialize the database
bun run db:push

# Start the dev server
bun run dev
```

Open **http://localhost:3000** in your browser.

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start the dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |

---

## 🏗️ Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated app pages
│   │   ├── dashboard/            # Dashboard
│   │   ├── workspace/            # Monaco editor + file explorer
│   │   ├── planner/              # AI Planner & Agents
│   │   ├── tool-intelligence/    # Tool chain builder
│   │   ├── flutter-platform/     # Code generator + review
│   │   ├── runtime/              # Flutter runtime
│   │   ├── visual/               # Visual runtime + device bridge
│   │   ├── vision-ai/            # Vision AI analysis
│   │   ├── autonomous/           # Autonomous engineering
│   │   └── cloud/                # Cloud build platform
│   ├── api/v1/                   # REST API (99 routes)
│   ├── error.tsx                 # App error boundary
│   ├── global-error.tsx          # Global error boundary
│   └── not-found.tsx             # 404 page
├── features/                     # Feature modules (12 phases)
│   ├── ai/                       # AI Core (9 providers, chat engine)
│   ├── execution/                # Execution Engine (52 tools)
│   ├── planner/                  # Planner & Agents (38 agents)
│   ├── tool-intelligence/        # Tool Intelligence
│   ├── flutter-platform/         # Flutter Platform
│   ├── flutter-runtime/          # Runtime Platform
│   ├── visual-runtime/           # Visual Runtime
│   ├── vision-ai/                # Vision AI
│   ├── autonomous/               # Autonomous Engineering
│   └── cloud/                    # Cloud Platform
├── stores/                       # Zustand stores (12)
├── lib/                          # Shared utilities + validation
└── middleware.ts                 # Security + rate limiting
```

### Key Design Principles

1. **Feature-modular architecture** — each phase is a self-contained module under `src/features/`
2. **Stateful server state** — in-memory state persists via `globalThis` for dev, Prisma for prod
3. **AI-first** — the Forge chat engine (z-ai SDK) drives code generation, review, repair, and analysis
4. **Type-safe** — Zod schemas validate all API inputs
5. **Resilient** — error boundaries at app + global level, automatic recovery in execution engine

---

## 🔌 API Overview

All API routes are under `/api/v1/`. Key endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/planner/plan` | POST | AI-driven plan creation |
| `/api/v1/planner/execute` | POST | Execute a plan |
| `/api/v1/tools/analyze` | POST | AI tool chain analysis |
| `/api/v1/tools/execute` | POST | Execute a tool chain |
| `/api/v1/flutter/generate` | POST | AI Dart code generation |
| `/api/v1/flutter/review` | POST | AI code review |
| `/api/v1/runtime/run` | POST | Start a run session |
| `/api/v1/runtime/build` | POST | Queue a build |
| `/api/v1/visual/capture` | POST | Capture screenshot |
| `/api/v1/vision/analyze` | POST | Vision AI analysis |
| `/api/v1/autonomous/analyze` | POST | Autonomous pipeline |
| `/api/v1/cloud/jobs` | GET/POST | Cloud job queue |

Rate limited: **100 requests/minute/IP** (configurable via `RATE_LIMIT_MAX_REQUESTS`).

---

## 🔒 Security

- **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, HSTS (via `next.config.ts` + middleware)
- **CORS** — configurable via `ALLOWED_ORIGINS` env var
- **Rate limiting** — in-memory, per-IP, 100 req/min (configurable)
- **Input validation** — all API routes use Zod schemas
- **Error boundaries** — app-level + global error handling
- **No secrets in client** — `z-ai-web-dev-sdk` only used server-side

---

## 🚢 Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — click **Deploy**
4. Set environment variables in Vercel dashboard (see `.env.example`)
5. Every push to `main` auto-deploys

### Docker

```bash
# Build
docker build -t flutterforge-ai .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=file:./db/flutterforge.db \
  -e AI_ENCRYPTION_KEY=your-key \
  -e NEXTAUTH_SECRET=your-secret \
  flutterforge-ai
```

### Environment Variables

See [`.env.example`](.env.example) for all available environment variables.

---

## 🗺️ Roadmap

### v1.0.0 (current)
- All 12 phases working with real AI + real execution
- Production-ready: error handling, security, validation, CI/CD

### v1.1.0 (planned)
- Real Flutter SDK integration (replace simulated runtime)
- WebSocket-based real-time collaboration
- User authentication with GitHub OAuth

### v1.2.0 (planned)
- Real device farm (Firebase Test Lab / BrowserStack)
- CI/CD pipeline templates
- Plugin system for custom tools

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">Built with ❤️ for the Flutter community</p>
