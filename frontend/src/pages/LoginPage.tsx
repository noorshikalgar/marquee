import { Clapperboard } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/apiClient";
import { useAuth } from "../lib/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Clapperboard className="h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-semibold text-slate-100">Marquee</h1>
          <p className="text-sm text-slate-500">Sign in to see your picks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline/5 bg-base-900 p-6">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-slate-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
