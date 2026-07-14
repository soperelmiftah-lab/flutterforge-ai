/**
 * @module features/vision-ai/policies
 *
 * Policies — configurable limits for the Vision AI platform.
 */

export interface VisionPolicies {
  minConfidence: number;
  maxIssuesPerReport: number;
  includeSuggestions: boolean;
  severityThreshold: "all" | "low+" | "medium+" | "high+";
}

export const defaultPolicies: VisionPolicies = {
  minConfidence: 0.3,
  maxIssuesPerReport: 50,
  includeSuggestions: true,
  severityThreshold: "all",
};

let active = defaultPolicies;

export function getPolicies(): VisionPolicies { return active; }
export function setPolicies(p: Partial<VisionPolicies>): void { active = { ...active, ...p }; }
