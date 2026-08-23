import { Clapperboard, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { setServerUrl, testServerUrl } from "../lib/serverConfig";

export function ServerSetupPage({ onConnected }: { onConnected: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return;
    setTesting(true);
    const ok = await testServerUrl(url);
    setTesting(false);
    if (!ok) {
      setError("Couldn't reach that server. Check the address and that it's running.");
      return;
    }
    setServerUrl(url);
    onConnected();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Clapperboard className="h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-semibold text-slate-100">Connect to your server</h1>
          <p className="text-sm text-slate-500">
            Marquee's desktop app needs the address of your self-hosted Marquee server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline/10 bg-base-900 p-6">
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

          {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={testing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
          >
            {testing && <Loader2 className="h-4 w-4 animate-spin" />}
            {testing ? "Checking…" : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
