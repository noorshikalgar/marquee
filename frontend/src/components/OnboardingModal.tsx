import { Clapperboard } from "lucide-react";
import { createPortal } from "react-dom";
import { CountryPicker } from "./CountryPicker";
import { ThemePicker } from "./ThemePicker";
import { useOnboarding } from "../hooks/useOnboarding";

export function OnboardingModal() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  if (!showOnboarding) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-hairline/10 bg-base-900 p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <Clapperboard className="h-9 w-9 text-amber-400" />
          <h1 className="text-lg font-semibold text-slate-100">Welcome to Marquee</h1>
          <p className="text-sm text-slate-400">Let's set a couple of quick preferences — you can change these anytime in Settings.</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Pick a look</p>
          <ThemePicker />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Preferred country</p>
          <p className="text-xs text-slate-500">We'll surface more movies and shows from here on your Browse page.</p>
          <CountryPicker />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={completeOnboarding} className="text-sm text-slate-500 hover:text-slate-300">
            Skip for now
          </button>
          <button
            type="button"
            onClick={completeOnboarding}
            className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300"
          >
            Get started
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
