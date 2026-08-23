import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
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
      navigate(fallbackTo);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("common_back")}
      className={clsx(
        "flex items-center gap-1.5 rounded-full text-sm font-medium transition",
        overlay
          ? "bg-base-950/60 px-3 py-2 text-slate-100 ring-1 ring-hairline/10 backdrop-blur-sm hover:bg-base-950/80"
          : "px-1 py-1 text-slate-400 hover:text-slate-100",
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{t("common_back")}</span>
    </button>
  );
}
