export interface SavedServer {
  id: string;
  name: string;
  url: string;
}

const SERVERS_KEY = "marquee:servers";
const ACTIVE_SERVER_KEY = "marquee:activeServerId";

export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

function defaultUrl(): string {
  // Desktop builds ship with no baked-in server — the user picks one on first
  // launch, possibly from several saved servers (like Jellyfin). Web builds
  // keep the old single-origin behavior.
  if (isDesktop()) return "";
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";
}

export function listServers(): SavedServer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SERVERS_KEY);
    return raw ? (JSON.parse(raw) as SavedServer[]) : [];
  } catch {
    return [];
  }
}

function saveServers(servers: SavedServer[]) {
  window.localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
}

export function addServer(name: string, url: string): SavedServer {
  const normalized = url.trim().replace(/\/+$/, "");
  const server: SavedServer = { id: crypto.randomUUID(), name: name.trim() || normalized, url: normalized };
  saveServers([...listServers(), server]);
  return server;
}

export function removeServer(id: string) {
  saveServers(listServers().filter((s) => s.id !== id));
  if (getActiveServerId() === id) clearActiveServer();
}

export function getActiveServerId(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_SERVER_KEY) : null;
}

export function setActiveServer(id: string) {
  window.localStorage.setItem(ACTIVE_SERVER_KEY, id);
}

export function clearActiveServer() {
  window.localStorage.removeItem(ACTIVE_SERVER_KEY);
}

export function getActiveServer(): SavedServer | undefined {
  const id = getActiveServerId();
  return id ? listServers().find((s) => s.id === id) : undefined;
}

export function getServerUrl(): string {
  const active = getActiveServer();
  if (active) return active.url;
  return defaultUrl();
}

export function hasActiveServer(): boolean {
  return !isDesktop() || !!getActiveServer();
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
