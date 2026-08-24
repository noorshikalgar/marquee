import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/i18n/LanguageContext";

export function BackButton({ fallbackTo = "/", overlay = false }: { fallbackTo?: string; overlay?: boolean }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  function handleClick() {
    // history.state.idx is set by react-router's history package; 0 means this
    // is the first entry in the stack (e.g. a deep link), so there's nothing to pop back to.
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackTo, { viewTransition: true });
    }
  }

  if (overlay) {
    // Sits on a photo backdrop, whose contrast needs are independent of the
    // app's light/dark theme — a fixed dark-glass treatment stays legible over
    // any image, unlike themed colors which would invert per theme.
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={t("common_back")}
        title={t("common_back")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/60 hover:ring-white/25"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("common_back")}
      className="flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-medium text-slate-400 transition hover:text-slate-100"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{t("common_back")}</span>
    </button>
  );
}
