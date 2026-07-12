export interface FaqItem {
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    question: "What is FlutterForge AI?",
    answer:
      "FlutterForge AI is a browser-based, AI-native development studio specialized for Flutter. It brings together a Monaco-grade editor, an AI coding agent, live preview, and build tooling into a single workspace — designed to grow into a Flutter-focused alternative to Google AI Studio.",
  },
  {
    question: "Do I need to install Flutter on my machine?",
    answer:
      "No. The long-term vision is a fully managed cloud build & preview engine, so you can create, preview, and ship Flutter apps without a local toolchain. Phase 1 ships the workspace foundation; the build engine arrives in later phases.",
  },
  {
    question: "Which AI models will be supported?",
    answer:
      "The architecture is model-agnostic. Future phases add OpenRouter and Ollama routing, plus an MCP (Model Context Protocol) layer so you can bring your own models and tools.",
  },
  {
    question: "Is my code stored in the cloud?",
    answer:
      "Phase 1 keeps everything local-first. Future phases add optional Supabase Storage and GitHub sync — you stay in control of where your data lives.",
  },
  {
    question: "Can I use my own editor instead?",
    answer:
      "FlutterForge is a complete environment, but it's also extensible. A plugin system and MCP support are planned so you can wire external tools and agents into the workspace.",
  },
  {
    question: "What's the current status?",
    answer:
      "Phase 1 delivers the foundation: app shell, Monaco editor, file explorer, project management, settings, and a clean modular architecture ready for the AI, preview, and build engines to come.",
  },
];
