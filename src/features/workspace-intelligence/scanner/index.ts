/**
 * @module features/workspace-intelligence/scanner
 *
 * Project Scanner — walks a Flutter project's structure and collects raw
 * inputs for the indexer. Reads:
 *   pubspec.yaml, analysis_options.yaml, lib/, test/, android/, ios/, web/,
 *   windows/, linux/, macos/, assets/, README, docs/
 *
 * In Phase 3 the scanner operates on the in-memory mock file tree (the
 * sandbox has no real Flutter project on disk). The interface is
 * filesystem-shaped so a real-fs implementation can drop in later without
 * changing callers.
 */

import type {
  WorkspacePath,
  PubspecInfo,
  AnalysisOptionsInfo,
  PlatformPresence,
  ProjectFileNode,
} from "@/features/workspace-intelligence/types";
import { mockFileTree } from "@/lib/mock-data";

/** A scanned raw file (content available for parsing). */
export interface ScannedFile {
  path: WorkspacePath;
  name: string;
  extension: string;
  content: string;
  size: number;
  lines: number;
}

/** The complete scan result. */
export interface ScanResult {
  root: WorkspacePath;
  files: ScannedFile[];
  folders: WorkspacePath[];
  pubspec: PubspecInfo | null;
  analysisOptions: AnalysisOptionsInfo | null;
  platforms: PlatformPresence;
  readme: string | null;
  docs: ScannedFile[];
  assets: string[];
}

/**
 * Scanner interface. Implementations walk a project (in-memory or real fs)
 * and return a ScanResult.
 */
export interface ProjectScanner {
  scan(root: WorkspacePath): Promise<ScanResult>;
  /** Quick re-scan of a single file (used by the watcher). */
  rescanFile(path: WorkspacePath): Promise<ScannedFile | null>;
}

/**
 * InMemoryScanner — scans the mock Flutter project tree from Phase 1.
 * This is the Phase 3 default; a real-fs scanner arrives when the Flutter
 * Engine lands in a later phase.
 */
export class InMemoryScanner implements ProjectScanner {
  private tree: ProjectFileNode[];

  constructor(tree: ProjectFileNode[] = mockFileTree) {
    this.tree = tree;
  }

  async scan(_root: WorkspacePath = "."): Promise<ScanResult> {
    const files: ScannedFile[] = [];
    const folders: WorkspacePath[] = [];
    const assets: string[] = [];

    const walk = (nodes: ProjectFileNode[], parentPath: string) => {
      for (const node of nodes) {
        if (node.type === "folder") {
          folders.push(node.path);
          if (node.children) walk(node.children, node.path);
        } else if (node.type === "file" && node.content !== undefined) {
          const lines = node.content.split("\n").length;
          files.push({
            path: node.path,
            name: node.name,
            extension: this.ext(node.name),
            content: node.content,
            size: node.content.length,
            lines,
          });
        }
      }
    };
    walk(this.tree, "");

    const pubspecFile = files.find((f) => f.path === "pubspec.yaml");
    const analysisFile = files.find((f) => f.path === "analysis_options.yaml");
    const readmeFile = files.find(
      (f) => f.name.toUpperCase() === "README.MD" || f.path === "README.md"
    );

    const pubspec = pubspecFile ? parsePubspec(pubspecFile.content) : null;
    const analysisOptions = analysisFile ? parseAnalysisOptions(analysisFile.content) : null;
    const platforms = detectPlatforms(folders);
    const docs = files.filter((f) => f.path.startsWith("docs/") || f.extension === "md");

    // Collect declared assets from pubspec.
    if (pubspec?.flutter?.assets) {
      assets.push(...pubspec.flutter.assets);
    }

    return {
      root: ".",
      files,
      folders,
      pubspec,
      analysisOptions,
      platforms,
      readme: readmeFile?.content ?? null,
      docs,
      assets,
    };
  }

  async rescanFile(path: WorkspacePath): Promise<ScannedFile | null> {
    const find = (nodes: ProjectFileNode[]): ProjectFileNode | undefined => {
      for (const n of nodes) {
        if (n.path === path && n.type === "file") return n;
        if (n.children) {
          const f = find(n.children);
          if (f) return f;
        }
      }
      return undefined;
    };
    const node = find(this.tree);
    if (!node || node.content === undefined) return null;
    return {
      path: node.path,
      name: node.name,
      extension: this.ext(node.name),
      content: node.content,
      size: node.content.length,
      lines: node.content.split("\n").length,
    };
  }

  private ext(name: string): string {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx + 1) : "";
  }
}

/** Parse a pubspec.yaml content string into a PubspecInfo. */
export function parsePubspec(content: string): PubspecInfo | null {
  try {
    // Lightweight YAML parse — pubspec is simple enough for line-based parsing.
    const info: PubspecInfo = { name: "", description: "", version: "", dependencies: {}, devDependencies: {} };
    let section: "root" | "dependencies" | "dev_dependencies" | "environment" | "flutter" | null = "root";
    let flutterSub: "fonts" | "assets" | null = null;

    for (const rawLine of content.split("\n")) {
      const line = rawLine.replace(/\r$/, "");
      if (!line.trim() || line.trim().startsWith("#")) continue;

      const indent = line.length - line.trimStart().length;

      // Top-level keys (indent 0).
      if (indent === 0) {
        section = "root";
        flutterSub = null;
        const match = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          if (key === "dependencies") section = "dependencies";
          else if (key === "dev_dependencies") section = "dev_dependencies";
          else if (key === "environment") section = "environment";
          else if (key === "flutter") section = "flutter";
          else if (key === "name") info.name = value.trim();
          else if (key === "description") info.description = value.trim().replace(/^['"]|['"]$/g, "");
          else if (key === "version") info.version = value.trim();
        }
        continue;
      }

      // environment section
      if (section === "environment") {
        const match = line.trim().match(/^([a-zA-Z_]+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          info.environment = info.environment ?? {};
          if (key === "sdk") info.environment.sdk = value.trim().replace(/^['"]|['"]$/g, "");
          if (key === "flutter") info.environment.flutter = value.trim().replace(/^['"]|['"]$/g, "");
        }
        continue;
      }

      // dependencies / dev_dependencies
      if (section === "dependencies" || section === "dev_dependencies") {
        const match = line.trim().match(/^([a-zA-Z0-9_]+):\s*(.+)$/);
        if (match) {
          const [, name, value] = match;
          const target = section === "dependencies" ? info.dependencies : info.devDependencies;
          target[name] = value.trim();
        }
        continue;
      }

      // flutter section
      if (section === "flutter") {
        const trimmed = line.trim();
        if (indent <= 2) flutterSub = null;
        if (trimmed.startsWith("uses-material-design:")) {
          info.flutter = info.flutter ?? {};
          info.flutter.usesMaterialDesign = trimmed.split(":")[1]?.trim() === "true";
        } else if (trimmed.startsWith("assets:")) {
          flutterSub = "assets";
          info.flutter = info.flutter ?? {};
          info.flutter.assets = info.flutter.assets ?? [];
        } else if (flutterSub === "assets" && trimmed.startsWith("-")) {
          info.flutter!.assets!.push(trimmed.slice(1).trim().replace(/^['"]|['"]$/g, ""));
        }
        continue;
      }
    }
    return info.name ? info : null;
  } catch {
    return null;
  }
}

/** Parse analysis_options.yaml content. */
export function parseAnalysisOptions(content: string): AnalysisOptionsInfo | null {
  try {
    const info: AnalysisOptionsInfo = { dependencies: {} as never, devDependencies: {} as never } as unknown as AnalysisOptionsInfo;
    const result: AnalysisOptionsInfo = { include: undefined, linter: { rules: [] }, analyzer: { exclude: [] } };
    let section: "root" | "linter" | "analyzer" | null = "root";

    for (const rawLine of content.split("\n")) {
      const line = rawLine.replace(/\r$/, "");
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const indent = line.length - line.trimStart().length;
      const trimmed = line.trim();

      if (indent === 0) {
        section = "root";
        if (trimmed.startsWith("include:")) {
          result.include = trimmed.split(":")[1]?.trim().replace(/^['"]|['"]$/g, "");
        } else if (trimmed.startsWith("linter:")) section = "linter";
        else if (trimmed.startsWith("analyzer:")) section = "analyzer";
        continue;
      }

      if (section === "linter" && trimmed.startsWith("rules:")) {
        continue;
      }
      if (section === "linter" && trimmed.startsWith("-")) {
        result.linter!.rules!.push(trimmed.slice(1).trim());
        continue;
      }
      if (section === "analyzer" && trimmed.startsWith("exclude:")) {
        continue;
      }
      if (section === "analyzer" && trimmed.startsWith("-")) {
        result.analyzer!.exclude!.push(trimmed.slice(1).trim().replace(/^['"]|['"]$/g, ""));
        continue;
      }
    }
    void info; // satisfy linter
    return result;
  } catch {
    return null;
  }
}

/** Detect platform folders from the scanned folder list. */
export function detectPlatforms(folders: WorkspacePath[]): PlatformPresence {
  return {
    android: folders.some((f) => f === "android" || f.startsWith("android/")),
    ios: folders.some((f) => f === "ios" || f.startsWith("ios/")),
    web: folders.some((f) => f === "web" || f.startsWith("web/")),
    windows: folders.some((f) => f === "windows" || f.startsWith("windows/")),
    linux: folders.some((f) => f === "linux" || f.startsWith("linux/")),
    macos: folders.some((f) => f === "macos" || f.startsWith("macos/")),
  };
}

/** Singleton scanner instance. */
export const scanner = new InMemoryScanner();
