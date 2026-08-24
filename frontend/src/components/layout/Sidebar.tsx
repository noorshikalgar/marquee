import {
  Bookmark,
  CalendarClock,
  Clapperboard,
  Compass,
  Heart,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { NotificationBell } from "../NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  tour?: string;
}

function SidebarLink({ to, label, icon: Icon, end, tour }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      data-tour={tour}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive ? "bg-base-800 text-amber-400" : "text-slate-400 hover:bg-base-800/60 hover:text-slate-100",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { language, setLanguage, t } = useLanguage();

  const primaryItems: NavItem[] = [
    { to: "/", label: t("nav_browse"), icon: Compass, end: true, tour: "nav-browse" },
    { to: "/coming-soon", label: t("nav_comingSoon"), icon: CalendarClock, end: false },
    { to: "/search", label: t("nav_search"), icon: Search, end: false, tour: "nav-ai-search" },
    { to: "/discover", label: t("nav_discover"), icon: SlidersHorizontal, end: false },
  ];

  const myItems: NavItem[] = [
    { to: "/my/liked", label: t("my_liked"), icon: Heart, end: false },
    { to: "/my/watchlist", label: t("nav_watchlist"), icon: Bookmark, end: false },
    { to: "/my/for-you", label: t("nav_forYou"), icon: Sparkles, end: false },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-hairline/5 bg-base-950 sm:flex">
      <NavLink to="/" className="flex shrink-0 items-center gap-2 px-4 py-5 text-lg font-semibold text-slate-100">
        <Clapperboard className="h-6 w-6 shrink-0 text-amber-400" />
        <span className="whitespace-nowrap">Marquee</span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {primaryItems.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        <div data-tour="nav-my" className="mt-4">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{t("nav_my")}</p>
          <div className="flex flex-col gap-0.5">
            {myItems.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-hairline/5 p-3">
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive ? "bg-base-800 text-amber-400" : "text-slate-400 hover:bg-base-800/60 hover:text-slate-100",
            )
          }
        >
          <NotificationBell asIcon />
          {t("nav_notifications")}
        </NavLink>
        <SidebarLink to="/settings" label={t("nav_settings")} icon={Settings} end={false} />
        <div className="flex items-center rounded-lg bg-base-800 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={clsx(
              "flex-1 rounded-md px-2 py-1 transition",
              language === "en" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={clsx(
              "flex-1 rounded-md px-2 py-1 transition",
              language === "hi" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
            )}
          >
            हि
          </button>
        </div>
      </div>
    </aside>
  );
}
