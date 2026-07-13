/**
 * @module features/planner/graph
 *
 * Task Graph Builder + Dependency Analyzer. Builds a DAG from tasks and
 * computes the critical path, blocked tasks, and execution order.
 */

import type { Task, TaskGraph } from "../types";

/** Build a task graph (DAG) from a list of tasks. */
export function buildGraph(tasks: Task[]): TaskGraph {
  const taskMap = new Map<string, Task>();
  for (const t of tasks) taskMap.set(t.id, t);

  const edges: Array<{ from: string; to: string }> = [];
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      edges.push({ from: depId, to: task.id });
    }
  }

  const criticalPath = computeCriticalPath(tasks);

  return {
    tasks: taskMap,
    edges,
    criticalPath,
    builtAt: new Date().toISOString(),
  };
}

/** Compute the critical path — the longest chain of dependencies. */
export function computeCriticalPath(tasks: Task[]): string[] {
  const memo = new Map<string, { path: string[]; duration: number }>();

  const compute = (taskId: string): { path: string[]; duration: number } => {
    if (memo.has(taskId)) return memo.get(taskId)!;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { path: [], duration: 0 };

    const dependents = tasks.filter((t) => t.dependsOn.includes(taskId));
    if (dependents.length === 0) {
      const result = { path: [taskId], duration: task.estimatedDurationMs };
      memo.set(taskId, result);
      return result;
    }

    let best = { path: [taskId], duration: task.estimatedDurationMs };
    for (const dep of dependents) {
      const child = compute(dep.id);
      const candidate = {
        path: [taskId, ...child.path],
        duration: task.estimatedDurationMs + child.duration,
      };
      if (candidate.duration > best.duration) best = candidate;
    }
    memo.set(taskId, best);
    return best;
  };

  // Start from tasks with no dependencies.
  const roots = tasks.filter((t) => t.dependsOn.length === 0);
  let longest: { path: string[]; duration: number } = { path: [], duration: 0 };
  for (const root of roots) {
    const result = compute(root.id);
    if (result.duration > longest.duration) longest = result;
  }
  return longest.path;
}

/** Find tasks that are blocked (have unmet dependencies). */
export function findBlocked(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.status === "pending" && t.dependsOn.some((depId) => {
      const dep = tasks.find((d) => d.id === depId);
      return dep && dep.status !== "completed";
    })
  );
}

/** Find tasks that are ready to run (all deps completed). */
export function findReady(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.status === "pending" && t.dependsOn.every((depId) => {
      const dep = tasks.find((d) => d.id === depId);
      return dep && dep.status === "completed";
    })
  );
}

/** Find independent tasks (no deps, no dependents). */
export function findIndependent(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.dependsOn.length === 0 && t.dependents.length === 0);
}

/** Detect circular dependencies. */
export function detectCircular(tasks: Task[]): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const path: string[] = [];

  const dfs = (taskId: string) => {
    if (visiting.has(taskId)) {
      const cycleStart = path.indexOf(taskId);
      cycles.push([...path.slice(cycleStart), taskId]);
      return;
    }
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    path.push(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      for (const depId of task.dependsOn) {
        dfs(depId);
      }
    }
    path.pop();
    visiting.delete(taskId);
    visited.add(taskId);
  };

  for (const t of tasks) dfs(t.id);
  return cycles;
}

/** Get topological execution order. */
export function topologicalOrder(tasks: Task[]): string[] {
  const inDegree = new Map<string, number>();
  for (const t of tasks) inDegree.set(t.id, t.dependsOn.length);
  const queue = tasks.filter((t) => t.dependsOn.length === 0).map((t) => t.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    const task = tasks.find((t) => t.id === id);
    if (task) {
      for (const depId of task.dependents) {
        const deg = (inDegree.get(depId) ?? 1) - 1;
        inDegree.set(depId, deg);
        if (deg === 0) queue.push(depId);
      }
    }
  }
  return order;
}
