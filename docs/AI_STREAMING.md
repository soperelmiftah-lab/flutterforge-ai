# AI Streaming

FlutterForge AI uses Server-Sent Events (SSE) to stream AI responses token-by-token from the provider to the browser. This document covers the streaming architecture, wire format, and how to consume the stream.

## Streaming Flow

```
Browser (chat-store)                    Server (API route)                AI Provider
───────────────────                    ─────────────────                ───────────
                                       
POST /api/v1/ai/chat ──────────────►   Receive request
  body: { provider, model,             │
    messages, stream: true }           │ Resolve provider + credentials
                                      │
                                      ▼
                                Provider.stream(request)
                                      │ ──────────────────────────►  POST /chat/completions
                                      │                               stream: true
                                      │ ◄──────────────────────────  SSE: data: {"delta":"Hello"}
                                      │ ◄──────────────────────────  SSE: data: {"delta":" world"}
                                      │ ◄──────────────────────────  SSE: data: [DONE]
                                      │
                                yield ChatChunk deltas
                                      │
                                streamToResponse(iterable)
                                      │
  ◄────────────────────────────── SSE Response (text/event-stream)
  data: {"type":"chunk","chunk":{"type":"delta","content":"Hello"}}
  data: {"type":"chunk","chunk":{"type":"delta","content":" world"}}
  data: {"type":"chunk","chunk":{"type":"done","finishReason":"stop"}}
  data: {"type":"done"}
                                      
consumeSSEStream(response)             
  │ parse each "data:" line
  │ applyChunk(acc, chunk)
  │ update message content in store
  │
  ▼
UI renders token-by-token
```

## Wire Format

The `/api/v1/ai/chat` endpoint returns SSE events. Each event is a JSON object wrapped in `data: ...\n\n`:

### Delta event (text token)
```json
{
  "type": "chunk",
  "chunk": {
    "type": "delta",
    "content": "Hello",
    "requestId": "chat_abc123"
  }
}
```

### Usage event (token count)
```json
{
  "type": "chunk",
  "chunk": {
    "type": "usage",
    "usage": {
      "inputTokens": 368,
      "outputTokens": 26,
      "totalTokens": 394
    },
    "requestId": "chat_abc123"
  }
}
```

### Done event
```json
{
  "type": "chunk",
  "chunk": {
    "type": "done",
    "finishReason": "stop",
    "requestId": "chat_abc123"
  }
}
```

### Error event
```json
{
  "type": "error",
  "error": {
    "code": "RATE_LIMIT",
    "message": "Rate limit exceeded."
  }
}
```

### Stream terminator
```json
{ "type": "done" }
```

## Server-Side Implementation

### `streamToResponse(iterable)` — in `stream/sse.ts`

Converts an `AsyncIterable<ChatChunk>` into an SSE `Response`:

```typescript
export function streamToResponse(
  iterable: AsyncIterable<ChatChunk>,
  onError?: (err: unknown) => SSEEvent
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          controller.enqueue(encoder.encode(formatSSE({ type: "chunk", chunk })));
        }
        controller.enqueue(encoder.encode(formatSSE({ type: "done" })));
      } catch (err) {
        controller.enqueue(encoder.encode(formatSSE(onError?.(err) ?? ...)));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable proxy buffering
    },
  });
}
```

### Provider streaming — `OpenRouterProvider.stream()`

The OpenRouter provider:
1. Creates an `AbortController` and registers it for cancellation
2. `fetch()` with `stream: true` in the body
3. Reads `res.body.getReader()` — a `ReadableStream<Uint8Array>`
4. Decodes bytes to text with `TextDecoder`
5. Splits by `\n\n` to get SSE frames
6. Parses each `data:` line as JSON
7. Yields `ChatChunk` for each delta/usage/done

The Forge provider does the same, but the z-ai SDK yields raw SSE bytes that need the same parsing.

## Client-Side Implementation

### `consumeSSEStream(response)` — in `stream/sse.ts`

Reads an SSE `Response` body and yields parsed events:

```typescript
export async function* consumeSSEStream(response: Response): AsyncIterable<SSEEvent> {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const event = parseSSEEvent(line.slice(5).trim());
        if (event) yield event;
      }
    }
  }
}
```

### Chat store — `chat-store.ts`

The chat store's `send()` method:
1. Adds the user message + an empty assistant message to the store
2. `fetch("/api/v1/ai/chat", { method: "POST", body, signal })`
3. Iterates `consumeSSEStream(res)` with `for await`
4. For each `delta` chunk: appends content to the assistant message (triggers React re-render)
5. For each `usage` chunk: stores `lastUsage` for the token counter
6. On error: shows the error message in the assistant bubble
7. Supports `stop()` — aborts the `AbortController`

### Stream accumulator — `stream/parser.ts`

`StreamAccumulator` collects chunks into a final result:

```typescript
const acc = createAccumulator();
for await (const event of consumeSSEStream(res)) {
  if (event.type === "chunk") {
    applyChunk(acc, event.chunk);
    // acc.content grows with each delta
  }
}
// acc.content = full response
// acc.usage = token counts
```

## Cancellation

Every streaming request is cancellable:

1. **Server side:** `AbortController` stored in a `Map<requestId, AbortController>`. `provider.cancel(id)` calls `controller.abort()`.
2. **Client side:** The chat store creates an `AbortController` and passes `signal` to `fetch()`. `stop()` calls `controller.abort()`.
3. **UI:** The send button becomes a stop button (red square) while streaming.

## Error Recovery

| Error | Behavior |
|-------|----------|
| Network error | Error message shown in assistant bubble; user can retry |
| Rate limit (429) | Typed error with retry suggestion |
| Invalid API key (401) | "Add an API key in AI Settings" message |
| Streaming interrupted | Partial content preserved; user can resend |
| Provider unavailable (5xx) | Retryable error message |

The SSE stream itself handles errors gracefully — if the provider throws mid-stream, `streamToResponse` catches the error and sends a final `error` event before closing the stream.

## Non-Streaming Mode

If `stream: false` is set in the request, the endpoint returns a standard JSON response:

```json
{
  "id": "chat_abc123",
  "content": "Hello! I'm FlutterForge AI...",
  "usage": { "inputTokens": 368, "outputTokens": 26, "totalTokens": 394 },
  "model": "glm-4-plus",
  "provider": "forge"
}
```

The chat store handles both modes — non-streaming just sets the full content at once instead of accumulating deltas.
