/**
 * @module features/ai/prompt/flutter
 *
 * Flutter-specific prompt additions.
 */

import type { PromptContext } from "./types";

export const FLUTTER_EXPERTISE_PROMPT = `Flutter conventions to follow:
- Use const constructors wherever possible.
- Prefer composition over inheritance.
- Use Riverpod or Bloc for state management in production apps.
- Structure projects feature-first: lib/features/<feature>/{widgets,screens,providers,models}.
- Keep widgets small and composable.
- Use ThemeData for styling; avoid hardcoded colors.
- Handle null safety explicitly — never force-unwrap with !.
- Use sealed classes / freezed for immutable models.
- Write tests for business logic and critical widgets.

Common pitfalls to warn about:
- Rebuilding entire widget trees (use select/Consumer).
- Using setState for app-wide state.
- Forgetting to dispose controllers and streams.
- Blocking the UI thread with synchronous I/O.`;

export function buildFlutterPrompt(_ctx?: PromptContext): string {
  return FLUTTER_EXPERTISE_PROMPT;
}
