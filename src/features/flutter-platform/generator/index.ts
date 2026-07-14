/**
 * @module features/flutter-platform/generator
 *
 * AI-driven Flutter code generator. Uses the Forge chat engine
 * (z-ai-web-dev-sdk) to produce real Dart code from natural-language
 * descriptions.
 *
 * Supports four generation modes:
 *   - "screen"      → a full screen widget (StatelessWidget or StatefulWidget)
 *   - "widget"      → a reusable widget
 *   - "model"       → a data model class (with fromJson / toJson / copyWith)
 *   - "service"     → a service class (API client, repository, etc.)
 *
 * Falls back to a small built-in template if the AI is unavailable, so the
 * endpoint always returns usable code.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";

/** Generation modes. */
export type GenerationMode = "screen" | "widget" | "model" | "service";

/** Result returned by the generator. */
export interface GenerationResult {
  id: string;
  mode: GenerationMode;
  description: string;
  className: string;
  code: string;
  /** Path suggestion for the file (lib/...). */
  suggestedPath: string;
  /** Estimated lines of code. */
  lineCount: number;
  /** AI rationale (1–2 sentences). */
  rationale: string;
  aiGenerated: boolean;
  generatedAt: string;
}

/** Default Forge model. */
const DEFAULT_MODEL = "glm-4.6";

/** Generate Dart code from a description. */
export async function generateDartCode(
  description: string,
  mode: GenerationMode = "screen",
  options?: { className?: string }
): Promise<GenerationResult> {
  const className =
    options?.className?.trim() || deriveClassName(description, mode);
  const suggestedPath = suggestPath(className, mode);
  const id = uid("gen");

  try {
    const systemPrompt = buildSystemPrompt(mode);
    const userPrompt = buildUserPrompt(description, mode, className);

    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.2,
      maxTokens: 2500,
      systemPrompt,
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const code = extractDartCode(response.content);
    if (!code) {
      return fallback(id, description, mode, className, suggestedPath, "AI returned no code");
    }

    return {
      id,
      mode,
      description,
      className,
      code,
      suggestedPath,
      lineCount: code.split("\n").length,
      rationale: extractRationale(response.content) ?? `AI-generated ${mode} for: ${description}`,
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
    };
  } catch (e: unknown) {
    return fallback(
      id,
      description,
      mode,
      className,
      suggestedPath,
      e instanceof Error ? e.message : "AI unavailable"
    );
  }
}

/** Build the system prompt for a given generation mode. */
function buildSystemPrompt(mode: GenerationMode): string {
  const base =
    "You are FlutterForge AI's code generator — an expert Flutter/Dart engineer. " +
    "Generate production-ready, idiomatic Dart code that follows the official Flutter style guide. " +
    "Always emit a single complete Dart file, ready to drop into a Flutter project. " +
    "Respond in TWO sections separated by a line containing only `---`:\n" +
    "1. A one-sentence rationale describing the design choice.\n" +
    "2. The Dart code in a single ```dart fenced block.\n\n" +
    "Rules:\n" +
    "- Use `package:flutter/material.dart` for screens/widgets.\n" +
    "- Use Material 3 conventions (ColorScheme.fromSeed, useMaterial3: true).\n" +
    "- Use `const` constructors wherever possible.\n" +
    "- Include `super.key` in widget constructors.\n" +
    "- Add concise inline comments for non-obvious logic.\n" +
    "- Never emit analysis warnings (avoid deprecated APIs, unused imports, missing const).\n";

  const modeSpecific: Record<GenerationMode, string> = {
    screen:
      "The user wants a complete screen. Output a `StatelessWidget` (or `StatefulWidget` if state is required) with a `Scaffold`. Include `AppBar` with a title and a sensible `body` layout. Use `const` where possible.",
    widget:
      "The user wants a reusable widget. Output a `StatelessWidget` with sensible constructor parameters. Keep it small and focused. Do NOT include a Scaffold.",
    model:
      "The user wants a data model class. Output an immutable class with: required named constructor parameters, `const` constructor, `final` fields, `==`/`hashCode` overrides, `copyWith`, `toString`, `fromJson` factory, and `toJson` method. Include `import 'dart:convert';` only if needed.",
    service:
      "The user wants a service class (e.g., API client, repository). Output a class with clearly-named async methods. Use `http` package imports if needed. Include basic error handling and a clear method signature.",
  };

  return base + modeSpecific[mode];
}

/** Build the user prompt. */
function buildUserPrompt(
  description: string,
  _mode: GenerationMode,
  className: string
): string {
  return (
    `Description: ${description}\n\n` +
    `Class name: ${className}\n\n` +
    `Return your response in this exact format:\n` +
    `<one-sentence rationale>\n` +
    `---\n` +
    "```dart\n" +
    "<complete Dart file>\n" +
    "```"
  );
}

/** Extract the Dart code block from the AI response. */
function extractDartCode(content: string): string | null {
  if (!content) return null;
  // Look for a ```dart fenced block.
  const match = content.match(/```(?:dart)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Fall back to the entire content if it already looks like Dart.
  if (content.trim().startsWith("import ") || content.trim().startsWith("class ") || content.trim().startsWith("library ")) {
    return content.trim();
  }
  return null;
}

/** Extract the rationale line (text before `---`). */
function extractRationale(content: string): string | null {
  const idx = content.indexOf("\n---\n");
  if (idx === -1) return null;
  const rationale = content.slice(0, idx).trim();
  return rationale || null;
}

/** Derive a sensible class name from the description. */
function deriveClassName(description: string, mode: GenerationMode): string {
  const suffix = mode === "screen" ? "Screen" : mode === "widget" ? "Widget" : mode === "model" ? "Model" : "Service";
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .slice(0, 3);
  if (words.length === 0) return `Generated${suffix}`;
  const name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  // Avoid double suffix (e.g., "LoginScreenScreen").
  return name.endsWith(suffix) ? name : `${name}${suffix}`;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "with", "for", "and", "or", "of", "to", "in", "on",
  "that", "this", "show", "showing", "create", "make", "build", "add",
  "screen", "widget", "page", "view", "component",
]);

/** Suggest a file path for the class. */
function suggestPath(className: string, mode: GenerationMode): string {
  // Convert ClassName → snake_case
  const snake = className
    .replace(/([A-Z])/g, "_$1")
    .replace(/^_/, "")
    .toLowerCase();
  const folder =
    mode === "screen" ? "screens" :
    mode === "widget" ? "widgets" :
    mode === "model" ? "models" : "services";
  return `lib/${folder}/${snake}.dart`;
}

/** Build a fallback (template) result when the AI is unavailable. */
function fallback(
  id: string,
  description: string,
  mode: GenerationMode,
  className: string,
  suggestedPath: string,
  reason: string
): GenerationResult {
  const code = templateFor(mode, className, description);
  return {
    id,
    mode,
    description,
    className,
    code,
    suggestedPath,
    lineCount: code.split("\n").length,
    rationale: `Template fallback (${reason}). Edit the generated code as needed.`,
    aiGenerated: false,
    generatedAt: new Date().toISOString(),
  };
}

/** Minimal template per mode. */
function templateFor(mode: GenerationMode, className: string, description: string): string {
  if (mode === "screen") {
    return [
      `import 'package:flutter/material.dart';`,
      ``,
      `class ${className} extends StatelessWidget {`,
      `  const ${className}({super.key});`,
      ``,
      `  @override`,
      `  Widget build(BuildContext context) {`,
      `    return Scaffold(`,
      `      appBar: AppBar(title: const Text('${className}')),`,
      `      body: const Center(child: Text('${description}')),`,
      `    );`,
      `  }`,
      `}`,
      ``,
    ].join("\n");
  }
  if (mode === "widget") {
    return [
      `import 'package:flutter/material.dart';`,
      ``,
      `class ${className} extends StatelessWidget {`,
      `  const ${className}({super.key});`,
      ``,
      `  @override`,
      `  Widget build(BuildContext context) {`,
      `    return Container(child: const Text('${description}'));`,
      `  }`,
      `}`,
      ``,
    ].join("\n");
  }
  if (mode === "model") {
    return [
      `class ${className} {`,
      `  const ${className}({required this.id});`,
      ``,
      `  final String id;`,
      ``,
      `  factory ${className}.fromJson(Map<String, dynamic> json) =>`,
      `      ${className}(id: json['id'] as String);`,
      ``,
      `  Map<String, dynamic> toJson() => {'id': id};`,
      ``,
      `  ${className} copyWith({String? id}) => ${className}(id: id ?? this.id);`,
      ``,
      `  @override`,
      `  bool operator ==(Object other) => other is ${className} && other.id == id;`,
      ``,
      `  @override`,
      `  int get hashCode => id.hashCode;`,
      `}`,
      ``,
    ].join("\n");
  }
  // service
  return [
    `class ${className} {`,
    `  const ${className}();`,
    ``,
    `  Future<void> execute() async {`,
    `    // TODO: implement '${description}'`,
    `  }`,
    `}`,
    ``,
  ].join("\n");
}
