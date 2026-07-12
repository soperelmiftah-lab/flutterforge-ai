/**
 * @module features/ai/agents/types
 *
 * Agent contracts. Agents are higher-level AI workers that use the chat
 * engine to accomplish complex, multi-step tasks. Phase 2 defines the
 * contracts only — implementations arrive in Phase 3+.
 *
 * Each agent has:
 *   - A role (what it does)
 *   - An input type (what it accepts)
 *   - An output type (what it produces)
 *   - A run() method (currently throws NOT_IMPLEMENTED)
 *
 * The AI Agent (autonomous coder), Flutter Generator, Debug Agent, etc.
 * all implement this base contract.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { ProviderId } from "@/features/ai/provider/types";

/** Agent role identifiers. */
export type AgentRole =
  | "planner"
  | "coder"
  | "flutter"
  | "debug"
  | "docs"
  | "git"
  | "reviewer";

/** Base agent input. */
export interface AgentInput {
  /** What the agent should accomplish. */
  task: string;
  /** Conversation context (prior messages). */
  context?: ChatMessage[];
  /** Provider + model to use. */
  provider: ProviderId;
  model: string;
  /** Project/workspace context. */
  projectId?: string;
  openFiles?: string[];
}

/** Base agent output. */
export interface AgentOutput {
  /** Agent's textual response/plan. */
  message: string;
  /** Actions the agent wants to take (file edits, commands, etc.). */
  actions?: AgentAction[];
  /** Whether the agent finished successfully. */
  success: boolean;
  /** Error message if success is false. */
  error?: string;
}

/** An action an agent wants to perform. */
export interface AgentAction {
  type: "file_edit" | "file_create" | "command" | "tool_call";
  target: string;
  content?: string;
  description?: string;
}

/** The universal agent contract. */
export interface AIAgent {
  readonly role: AgentRole;
  readonly name: string;
  readonly description: string;
  run(input: AgentInput): Promise<AgentOutput>;
}
