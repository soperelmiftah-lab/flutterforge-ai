/**
 * @module features/ai/stream/sse
 *
 * Server-Sent Events helpers for streaming AI chat completions.
 *
 * Server side:  `streamToResponse()` converts an AsyncIterable<ChatChunk>
 *   into a ReadableStream of SSE-formatted bytes, returned as a Response.
 *
 * Client side:  `consumeSSEStream()` reads an SSE Response body and yields
 *   parsed events, handling buffering and partial frames correctly.
 */

import type { ChatChunk } from "@/features/ai/chat/types";

/** SSE event types for the /api/v1/ai/chat streaming endpoint. */
export type SSEEvent =
  | { type: "chunk"; chunk: ChatChunk }
  | { type: "error"; error: { code: string; message: string } }
  | { type: "done" };

/**
 * Convert an async iterable of ChatChunks into an SSE Response.
 * Used by the /api/v1/ai/chat route handler.
 */
export function streamToResponse(
  iterable: AsyncIterable<ChatChunk>,
  onError?: (err: unknown) => SSEEvent
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          const event: SSEEvent = { type: "chunk", chunk };
          controller.enqueue(encoder.encode(formatSSE(event)));
        }
        controller.enqueue(encoder.encode(formatSSE({ type: "done" })));
      } catch (err: unknown) {
        const errorEvent: SSEEvent =
          onError?.(err) ?? {
            type: "error",
            error: {
              code: "UNKNOWN",
              message: err instanceof Error ? err.message : "Streaming failed",
            },
          };
        controller.enqueue(encoder.encode(formatSSE(errorEvent)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Format a single SSE event as wire text. */
function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parse an SSE event from a raw data string.
 * @returns The parsed SSEEvent, or null if the line is a comment/heartbeat.
 */
export function parseSSEEvent(data: string): SSEEvent | null {
  if (!data || data.startsWith(":")) return null; // comment/heartbeat
  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

/**
 * Client-side SSE consumer. Reads a fetch Response body and yields parsed
 * events. Handles buffering across chunk boundaries.
 */
export async function* consumeSSEStream(
  response: Response
): AsyncIterable<SSEEvent> {
  if (!response.body) throw new Error("Response has no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by double newlines.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const lines = frame.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          const event = parseSSEEvent(data);
          if (event) yield event;
        }
      }
    }

    // Flush any remaining buffer.
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        const event = parseSSEEvent(data);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
