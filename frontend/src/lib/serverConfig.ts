const STORAGE_KEY = "marquee:serverUrl";

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

function defaultUrl(): string {
  // Desktop builds ship with no baked-in server — the user points it at their
  // own self-hosted instance on first launch. Web builds keep the old behavior.
  if (isDesktop()) return "";
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";
}

export function getServerUrl(): string {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (stored) return stored;
  return defaultUrl();
}

export function hasServerUrl(): boolean {
  return getServerUrl().length > 0;
}

export function setServerUrl(url: string) {
  const normalized = url.trim().replace(/\/+$/, "");
  window.localStorage.setItem(STORAGE_KEY, normalized);
}

export function clearServerUrl() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function testServerUrl(url: string): Promise<boolean> {
  const normalized = url.trim().replace(/\/+$/, "");
  try {
    const res = await fetch(`${normalized}/api/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
