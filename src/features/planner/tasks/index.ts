/**
 * @module features/planner/tasks
 *
 * Task Builder — converts a Goal's objectives into concrete Tasks with
 * dependencies, priorities, complexity estimates, and required tools.
 */

import type { Goal, Task, TaskPriority, ComplexityLevel, IntentType } from "../types";
import { uid } from "@/lib/utils";

/** Task templates per intent type. Each task lists required tool ids. */
const TASK_TEMPLATES: Record<IntentType, Array<{
  title: string;
  description: string;
  priority: TaskPriority;
  complexity: ComplexityLevel;
  estimatedDurationMs: number;
  requiredTools: string[];
  dependsOnIdx?: number[];
}>> = {
  question: [
    { title: "Search workspace for context", description: "Find files related to the question", priority: "normal", complexity: "trivial", estimatedDurationMs: 2000, requiredTools: ["search.find_text", "search.find_symbol"] },
    { title: "Read relevant files", description: "Load the matched files", priority: "normal", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.read_file"], dependsOnIdx: [0] },
    { title: "Compose answer", description: "Generate the response", priority: "normal", complexity: "simple", estimatedDurationMs: 3000, requiredTools: [], dependsOnIdx: [1] },
  ],
  "bug-fix": [
    { title: "Search for error", description: "Find where the error occurs", priority: "high", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["search.find_text"] },
    { title: "Read affected file", description: "Load the file with the bug", priority: "high", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.read_file"], dependsOnIdx: [0] },
    { title: "Apply fix", description: "Patch the file", priority: "critical", complexity: "moderate", estimatedDurationMs: 5000, requiredTools: ["fs.write_file"], dependsOnIdx: [1] },
    { title: "Run analyzer", description: "Verify the fix", priority: "normal", complexity: "simple", estimatedDurationMs: 3000, requiredTools: ["flutter.analyze"], dependsOnIdx: [2] },
  ],
  "feature-request": [
    { title: "Analyze requirements", description: "Understand what to build", priority: "high", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["search.find_file"] },
    { title: "Design implementation", description: "Plan the approach", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [], dependsOnIdx: [0] },
    { title: "Create new file", description: "Generate the feature code", priority: "high", complexity: "complex", estimatedDurationMs: 8000, requiredTools: ["fs.create_file"], dependsOnIdx: [1] },
    { title: "Add tests", description: "Write test cases", priority: "normal", complexity: "moderate", estimatedDurationMs: 5000, requiredTools: ["fs.create_file"], dependsOnIdx: [2] },
  ],
  refactor: [
    { title: "Read target file", description: "Load the file to refactor", priority: "normal", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.read_file"] },
    { title: "Plan refactoring", description: "Identify improvements", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [], dependsOnIdx: [0] },
    { title: "Apply changes", description: "Execute the refactoring", priority: "high", complexity: "complex", estimatedDurationMs: 6000, requiredTools: ["fs.write_file"], dependsOnIdx: [1] },
    { title: "Verify behavior", description: "Run analyzer", priority: "normal", complexity: "simple", estimatedDurationMs: 3000, requiredTools: ["flutter.analyze"], dependsOnIdx: [2] },
  ],
  "code-review": [
    { title: "Read the code", description: "Load files for review", priority: "normal", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.read_file"] },
    { title: "Analyze quality", description: "Evaluate patterns and style", priority: "normal", complexity: "moderate", estimatedDurationMs: 4000, requiredTools: [], dependsOnIdx: [0] },
    { title: "Write review", description: "Compose feedback", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: [], dependsOnIdx: [1] },
  ],
  "generate-ui": [
    { title: "Design widget", description: "Plan the UI structure", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: [] },
    { title: "Generate widget code", description: "Create the Dart widget file", priority: "high", complexity: "moderate", estimatedDurationMs: 5000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Add to exports", description: "Export the new widget", priority: "low", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.write_file"], dependsOnIdx: [1] },
  ],
  "generate-api": [
    { title: "Design API contract", description: "Define endpoints", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [] },
    { title: "Create service class", description: "Generate the API service", priority: "high", complexity: "complex", estimatedDurationMs: 6000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Create models", description: "Generate request/response models", priority: "high", complexity: "moderate", estimatedDurationMs: 4000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
  ],
  "generate-database": [
    { title: "Design schema", description: "Define tables and relations", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [] },
    { title: "Create models", description: "Generate data model classes", priority: "high", complexity: "moderate", estimatedDurationMs: 4000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Create migrations", description: "Write migration scripts", priority: "high", complexity: "complex", estimatedDurationMs: 5000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
  ],
  "generate-flutter-app": [
    { title: "Scaffold project structure", description: "Create folder layout", priority: "critical", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: ["fs.create_directory"] },
    { title: "Configure pubspec.yaml", description: "Set up dependencies", priority: "high", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Generate main.dart", description: "Create entry point", priority: "high", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Add starter screens", description: "Create initial screens", priority: "normal", complexity: "moderate", estimatedDurationMs: 5000, requiredTools: ["fs.create_file"], dependsOnIdx: [2] },
  ],
  "analyze-project": [
    { title: "Scan project files", description: "Index all files", priority: "high", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["fs.list_directory"] },
    { title: "Parse symbols", description: "Extract symbols from Dart files", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: ["search.find_symbol"], dependsOnIdx: [0] },
    { title: "Compute statistics", description: "Generate metrics", priority: "normal", complexity: "simple", estimatedDurationMs: 1000, requiredTools: [], dependsOnIdx: [1] },
    { title: "Summarize", description: "Present findings", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: [], dependsOnIdx: [2] },
  ],
  "explain-code": [
    { title: "Read target code", description: "Load the file to explain", priority: "normal", complexity: "trivial", estimatedDurationMs: 1000, requiredTools: ["fs.read_file"] },
    { title: "Trace logic", description: "Follow the execution flow", priority: "normal", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [], dependsOnIdx: [0] },
    { title: "Compose explanation", description: "Write the explanation", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: [], dependsOnIdx: [1] },
  ],
  documentation: [
    { title: "Find undocumented code", description: "Search for missing docs", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["search.find_symbol"] },
    { title: "Generate docs", description: "Write documentation", priority: "normal", complexity: "moderate", estimatedDurationMs: 5000, requiredTools: ["fs.write_file"], dependsOnIdx: [0] },
    { title: "Update README", description: "Reflect changes", priority: "low", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["fs.write_file"], dependsOnIdx: [1] },
  ],
  testing: [
    { title: "Identify test targets", description: "Find code to test", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: ["search.find_symbol"] },
    { title: "Write test files", description: "Create test cases", priority: "high", complexity: "moderate", estimatedDurationMs: 6000, requiredTools: ["fs.create_file"], dependsOnIdx: [0] },
    { title: "Run tests", description: "Execute and verify", priority: "normal", complexity: "simple", estimatedDurationMs: 4000, requiredTools: ["flutter.test"], dependsOnIdx: [1] },
  ],
  deployment: [
    { title: "Prepare build config", description: "Set up release config", priority: "high", complexity: "moderate", estimatedDurationMs: 3000, requiredTools: [] },
    { title: "Build APK", description: "Create release APK", priority: "critical", complexity: "complex", estimatedDurationMs: 300000, requiredTools: ["flutter.build_apk"], dependsOnIdx: [0] },
    { title: "Verify build", description: "Check the artifact", priority: "normal", complexity: "simple", estimatedDurationMs: 2000, requiredTools: [], dependsOnIdx: [1] },
  ],
};

/** Build tasks from a goal. */
export function buildTasks(goal: Goal): Task[] {
  const templates = TASK_TEMPLATES[goal.intentType] ?? TASK_TEMPLATES.question;
  const tasks: Task[] = templates.map((t) => ({
    id: uid("task"),
    title: t.title,
    description: t.description,
    subtaskIds: [],
    dependsOn: [],
    dependents: [],
    status: "pending",
    priority: t.priority,
    complexity: t.complexity,
    estimatedDurationMs: t.estimatedDurationMs,
    requiredTools: t.requiredTools,
    progress: 0,
    createdAt: new Date().toISOString(),
  }));

  // Resolve dependency indices to ids.
  templates.forEach((t, i) => {
    if (t.dependsOnIdx) {
      tasks[i].dependsOn = t.dependsOnIdx.map((idx) => tasks[idx].id);
    }
  });

  // Compute reverse dependencies.
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      const dep = tasks.find((t) => t.id === depId);
      if (dep) dep.dependents.push(task.id);
    }
  }

  return tasks;
}

/** Compute total estimated duration (sum of critical path). */
export function estimateDuration(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + t.estimatedDurationMs, 0);
}
