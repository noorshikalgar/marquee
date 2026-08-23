import { AnimatePresence, motion } from "framer-motion";
import { Settings, X, type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useLanguage } from "../../lib/i18n/LanguageContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export function MobileNavDrawer({ open, onClose, navItems }: MobileNavDrawerProps) {
  const { language, setLanguage, t } = useLanguage();

  // Portal to document.body: the header uses backdrop-blur, which (like `transform`)
  // creates a new containing block for `position: fixed` descendants — without the
  // portal this drawer would be sized relative to the ~60px header, not the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/60 sm:hidden"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-40 flex w-72 max-w-[85vw] flex-col bg-base-950 shadow-2xl ring-1 ring-hairline/10 sm:hidden"
          >
            <div className="flex items-center justify-between border-b border-hairline/5 px-4 py-4">
              <span className="text-sm font-semibold text-slate-200">Menu</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-base-800 hover:text-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive ? "bg-base-800 text-amber-400" : "text-slate-300 hover:bg-base-800/60",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive ? "bg-base-800 text-amber-400" : "text-slate-300 hover:bg-base-800/60",
                  )
                }
              >
                <Settings className="h-4 w-4" />
                {t("nav_settings")}
              </NavLink>
            </nav>

            <div className="border-t border-hairline/5 p-4">
              <p className="mb-2 text-xs text-slate-500">{t("settings_language")}</p>
              <div className="flex items-center gap-1 rounded-lg bg-base-800 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={clsx(
                    "flex-1 rounded-md px-3 py-1.5 transition",
                    language === "en" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={clsx(
                    "flex-1 rounded-md px-3 py-1.5 transition",
                    language === "hi" ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
                  )}
                >
                  हिन्दी
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
