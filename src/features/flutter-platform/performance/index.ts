/**
 * @module features/flutter-platform/performance
 *
 * AI-driven Flutter performance analysis. Returns rebuild scores, const
 * usage, memory issues, and concrete suggestions.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";
import type { PerformanceIssue, PerformanceReport, ReviewSeverity } from "../types";

/** Default Forge model. */
const DEFAULT_MODEL = "glm-4.6";

/** Analyze performance of a Dart code snippet. */
export async function analyzePerformance(code: string): Promise<PerformanceReport> {
  if (!code.trim()) {
    return {
      issues: [],
      rebuildScore: 0,
      constUsageScore: 0,
      memoryScore: 0,
      overallScore: 0,
      suggestions: [],
    };
  }

  try {
    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.1,
      maxTokens: 1500,
      systemPrompt:
        "You are FlutterForge AI's performance analyzer. Respond with STRICT JSON only.\n\n" +
        "Schema:\n" +
        "{\n" +
        '  "rebuildScore": 0-100,\n' +
        '  "constUsageScore": 0-100,\n' +
        '  "memoryScore": 0-100,\n' +
        '  "suggestions": ["..."],\n' +
        '  "issues": [{"category": "...", "severity": "info|warning|error|critical", "title": "...", "description": "...", "suggestion": "...", "impact": "low|medium|high"}]\n' +
        "}",
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: `Analyze the performance of this Flutter/Dart code:\n\n${code}`,
        },
      ],
    });

    return parsePerformance(response.content, code);
  } catch (e: unknown) {
    return fallbackPerformance(code, e instanceof Error ? e.message : "AI unavailable");
  }
}

function parsePerformance(content: string, code: string): PerformanceReport {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return fallbackPerformance(code, "Invalid JSON");
  text = text.slice(start, end + 1);

  let parsed: {
    rebuildScore?: number;
    constUsageScore?: number;
    memoryScore?: number;
    suggestions?: string[];
    issues?: Array<{
      category?: string;
      severity?: string;
      title?: string;
      description?: string;
      suggestion?: string;
      impact?: string;
    }>;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return fallbackPerformance(code, "Invalid JSON");
  }

  const rebuildScore = clamp(parsed.rebuildScore);
  const constUsageScore = clamp(parsed.constUsageScore);
  const memoryScore = clamp(parsed.memoryScore);
  const overallScore = Math.round((rebuildScore + constUsageScore + memoryScore) / 3);

  const issues: PerformanceIssue[] = (parsed.issues ?? []).map((i) => ({
    id: uid("issue"),
    category: i.category ?? "general",
    severity: validSeverity(i.severity),
    title: i.title ?? "Untitled issue",
    description: i.description ?? "",
    suggestion: i.suggestion ?? "",
    impact: validImpact(i.impact),
  }));

  return {
    issues,
    rebuildScore,
    constUsageScore,
    memoryScore,
    overallScore,
    suggestions: parsed.suggestions ?? [],
  };
}

function clamp(n: unknown): number {
  const num = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function validSeverity(s: unknown): ReviewSeverity {
  if (s === "info" || s === "warning" || s === "error" || s === "critical") return s;
  return "info";
}

function validImpact(s: unknown): "low" | "medium" | "high" {
  if (s === "low" || s === "medium" || s === "high") return s;
  return "medium";
}

function fallbackPerformance(code: string, reason?: string): PerformanceReport {
  const issues: PerformanceIssue[] = [];

  // Count non-const widget constructors (rough heuristic).
  const widgetCalls = code.match(/\b(Column|Row|Container|Padding|Center|SizedBox|Text|Card)\(/g) ?? [];
  const constCalls = code.match(/\bconst\s+(Column|Row|Container|Padding|Center|SizedBox|Text|Card)\(/g) ?? [];
  const constRatio = widgetCalls.length > 0 ? constCalls.length / widgetCalls.length : 1;
  const constUsageScore = Math.round(constRatio * 100);

  if (constUsageScore < 50) {
    issues.push({
      id: uid("issue"),
      category: "const usage",
      severity: "warning",
      title: "Low const usage",
      description: `Only ${constCalls.length} of ${widgetCalls.length} widget constructors are const.`,
      suggestion: "Add `const` before literal widget constructors to skip rebuilds.",
      impact: "medium",
    });
  }

  if (/ListView\s*\(\s*children:/.test(code)) {
    issues.push({
      id: uid("issue"),
      category: "list rendering",
      severity: "warning",
      title: "ListView with children[]",
      description: "ListView(children:) builds all items eagerly — wasteful for large lists.",
      suggestion: "Use ListView.builder for dynamic or long lists.",
      impact: "high",
    });
  }

  const rebuildScore = Math.max(50, 100 - issues.length * 15);
  const memoryScore = 80;

  return {
    issues,
    rebuildScore,
    constUsageScore,
    memoryScore,
    overallScore: Math.round((rebuildScore + constUsageScore + memoryScore) / 3),
    suggestions: reason
      ? [`Static analysis (AI unavailable: ${reason}).`]
      : ["Run flutter analyze and the DevTools Performance tab for live metrics."],
  };
}
