/**
 * @module features/vision-ai/heuristics
 *
 * Heuristics — rule-based analysis heuristics that drive issue detection.
 */

export interface Heuristic {
  id: string;
  name: string;
  description: string;
  check: (context: Record<string, unknown>) => { triggered: boolean; message?: string };
}

export const heuristics: Heuristic[] = [
  {
    id: "h.overflow",
    name: "Overflow Detection",
    description: "Detects when content exceeds available space",
    check: (ctx) => {
      const overflow = ctx.layoutIssueCount as number;
      return { triggered: overflow > 0, message: overflow > 0 ? `${overflow} overflow issues detected` : undefined };
    },
  },
  {
    id: "h.deep-nesting",
    name: "Deep Nesting",
    description: "Widget trees deeper than 10 levels are hard to maintain",
    check: (ctx) => {
      const depth = ctx.maxDepth as number;
      return { triggered: depth > 10, message: depth > 10 ? `Widget depth is ${depth}` : undefined };
    },
  },
  {
    id: "h.low-fps",
    name: "Low FPS",
    description: "FPS below 50 indicates performance issues",
    check: (ctx) => {
      const fps = ctx.fps as number;
      return { triggered: fps < 50, message: fps < 50 ? `FPS is ${fps}` : undefined };
    },
  },
  {
    id: "h.high-jank",
    name: "High Jank",
    description: "More than 5 janky frames indicates rendering problems",
    check: (ctx) => {
      const jank = ctx.jankCount as number;
      return { triggered: jank > 5, message: jank > 5 ? `${jank} janky frames` : undefined };
    },
  },
];

/** Run all heuristics against a context. */
export function runHeuristics(context: Record<string, unknown>): Array<{ heuristic: Heuristic; triggered: boolean; message?: string }> {
  return heuristics.map((h) => ({ heuristic: h, ...h.check(context) }));
}
