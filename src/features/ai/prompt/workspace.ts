/**
 * @module features/ai/prompt/workspace
 *
 * Workspace context prompt.
 */

import type { PromptContext } from "./types";

export function buildWorkspacePrompt(ctx: PromptContext): string {
  if (!ctx.projectName && !ctx.openFiles?.length) return "";

  const lines: string[] = ["Current workspace context:"];

  if (ctx.projectName) lines.push(`- Project: ${ctx.projectName}`);
  if (ctx.framework) lines.push(`- Framework: ${ctx.framework}`);
  if (ctx.openFiles?.length) {
    const files = ctx.openFiles.slice(0, 10).map((f) => `  · ${f}`).join("\n");
    lines.push(`- Open files:\n${files}`);
  }
  if (ctx.language) lines.push(`- Active language: ${ctx.language}`);

  return lines.join("\n");
}
