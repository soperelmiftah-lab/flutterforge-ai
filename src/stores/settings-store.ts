import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, EditorTheme, ThemeMode } from "@/lib/types";

/**
 * Settings store — persisted to localStorage. Holds user preferences that
 * affect the whole app (theme, editor config). The UI store consumes
 * `theme` indirectly via next-themes attribute.
 */
interface SettingsState extends AppSettings {
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
  setFontSize: (size: number) => void;
  setEditorTheme: (theme: EditorTheme) => void;
  setAutoSave: (autoSave: boolean) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setMinimap: (minimap: boolean) => void;
  setLineNumbers: (lineNumbers: boolean) => void;
  reset: () => void;
}

export const defaultSettings: AppSettings = {
  theme: "dark",
  language: "en",
  fontSize: 14,
  editorTheme: "forge-dark",
  autoSave: true,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setEditorTheme: (editorTheme) => set({ editorTheme }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      reset: () => set({ ...defaultSettings }),
    }),
    { name: "flutterforge-settings" }
  )
);
