import clsx from "clsx";
import { Compass, Globe, LogOut, MapPin, Palette, Server, Settings as SettingsIcon, ShieldCheck, Smartphone, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CountryPicker } from "../components/CountryPicker";
import { InstallPrompt } from "../components/InstallPrompt";
import { ThemePicker } from "../components/ThemePicker";
import { useUpdateSettings } from "../hooks/useSettings";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { clearServerUrl, getServerUrl, isDesktop } from "../lib/serverConfig";

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const updateSettings = useUpdateSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function handleChangeServer() {
    await logout().catch(() => {});
    clearServerUrl();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <SettingsIcon className="h-5 w-5 text-amber-400" />
        {t("settings_title")}
      </h1>

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <UserCircle className="h-4 w-4 text-amber-400" />
          Account
        </h2>
        <p className="text-sm text-slate-400">
          Signed in as <span className="text-slate-200">{user?.displayName}</span>{" "}
          <span className="text-slate-500">@{user?.username}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Manage family accounts
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/60"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>

      {isDesktop() && (
        <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Server className="h-4 w-4 text-amber-400" />
            Server
          </h2>
          <p className="text-sm text-slate-400">
            Connected to <span className="text-slate-200">{getServerUrl()}</span>
          </p>
          <button
            type="button"
            onClick={handleChangeServer}
            className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700"
          >
            Change server
          </button>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Palette className="h-4 w-4 text-amber-400" />
          Theme
        </h2>
        <p className="text-sm text-slate-400">Pick a look — three dark, three light.</p>
        <ThemePicker />
      </section>

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Globe className="h-4 w-4 text-amber-400" />
          {t("settings_language")}
        </h2>
        <p className="text-sm text-slate-400">{t("settings_languageDesc")}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              language === "en" ? "bg-amber-400 text-accent-ink" : "bg-base-800 text-slate-300 hover:bg-base-700",
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage("hi")}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              language === "hi" ? "bg-amber-400 text-accent-ink" : "bg-base-800 text-slate-300 hover:bg-base-700",
            )}
          >
            हिन्दी
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <MapPin className="h-4 w-4 text-amber-400" />
          {t("settings_country")}
        </h2>
        <p className="text-sm text-slate-400">{t("settings_countryDesc")}</p>
        <CountryPicker />
      </section>

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Compass className="h-4 w-4 text-amber-400" />
          Setup &amp; tour
        </h2>
        <p className="text-sm text-slate-400">Replay the welcome setup and the quick feature tour.</p>
        <button
          type="button"
          onClick={() => updateSettings.mutate({ onboardingComplete: "false", tourComplete: "false" })}
          className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700"
        >
          Run setup again
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Smartphone className="h-4 w-4 text-amber-400" />
          {t("settings_install")}
        </h2>
        <p className="text-sm text-slate-400">{t("settings_installDesc")}</p>
        <InstallPrompt />
      </section>

      <section className="space-y-2 rounded-xl border border-hairline/5 bg-base-900 p-5">
        <h2 className="text-sm font-semibold text-slate-200">{t("nav_notifications")}</h2>
        <p className="text-sm text-slate-400">
          Manage your daily digest and push notification preferences on the{" "}
          <Link to="/notifications" className="text-amber-400 hover:underline">
            {t("nav_notifications")}
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="space-y-1 rounded-xl border border-hairline/5 bg-base-900 p-5 text-xs text-slate-500">
        <p>Marquee — a personal movie &amp; TV companion.</p>
        <p>Data from TMDB. Recommendations powered by Gemini.</p>
      </section>
    </div>
  );
}
