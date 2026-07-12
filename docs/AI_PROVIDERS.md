# AI Providers

FlutterForge AI supports 9 AI providers through a unified interface. This document covers the provider system, the OpenRouter integration (default + working), and how to add new providers.

## Provider System

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

### Provider Flow

```
User selects provider + model
        │
        ▼
Client (ai-store) ──► POST /api/v1/ai/chat
                          │
                    ┌─────▼─────┐
                    │ Chat Engine│
                    └─────┬─────┘
                          │ resolves provider
                    ┌─────▼─────┐
                    │ Registry   │
                    └─────┬─────┘
                          │ fetches credential
                    ┌─────▼──────┐
                    │ Credential  │
                    │ Store (AES) │
                    └─────┬──────┘
                          │ apiKey
                    ┌─────▼─────┐
                    │ Provider   │
                    │ (OpenRouter)│
                    └─────┬─────┘
                          │ HTTPS
                    ┌─────▼─────┐
                    │ AI Vendor  │
                    └─────┬─────┘
                          │ SSE stream
                    ┌─────▼─────┐
                    │ Response   │
                    └───────────┘
```

## Supported Providers

| Provider | ID | Status | Key Required | Default? |
|----------|-----|--------|-------------|----------|
| Forge (Built-in) | `forge` | ✅ Working | No | — |
| OpenRouter | `openrouter` | ✅ Working | Yes | ✅ |
| OpenAI | `openai` | Placeholder | Yes | — |
| Anthropic Claude | `anthropic` | Placeholder | Yes | — |
| Google Gemini | `gemini` | Placeholder | Yes | — |
| Ollama (Local) | `ollama` | Placeholder | No | — |
| LM Studio (Local) | `lmstudio` | Placeholder | No | — |
| OpenAI-Compatible | `openai-compatible` | Placeholder | Yes | — |
| Custom Endpoint | `custom` | Placeholder | Yes | — |

## OpenRouter Guide

OpenRouter is the **default provider** — a multi-vendor gateway that gives access to hundreds of models (Google, Anthropic, Meta, Mistral, Qwen, etc.) with a single API key, including a rich catalog of **FREE models**.

### Setup

1. Go to **AI Settings** → **API Keys**
2. Click **Add API key** next to OpenRouter
3. Paste your key from [openrouter.ai/keys](https://openrouter.ai/keys)
4. Click **Save & encrypt** — the key is encrypted with AES-256-GCM

### Free Models

OpenRouter marks models as free when `pricing.prompt === "0"` and `pricing.completion === "0"`. FlutterForge AI:

- Automatically fetches all models from `GET /api/v1/models` (public, no auth)
- Filters to free-only by default
- Provides a **Show Paid Models** toggle in the model selector

As of Phase 2, there are **28+ free models** available including:
- `qwen/qwen3-coder:free` — coding
- `google/gemini-2.0-flash-exp:free` — multimodal
- `nvidia/nemotron-3-ultra-550b-a55b:free` — large model
- And many more

### Using OpenRouter

```bash
# List free models (no auth needed)
curl http://localhost:3000/api/v1/ai/models?freeOnly=true

# Chat (requires API key configured)
curl -X POST http://localhost:3000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openrouter",
    "model": "qwen/qwen3-coder:free",
    "messages": [{"role":"user","content":"Hello"}],
    "stream": true
  }'
```

### OpenRouter-specific headers

Every OpenRouter request includes:
- `Authorization: Bearer <apiKey>`
- `HTTP-Referer: https://flutterforge.ai` — helps OpenRouter identify the app
- `X-Title: FlutterForge AI` — app name shown in OpenRouter dashboard

### Streaming

OpenRouter returns standard SSE (`data: {...}\n\n` with `data: [DONE]` terminator). The `OpenRouterProvider.stream()` method:
1. Creates an `AbortController` for cancellation
2. Reads the response body with `getReader()`
3. Parses SSE frames (split by `\n\n`)
4. Yields `ChatChunk` deltas for each `choices[0].delta.content`
5. Yields `usage` when `stream_options.include_usage` returns it
6. Yields `done` on `finish_reason` or `[DONE]`

## Forge (Built-in) Provider

Forge is a bonus built-in provider powered by the Z.ai SDK. It requires **no API key** — perfect for immediate experimentation.

- Models: `glm-4.6` (multimodal, reasoning), `glm-4.5` (fast)
- Both are free with 131K context
- Streaming works via SSE parsing (the SDK yields raw SSE bytes)

> The Forge provider is NOT one of the 8 spec-listed providers. It's an addition so FlutterForge works out-of-the-box. The default is still OpenRouter per spec.

## Future Provider Guide

To implement a placeholder provider (e.g., OpenAI):

### 1. Replace the placeholder class

In `src/features/ai/provider/placeholders.ts`, replace `OpenAIProvider`:

```typescript
export class OpenAIProvider implements AIProvider {
  readonly meta = openaiMeta;
  config: ProviderConfig | null = null;

  async initialize(config: ProviderConfig) {
    this.config = { timeoutMs: 60_000, ...config };
  }

  async models(): Promise<ModelDescriptor[]> {
    const res = await fetch(`${this.config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
    });
    const json = await res.json();
    return json.data.map(/* map to ModelDescriptor */);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // POST /chat/completions (non-streaming)
  }

  async *stream(request: ChatRequest): AsyncIterable<ChatChunk> {
    // POST /chat/completions with stream:true
    // Parse SSE and yield chunks
  }

  async health(): Promise<HealthStatus> {
    // GET /models to verify connectivity
  }

  async cancel(requestId: string) {
    // Abort the in-flight request
  }
}
```

### 2. Update metadata

In `provider/metas.ts`, set `implemented: true` for the provider.

### 3. Test

- Visit AI Settings → verify the provider shows as implemented
- Add an API key → test connection
- Select a model → send a chat message

That's it — no changes to the chat engine, stores, or UI. The provider abstraction handles everything.
