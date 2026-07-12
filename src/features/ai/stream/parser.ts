/**
 * @module features/ai/stream/parser
 *
 * Stream parser — collects ChatChunk deltas into a final string and tracks
 * usage. Used by the client to accumulate a streaming response.
 */

import type { ChatChunk } from "@/features/ai/chat/types";
import type { TokenUsage } from "@/features/ai/tokens/types";

export interface StreamAccumulator {
  /** Concatenated text content from all deltas. */
  content: string;
  /** Tool calls collected during the stream. */
  toolCalls: NonNullable<ChatChunk["toolCall"]>[];
  /** Final token usage (if the provider sent it). */
  usage?: TokenUsage;
  /** Finish reason. */
  finishReason?: ChatChunk["finishReason"];
  /** Whether the stream completed. */
  done: boolean;
  /** Error, if any. */
  error?: { code: string; message: string };
}

/** Create a fresh accumulator. */
export function createAccumulator(): StreamAccumulator {
  return { content: "", toolCalls: [], done: false };
}

/** Apply a chunk to the accumulator. Returns true if the stream is finished. */
export function applyChunk(acc: StreamAccumulator, chunk: ChatChunk): boolean {
  switch (chunk.type) {
    case "delta":
      if (chunk.content) acc.content += chunk.content;
      return false;
    case "tool_call":
      if (chunk.toolCall) acc.toolCalls.push(chunk.toolCall);
      return false;
    case "usage":
      acc.usage = chunk.usage;
      return false;
    case "done":
      acc.done = true;
      acc.finishReason = chunk.finishReason;
      return true;
    case "error":
      acc.done = true;
      acc.error = chunk.error ?? { code: "UNKNOWN", message: "Stream error" };
      return true;
    default:
      return false;
  }
}
