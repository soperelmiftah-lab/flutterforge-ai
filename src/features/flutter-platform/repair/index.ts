/**
 * @module features/flutter-platform/repair
 *
 * AI-driven Flutter/Dart repair detection. Sends the user's Dart code to the
 * Forge chat engine and asks it to identify common Flutter bugs (broken
 * widgets, disposed-controller misuse, async misuse, etc.) with fix
 * suggestions.
 *
 * Falls back to a small set of static heuristics if the AI is unavailable.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";
import type { RepairResult, RepairIssue, RepairType, ReviewSeverity } from "../types";

/** Default Forge model. */
const DEFAULT_MODEL = "glm-4.6";

/** Detect repair issues in Dart code. */
export async function detectRepairIssues(code: string): Promise<RepairResult> {
  if (!code.trim()) {
    return { issues: [], autoFixableCount: 0, criticalCount: 0, summary: "No code provided." };
  }

  try {
    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.1,
      maxTokens: 1800,
      systemPrompt:
        "You are FlutterForge AI's repair engine. Detect common Flutter/Dart bugs and respond with STRICT JSON only — no markdown.\n\n" +
        "Schema:\n" +
        "{\n" +
        '  "summary": "<2-3 sentence summary>",\n' +
        '  "issues": [\n' +
        '    {\n' +
        '      "type": "broken-widget" | "invalid-build-context" | "memory-leak" | "async-misuse" | "setstate-misuse" | "disposed-controller" | "navigator-issue" | "theme-issue",\n' +
        '      "severity": "info" | "warning" | "error" | "critical",\n' +
        '      "title": "<short title>",\n' +
        '      "description": "<what is wrong>",\n' +
        '      "fix": "<how to fix>",\n' +
        '      "autoFixable": true | false\n' +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "Rules:\n" +
        "- Be specific — reference exact identifiers.\n" +
        "- Mark `autoFixable: true` only for trivial mechanical fixes (e.g., missing const, wrong dispose call).\n" +
        "- 0 issues only if the code is genuinely clean.",
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: `Detect issues in this Dart/Flutter code:\n\n${code}`,
        },
      ],
    });

    const parsed = parseRepairResponse(response.content);
    if (parsed) return parsed;
    return fallbackRepair(code);
  } catch (e: unknown) {
    return fallbackRepair(code, e instanceof Error ? e.message : "AI unavailable");
  }
}

function parseRepairResponse(content: string): RepairResult | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);

  let parsed: {
    summary?: string;
    issues?: Array<{
      type?: string;
      severity?: string;
      title?: string;
      description?: string;
      fix?: string;
      autoFixable?: boolean;
    }>;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const issues: RepairIssue[] = (parsed.issues ?? []).map((i) => ({
    id: uid("issue"),
    type: validType(i.type),
    severity: validSeverity(i.severity),
    title: i.title ?? "Untitled issue",
    description: i.description ?? "",
    fix: i.fix ?? "",
    autoFixable: !!i.autoFixable,
  }));

  return {
    issues,
    autoFixableCount: issues.filter((i) => i.autoFixable).length,
    criticalCount: issues.filter((i) => i.severity === "critical" || i.severity === "error").length,
    summary: parsed.summary ?? `Repair scan complete — ${issues.length} issue(s).`,
  };
}

function validType(t: unknown): RepairType {
  const valid: RepairType[] = [
    "broken-widget",
    "invalid-build-context",
    "memory-leak",
    "async-misuse",
    "setstate-misuse",
    "disposed-controller",
    "navigator-issue",
    "theme-issue",
  ];
  return (valid as string[]).includes(t as string) ? (t as RepairType) : "broken-widget";
}

function validSeverity(s: unknown): ReviewSeverity {
  if (s === "info" || s === "warning" || s === "error" || s === "critical") return s;
  return "info";
}

/** Minimal static fallback. */
function fallbackRepair(code: string, reason?: string): RepairResult {
  const issues: RepairIssue[] = [];

  // disposed-controller misuse: TextEditingController without dispose()
  if (/TextEditingController\(/.test(code) && !/dispose\(\)/.test(code)) {
    issues.push({
      id: uid("issue"),
      type: "disposed-controller",
      severity: "error",
      title: "Controller not disposed",
      description: "A TextEditingController is created but never disposed, which leaks resources.",
      fix: "Override `dispose()` and call `_controller.dispose()`.",
      autoFixable: false,
    });
  }

  // setState misuse: calling setState after async gap without mounted check
  if (/await\s+/.test(code) && /setState\(\(\)/.test(code) && !/mounted/.test(code)) {
    issues.push({
      id: uid("issue"),
      type: "setstate-misuse",
      severity: "warning",
      title: "setState after async without mounted check",
      description: "Calling setState after an `await` without checking `mounted` can throw after disposal.",
      fix: "Add `if (!mounted) return;` before setState.",
      autoFixable: false,
    });
  }

  // Navigator issue: using context.search across async gaps
  if (/Navigator\.of\(context\)/.test(code) && /await\s+/.test(code)) {
    issues.push({
      id: uid("issue"),
      type: "navigator-issue",
      severity: "warning",
      title: "Navigator used across async gap",
      description: "Using `Navigator.of(context)` after an `await` is unsafe if the widget unmounted.",
      fix: "Capture `navigator` before the await, or check `mounted`.",
      autoFixable: false,
    });
  }

  // Memory leak: AnimationController without dispose
  if (/AnimationController\(/.test(code) && !/dispose\(\)/.test(code)) {
    issues.push({
      id: uid("issue"),
      type: "memory-leak",
      severity: "error",
      title: "AnimationController leak",
      description: "AnimationController is not disposed — will leak and continue ticking.",
      fix: "Dispose the controller in `dispose()`.",
      autoFixable: false,
    });
  }

  return {
    issues,
    autoFixableCount: issues.filter((i) => i.autoFixable).length,
    criticalCount: issues.filter((i) => i.severity === "critical" || i.severity === "error").length,
    summary: reason
      ? `Static fallback (AI unavailable: ${reason}). ${issues.length} issue(s).`
      : `Static scan — ${issues.length} issue(s).`,
  };
}

// (Legacy `repairInfo` placeholder removed — "use server" modules can only
// export async functions. Use the `detectRepairIssues` async function instead.)
