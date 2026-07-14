/**
 * @module features/ai/prompt/types
 *
 * Prompt system types. The prompt builder merges a system prompt, developer
 * prompt, workspace context, and Flutter expertise into a single system
 * message that precedes the conversation.
 */

export interface PromptContext {
  projectName?: string;
  framework?: string;
  openFiles?: string[];
  language?: string;
  beginnerMode?: boolean;
  customInstructions?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  build: (ctx: PromptContext) => string;
}
