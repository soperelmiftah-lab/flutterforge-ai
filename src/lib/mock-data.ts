import type {
  ActivityEvent,
  Project,
  ProjectFileNode,
  ChatSession,
} from "@/lib/types";

/**
 * Mock data layer. In production these come from the API + database; for
 * phase 1 we keep a single in-memory dataset so the UI is fully interactive
 * without a backend. The Zustand stores hydrate from this file.
 */

export const mockProjects: Project[] = [
  {
    id: "prj_forge_demo",
    name: "Forge Demo",
    description: "A showcase Flutter app demonstrating FlutterForge workflows.",
    framework: "Flutter 3.22",
    status: "active",
    favorite: true,
    color: "emerald",
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    filesCount: 42,
    collaborators: 2,
  },
  {
    id: "prj_pocket_budget",
    name: "Pocket Budget",
    description: "Personal finance tracker with charts and budgets.",
    framework: "Flutter 3.19",
    status: "active",
    favorite: false,
    color: "violet",
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    filesCount: 67,
    collaborators: 1,
  },
  {
    id: "prj_weatherly",
    name: "Weatherly",
    description: "Beautiful weather app with animated backgrounds.",
    framework: "Flutter 3.22",
    status: "draft",
    favorite: false,
    color: "cyan",
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    filesCount: 18,
    collaborators: 1,
  },
  {
    id: "prj_recipebox",
    name: "RecipeBox",
    description: "Save and discover recipes with a clean Material 3 UI.",
    framework: "Flutter 3.19",
    status: "archived",
    favorite: false,
    color: "amber",
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    filesCount: 31,
    collaborators: 1,
  },
  {
    id: "prj_fitness_flow",
    name: "Fitness Flow",
    description: "Workout tracker with timers and progress analytics.",
    framework: "Flutter 3.22",
    status: "building",
    favorite: true,
    color: "rose",
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    filesCount: 54,
    collaborators: 3,
  },
];

const sampleDart = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/home/home_screen.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: ForgeDemoApp()));
}

class ForgeDemoApp extends ConsumerWidget {
  const ForgeDemoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Forge Demo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      home: const HomeScreen(),
    );
  }
}
`;

const sampleHome = `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forge Demo')),
      body: const Center(
        child: Text('Welcome to FlutterForge AI'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }
}
`;

const sampleTheme = `import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF10B981),
        brightness: Brightness.light,
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF10B981),
        brightness: Brightness.dark,
      );
}
`;

const samplePubspec = `name: forge_demo
description: A showcase Flutter app built with FlutterForge AI.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  cupertino_icons: ^1.0.8

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
`;

const sampleReadme = `# Forge Demo

A showcase Flutter app demonstrating FlutterForge AI workflows.

## Getting Started

This project is managed inside FlutterForge AI. Open the workspace to edit files,
preview changes, and (coming soon) build APKs.

## Features

- Material 3 theming
- Riverpod state management
- Clean feature-first architecture
`;

export const mockFileTree: ProjectFileNode[] = [
  {
    id: "dir_lib",
    name: "lib",
    type: "folder",
    path: "lib",
    expanded: true,
    children: [
      {
        id: "dir_features",
        name: "features",
        type: "folder",
        path: "lib/features",
        expanded: true,
        children: [
          {
            id: "dir_home",
            name: "home",
            type: "folder",
            path: "lib/features/home",
            expanded: false,
            children: [
              {
                id: "file_home_screen",
                name: "home_screen.dart",
                type: "file",
                path: "lib/features/home/home_screen.dart",
                language: "dart",
                content: sampleHome,
              },
            ],
          },
        ],
      },
      {
        id: "dir_core",
        name: "core",
        type: "folder",
        path: "lib/core",
        expanded: true,
        children: [
          {
            id: "dir_theme",
            name: "theme",
            type: "folder",
            path: "lib/core/theme",
            expanded: false,
            children: [
              {
                id: "file_app_theme",
                name: "app_theme.dart",
                type: "file",
                path: "lib/core/theme/app_theme.dart",
                language: "dart",
                content: sampleTheme,
              },
            ],
          },
        ],
      },
      {
        id: "file_main",
        name: "main.dart",
        type: "file",
        path: "lib/main.dart",
        language: "dart",
        content: sampleDart,
      },
    ],
  },
  {
    id: "dir_test",
    name: "test",
    type: "folder",
    path: "test",
    expanded: false,
    children: [
      {
        id: "file_widget_test",
        name: "widget_test.dart",
        type: "file",
        path: "test/widget_test.dart",
        language: "dart",
        content: "// TODO: add widget tests",
      },
    ],
  },
  {
    id: "file_pubspec",
    name: "pubspec.yaml",
    type: "file",
    path: "pubspec.yaml",
    language: "yaml",
    content: samplePubspec,
  },
  {
    id: "file_readme",
    name: "README.md",
    type: "file",
    path: "README.md",
    language: "markdown",
    content: sampleReadme,
  },
  {
    id: "file_analysis",
    name: "analysis_options.yaml",
    type: "file",
    path: "analysis_options.yaml",
    language: "yaml",
    content: "include: package:flutter_lints/flutter.yaml\n",
  },
];

export const mockActivity: ActivityEvent[] = [
  {
    id: "act_1",
    type: "edited",
    message: "Edited main.dart",
    projectId: "prj_forge_demo",
    projectName: "Forge Demo",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "act_2",
    type: "previewed",
    message: "Previewed HomeScreen",
    projectId: "prj_forge_demo",
    projectName: "Forge Demo",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "act_3",
    type: "created",
    message: "Created project Fitness Flow",
    projectId: "prj_fitness_flow",
    projectName: "Fitness Flow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "act_4",
    type: "built",
    message: "Built APK for Pocket Budget",
    projectId: "prj_pocket_budget",
    projectName: "Pocket Budget",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "act_5",
    type: "shared",
    message: "Shared Weatherly with a collaborator",
    projectId: "prj_weatherly",
    projectName: "Weatherly",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export const mockChatSessions: ChatSession[] = [
  {
    id: "chat_1",
    title: "Implement Riverpod state for counter",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    messageCount: 12,
  },
  {
    id: "chat_2",
    title: "Material 3 color scheme tuning",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    messageCount: 8,
  },
  {
    id: "chat_3",
    title: "Debug null safety migration",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    messageCount: 21,
  },
];
