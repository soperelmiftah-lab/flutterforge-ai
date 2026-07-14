/**
 * @module features/flutter-platform/review
 *
 * AI-driven Flutter/Dart code review. Sends the user's Dart code to the
 * Forge chat engine and asks it to produce a structured review with
 * findings and 0–100 scores across 4 dimensions.
 *
 * Falls back to a minimal static review if the AI is unavailable.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";
import type { ReviewResult, ReviewFinding, ReviewSeverity } from "../types";

/** Default Forge model. */
const DEFAULT_MODEL = "glm-4.6";

/** Review a Dart code snippet. */
export async function reviewDartCode(code: string): Promise<ReviewResult> {
  if (!code.trim()) {
    return emptyReview("No code provided.");
  }

  try {
    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.1,
      maxTokens: 2000,
      systemPrompt:
        "You are FlutterForge AI's senior Flutter reviewer. Analyze Dart/Flutter code and respond with STRICT JSON only — no markdown, no commentary.\n\n" +
        "Schema:\n" +
        "{\n" +
        '  "summary": "<2-3 sentence overall summary>",\n' +
        '  "scores": {\n' +
        '    "architecture": 0-100,\n' +
        '    "performance": 0-100,\n' +
        '    "accessibility": 0-100,\n' +
        '    "maintainability": 0-100\n' +
        "  },\n" +
        '  "findings": [\n' +
        '    {\n' +
        '      "severity": "info" | "warning" | "error" | "critical",\n' +
        '      "category": "architecture" | "performance" | "a11y" | "maintainability" | "style" | "correctness",\n' +
        '      "title": "<short title>",\n' +
        '      "description": "<what is wrong>",\n' +
        '      "recommendation": "<how to fix it>",\n' +
        '      "line": <optional 1-based line number>\n' +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "Rules:\n" +
        "- Be specific. Reference exact identifiers from the code.\n" +
        "- Prioritise actionable findings over stylistic nitpicks.\n" +
        "- 5–10 findings is ideal. Empty findings array only if the code is perfect.\n" +
        "- Score 90+ for excellent, 70-89 good, 50-69 needs work, <50 poor.",
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: `Review this Dart/Flutter code:\n\n${code}`,
        },
      ],
    });

    const parsed = parseReviewResponse(response.content);
    if (parsed) return parsed;
    return fallbackReview(code);
  } catch (e: unknown) {
    return fallbackReview(code, e instanceof Error ? e.message : "AI unavailable");
  }
}

/** Parse the AI JSON response. */
function parseReviewResponse(content: string): ReviewResult | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);

  let parsed: {
    summary?: string;
    scores?: { architecture?: number; performance?: number; accessibility?: number; maintainability?: number };
    findings?: Array<{
      severity?: string;
      category?: string;
      title?: string;
      description?: string;
      recommendation?: string;
      line?: number;
    }>;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const scores = parsed.scores ?? {};
  const architectureScore = clampScore(scores.architecture);
  const performanceScore = clampScore(scores.performance);
  const accessibilityScore = clampScore(scores.accessibility);
  const maintainabilityScore = clampScore(scores.maintainability);
  const overallScore = Math.round(
    (architectureScore + performanceScore + accessibilityScore + maintainabilityScore) / 4
  );

  const findings: ReviewFinding[] = (parsed.findings ?? []).map((f) => ({
    id: uid("finding"),
    severity: validSeverity(f.severity),
    category: f.category ?? "general",
    title: f.title ?? "Untitled finding",
    description: f.description ?? "",
    recommendation: f.recommendation ?? "",
    line: typeof f.line === "number" ? f.line : undefined,
  }));

  return {
    findings,
    overallScore,
    architectureScore,
    performanceScore,
    accessibilityScore,
    maintainabilityScore,
    summary: parsed.summary ?? "AI review complete.",
  };
}

function clampScore(n: unknown): number {
  const num = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function validSeverity(s: unknown): ReviewSeverity {
  if (s === "info" || s === "warning" || s === "error" || s === "critical") return s;
  return "info";
}

function emptyReview(summary: string): ReviewResult {
  return {
    findings: [],
    overallScore: 0,
    architectureScore: 0,
    performanceScore: 0,
    accessibilityScore: 0,
    maintainabilityScore: 0,
    summary,
  };
}

/** Minimal static fallback review (used when AI is unavailable). */
function fallbackReview(code: string, reason?: string): ReviewResult {
  const findings: ReviewFinding[] = [];
  const lines = code.split("\n");

  // Check common issues with regex.
  if (!/import\s+['"]package:flutter\//.test(code)) {
    findings.push({
      id: uid("finding"),
      severity: "warning",
      category: "correctness",
      title: "Missing Flutter import",
      description: "No `package:flutter/material.dart` (or cupertino) import detected.",
      recommendation: "Add the appropriate Flutter import at the top of the file.",
    });
  }
  if (/setState\(\(\)/.test(code) && !/extends\s+State</.test(code)) {
    findings.push({
      id: uid("finding"),
      severity: "error",
      category: "correctness",
      title: "setState used outside a State class",
      description: "Calling setState() outside a StatefulWidget's State will throw at runtime.",
      recommendation: "Move the call into a State subclass.",
    });
  }
  if (/Text\(['"][^'"]+['"]\)/.test(code) && !/const\s+Text\(/.test(code)) {
    findings.push({
      id: uid("finding"),
      severity: "info",
      category: "performance",
      title: "Missing const on Text widgets",
      description: "Literal Text widgets can be const — reduces rebuild cost.",
      recommendation: "Add `const` before Text(...) where the content is a literal.",
    });
  }
  if (lines.length > 300) {
    findings.push({
      id: uid("finding"),
      severity: "warning",
      category: "maintainability",
      title: "Long file",
      description: `This file has ${lines.length} lines. Long files are hard to maintain.`,
      recommendation: "Split into smaller, focused files.",
    });
  }

  const score = Math.max(40, 90 - findings.length * 8);
  return {
    findings,
    overallScore: score,
    architectureScore: score,
    performanceScore: Math.max(40, score - 5),
    accessibilityScore: Math.max(40, score - 15),
    maintainabilityScore: score,
    summary: reason
      ? `Static fallback review (AI unavailable: ${reason}). ${findings.length} finding(s).`
      : `Static fallback review. ${findings.length} finding(s).`,
  };
}

// (Legacy `reviewInfo` placeholder removed — "use server" modules can only
// export async functions. Use the `reviewDartCode` async function instead.)
