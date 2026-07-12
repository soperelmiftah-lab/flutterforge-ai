/**
 * @module features/workspace-intelligence/symbols/parser
 *
 * Code Symbol Engine — extracts symbols (classes, widgets, functions, etc.)
 * from Dart source files using regex-based parsing. This is intentionally
 * lightweight (no full AST) so it runs fast on every file in the project.
 *
 * A full dart_analyzer-backed parser can replace this in a future phase
 * without changing the SymbolRef output shape.
 */

import type {
  SymbolRef,
  SymbolKind,
  WidgetArchetype,
  ImportRef,
  ExportRef,
} from "@/features/workspace-intelligence/types";

const WIDGET_ARCHETYPES: Record<string, WidgetArchetype> = {
  StatelessWidget: "StatelessWidget",
  StatefulWidget: "StatefulWidget",
  HookWidget: "HookWidget",
  ConsumerWidget: "ConsumerWidget",
  ConsumerStatefulWidget: "ConsumerStatefulWidget",
  HookConsumerWidget: "HookConsumerWidget",
  InheritedWidget: "InheritedWidget",
  CustomPainter: "CustomPainter",
  CustomClipper: "CustomClipper",
};

const WIDGET_EXTENDS = Object.keys(WIDGET_ARCHETYPES).join("|");

/** Extract all top-level symbols from a Dart file. */
export function parseSymbols(content: string, filePath: string): SymbolRef[] {
  const symbols: SymbolRef[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

    // Doc comment capture (look above)
    const doc = captureDoc(lines, i);

    // Class / Widget / Enum / Mixin / Extension
    const classMatch = line.match(
      new RegExp(
        `^(\\s*)(abstract\\s+)?(class|sealed\\s+class|base\\s+class|final\\s+class|interface\\s+class|mixin|enum|extension)\\s+([A-Za-z_][A-Za-z0-9_]*)`
      )
    );
    if (classMatch) {
      const modifiers = [];
      if (classMatch[2]) modifiers.push("abstract");
      const keyword = classMatch[3].replace(/\s+/g, " ");
      const name = classMatch[4];
      const kind = mapClassKeyword(keyword, line, name);
      const archetype = detectWidgetArchetype(line);
      symbols.push({
        name,
        kind,
        line: i + 1,
        endLine: findBlockEnd(lines, i),
        widgetArchetype: archetype ?? undefined,
        modifiers,
        doc: doc ?? undefined,
        filePath,
      });
      continue;
    }

    // Typedef
    const typedefMatch = line.match(/^(\s*)typedef\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (typedefMatch) {
      symbols.push({
        name: typedefMatch[2],
        kind: "typedef",
        line: i + 1,
        modifiers: [],
        doc: doc ?? undefined,
        filePath,
      });
      continue;
    }

    // Top-level function or method (simplified: any `name(...)` with a return type or `void`).
    const fnMatch = line.match(
      /^(\s*)(static\s+)?(async\s+)?([A-Za-z_][A-Za-z0-9_<>,\s\[\]\?]*\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*(async\s*)?\{?/
    );
    if (fnMatch && !line.includes("class ") && !line.includes("new ")) {
      const name = fnMatch[5];
      // Skip control-flow keywords and property assignments.
      if (["if", "for", "while", "switch", "catch", "return", "assert", "throw"].includes(name)) continue;
      if (!name || !/^[A-Za-z_]/.test(name)) continue;
      const modifiers = [];
      if (fnMatch[2]) modifiers.push("static");
      if (fnMatch[3] || fnMatch[6]) modifiers.push("async");
      const indent = fnMatch[1].length;
      const kind: SymbolKind = indent === 0 ? "function" : "method";
      symbols.push({
        name,
        kind,
        line: i + 1,
        modifiers,
        doc: doc ?? undefined,
        filePath,
      });
      continue;
    }

    // Top-level constant/variable (const Name = ... or final Name = ...)
    const constMatch = line.match(/^(\s*)(const|final)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (constMatch && constMatch[1].length === 0) {
      symbols.push({
        name: constMatch[3],
        kind: "constant",
        line: i + 1,
        modifiers: [constMatch[2]],
        doc: doc ?? undefined,
        filePath,
      });
    }
  }

  return symbols;
}

/** Map a class keyword + context to a SymbolKind. */
function mapClassKeyword(keyword: string, line: string, name: string): SymbolKind {
  // Detect widget archetype
  if (new RegExp(`extends\\s+(${WIDGET_EXTENDS})`).test(line)) return "widget";
  if (new RegExp(`with\\s+.*(${WIDGET_EXTENDS})`).test(line)) return "widget";

  // Heuristic naming
  const lower = name.toLowerCase();
  if (lower.endsWith("provider")) return "provider";
  if (lower.endsWith("service")) return "service";
  if (lower.endsWith("repository") || lower.endsWith("repo")) return "repository";
  if (lower.endsWith("route") || lower.endsWith("page") || lower.endsWith("screen")) return "route";
  if (lower.endsWith("theme")) return "theme";
  if (lower.endsWith("model") || lower.endsWith("dto") || lower.endsWith("entity")) return "model";

  if (keyword.startsWith("enum")) return "enum";
  if (keyword.startsWith("mixin")) return "mixin";
  if (keyword.startsWith("extension")) return "extension";
  return "class";
}

/** Detect the Flutter widget archetype from an extends clause. */
function detectWidgetArchetype(line: string): WidgetArchetype | null {
  for (const [key, value] of Object.entries(WIDGET_ARCHETYPES)) {
    if (new RegExp(`extends\\s+${key}`).test(line)) return value;
  }
  return null;
}

/** Find the end of a brace block starting at line index. */
function findBlockEnd(lines: string[], startIdx: number): number | undefined {
  let depth = 0;
  let started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") {
        depth++;
        started = true;
      } else if (ch === "}") {
        depth--;
        if (started && depth === 0) return i + 1;
      }
    }
    if (started && depth === 0) return i + 1;
  }
  return undefined;
}

// Capture a doc comment (triple-slash or slash-star-star) preceding a symbol.
function captureDoc(lines: string[], symbolIdx: number): string | null {
  const parts: string[] = [];
  let i = symbolIdx - 1;
  while (i >= 0) {
    const t = lines[i].trim();
    if (t.startsWith("///")) {
      parts.unshift(t.replace(/^\/\/\//, "").trim());
      i--;
      continue;
    }
    if (t.startsWith("*") || t.startsWith("/*")) {
      parts.unshift(t.replace(/^[/*\s]+/, "").replace(/[/*\s]+$/, ""));
      i--;
      continue;
    }
    break;
  }
  return parts.length > 0 ? parts.join(" ").trim() : null;
}

/** Extract imports from a Dart file. */
export function parseImports(content: string): ImportRef[] {
  const imports: ImportRef[] = [];
  const regex = /import\s+['"]([^'"]+)['"](?:\s+as\s+([A-Za-z_]\w*))?(?:\s+show\s+([^;]+))?(?:\s+hide\s+([^;]+))?;/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const [, uri, alias, show, hide] = match;
    imports.push({
      uri,
      alias: alias ?? undefined,
      show: show ? show.split(",").map((s) => s.trim()) : undefined,
      hide: hide ? hide.split(",").map((s) => s.trim()) : undefined,
      relative: uri.startsWith(".") || uri.startsWith("/"),
    });
  }
  return imports;
}

/** Extract exports from a Dart file. */
export function parseExports(content: string): ExportRef[] {
  const exports: ExportRef[] = [];
  const regex = /export\s+['"]([^'"]+)['"](?:\s+show\s+([^;]+))?(?:\s+hide\s+([^;]+))?;/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const [, uri, show, hide] = match;
    exports.push({
      uri,
      show: show ? show.split(",").map((s) => s.trim()) : undefined,
      hide: hide ? hide.split(",").map((s) => s.trim()) : undefined,
      relative: uri.startsWith(".") || uri.startsWith("/"),
    });
  }
  return exports;
}
