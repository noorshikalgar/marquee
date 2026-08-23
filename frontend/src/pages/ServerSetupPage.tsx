import { Clapperboard, Loader2, Plus, Server, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { addServer, listServers, removeServer, setActiveServer, testServerUrl, type SavedServer } from "../lib/serverConfig";

export function ServerSetupPage({ onConnected }: { onConnected: () => void }) {
  const [servers, setServers] = useState<SavedServer[]>(listServers());
  const [adding, setAdding] = useState(servers.length === 0);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function connect(server: SavedServer) {
    setError(null);
    setBusyId(server.id);
    const ok = await testServerUrl(server.url);
    setBusyId(null);
    if (!ok) {
      setError(`Couldn't reach "${server.name}". Check it's running and reachable.`);
      return;
    }
    setActiveServer(server.id);
    onConnected();
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return;
    setBusyId("new");
    const ok = await testServerUrl(url);
    setBusyId(null);
    if (!ok) {
      setError("Couldn't reach that server. Check the address and that it's running.");
      return;
    }
    const server = addServer(name, url);
    setServers(listServers());
    setName("");
    setUrl("");
    setAdding(false);
    await connect(server);
  }

  function handleRemove(id: string) {
    removeServer(id);
    setServers(listServers());
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Clapperboard className="h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-semibold text-slate-100">
            {servers.length === 0 ? "Connect to your server" : "Select a server"}
          </h1>
          <p className="text-sm text-slate-500">
            {servers.length === 0
              ? "Marquee's desktop app needs the address of your self-hosted Marquee server."
              : "Choose a server, or add another one."}
          </p>
        </div>

        {servers.length > 0 && (
          <div className="space-y-2">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-xl border border-hairline/10 bg-base-900 p-3"
              >
                <button
                  type="button"
                  onClick={() => connect(s)}
                  disabled={busyId === s.id}
                  className="flex flex-1 items-center gap-3 text-left disabled:opacity-50"
                >
                  <Server className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-100">{s.name}</span>
                    <span className="block truncate text-xs text-slate-500">{s.url}</span>
                  </span>
                  {busyId === s.id && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  title="Remove server"
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-950/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}

        {adding || servers.length === 0 ? (
          <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-hairline/10 bg-base-900 p-6">
            <div className="space-y-1.5">
              <label htmlFor="server-name" className="text-sm font-medium text-slate-300">
                Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="server-name"
                type="text"
                placeholder="Home server"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="server-url" className="text-sm font-medium text-slate-300">
                Server address
              </label>
              <input
                id="server-url"
                type="text"
                placeholder="https://marquee.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div className="flex gap-2">
              {servers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-base-700"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={busyId === "new"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
              >
                {busyId === "new" && <Loader2 className="h-4 w-4 animate-spin" />}
                {busyId === "new" ? "Checking…" : "Add server"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700"
          >
            <Plus className="h-4 w-4" />
            Add another server
          </button>
        )}
      </div>
    </div>
  );
}
