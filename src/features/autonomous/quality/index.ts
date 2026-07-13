/**
 * @module features/autonomous/quality
 *
 * Quality Engine — generates quality scores for maintainability, complexity,
 * performance, accessibility, and architecture.
 */

import type { QualityScore } from "../types";

/** Compute quality score from project metrics. */
export function computeQuality(params: {
  constUsage: number;
  avgFileLength: number;
  maxDepth: number;
  fps: number;
  jankCount: number;
  a11yScore: number;
  hasTests: boolean;
  hasStateManagement: boolean;
  hasCleanArchitecture: boolean;
}): QualityScore {
  const maintainability = Math.round(
    (params.constUsage * 40) +
    (params.avgFileLength < 200 ? 30 : params.avgFileLength < 400 ? 20 : 10) +
    (params.hasTests ? 30 : 0)
  );

  const complexity = Math.round(
    100 - (params.maxDepth > 10 ? 40 : params.maxDepth > 7 ? 20 : 0) -
    (params.avgFileLength > 500 ? 30 : params.avgFileLength > 300 ? 15 : 0)
  );

  const performance = Math.round(
    (params.fps >= 55 ? 40 : params.fps >= 45 ? 25 : 10) +
    (params.jankCount < 3 ? 30 : params.jankCount < 10 ? 15 : 0) +
    (params.constUsage > 0.6 ? 30 : 15)
  );

  const accessibility = params.a11yScore;
  const architecture = Math.round(
    (params.hasStateManagement ? 35 : 0) +
    (params.hasCleanArchitecture ? 35 : 0) +
    (params.hasTests ? 30 : 0)
  );

  const overall = Math.round((maintainability + complexity + performance + accessibility + architecture) / 5);

  return { overall, maintainability, complexity, performance, accessibility, architecture };
}
