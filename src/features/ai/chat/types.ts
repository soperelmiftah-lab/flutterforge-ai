/**
 * @module features/ai/chat/types
 *
 * Universal chat types shared by all providers, the chat engine, the memory
 * system, and the API layer. Providers translate between this canonical shape
 * and their native format.
 */

import type { ProviderId } from "@/features/ai/provider/types";
import type { TokenUsage } from "@/features/ai/tokens/types";

/** Message role. */
export type ChatRole = "system" | "developer" | "user" | "assistant" | "tool";

/** A single message in a conversation. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Optional name/label for the sender. */
  name?: string;
  /** Tool call results (role === "tool"). */
  toolCallId?: string;
  /** Tool calls issued by the assistant. */
  toolCalls?: ToolCall[];
  /** When this message was created. */
  createdAt?: string;
  /** Whether the user pinned this message (memory system). */
  pinned?: boolean;
}

/** A tool/function definition the model can call. */
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

/** A tool call the model wants to execute. */
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/**
 * Universal chat request. The chat engine builds this from user input +
 * memory + prompts, then hands it to the provider.
 */
export interface ChatRequest {
  /** Unique id for tracing/cancellation. */
  id: string;
  /** Which provider to route to. */
  provider: ProviderId;
  /** Which model to use. */
  model: string;
  /** Conversation messages (system/developer prompts are prepended by the engine). */
  messages: ChatMessage[];
  /** Override the default system prompt. */
  systemPrompt?: string;
  /** Developer-level instructions (higher priority than system). */
  developerPrompt?: string;
  // Generation parameters
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
  // Capabilities
  stream?: boolean;
  tools?: ToolDefinition[];
  /** Reasoning effort level (for models that support it). */
  reasoningEffort?: "low" | "medium" | "high";
  /** JSON schema to force structured output. */
  jsonSchema?: Record<string, unknown>;
}

/** Non-streaming response. */
export interface ChatResponse {
  id: string;
  requestId: string;
  model: string;
  provider: ProviderId;
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter";
  usage?: TokenUsage;
}

/** A single streamed chunk. */
export interface ChatChunk {
  type: "delta" | "tool_call" | "usage" | "done" | "error";
  /** Partial text delta (type === "delta"). */
  content?: string;
  /** Tool call delta (type === "tool_call"). */
  toolCall?: ToolCall;
  /** Token usage (type === "usage", usually sent at the end). */
  usage?: TokenUsage;
  /** Finish reason (type === "done"). */
  finishReason?: "stop" | "length" | "tool_calls" | "content_filter";
  /** Error (type === "error"). */
  error?: { code: string; message: string };
  /** Request id for correlation. */
  requestId?: string;
}
