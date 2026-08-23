import {
  Bookmark,
  CalendarClock,
  ChevronDown,
  Clapperboard,
  Compass,
  Heart,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { NotificationBell } from "../NotificationBell";
import { MobileNavDrawer } from "./MobileNavDrawer";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  tour?: string;
}

function MyNavDropdown({ myItems }: { myItems: NavItem[] }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = location.pathname.startsWith("/my");

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative" data-tour="nav-my">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t("nav_my")}
        className={clsx(
          "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition sm:px-3",
          isActive ? "bg-base-800 text-amber-400" : "text-slate-400 hover:text-slate-100",
        )}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{t("nav_my")}</span>
        <ChevronDown className={clsx("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-hairline/10 bg-base-900 py-1 shadow-xl">
          {myItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive: linkActive }) =>
                clsx(
                  "flex items-center gap-2 px-3 py-2 text-sm transition",
                  linkActive ? "bg-base-800 text-amber-400" : "text-slate-300 hover:bg-base-800/60",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavBar() {
  const { language, setLanguage, t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <header className="sticky top-0 z-20 border-b border-hairline/5 bg-base-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-slate-100">
          <Clapperboard className="h-6 w-6 shrink-0 text-amber-400" />
          <span className="whitespace-nowrap">Marquee</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 sm:flex sm:gap-1">
          {primaryItems.map(({ to, label, icon: Icon, end, tour }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              data-tour={tour}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition sm:px-3",
                  isActive ? "bg-base-800 text-amber-400" : "text-slate-400 hover:text-slate-100",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <MyNavDropdown myItems={myItems} />
          <div className="ml-1 flex items-center rounded-lg bg-base-800 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={clsx(
                "rounded-md px-2 py-1 transition",
                language === "en" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={clsx(
                "rounded-md px-2 py-1 transition",
                language === "hi" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
              )}
            >
              हि
            </button>
          </div>
          <NotificationBell />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                "rounded-lg p-2 transition",
                isActive ? "bg-base-800 text-amber-400" : "text-slate-400 hover:bg-base-800 hover:text-slate-100",
              )
            }
            title={t("nav_settings")}
          >
            <Settings className="h-5 w-5" />
          </NavLink>
        </nav>

        {/* Mobile: bell + hamburger */}
        <div className="flex items-center gap-1 sm:hidden">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-300 hover:bg-base-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navItems={[...primaryItems, ...myItems]} />
    </header>
  );
}
