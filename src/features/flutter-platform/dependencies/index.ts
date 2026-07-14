/**
 * @module features/flutter-platform/dependencies
 *
 * Real list of popular Flutter packages, grouped by category. Used by the
 * packages API and the dependency-management UI.
 */

import type { FlutterPackage } from "../types";

/** Curated list of popular Flutter packages. */
export const flutterPackages: FlutterPackage[] = [
  // State management
  { name: "flutter_riverpod", version: "^2.5.1", description: "Reactive caching and dependency-binding framework (Riverpod).", category: "state", isDependency: true, isDevDependency: false, homepage: "https://riverpod.dev", compatible: true },
  { name: "provider", version: "^6.1.2", description: "Inherited widgets made easy (the official simple state solution).", category: "state", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/provider", compatible: true },
  { name: "bloc", version: "^8.1.4", description: "Predictable state management (BLoC pattern).", category: "state", isDependency: true, isDevDependency: false, homepage: "https://bloclibrary.dev", compatible: true },
  { name: "get", version: "^4.6.6", description: "All-in-one: state, routing, dependency injection (GetX).", category: "state", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/get", compatible: true },

  // Networking
  { name: "dio", version: "^5.4.3", description: "Powerful HTTP client with interceptors, FormData, and global config.", category: "network", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/dio", compatible: true },
  { name: "http", version: "^1.2.1", description: "Composable, Future-based HTTP client (official).", category: "network", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/http", compatible: true },
  { name: "retrofit", version: "^4.1.2", description: "Annotation-based HTTP client generator (Dio-based).", category: "network", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/retrofit", compatible: true },

  // Routing
  { name: "go_router", version: "^14.0.2", description: "Declarative routing with deep linking, redirects, and type safety.", category: "routing", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/go_router", compatible: true },
  { name: "auto_route", version: "^7.9.2", description: "Annotation-based routing with code generation.", category: "routing", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/auto_route", compatible: true },

  // Storage
  { name: "shared_preferences", version: "^2.2.3", description: "Simple key-value persistent storage.", category: "storage", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/shared_preferences", compatible: true },
  { name: "hive", version: "^2.2.3", description: "Lightweight, fast, NoSQL database (pure Dart).", category: "storage", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/hive", compatible: true },
  { name: "sqflite", version: "^2.3.3", description: "SQLite plugin for Flutter.", category: "storage", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/sqflite", compatible: true },
  { name: "drift", version: "^2.16.0", description: "Reactive SQLite persistence with a query API.", category: "storage", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/drift", compatible: true },

  // UI
  { name: "flutter_svg", version: "^2.0.10", description: "Render SVG pictures in Flutter.", category: "ui", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/flutter_svg", compatible: true },
  { name: "cached_network_image", version: "^3.3.1", description: "Image widget with caching and placeholders.", category: "ui", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/cached_network_image", compatible: true },
  { name: "shimmer", version: "^3.0.0", description: "Shimmer placeholder effect for loading content.", category: "ui", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/shimmer", compatible: true },
  { name: "google_fonts", version: "^6.2.1", description: "Use Google Fonts in Flutter (HTTP-fetched).", category: "ui", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/google_fonts", compatible: true },

  // Testing
  { name: "flutter_test", version: "any", description: "Testing utilities for Flutter (SDK).", category: "testing", isDependency: false, isDevDependency: true, compatible: true },
  { name: "mocktail", version: "^1.0.3", description: "Mocking library with null-safe, type-safe API.", category: "testing", isDependency: false, isDevDependency: true, homepage: "https://pub.dev/packages/mocktail", compatible: true },
  { name: "integration_test", version: "any", description: "Integration testing for Flutter (SDK).", category: "testing", isDependency: false, isDevDependency: true, compatible: true },

  // Tooling
  { name: "build_runner", version: "^2.4.9", description: "Runs code generators (Dart build system).", category: "tooling", isDependency: false, isDevDependency: true, homepage: "https://pub.dev/packages/build_runner", compatible: true },
  { name: "freezed", version: "^2.5.2", description: "Code generation for immutable classes, unions, deep copy.", category: "tooling", isDependency: false, isDevDependency: true, homepage: "https://pub.dev/packages/freezed", compatible: true },
  { name: "json_serializable", version: "^6.8.0", description: "Generates fromJson / toJson code.", category: "tooling", isDependency: false, isDevDependency: true, homepage: "https://pub.dev/packages/json_serializable", compatible: true },

  // Other
  { name: "intl", version: "^0.19.0", description: "Internationalization and localization (date, number, message).", category: "other", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/intl", compatible: true },
  { name: "logger", version: "^2.3.0", description: "Small, extensible logger with pretty printing.", category: "other", isDependency: true, isDevDependency: false, homepage: "https://pub.dev/packages/logger", compatible: true },
];

/** List packages (optionally filtered by category). */
export function listPackages(category?: FlutterPackage["category"]): FlutterPackage[] {
  return category ? flutterPackages.filter((p) => p.category === category) : flutterPackages;
}

/** Get a package by name. */
export function getPackage(name: string): FlutterPackage | undefined {
  return flutterPackages.find((p) => p.name === name);
}

/** List all package categories. */
export function packageCategories(): FlutterPackage["category"][] {
  return Array.from(new Set(flutterPackages.map((p) => p.category)));
}
