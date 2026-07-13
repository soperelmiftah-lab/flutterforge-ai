/**
 * @module features/planner/scheduler
 *
 * Scheduler — manages task execution order based on the execution strategy.
 * Supports parallel, sequential, priority, pause, resume, retry, cancel.
 */

import type { Task, ExecutionStrategy, TaskGraph } from "../types";
import { findReady, topologicalOrder } from "../graph";

class TaskScheduler {
  private paused = false;
  private running = new Set<string>();
  private retryCounts = new Map<string, number>();

  /** Get the next batch of tasks to run (respecting strategy + concurrency). */
  nextBatch(tasks: Task[], strategy: ExecutionStrategy): Task[] {
    if (this.paused) return [];
    const ready = findReady(tasks).filter((t) => !this.running.has(t.id));
    if (ready.length === 0) return [];

    switch (strategy.kind) {
      case "sequential":
        return ready.slice(0, 1);
      case "parallel":
      case "hybrid":
        return ready.slice(0, strategy.maxConcurrent - this.running.size);
      case "priority-based": {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const sorted = [...ready].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return sorted.slice(0, strategy.maxConcurrent - this.running.size);
      }
      case "risk-based":
        return ready.slice(0, 1);
      case "token-optimized":
        return ready.slice(0, strategy.maxConcurrent - this.running.size);
      default:
        return ready.slice(0, 1);
    }
  }

  /** Mark a task as running. */
  start(taskId: string): void {
    this.running.add(taskId);
  }

  /** Mark a task as completed (or failed). */
  complete(taskId: string): void {
    this.running.delete(taskId);
  }

  /** Retry a failed task (up to maxRetries). */
  retry(taskId: string, maxRetries: number): boolean {
    const count = this.retryCounts.get(taskId) ?? 0;
    if (count >= maxRetries) return false;
    this.retryCounts.set(taskId, count + 1);
    return true;
  }

  /** Pause the scheduler. */
  pause(): void {
    this.paused = true;
  }

  /** Resume the scheduler. */
  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Get running task count. */
  runningCount(): number {
    return this.running.size;
  }

  /** Get execution order (topological). */
  executionOrder(graph: TaskGraph): string[] {
    return topologicalOrder(Array.from(graph.tasks.values()));
  }
}

/** Singleton scheduler. */
export const scheduler = new TaskScheduler();
