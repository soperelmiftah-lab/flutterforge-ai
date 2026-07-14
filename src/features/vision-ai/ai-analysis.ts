/**
 * @module features/vision-ai/ai-analysis
 *
 * AI-driven Vision AI analysis. Uses the Forge chat engine to produce
 * a richer executive summary and smarter recommendations based on the
 * heuristic analysis results.
 *
 * Falls back to the heuristic summary if the AI is unavailable.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";
import type { VisionReport, VisionIssue, Recommendation } from "./types";

const DEFAULT_MODEL = "glm-4.6";

/**
 * Enhance a heuristic report with an AI-generated executive summary and
 * additional recommendations. Returns the enhanced report.
 */
export async function enhanceWithAI(report: VisionReport): Promise<VisionReport> {
  try {
    const issuesSummary = summarizeIssues(report.issues);
    const prompt = buildPrompt(report, issuesSummary);

    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.2,
      maxTokens: 800,
      systemPrompt:
        "You are FlutterForge AI's Vision AI analyst. You receive a heuristic analysis report of a Flutter app screen and must produce:\n" +
        "1. A concise 2-3 sentence executive summary that prioritises the most impactful issues.\n" +
        "2. One additional high-priority recommendation not already in the list.\n\n" +
        "Respond with STRICT JSON only — no markdown:\n" +
        "{\n" +
        '  "executiveSummary": "...",\n' +
        '  "extraRecommendation": {\n' +
        '    "category": "layout" | "performance" | "accessibility" | "material" | "best-practice" | "maintainability",\n' +
        '    "priority": "high" | "medium" | "low",\n' +
        '    "title": "...",\n' +
        '    "description": "...",\n' +
        '    "action": "...",\n' +
        '    "impact": "high" | "medium" | "low"\n' +
        "  }\n" +
        "}",
      messages: [
        { id: uid("msg"), role: "user", content: prompt },
      ],
    });

    const parsed = parseResponse(response.content);
    if (!parsed) return report;

    const enhanced: VisionReport = {
      ...report,
      executiveSummary: parsed.executiveSummary ?? report.executiveSummary,
      recommendations: parsed.extraRecommendation
        ? [...report.recommendations, { id: uid("rec"), ...parsed.extraRecommendation }]
        : report.recommendations,
    };
    return enhanced;
  } catch {
    return report;
  }
}

function summarizeIssues(issues: VisionIssue[]): string {
  const byCategory = new Map<string, number>();
  for (const i of issues) {
    byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
  }
  return Array.from(byCategory.entries())
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");
}

function buildPrompt(report: VisionReport, issuesSummary: string): string {
  return (
    `Screen: ${report.screenUnderstanding.currentPage} (${report.screenUnderstanding.screenType})\n` +
    `Overall score: ${report.overallScore}/100\n` +
    `Confidence: ${(report.confidence.score * 100).toFixed(0)}%\n` +
    `Issues (${issuesSummary}): ${report.issues.slice(0, 5).map((i) => i.title).join("; ")}\n` +
    `Layout score: ${report.layout.score}/100 (${report.layout.issueCount} findings)\n` +
    `Widget score: ${report.widget.score}/100 (const usage: ${report.widget.constUsage}%)\n` +
    `Design score: ${report.design.overallScore}/100\n` +
    `Accessibility score: ${report.accessibility.score}/100 (WCAG: ${report.accessibility.wcagLevel})\n` +
    `Performance score: ${report.performance.score}/100 (${report.performance.fps} fps, ${report.performance.jankCount} jank)\n` +
    `Responsive score: ${report.responsive.overallScore}/100\n` +
    `Existing recommendations: ${report.recommendations.map((r) => r.title).join("; ")}\n\n` +
    `Return strict JSON with an executive summary and one extra recommendation.`
  );
}

function parseResponse(content: string): {
  executiveSummary?: string;
  extraRecommendation?: Omit<Recommendation, "id">;
} | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
