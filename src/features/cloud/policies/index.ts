/**
 * @module features/cloud/policies
 *
 * Policies — configurable limits for the cloud platform.
 */

import type { CloudPolicies } from "../types";

export const defaultPolicies: CloudPolicies = {
  maxConcurrentJobs: 10, maxRetries: 3, defaultTimeoutMs: 120000,
  artifactRetentionDays: 30, autoScaleWorkers: false, minWorkers: 1, maxWorkers: 5,
};

let active = defaultPolicies;
export function getPolicies(): CloudPolicies { return active; }
export function setPolicies(p: Partial<CloudPolicies>): void { active = { ...active, ...p }; }
