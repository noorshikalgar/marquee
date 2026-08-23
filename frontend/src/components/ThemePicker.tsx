import clsx from "clsx";
import { THEMES, useThemePreference } from "../hooks/useTheme";

export function ThemePicker() {
  const { theme, setTheme } = useThemePreference();

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {THEMES.map((opt) => (
        <button
          key={opt.id}
          type="button"
          data-theme={opt.id}
          onClick={() => setTheme(opt.id)}
          className={clsx(
            "flex flex-col items-center gap-1.5 rounded-lg bg-base-900 p-2 ring-1 ring-hairline/10 transition",
            theme === opt.id && "ring-2 ring-[#fbbf24]",
          )}
        >
          <span className="flex h-6 w-full overflow-hidden rounded-md ring-1 ring-hairline/20">
            <span className="w-1/2 bg-base-950" />
            <span className="w-1/4 bg-base-700" />
            <span className="w-1/4 bg-amber-400" />
          </span>
          <span className="text-[11px] font-medium text-slate-300">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
