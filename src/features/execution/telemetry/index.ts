/**
 * @module features/execution/telemetry
 *
 * Telemetry — aggregates execution metrics per tool: count, success rate,
 * average duration, usage. Subscribes to the event bus for automatic
 * capture.
 */

import type { ToolTelemetry, ExecutionStatus } from "../types";
import { eventBus } from "../events";

interface TelemetryRecord {
  toolId: string;
  status: ExecutionStatus;
  durationMs: number;
  timestamp: string;
}

class TelemetryCollector {
  private records: TelemetryRecord[] = [];
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    eventBus.on("tool:finished", (event) => {
      if (event.toolId && event.details) {
        const d = event.details as { status: ExecutionStatus; durationMs: number };
        this.records.push({
          toolId: event.toolId,
          status: d.status,
          durationMs: d.durationMs,
          timestamp: event.timestamp,
        });
      }
    });
    eventBus.on("tool:failed", (event) => {
      if (event.toolId && event.details) {
        const d = event.details as { durationMs: number };
        this.records.push({
          toolId: event.toolId,
          status: "failed",
          durationMs: d.durationMs,
          timestamp: event.timestamp,
        });
      }
    });
  }

  /** Record a manual telemetry entry. */
  record(toolId: string, status: ExecutionStatus, durationMs: number): void {
    this.records.push({
      toolId,
      status,
      durationMs,
      timestamp: new Date().toISOString(),
    });
    if (this.records.length > 5000) this.records.shift();
  }

  /** Get aggregated telemetry for a single tool. */
  getToolTelemetry(toolId: string): ToolTelemetry {
    const toolRecords = this.records.filter((r) => r.toolId === toolId);
    const executionCount = toolRecords.length;
    const successCount = toolRecords.filter((r) => r.status === "success").length;
    const failureCount = toolRecords.filter((r) => r.status === "failed").length;
    const totalDurationMs = toolRecords.reduce((sum, r) => sum + r.durationMs, 0);
    const lastExecutedAt = toolRecords[toolRecords.length - 1]?.timestamp;
    return {
      toolId,
      executionCount,
      successCount,
      failureCount,
      totalDurationMs,
      averageDurationMs: executionCount > 0 ? Math.round(totalDurationMs / executionCount) : 0,
      successRate: executionCount > 0 ? successCount / executionCount : 0,
      lastExecutedAt,
    };
  }

  /** Get telemetry for all tools. */
  getAllTelemetry(): ToolTelemetry[] {
    const toolIds = new Set(this.records.map((r) => r.toolId));
    return Array.from(toolIds).map((id) => this.getToolTelemetry(id));
  }

  /** Summary stats across all tools. */
  getSummary(): {
    totalExecutions: number;
    totalSuccess: number;
    totalFailures: number;
    overallSuccessRate: number;
    averageDurationMs: number;
  } {
    const total = this.records.length;
    const success = this.records.filter((r) => r.status === "success").length;
    const failures = this.records.filter((r) => r.status === "failed").length;
    const totalDuration = this.records.reduce((sum, r) => sum + r.durationMs, 0);
    return {
      totalExecutions: total,
      totalSuccess: success,
      totalFailures: failures,
      overallSuccessRate: total > 0 ? success / total : 0,
      averageDurationMs: total > 0 ? Math.round(totalDuration / total) : 0,
    };
  }

  clear(): void {
    this.records = [];
  }
}

/** Singleton telemetry collector. */
export const telemetry = new TelemetryCollector();
