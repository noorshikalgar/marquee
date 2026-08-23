import { Download } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";

export function InstallPrompt() {
  const { canInstall, installed, promptInstall } = usePwaInstall();

  if (installed) {
    return <p className="text-sm text-emerald-400">Marquee is installed on this device.</p>;
  }

  if (!canInstall) {
    return (
      <p className="text-sm text-slate-500">
        Your browser will offer an install option once you've used the app a bit — or use its menu's "Install app" /
        "Add to Home Screen" action.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => promptInstall()}
      className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300"
    >
      <Download className="h-4 w-4" />
      Install Marquee
    </button>
  );
}
