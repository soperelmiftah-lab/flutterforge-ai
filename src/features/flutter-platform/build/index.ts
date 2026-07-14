/**
 * @module features/flutter-platform/build
 *
 * Build-readiness checks — runs a series of static checks against the
 * virtual filesystem (via the Execution Engine's VFS) to determine whether
 * the project is ready to be built with `flutter build`.
 */

import { vfs } from "@/features/execution/filesystem";
import type { WorkspacePath } from "@/features/workspace-intelligence/types";
import type { BuildReadiness, BuildReadinessCheck } from "../types";

/** Check the workspace for build readiness. */
export function checkBuildReadiness(rootPath: WorkspacePath = "."): BuildReadiness {
  const checks: BuildReadinessCheck[] = [];

  // Strip a leading "./" so paths match the VFS convention (e.g. "pubspec.yaml"
  // rather than "./pubspec.yaml").
  const base = rootPath === "." ? "" : rootPath.replace(/\/$/, "") + "/";
  const pubspecPath = `${base}pubspec.yaml`;
  const mainPath = `${base}lib/main.dart`;
  const analysisPath = `${base}analysis_options.yaml`;

  // 1. pubspec.yaml exists
  const pubspec = vfs.readFile(pubspecPath);
  checks.push({
    id: "pubspec",
    label: "pubspec.yaml exists",
    status: pubspec !== null ? "pass" : "fail",
    message: pubspec !== null ? "Found" : "Missing — required for every Flutter project.",
  });

  // 2. lib/main.dart exists
  const mainDart = vfs.readFile(mainPath);
  checks.push({
    id: "main",
    label: "lib/main.dart exists",
    status: mainDart !== null ? "pass" : "fail",
    message: mainDart !== null ? "Found" : "Missing — the entry point of every Flutter app.",
  });

  // 3. analysis_options.yaml exists (recommended)
  const analysisOpts = vfs.readFile(analysisPath);
  checks.push({
    id: "analysis-options",
    label: "analysis_options.yaml exists",
    status: analysisOpts !== null ? "pass" : "warning",
    message: analysisOpts !== null ? "Found" : "Recommended — enables lints and code style checks.",
  });

  // 4. main.dart has a main() function
  let mainHasMainFn = false;
  if (mainDart) {
    mainHasMainFn = /\bvoid\s+main\s*\(/.test(mainDart);
  }
  checks.push({
    id: "main-fn",
    label: "main.dart has a main() function",
    status: mainHasMainFn ? "pass" : "fail",
    message: mainHasMainFn
      ? "Found main()"
      : "main.dart must declare a top-level `void main()` function.",
  });

  // 5. main.dart has a runApp() call
  let mainHasRunApp = false;
  if (mainDart) {
    mainHasRunApp = /\brunApp\s*\(/.test(mainDart);
  }
  checks.push({
    id: "runapp",
    label: "main.dart calls runApp()",
    status: mainHasRunApp ? "pass" : "fail",
    message: mainHasRunApp ? "Found runApp()" : "main() must call runApp() with the root widget.",
  });

  // 6. pubspec has a name + environment
  let pubspecHasName = false;
  let pubspecHasSdk = false;
  if (pubspec) {
    pubspecHasName = /^name:\s*\S+/m.test(pubspec);
    pubspecHasSdk = /environment:\s*\n\s*sdk:/m.test(pubspec);
  }
  checks.push({
    id: "pubspec-name",
    label: "pubspec.yaml declares a name",
    status: pubspecHasName ? "pass" : "warning",
    message: pubspecHasName ? "Found" : "Add a `name:` field to pubspec.yaml.",
  });
  checks.push({
    id: "pubspec-sdk",
    label: "pubspec.yaml pins Dart SDK",
    status: pubspecHasSdk ? "pass" : "warning",
    message: pubspecHasSdk ? "Found" : "Add `environment: sdk: '>=3.0.0 <4.0.0'` to pin the SDK.",
  });

  const blockers = checks.filter((c) => c.status === "fail").map((c) => c.label);
  const score = Math.round(
    (checks.reduce((sum, c) => sum + (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0), 0) /
      checks.length) *
      100
  );

  return {
    checks,
    ready: blockers.length === 0,
    score,
    blockers,
  };
}

// Re-export the placeholder for backward compat.
export const buildInfo = { name: "build", description: "Flutter build module" };
