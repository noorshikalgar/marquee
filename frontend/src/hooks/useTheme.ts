import { useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useSettings, useUpdateSettings } from "./useSettings";

export const THEMES = [
  { id: "midnight", label: "Midnight", mode: "dark" },
  { id: "slate", label: "Slate", mode: "dark" },
  { id: "crimson", label: "Crimson", mode: "dark" },
  { id: "daylight", label: "Daylight", mode: "light" },
  { id: "ocean", label: "Ocean", mode: "light" },
  { id: "paper", label: "Paper", mode: "light" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const DEFAULT_THEME: ThemeId = "midnight";

export function useThemeSync() {
  const { user } = useAuth();
  const { data: settings } = useSettings({ enabled: !!user });
  const theme = (settings?.theme as ThemeId | undefined) ?? DEFAULT_THEME;

  useEffect(() => {
    if (!user) return;
    document.documentElement.dataset.theme = theme;
  }, [user, theme]);
}

export function useThemePreference() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const theme = (settings?.theme as ThemeId | undefined) ?? DEFAULT_THEME;

  function setTheme(next: ThemeId) {
    updateSettings.mutate({ theme: next });
  }

  return { theme, setTheme };
}
