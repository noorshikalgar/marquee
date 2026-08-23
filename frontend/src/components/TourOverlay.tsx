import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOnboarding } from "../hooks/useOnboarding";

interface Step {
  selector: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { selector: '[data-tour="nav-browse"]', title: "Browse", description: "Trending titles and picks based on your taste, right on the landing page." },
  { selector: '[data-tour="nav-ai-search"]', title: "AI Search", description: "Describe what you want in plain English — \"crime series from Japan\" — and let AI find it." },
  { selector: '[data-tour="nav-my"]', title: "My", description: "Your Liked titles, Watchlist, and AI-curated For You picks all live here." },
];

export function TourOverlay() {
  const { showTour, completeTour } = useOnboarding();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 640);
  }, []);

  useEffect(() => {
    if (!showTour || !isDesktop) return;
    function updateRect() {
      const el = document.querySelector(STEPS[step].selector);
      setRect(el?.getBoundingClientRect() ?? null);
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [showTour, isDesktop, step]);

  if (!showTour) return null;
  if (!isDesktop) {
    completeTour();
    return null;
  }
  if (!rect) return null;

  const current = STEPS[step];
  const tooltipTop = rect.bottom + 12;
  const tooltipLeft = Math.min(Math.max(rect.left, 16), window.innerWidth - 300);

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else completeTour();
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute rounded-lg transition-all duration-300"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
        }}
      />
      <div
        className="absolute w-72 space-y-2 rounded-xl border border-hairline/10 bg-base-900 p-4 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <p className="text-xs font-medium text-amber-400">
          {step + 1} of {STEPS.length}
        </p>
        <p className="text-sm font-semibold text-slate-100">{current.title}</p>
        <p className="text-sm text-slate-400">{current.description}</p>
        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={completeTour} className="text-xs text-slate-500 hover:text-slate-300">
            Skip tour
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-accent-ink transition hover:bg-amber-300"
          >
            {step < STEPS.length - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
