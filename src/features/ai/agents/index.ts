/**
 * @module features/ai/agents
 *
 * Agent placeholder contracts. Each agent is a stub that throws
 * PROVIDER_NOT_IMPLEMENTED in Phase 2. The contracts are real so Phase 3+
 * can fill in implementations without changing callers.
 *
 * Agents:
 *   - PlannerAgent      — breaks complex tasks into steps
 *   - CodeGeneratorAgent — generates code from descriptions
 *   - FlutterAgent      — Flutter-specific generation & refactoring
 *   - DebugAgent        — finds and fixes bugs
 *   - DocumentationAgent — generates docs & comments
 *   - GitAgent          — manages version control operations
 *   - ReviewAgent       — reviews code for quality & security
 */

import type { AIAgent, AgentRole, AgentInput, AgentOutput } from "./types";
import { aiErrors } from "@/features/ai/errors";

/** Base class for stub agents. */
abstract class StubAgent implements AIAgent {
  abstract readonly role: AgentRole;
  abstract readonly name: string;
  abstract readonly description: string;

  async run(_input: AgentInput): Promise<AgentOutput> {
    throw aiErrors.notImplemented(`${this.name} agent`);
  }
}

export class PlannerAgent extends StubAgent {
  readonly role = "planner" as const;
  readonly name = "Planner";
  readonly description = "Breaks complex tasks into actionable steps before execution.";
}

export class CodeGeneratorAgent extends StubAgent {
  readonly role = "coder" as const;
  readonly name = "Code Generator";
  readonly description = "Generates code from natural-language descriptions.";
}

export class FlutterAgent extends StubAgent {
  readonly role = "flutter" as const;
  readonly name = "Flutter Agent";
  readonly description = "Flutter-specific generation, refactoring, and widget scaffolding.";
}

export class DebugAgent extends StubAgent {
  readonly role = "debug" as const;
  readonly name = "Debug Agent";
  readonly description = "Analyzes errors, traces bugs, and proposes fixes.";
}

export class DocumentationAgent extends StubAgent {
  readonly role = "docs" as const;
  readonly name = "Documentation Agent";
  readonly description = "Generates README, API docs, and inline comments.";
}

export class GitAgent extends StubAgent {
  readonly role = "git" as const;
  readonly name = "Git Agent";
  readonly description = "Manages commits, branches, and pull requests.";
}

export class ReviewAgent extends StubAgent {
  readonly role = "reviewer" as const;
  readonly name = "Review Agent";
  readonly description = "Reviews code for quality, security, and best practices.";
}

/** All agent instances, keyed by role. */
export const agents: Record<AgentRole, AIAgent> = {
  planner: new PlannerAgent(),
  coder: new CodeGeneratorAgent(),
  flutter: new FlutterAgent(),
  debug: new DebugAgent(),
  docs: new DocumentationAgent(),
  git: new GitAgent(),
  reviewer: new ReviewAgent(),
};

/** Get an agent by role. */
export function getAgent(role: AgentRole): AIAgent {
  return agents[role];
}

export type { AIAgent, AgentRole, AgentInput, AgentOutput } from "./types";
