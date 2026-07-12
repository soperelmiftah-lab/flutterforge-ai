# AI Core Architecture

FlutterForge AI's AI Core is a provider-independent, modular intelligence layer that powers every AI feature in the application — chat, agents, code generation, debugging, review, and documentation. Built in Phase 2, it's designed so new providers, models, and agents can be added without touching existing code.

## 1. Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                             │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│   │ AI Store  │  │ Provider │  │ Model    │  │ Chat Store       │    │
│   │ (params)  │  │ Store    │  │ Store    │  │ (messages, SSE)  │    │
│   └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │
│         │             │             │                  │              │
│         └─────────────┴─────────────┴──────────────────┘              │
│                                    │ fetch /api/v1/ai/*              │
└────────────────────────────────────┼─────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────┐
│                    Next.js API Routes (server)                       │
│                                                                     │
│   /api/v1/ai/chat       ─→ Chat Engine ─→ Provider ─→ AI Vendor      │
│   /api/v1/ai/models     ─→ Model Registry                            │
│   /api/v1/ai/providers  ─→ Credential Store (encrypted)              │
│   /api/v1/ai/settings   ─→ AI Settings                               │
│   /api/v1/ai/health     ─→ Provider Health Check                     │
└───────────────────────────────────────────────────────────────────────┘
                                     │ SSE stream
┌────────────────────────────────────▼─────────────────────────────────┐
│                         AI Core (features/ai/)                       │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ provider/ │  │ models/  │  │ chat/    │  │ stream/  │            │
│   │ 9 provs  │  │ registry │  │ engine   │  │ SSE      │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ memory/  │  │ prompt/  │  │ tokens/  │  │ context/ │            │
│   │ conv,ctx │  │ sys,flutter│ │ count,trk│  │ manager  │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ tools/   │  │ settings/│  │ registry/│  │ agents/  │            │
│   │ contracts│  │ types    │  │ encrypt  │  │ stubs    │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└───────────────────────────────────────────────────────────────────────┘
```

## 2. Module breakdown

### `provider/` — Provider Abstraction

Every provider implements the `AIProvider` interface:

```typescript
interface AIProvider {
  readonly meta: ProviderMeta;
  initialize(config: ProviderConfig): Promise<void>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<ChatChunk>;
  models(): Promise<ModelDescriptor[]>;
  health(): Promise<HealthStatus>;
  cancel(requestId: string): Promise<void>;
}
```

**9 providers** are registered:

| Provider | Status | Key Required | Notes |
|----------|--------|-------------|-------|
| **Forge** (Built-in) | ✅ Working | No | z-ai SDK, zero-config |
| **OpenRouter** | ✅ Working | Yes | Default; 28+ free models |
| OpenAI | Placeholder | Yes | Phase 3+ |
| Anthropic Claude | Placeholder | Yes | Phase 3+ |
| Google Gemini | Placeholder | Yes | Phase 3+ |
| Ollama (Local) | Placeholder | No | Phase 3+ |
| LM Studio (Local) | Placeholder | No | Phase 3+ |
| OpenAI-Compatible | Placeholder | Yes | Phase 3+ |
| Custom Endpoint | Placeholder | Yes | Phase 3+ |

**Key design rule:** `metas.ts` contains static metadata only (no imports of provider implementations). Client components import from `metas.ts`; server code imports from `registry.ts`. This prevents server-only dependencies (like `z-ai-web-dev-sdk`'s `fs/promises`) from leaking into client bundles.

### `models/` — Dynamic Model Registry

- `fetchProviderModels(id)` — fetches models from a provider (cached 5 min)
- `fetchAllModels()` — aggregates all providers
- `filterModels(models, filter)` — free/paid, capability, search
- `sortModels(models, key)` — popularity, name, context, cost

**Free model detection:** A model is free when `pricing.prompt === "0" && pricing.completion === "0"`. OpenRouter exposes this natively; the UI defaults to free-only with a "Show Paid Models" toggle.

### `chat/` — Universal Chat Engine

The single entry point for all AI completions:

```typescript
// Non-streaming
const response = await chat({ provider, model, messages, ... });

// Streaming (SSE)
for await (const chunk of stream({ provider, model, messages, ... })) {
  // chunk.type: "delta" | "tool_call" | "usage" | "done" | "error"
}
```

The engine:
1. Resolves the provider from the registry
2. Merges system/developer/workspace prompts (via the prompt builder)
3. Delegates to the provider's `chat()` or `stream()` method
4. Normalises errors into typed `AIError`s

### `stream/` — SSE Streaming

- **Server:** `streamToResponse(iterable)` converts `AsyncIterable<ChatChunk>` → SSE `Response`
- **Client:** `consumeSSEStream(response)` reads the SSE body → `AsyncIterable<SSEEvent>`
- **Parser:** `StreamAccumulator` collects deltas into final content + usage

SSE wire format: `data: {"type":"chunk","chunk":{"type":"delta","content":"Hello"}}\n\n`

### `memory/` — Conversation Memory

- `createSession()` / `addMessage()` / `togglePin()` — conversation CRUD
- `fitToContext(session, contextLength)` — trims old messages, keeps pinned
- `summariseMessages()` — stub for Phase 3 RAG summarisation

### `prompt/` — Prompt System

Merges into a single system prompt in this order:
1. **Base system** — FlutterForge AI identity + expertise
2. **Flutter expertise** — conventions, best practices, pitfalls
3. **Workspace context** — project name, open files, language
4. **Custom instructions** — user-defined (from AI Settings)

### `tokens/` — Token Engine

- `estimateTokens(text)` — char+word hybrid heuristic (~10% accuracy)
- `TokenTracker` — accumulates usage across a session
- `formatTokens(n)` — display helper (e.g. "12.4k")
- `contextUsagePercent(used, length)` — context bar percentage

### `context/` — Context Manager

`assembleContext(session, contextLength)` combines pinned messages + recent messages + token estimates to produce the final message array for a request. Reports usage percentage for the UI.

### `registry/` — Credential Store

API keys are encrypted at rest with **AES-256-GCM**:
- Key derived via `scrypt(secret, salt, 32)` from `AI_ENCRYPTION_KEY` env var
- Each credential stores `{ iv, ciphertext, tag }` as base64 JSON
- `getCredential()` decrypts server-side only; `getCredentialView()` returns a masked view for the client

### `agents/` — Agent Contracts (Phase 3+)

7 agent stubs, all throwing `PROVIDER_NOT_IMPLEMENTED`:
- PlannerAgent, CodeGeneratorAgent, FlutterAgent
- DebugAgent, DocumentationAgent, GitAgent, ReviewAgent

Each implements the `AIAgent` interface with `run(input: AgentInput): Promise<AgentOutput>`.

## 3. Error handling

All errors are normalised into `AIError` with a typed `code`:

| Code | Meaning | Retryable |
|------|---------|-----------|
| `NETWORK_ERROR` | Fetch failed | ✅ |
| `PROVIDER_UNAVAILABLE` | Provider returned 5xx | ✅ |
| `RATE_LIMIT` | 429 Too Many Requests | ✅ |
| `TIMEOUT` | Request exceeded timeoutMs | ✅ |
| `INVALID_API_KEY` | 401/403 | ❌ |
| `UNKNOWN_MODEL` | 404 | ❌ |
| `STREAMING_INTERRUPTED` | SSE connection lost | ✅ |
| `MISSING_CREDENTIALS` | No API key configured | ❌ |
| `PROVIDER_NOT_IMPLEMENTED` | Placeholder provider | ❌ |
| `CONTEXT_OVERFLOW` | Exceeds context window | ❌ |

The API layer maps these to HTTP status codes automatically.

## 4. Security

- **API keys** are encrypted (AES-256-GCM) before DB storage
- **Keys never leave the server** — the client only sees masked views (`sk-...••••4f2a`)
- **All provider calls** happen server-side in API routes
- **Request validation** — every API route validates its input
- **Rate-limit ready** — `AiUsageRecord` table tracks per-request usage for future rate limiting
- **Abort/cancel** — every streaming request is abortable via `AbortController`

## 5. State management

5 dedicated Zustand stores:

| Store | Purpose | Persisted |
|-------|---------|-----------|
| `ai-store` | Provider, model, generation params, custom instructions | ✅ localStorage |
| `provider-store` | Provider metadata, masked credentials, health status | ❌ |
| `model-store` | Model registry, free/paid filter, selected model | ❌ |
| `chat-store` | Messages, streaming state, SSE consumption | ❌ |
| `token-store` | Cumulative usage, context length, records | ❌ |

## 6. Extension guide

**Adding a new provider:**
1. Create `provider/myprovider.ts` implementing `AIProvider`
2. Add metadata to `provider/metas.ts`
3. Register the factory in `provider/registry.ts`
4. (Optional) Add a Prisma migration if new credential fields are needed

**Adding a new agent:**
1. Create `agents/myagent.ts` extending `StubAgent`
2. Add the role to `AgentRole` in `agents/types.ts`
3. Register in `agents/index.ts`

**The rest of the app doesn't change.** That's the architectural promise.
