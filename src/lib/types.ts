/**
 * Shared domain types. These mirror the future database schema and are the
 * contract between UI, stores, and API layers. Centralizing them keeps the
 * feature modules decoupled from each other.
 */

export type ID = string;
export type ISODate = string;

export type ThemeMode = "light" | "dark" | "system";
export type EditorTheme = "forge-dark" | "forge-light" | "vs-dark" | "light";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  plan: "free" | "pro" | "team";
  createdAt: ISODate;
}

export type ProjectStatus = "draft" | "active" | "building" | "archived";

export interface Project {
  id: ID;
  name: string;
  description: string;
  framework: string;
  status: ProjectStatus;
  favorite: boolean;
  color: string;
  lastOpenedAt: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  filesCount: number;
  collaborators: number;
}

export interface ProjectFileNode {
  id: ID;
  name: string;
  type: "file" | "folder";
  path: string;
  language?: string;
  content?: string;
  children?: ProjectFileNode[];
  expanded?: boolean;
}

export interface EditorTab {
  id: ID;
  fileId: ID;
  name: string;
  path: string;
  language: string;
  content: string;
  originalContent: string;
  dirty: boolean;
  active: boolean;
}

export interface ActivityEvent {
  id: ID;
  type: "created" | "edited" | "built" | "shared" | "deleted" | "previewed";
  message: string;
  projectId?: ID;
  projectName?: string;
  timestamp: ISODate;
}

export interface ChatSession {
  id: ID;
  title: string;
  createdAt: ISODate;
  messageCount: number;
}

export interface ChatMessage {
  id: ID;
  sessionId: ID;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: ISODate;
}

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  fontSize: number;
  editorTheme: EditorTheme;
  autoSave: boolean;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface ApiHealth {
  status: "ok" | "degraded" | "down";
  version: string;
  uptime: number;
  timestamp: ISODate;
  services: Record<string, "ok" | "degraded" | "down">;
}
