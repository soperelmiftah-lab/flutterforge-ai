/**
 * @module features/planner/intent
 *
 * Intent Analyzer — detects what the user wants from their natural-language
 * input. Drives the planning pipeline.
 */

import type { Intent, IntentType } from "../types";
import { uid } from "@/lib/utils";

/** Keyword → intent type mapping. */
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  question: ["what", "how", "why", "when", "where", "explain", "difference", "vs", "?"],
  "bug-fix": ["bug", "fix", "error", "broken", "crash", "exception", "stacktrace", "not working", "fails"],
  "feature-request": ["add", "create", "implement", "build", "feature", "new", "want", "need", "should"],
  refactor: ["refactor", "clean", "restructure", "reorganize", "extract", "inline", "simplify"],
  "code-review": ["review", "check", "audit", "inspect", "feedback", "improve"],
  "generate-ui": ["widget", "screen", "page", "ui", "button", "card", "form", "dialog", "modal", "layout"],
  "generate-api": ["api", "endpoint", "rest", "graphql", "service", "request", "http"],
  "generate-database": ["database", "schema", "table", "model", "entity", "migration", "supabase", "firebase"],
  "generate-flutter-app": ["app", "project", "flutter app", "scaffold", "starter", "bootstrap"],
  "analyze-project": ["analyze", "overview", "structure", "architecture", "dependencies", "stats"],
  "explain-code": ["explain", "understand", "what does", "how does", "walk through"],
  documentation: ["document", "docs", "readme", "comment", "docstring", "api docs"],
  testing: ["test", "unit test", "widget test", "integration test", "mock", "coverage"],
  deployment: ["deploy", "build apk", "build aab", "release", "publish", "ci/cd", "deploy"],
};

/** Detect the intent from user input. */
export function detectIntent(input: string): Intent {
  const lower = input.toLowerCase();
  const scores: Array<{ type: IntentType; score: number; keywords: string[] }> = [];

  for (const [type, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matched: string[] = [];
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.push(kw);
        score += kw.length > 3 ? 2 : 1; // longer keywords score higher
      }
    }
    if (score > 0) scores.push({ type: type as IntentType, score, keywords: matched });
  }

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  return {
    type: best?.type ?? "question",
    confidence: best ? Math.min(1, best.score / 10) : 0.3,
    rawInput: input,
    detectedAt: new Date().toISOString(),
    keywords: best?.keywords ?? [],
  };
}

/** Get all intent types (for UI). */
export function listIntentTypes(): Array<{ type: IntentType; label: string; description: string }> {
  return [
    { type: "question", label: "Question", description: "Asking for information or explanation" },
    { type: "bug-fix", label: "Bug Fix", description: "Fixing an error or broken behavior" },
    { type: "feature-request", label: "Feature Request", description: "Adding new functionality" },
    { type: "refactor", label: "Refactor", description: "Restructuring without changing behavior" },
    { type: "code-review", label: "Code Review", description: "Reviewing code for quality" },
    { type: "generate-ui", label: "Generate UI", description: "Creating widgets, screens, layouts" },
    { type: "generate-api", label: "Generate API", description: "Creating API endpoints/services" },
    { type: "generate-database", label: "Generate Database", description: "Creating schemas/models/migrations" },
    { type: "generate-flutter-app", label: "Generate Flutter App", description: "Scaffolding a new app" },
    { type: "analyze-project", label: "Analyze Project", description: "Inspecting project structure" },
    { type: "explain-code", label: "Explain Code", description: "Walking through code logic" },
    { type: "documentation", label: "Documentation", description: "Generating docs/comments" },
    { type: "testing", label: "Testing", description: "Writing or running tests" },
    { type: "deployment", label: "Deployment", description: "Building or deploying" },
  ];
}

void uid;
