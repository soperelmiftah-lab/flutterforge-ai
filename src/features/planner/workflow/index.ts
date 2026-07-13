/**
 * @module features/planner/workflow
 *
 * Workflow Engine — reusable, pre-defined workflows for common operations.
 * Each workflow is a template of steps with assigned agents and tools.
 */

import type { Workflow, WorkflowStep } from "../types";
import { uid } from "@/lib/utils";

/** Built-in workflow templates. */
export const workflows: Workflow[] = [
  buildWorkflow("wf.flutter-screen", "Generate Flutter Screen", "Create a new screen with state management and routing", "flutter", "📱", [
    { title: "Design screen structure", agentId: "agent.ui", requiredTools: [], dependsOn: [] },
    { title: "Generate screen widget", agentId: "agent.flutter", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Add Riverpod provider", agentId: "agent.riverpod", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Register route", agentId: "agent.flutter", requiredTools: ["fs.write_file"], dependsOn: [1] },
    { title: "Write widget tests", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [1] },
  ]),
  buildWorkflow("wf.crud", "Generate CRUD", "Create complete Create-Read-Update-Delete for a model", "backend", "🔄", [
    { title: "Design model schema", agentId: "agent.database", requiredTools: [], dependsOn: [] },
    { title: "Generate model class", agentId: "agent.backend", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Create repository", agentId: "agent.backend", requiredTools: ["fs.create_file"], dependsOn: [1] },
    { title: "Create API service", agentId: "agent.api", requiredTools: ["fs.create_file"], dependsOn: [1] },
    { title: "Write CRUD tests", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [2] },
  ]),
  buildWorkflow("wf.refactor-widget", "Refactor Widget", "Extract, simplify, and improve a widget", "refactor", "♻️", [
    { title: "Read target widget", agentId: "agent.review", requiredTools: ["fs.read_file"], dependsOn: [] },
    { title: "Plan refactoring", agentId: "agent.flutter", requiredTools: [], dependsOn: [0] },
    { title: "Apply refactoring", agentId: "agent.flutter", requiredTools: ["fs.write_file"], dependsOn: [1] },
    { title: "Run analyzer", agentId: "agent.debug", requiredTools: ["flutter.analyze"], dependsOn: [2] },
    { title: "Review changes", agentId: "agent.review", requiredTools: ["fs.read_file"], dependsOn: [3] },
  ]),
  buildWorkflow("wf.analyze-project", "Analyze Project", "Full project analysis with metrics and recommendations", "analysis", "🔍", [
    { title: "Scan project files", agentId: "agent.planner", requiredTools: ["fs.list_directory"], dependsOn: [] },
    { title: "Parse symbols", agentId: "agent.planner", requiredTools: ["search.find_symbol"], dependsOn: [0] },
    { title: "Security audit", agentId: "agent.security", requiredTools: ["fs.read_file"], dependsOn: [0] },
    { title: "Performance review", agentId: "agent.performance", requiredTools: ["fs.read_file"], dependsOn: [0] },
    { title: "Generate report", agentId: "agent.docs", requiredTools: [], dependsOn: [1, 2, 3] },
  ]),
  buildWorkflow("wf.fix-errors", "Fix Errors", "Find and fix all analyzer errors", "debug", "🐛", [
    { title: "Run analyzer", agentId: "agent.debug", requiredTools: ["flutter.analyze"], dependsOn: [] },
    { title: "Locate errors", agentId: "agent.debug", requiredTools: ["search.find_text"], dependsOn: [0] },
    { title: "Apply fixes", agentId: "agent.flutter", requiredTools: ["fs.write_file"], dependsOn: [1] },
    { title: "Verify fixes", agentId: "agent.debug", requiredTools: ["flutter.analyze"], dependsOn: [2] },
  ]),
  buildWorkflow("wf.rest-api", "Create REST API", "Generate a complete REST API service", "backend", "🌐", [
    { title: "Design API contract", agentId: "agent.api", requiredTools: [], dependsOn: [] },
    { title: "Generate models", agentId: "agent.backend", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Create API service", agentId: "agent.api", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Add error handling", agentId: "agent.backend", requiredTools: ["fs.write_file"], dependsOn: [2] },
    { title: "Write API tests", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [2] },
  ]),
  buildWorkflow("wf.authentication", "Create Authentication", "Set up auth with Supabase/Firebase", "backend", "🔐", [
    { title: "Design auth flow", agentId: "agent.api", requiredTools: [], dependsOn: [] },
    { title: "Set up Supabase", agentId: "agent.supabase", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Create auth service", agentId: "agent.backend", requiredTools: ["fs.create_file"], dependsOn: [1] },
    { title: "Add protected routes", agentId: "agent.flutter", requiredTools: ["fs.write_file"], dependsOn: [2] },
    { title: "Write auth tests", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [2] },
  ]),
  buildWorkflow("wf.dashboard", "Build Dashboard", "Create an admin dashboard with charts and tables", "frontend", "📊", [
    { title: "Design dashboard layout", agentId: "agent.ui", requiredTools: [], dependsOn: [] },
    { title: "Generate dashboard widget", agentId: "agent.flutter", requiredTools: ["fs.create_file"], dependsOn: [0] },
    { title: "Add data providers", agentId: "agent.riverpod", requiredTools: ["fs.create_file"], dependsOn: [1] },
    { title: "Create chart widgets", agentId: "agent.ui", requiredTools: ["fs.create_file"], dependsOn: [1] },
    { title: "Write dashboard tests", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [3] },
  ]),
];

function buildWorkflow(
  id: string,
  name: string,
  description: string,
  category: string,
  icon: string,
  steps: Array<{ title: string; agentId: string; requiredTools: string[]; dependsOn: number[] }>
): Workflow {
  const workflowSteps: WorkflowStep[] = steps.map((s, i) => ({
    id: `${id}.step.${i}`,
    title: s.title,
    description: s.title,
    agentId: s.agentId,
    requiredTools: s.requiredTools,
    dependsOn: s.dependsOn.map((idx) => `${id}.step.${idx}`),
    estimatedDurationMs: 3000,
  }));
  return {
    id,
    name,
    description,
    category,
    icon,
    steps: workflowSteps,
    estimatedDurationMs: workflowSteps.length * 3000,
    createdAt: new Date().toISOString(),
  };
}

/** Get a workflow by id. */
export function getWorkflow(id: string): Workflow | undefined {
  return workflows.find((w) => w.id === id);
}

/** List workflows, optionally filtered by category. */
export function listWorkflows(category?: string): Workflow[] {
  return category ? workflows.filter((w) => w.category === category) : workflows;
}
