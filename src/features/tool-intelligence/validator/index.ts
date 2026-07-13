/**
 * @module features/tool-intelligence/validator
 *
 * Tool Validator — validates parameters, permissions, workspace state,
 * dependencies, preconditions, and postconditions before execution.
 */

import type { ValidationResult, ChainStep } from "../types";
import type { ToolDescriptor } from "@/features/execution/types";
import { getToolDescriptor } from "@/features/execution/registry";
import { hasAllPermissions, getActivePermissions } from "@/features/execution/permissions";

/** Validate a tool chain before execution. */
export function validateChain(steps: ChainStep[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const step of steps) {
    const tool = getToolDescriptor(step.toolId);
    if (!tool) {
      errors.push(`Step ${step.id}: unknown tool "${step.toolId}"`);
      continue;
    }

    // 1. Validate tool is implemented.
    if (!tool.implemented) {
      warnings.push(`Step ${step.id}: tool "${tool.name}" is not yet implemented`);
    }

    // 2. Validate parameters.
    const paramErrors = validateParameters(step, tool);
    errors.push(...paramErrors);

    // 3. Validate permissions.
    const permCheck = hasAllPermissions(getActivePermissions(), tool.permissions);
    if (!permCheck.allowed) {
      errors.push(`Step ${step.id}: missing permissions: ${permCheck.missing.join(", ")}`);
    }

    // 4. Validate dependencies.
    for (const depId of step.dependsOn) {
      if (!steps.find((s) => s.id === depId)) {
        errors.push(`Step ${step.id}: depends on non-existent step "${depId}"`);
      }
    }

    // 5. Check preconditions.
    if (step.requiresApproval && tool.riskLevel === "safe") {
      warnings.push(`Step ${step.id}: marked for approval but tool is safe`);
    }
  }

  // 6. Check for circular dependencies.
  const cycles = detectCycles(steps);
  for (const cycle of cycles) {
    errors.push(`Circular dependency detected: ${cycle.join(" → ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checkedAt: new Date().toISOString(),
  };
}

/** Validate parameters against a tool descriptor. */
function validateParameters(step: ChainStep, tool: ToolDescriptor): string[] {
  const errors: string[] = [];
  for (const param of tool.parameters) {
    if (param.required && !(param.name in step.parameters)) {
      errors.push(`Step ${step.id}: missing required parameter "${param.name}" for tool "${tool.name}"`);
    }
  }
  return errors;
}

/** Detect circular dependencies in steps. */
function detectCycles(steps: ChainStep[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  const dfs = (stepId: string) => {
    if (stack.has(stepId)) {
      const cycleStart = path.indexOf(stepId);
      cycles.push([...path.slice(cycleStart), stepId]);
      return;
    }
    if (visited.has(stepId)) return;
    stack.add(stepId);
    path.push(stepId);
    const step = steps.find((s) => s.id === stepId);
    if (step) {
      for (const depId of step.dependsOn) {
        dfs(depId);
      }
    }
    path.pop();
    stack.delete(stepId);
    visited.add(stepId);
  };

  for (const step of steps) dfs(step.id);
  return cycles;
}
