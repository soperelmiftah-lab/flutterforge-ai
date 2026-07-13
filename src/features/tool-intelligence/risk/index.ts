/**
 * @module features/tool-intelligence/risk
 *
 * Risk Analyzer — evaluates the risk of a tool chain across 6 dimensions:
 * filesystem, terminal, flutter, git, network, and project impact.
 */

import type { RiskScore, ChainStep } from "../types";
import type { ToolDescriptor, RiskLevel } from "@/features/execution/types";

const RISK_WEIGHTS = {
  filesystem: 0.25,
  terminal: 0.20,
  flutter: 0.15,
  git: 0.15,
  network: 0.10,
  projectImpact: 0.15,
};

/** Analyze the risk of a single tool. */
export function analyzeToolRisk(tool: ToolDescriptor): number {
  const levelScores: Record<RiskLevel, number> = {
    safe: 0.1,
    moderate: 0.4,
    high: 0.7,
    critical: 0.9,
  };
  return levelScores[tool.riskLevel];
}

/** Analyze the risk of a tool chain. */
export function analyzeChainRisk(steps: ChainStep[]): RiskScore {
  let filesystem = 0;
  let terminal = 0;
  let flutter = 0;
  let git = 0;
  let network = 0;
  const factors: string[] = [];

  for (const step of steps) {
    const toolRisk = step.requiresApproval ? 0.6 : 0.2;
    if (step.toolId.startsWith("fs.")) {
      filesystem = Math.max(filesystem, toolRisk);
      if (step.toolId.includes("delete")) {
        filesystem = Math.max(filesystem, 0.9);
        factors.push(`High-risk filesystem operation: ${step.toolId}`);
      }
    }
    if (step.toolId.startsWith("terminal.")) {
      terminal = Math.max(terminal, toolRisk);
      factors.push(`Terminal execution: ${step.toolId}`);
    }
    if (step.toolId.startsWith("flutter.")) {
      flutter = Math.max(flutter, toolRisk);
      if (step.toolId.includes("build")) {
        flutter = Math.max(flutter, 0.8);
        factors.push(`Flutter build: ${step.toolId}`);
      }
    }
    if (step.toolId.startsWith("git.")) {
      git = Math.max(git, toolRisk);
      if (step.toolId.includes("reset") || step.toolId.includes("checkout")) {
        git = Math.max(git, 0.9);
        factors.push(`Destructive git operation: ${step.toolId}`);
      }
    }
    if (step.toolId.includes("network") || step.toolId.includes("fetch")) {
      network = Math.max(network, 0.5);
    }
  }

  const projectImpact = Math.min(1, steps.filter((s) => s.requiresApproval).length * 0.3);

  const overall =
    filesystem * RISK_WEIGHTS.filesystem +
    terminal * RISK_WEIGHTS.terminal +
    flutter * RISK_WEIGHTS.flutter +
    git * RISK_WEIGHTS.git +
    network * RISK_WEIGHTS.network +
    projectImpact * RISK_WEIGHTS.projectImpact;

  const level: RiskLevel =
    overall < 0.2 ? "safe" :
    overall < 0.4 ? "moderate" :
    overall < 0.7 ? "high" : "critical";

  return {
    overall: Math.round(overall * 100) / 100,
    filesystem: Math.round(filesystem * 100) / 100,
    terminal: Math.round(terminal * 100) / 100,
    flutter: Math.round(flutter * 100) / 100,
    git: Math.round(git * 100) / 100,
    network: Math.round(network * 100) / 100,
    projectImpact: Math.round(projectImpact * 100) / 100,
    level,
    factors,
  };
}

/** Get risk label for display. */
export function riskLabel(score: number): string {
  if (score < 0.2) return "Low";
  if (score < 0.4) return "Moderate";
  if (score < 0.7) return "High";
  return "Critical";
}

/** Get risk color for UI. */
export function riskColor(score: number): string {
  if (score < 0.2) return "text-emerald-600 dark:text-emerald-400";
  if (score < 0.4) return "text-amber-600 dark:text-amber-400";
  if (score < 0.7) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}
