/**
 * @module features/ai/tokens/tracker
 *
 * Token usage tracker. Accumulates input/output/total tokens across a
 * session. The token store consumes this to display running totals and
 * context usage in the UI.
 */

import type { TokenUsage, TokenRecord } from "./types";
import { uid } from "@/lib/utils";

/** Accumulated usage for a session. */
export class TokenTracker {
  private records: TokenRecord[] = [];

  /** Record a single request's usage. */
  record(usage: TokenUsage, model: string, provider: string, sessionId?: string): TokenRecord {
    const rec: TokenRecord = {
      id: uid("tok"),
      sessionId,
      model,
      provider,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      timestamp: new Date().toISOString(),
    };
    this.records.push(rec);
    return rec;
  }

  /** Get cumulative usage for the session. */
  cumulative(): TokenUsage {
    return this.records.reduce(
      (acc, r) => ({
        inputTokens: acc.inputTokens + r.inputTokens,
        outputTokens: acc.outputTokens + r.outputTokens,
        totalTokens: acc.totalTokens + r.totalTokens,
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    );
  }

  /** Get all records. */
  all(): TokenRecord[] {
    return [...this.records];
  }

  /** Clear all records. */
  reset(): void {
    this.records = [];
  }
}
