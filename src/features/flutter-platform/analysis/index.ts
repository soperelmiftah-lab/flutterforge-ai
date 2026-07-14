/**
 * @module features/flutter-platform/analysis
 *
 * AI-driven Flutter analysis. Returns SDK version, package count, issues,
 * and recommendations for a Dart code snippet. Falls back to static checks.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";

/** Default Forge model. */
const DEFAULT_MODEL = "glm-4.6";

export interface FlutterAnalysisResult {
  sdkVersion: string;
  flutterVersion: string;
  stateManagement: string;
  routing: string;
  packageCount: number;
  issues: Array<{ id: string; severity: "info" | "warning" | "error"; message: string }>;
  recommendations: string[];
  summary: string;
  aiGenerated: boolean;
}

/** Analyze a Dart code snippet. */
export async function analyzeFlutterCode(code: string): Promise<FlutterAnalysisResult> {
  if (!code.trim()) {
    return {
      sdkVersion: ">=3.3.0",
      flutterVersion: "3.22.0",
      stateManagement: "unknown",
      routing: "unknown",
      packageCount: 0,
      issues: [],
      recommendations: [],
      summary: "No code provided.",
      aiGenerated: false,
    };
  }

  try {
    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.1,
      maxTokens: 1500,
      systemPrompt:
        "You are FlutterForge AI's project analyzer. Analyze the provided Dart/Flutter code and respond with STRICT JSON only.\n\n" +
        "Schema:\n" +
        "{\n" +
        '  "summary": "<2-3 sentence summary>",\n' +
        '  "stateManagement": "setState" | "provider" | "riverpod" | "bloc" | "getX" | "unknown",\n' +
        '  "routing": "navigator" | "go_router" | "auto_route" | "none" | "unknown",\n' +
        '  "packageCount": <number of unique imports>,\n' +
        '  "issues": [{"severity": "info" | "warning" | "error", "message": "..."}],\n' +
        '  "recommendations": ["..."]\n' +
        "}",
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: `Analyze this Dart/Flutter code:\n\n${code}`,
        },
      ],
    });

    return parseAnalysis(response.content, code);
  } catch (e: unknown) {
    return fallbackAnalysis(code, e instanceof Error ? e.message : "AI unavailable");
  }
}

function parseAnalysis(content: string, code: string): FlutterAnalysisResult {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return fallbackAnalysis(code, "Invalid JSON");
  text = text.slice(start, end + 1);

  let parsed: {
    summary?: string;
    stateManagement?: string;
    routing?: string;
    packageCount?: number;
    issues?: Array<{ severity?: string; message?: string }>;
    recommendations?: string[];
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return fallbackAnalysis(code, "Invalid JSON");
  }

  const imports = code.match(/^import\s+['"]([^'"]+)['"]/gm) ?? [];
  return {
    sdkVersion: ">=3.3.0",
    flutterVersion: "3.22.0",
    stateManagement: parsed.stateManagement ?? detectStateManagement(code),
    routing: parsed.routing ?? detectRouting(code),
    packageCount: parsed.packageCount ?? imports.length,
    issues: (parsed.issues ?? []).map((i) => ({
      id: uid("issue"),
      severity: (i.severity === "error" || i.severity === "warning" || i.severity === "info") ? i.severity : "info",
      message: i.message ?? "",
    })),
    recommendations: parsed.recommendations ?? [],
    summary: parsed.summary ?? "Analysis complete.",
    aiGenerated: true,
  };
}

function detectStateManagement(code: string): string {
  if (/riverpod|ConsumerWidget|ProviderScope/.test(code)) return "riverpod";
  if (/ChangeNotifierProvider|MultiProvider/.test(code)) return "provider";
  if (/\bBloc\b| BlocBuilder| BlocListener/.test(code)) return "bloc";
  if (/Get\.(put|find|to)/.test(code)) return "getX";
  if (/setState\(/.test(code)) return "setState";
  return "unknown";
}

function detectRouting(code: string): string {
  if (/go_router|GoRouter/.test(code)) return "go_router";
  if (/auto_route|AutoRoute/.test(code)) return "auto_route";
  if (/Navigator\.(of|push|pop|pushReplacement)/.test(code)) return "navigator";
  return "none";
}

function fallbackAnalysis(code: string, reason?: string): FlutterAnalysisResult {
  const imports = code.match(/^import\s+['"]([^'"]+)['"]/gm) ?? [];
  const issues: FlutterAnalysisResult["issues"] = [];
  if (imports.length === 0) {
    issues.push({ id: uid("issue"), severity: "warning", message: "No imports found — the file may be incomplete." });
  }
  return {
    sdkVersion: ">=3.3.0",
    flutterVersion: "3.22.0",
    stateManagement: detectStateManagement(code),
    routing: detectRouting(code),
    packageCount: imports.length,
    issues,
    recommendations: [
      "Run `flutter analyze` regularly.",
      "Pin package versions in pubspec.yaml.",
      "Use `const` constructors wherever possible.",
    ],
    summary: reason
      ? `Static analysis (AI unavailable: ${reason}).`
      : "Static analysis complete.",
    aiGenerated: false,
  };
}

// (Legacy `analysisInfo` placeholder removed — "use server" modules can only
// export async functions. Use the `analyzeFlutterCode` async function instead.)
