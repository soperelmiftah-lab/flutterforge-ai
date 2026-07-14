/**
 * @module features/tool-intelligence/state
 *
 * Shared in-memory state for the Tool Intelligence layer.
 *
 * Holds:
 *   - chainStore:       all built chains (keyed by chain.id)
 *   - executionStore:   all chain executions (keyed by executionId)
 *
 * Extracted into its own module so API routes can import the stores without
 * creating a circular dependency on the analyze route.
 */

import type { ToolChain } from "../types";
import type { ChainExecution } from "./execution-types";

/** All built chains, keyed by chain.id. */
export const chainStore = new Map<string, ToolChain>();

/** All chain executions, keyed by executionId. */
export const executionStore = new Map<string, ChainExecution>();

/** Add a chain to the store. */
export function storeChain(chain: ToolChain): ToolChain {
  chainStore.set(chain.id, chain);
  return chain;
}

/** Add an execution to the store. */
export function storeExecution(execution: ChainExecution): ChainExecution {
  executionStore.set(execution.id, execution);
  return execution;
}

/** Get a chain by id. */
export function getChain(chainId: string): ToolChain | undefined {
  return chainStore.get(chainId);
}

/** Get an execution by id. */
export function getExecution(executionId: string): ChainExecution | undefined {
  return executionStore.get(executionId);
}

/** List all chains (newest first). */
export function listChains(): ToolChain[] {
  return Array.from(chainStore.values()).reverse();
}

/** List all executions (newest first). */
export function listExecutions(): ChainExecution[] {
  return Array.from(executionStore.values()).reverse();
}

export * from "./execution-types";
