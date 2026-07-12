/**
 * @module features/planner/goals
 *
 * Goal Analyzer — converts an Intent into a structured Goal with objectives.
 */

import type { Goal, Intent, Objective, IntentType } from "../types";
import { uid } from "@/lib/utils";

/** Objective templates per intent type. */
const OBJECTIVE_TEMPLATES: Record<IntentType, Array<{ title: string; description: string }>> = {
  question: [
    { title: "Understand the question", description: "Parse what the user is asking" },
    { title: "Find relevant context", description: "Search the workspace for related code" },
    { title: "Formulate answer", description: "Compose a clear, accurate response" },
  ],
  "bug-fix": [
    { title: "Reproduce the bug", description: "Identify the failing scenario" },
    { title: "Locate root cause", description: "Trace the error to its source" },
    { title: "Implement fix", description: "Apply the corrective change" },
    { title: "Verify fix", description: "Confirm the bug is resolved" },
  ],
  "feature-request": [
    { title: "Define requirements", description: "Clarify what needs to be built" },
    { title: "Design approach", description: "Plan the implementation strategy" },
    { title: "Implement feature", description: "Write the code" },
    { title: "Add tests", description: "Cover the new functionality" },
  ],
  refactor: [
    { title: "Analyze current structure", description: "Understand existing code" },
    { title: "Plan refactoring", description: "Identify improvements" },
    { title: "Apply changes", description: "Execute the refactoring" },
    { title: "Verify behavior", description: "Ensure nothing broke" },
  ],
  "code-review": [
    { title: "Read the code", description: "Understand the implementation" },
    { title: "Check quality", description: "Evaluate style, patterns, best practices" },
    { title: "Identify issues", description: "Find bugs, smells, improvements" },
    { title: "Provide feedback", description: "Write the review" },
  ],
  "generate-ui": [
    { title: "Design the widget", description: "Plan the UI structure" },
    { title: "Generate widget code", description: "Create the Dart widget" },
    { title: "Add styling", description: "Apply theme and layout" },
  ],
  "generate-api": [
    { title: "Design the API", description: "Define endpoints and contracts" },
    { title: "Implement service", description: "Create the API service class" },
    { title: "Add models", description: "Create request/response models" },
  ],
  "generate-database": [
    { title: "Design schema", description: "Define tables/relations" },
    { title: "Create models", description: "Generate data models" },
    { title: "Add migrations", description: "Create migration scripts" },
  ],
  "generate-flutter-app": [
    { title: "Scaffold project", description: "Create the project structure" },
    { title: "Configure dependencies", description: "Set up pubspec.yaml" },
    { title: "Generate entry point", description: "Create main.dart" },
    { title: "Add starter screens", description: "Create initial screens" },
  ],
  "analyze-project": [
    { title: "Scan project", description: "Index all files and symbols" },
    { title: "Compute statistics", description: "Generate metrics" },
    { title: "Build dependency graph", description: "Map relationships" },
    { title: "Summarize findings", description: "Present the analysis" },
  ],
  "explain-code": [
    { title: "Read the code", description: "Parse the target file/symbol" },
    { title: "Trace logic", description: "Follow the execution flow" },
    { title: "Explain", description: "Describe in plain language" },
  ],
  documentation: [
    { title: "Identify targets", description: "Find what needs documenting" },
    { title: "Generate docs", description: "Write the documentation" },
    { title: "Update README", description: "Reflect changes in README" },
  ],
  testing: [
    { title: "Identify test targets", description: "Find what needs testing" },
    { title: "Write tests", description: "Create test files" },
    { title: "Run tests", description: "Execute and verify" },
  ],
  deployment: [
    { title: "Prepare build", description: "Configure for release" },
    { title: "Build artifact", description: "Create APK/AAB" },
    { title: "Deploy", description: "Distribute the build" },
  ],
};

/** Create a goal from an intent. */
export function createGoal(intent: Intent): Goal {
  const templates = OBJECTIVE_TEMPLATES[intent.type] ?? OBJECTIVE_TEMPLATES.question;
  const objectives: Objective[] = templates.map((t) => ({
    id: uid("obj"),
    title: t.title,
    description: t.description,
    taskIds: [],
    completed: false,
  }));

  return {
    id: uid("goal"),
    title: deriveGoalTitle(intent),
    description: intent.rawInput,
    intentType: intent.type,
    objectives,
    createdAt: new Date().toISOString(),
  };
}

function deriveGoalTitle(intent: Intent): string {
  const input = intent.rawInput.trim();
  if (input.length <= 60) return input;
  return input.slice(0, 57) + "…";
}
