/**
 * @module features/workspace-intelligence/knowledge
 *
 * Flutter Knowledge — recognises Flutter/Dart framework patterns in a
 * project to give the context engine and future agents deeper understanding.
 * Detects state management, routing, widget archetypes, theming, assets,
 * and localization.
 */

import type {
  PubspecInfo,
  StateManagementKind,
  RoutingKind,
  SymbolRef,
} from "@/features/workspace-intelligence/types";

/** Detect the state management approach from pubspec deps. */
export function detectStateManagement(pubspec: PubspecInfo | null): StateManagementKind {
  if (!pubspec) return "none";
  const deps = { ...pubspec.dependencies, ...pubspec.devDependencies };
  if (deps["flutter_riverpod"] || deps["hooks_riverpod"] || deps["riverpod"]) return "riverpod";
  if (deps["flutter_bloc"] || deps["bloc"]) return "bloc";
  if (deps["cubit"]) return "cubit";
  if (deps["provider"]) return "provider";
  if (deps["get"]) return "getx";
  return "none";
}

/** Detect the routing approach from pubspec deps. */
export function detectRouting(pubspec: PubspecInfo | null): RoutingKind {
  if (!pubspec) return "none";
  const deps = { ...pubspec.dependencies, ...pubspec.devDependencies };
  if (deps["go_router"]) return "go_router";
  if (deps["auto_route"]) return "auto_route";
  return "navigator";
}

/** Whether a symbol is a Flutter widget. */
export function isWidgetSymbol(s: SymbolRef): boolean {
  return s.kind === "widget" || s.widgetArchetype !== undefined;
}

/** Whether a symbol is a Riverpod provider. */
export function isProviderSymbol(s: SymbolRef): boolean {
  return s.kind === "provider" || /^(provider|ref|notifier|asyncNotifier)/i.test(s.name);
}

/** Group symbols by kind for statistics. */
export function groupSymbolsByKind(symbols: SymbolRef[]): Record<string, SymbolRef[]> {
  const groups: Record<string, SymbolRef[]> = {};
  for (const s of symbols) {
    if (!groups[s.kind]) groups[s.kind] = [];
    groups[s.kind].push(s);
  }
  return groups;
}

/** Categorise a Flutter dependency (widget lib, state mgmt, routing, etc.). */
export type DependencyCategory =
  | "flutter-sdk"
  | "state-management"
  | "routing"
  | "networking"
  | "storage"
  | "ui"
  | "testing"
  | "tooling"
  | "other";

const DEP_CATEGORIES: Record<string, DependencyCategory> = {
  flutter: "flutter-sdk",
  cupertino_icons: "flutter-sdk",
  "flutter_riverpod": "state-management",
  "hooks_riverpod": "state-management",
  riverpod: "state-management",
  "flutter_bloc": "state-management",
  bloc: "state-management",
  cubit: "state-management",
  provider: "state-management",
  get: "state-management",
  "go_router": "routing",
  "auto_route": "routing",
  dio: "networking",
  http: "networking",
  retrofit: "networking",
  hive: "storage",
  sqflite: "storage",
  drift: "storage",
  "shared_preferences": "storage",
  "flutter_secure_storage": "storage",
  "google_fonts": "ui",
  "flutter_svg": "ui",
  "cached_network_image": "ui",
  "flutter_test": "testing",
  "mocktail": "testing",
  "mockito": "testing",
  "build_runner": "tooling",
  "freezed": "tooling",
  "json_serializable": "tooling",
};

/** Categorise a dependency. */
export function categoriseDependency(name: string): DependencyCategory {
  return DEP_CATEGORIES[name] ?? "other";
}

/** Human-readable label for a dependency category. */
export const DEP_CATEGORY_LABELS: Record<DependencyCategory, string> = {
  "flutter-sdk": "Flutter SDK",
  "state-management": "State Management",
  routing: "Routing",
  networking: "Networking",
  storage: "Storage",
  ui: "UI",
  testing: "Testing",
  tooling: "Tooling",
  other: "Other",
};

/** Detect Flutter expertise cues from symbols. */
export interface FlutterExpertiseSummary {
  widgetCount: number;
  statelessCount: number;
  statefulCount: number;
  consumerCount: number;
  providerCount: number;
  serviceCount: number;
  repositoryCount: number;
  routeCount: number;
  modelCount: number;
  themeCount: number;
  enumCount: number;
  mixinCount: number;
  extensionCount: number;
}

/** Summarise Flutter expertise from symbols. */
export function summariseExpertise(symbols: SymbolRef[]): FlutterExpertiseSummary {
  const summary: FlutterExpertiseSummary = {
    widgetCount: 0,
    statelessCount: 0,
    statefulCount: 0,
    consumerCount: 0,
    providerCount: 0,
    serviceCount: 0,
    repositoryCount: 0,
    routeCount: 0,
    modelCount: 0,
    themeCount: 0,
    enumCount: 0,
    mixinCount: 0,
    extensionCount: 0,
  };
  for (const s of symbols) {
    switch (s.kind) {
      case "widget":
        summary.widgetCount++;
        if (s.widgetArchetype === "StatelessWidget") summary.statelessCount++;
        if (s.widgetArchetype === "StatefulWidget") summary.statefulCount++;
        if (s.widgetArchetype === "ConsumerWidget" || s.widgetArchetype === "ConsumerStatefulWidget") summary.consumerCount++;
        break;
      case "provider": summary.providerCount++; break;
      case "service": summary.serviceCount++; break;
      case "repository": summary.repositoryCount++; break;
      case "route": summary.routeCount++; break;
      case "model": summary.modelCount++; break;
      case "theme": summary.themeCount++; break;
      case "enum": summary.enumCount++; break;
      case "mixin": summary.mixinCount++; break;
      case "extension": summary.extensionCount++; break;
    }
  }
  return summary;
}
