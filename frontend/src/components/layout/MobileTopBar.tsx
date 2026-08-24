import { Bookmark, CalendarClock, Clapperboard, Compass, Heart, Menu, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { NotificationBell } from "../NotificationBell";
import { MobileNavDrawer } from "./MobileNavDrawer";

export function MobileTopBar() {
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { to: "/", label: t("nav_browse"), icon: Compass, end: true },
    { to: "/coming-soon", label: t("nav_comingSoon"), icon: CalendarClock, end: false },
    { to: "/search", label: t("nav_search"), icon: Search, end: false },
    { to: "/discover", label: t("nav_discover"), icon: SlidersHorizontal, end: false },
    { to: "/my/liked", label: t("my_liked"), icon: Heart, end: false },
    { to: "/my/watchlist", label: t("nav_watchlist"), icon: Bookmark, end: false },
    { to: "/my/for-you", label: t("nav_forYou"), icon: Sparkles, end: false },
  ];

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-hairline/5 bg-base-950/85 px-3 py-3 backdrop-blur sm:hidden">
      <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-100">
        <Clapperboard className="h-6 w-6 shrink-0 text-amber-400" />
        <span className="whitespace-nowrap">Marquee</span>
      </NavLink>

      <div className="flex items-center gap-1">
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

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navItems={navItems} />
    </header>
  );
}
