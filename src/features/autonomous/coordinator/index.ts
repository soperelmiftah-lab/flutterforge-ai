/**
 * @module features/autonomous/coordinator
 *
 * Coordinator — high-level entry point that creates a problem from
 * engineering input and delegates to the engine.
 */

import type { EngineeringInput, EngineeringPipeline } from "../types";
import { runPipeline } from "../engine";

/** Run the full autonomous engineering pipeline. */
export async function coordinate(input: EngineeringInput): Promise<Awaited<ReturnType<typeof runPipeline>>> {
  return runPipeline(input);
}
