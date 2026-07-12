/**
 * Global site configuration. Single source of truth for branding/metadata.
 */
export const siteConfig = {
  name: "FlutterForge AI",
  shortName: "FlutterForge",
  tagline: "The AI-native studio for building Flutter apps in your browser.",
  description:
    "Create, edit, debug, preview, and build Flutter applications with AI assistance — entirely from the browser.",
  url: "https://flutterforge.ai",
  keywords: [
    "Flutter",
    "Dart",
    "AI IDE",
    "Flutter Studio",
    "AI Coding",
    "FlutterForge",
    "Web IDE",
    "Code Editor",
  ],
  version: "0.1.0",
  apiVersion: "v1",
  links: {
    github: "https://github.com/flutterforge-ai",
    discord: "https://discord.gg/flutterforge",
    docs: "/docs",
  },
} as const;

export type SiteConfig = typeof siteConfig;
