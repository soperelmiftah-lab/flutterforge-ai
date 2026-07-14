/**
 * @module features/ai/prompt/builder
 *
 * The prompt builder. Merges all prompt sections into a single system prompt.
 */

import type { PromptContext } from "./types";
import { buildBasePrompt } from "./system";
import { buildFlutterPrompt } from "./flutter";
import { buildWorkspacePrompt } from "./workspace";

export const DEFAULT_DEVELOPER_PROMPT =
  "Respond concisely. Use markdown for code blocks with the correct language tag.";

export function buildSystemPrompt(ctx?: PromptContext): string {
  const sections: string[] = [buildBasePrompt(ctx)];

  const flutter = buildFlutterPrompt(ctx);
  if (flutter) sections.push(flutter);

  if (ctx) {
    const workspace = buildWorkspacePrompt(ctx);
    if (workspace) sections.push(workspace);
  }

  if (ctx?.customInstructions?.trim()) {
    sections.push(`Custom instructions:\n${ctx.customInstructions.trim()}`);
  }

  return sections.join("\n\n---\n\n");
}
