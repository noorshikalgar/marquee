import { Bell, BellRing, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useDigests, useGenerateDigestNow, useMarkDigestRead } from "../hooks/useDigests";
import { disablePushNotifications, enablePushNotifications, getExistingSubscription, isPushSupported } from "../lib/pushSubscribe";
import { useLanguage } from "../lib/i18n/LanguageContext";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: digests, isLoading } = useDigests();
  const markRead = useMarkDigestRead();
  const generateNow = useGenerateDigestNow();

  const [pushState, setPushState] = useState<"unknown" | "supported" | "unsupported" | "subscribed">("unknown");
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await isPushSupported())) {
        setPushState("unsupported");
        return;
      }
      const timeout = setTimeout(() => !cancelled && setPushState((s) => (s === "unknown" ? "supported" : s)), 2000);
      const existing = await getExistingSubscription();
      clearTimeout(timeout);
      if (!cancelled) setPushState(existing ? "subscribed" : "supported");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnablePush() {
    const result = await enablePushNotifications();
    if (result.ok) {
      setPushState("subscribed");
      setPushMessage("Notifications enabled.");
    } else {
      setPushMessage(result.reason ?? "Couldn't enable notifications.");
    }
  }

  async function handleDisablePush() {
    await disablePushNotifications();
    setPushState("supported");
    setPushMessage("Notifications disabled.");
  }

  function openDigest(id: number, readAt: string | null) {
    if (!readAt) markRead.mutate(id);
    navigate(`/notifications/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Bell className="h-5 w-5 text-amber-400" />
          {t("notifications_title")}
        </h1>
        <button
          type="button"
          onClick={() => generateNow.mutate()}
          disabled={generateNow.isPending}
          className="rounded-lg bg-base-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-base-700 disabled:opacity-50"
        >
          {generateNow.isPending ? t("notifications_checking") : t("notifications_checkNow")}
        </button>
      </div>

      <div className="rounded-xl border border-hairline/5 bg-base-900 p-4">
        {pushState === "unknown" && <p className="text-sm text-slate-500">Checking notification support…</p>}
        {pushState === "unsupported" && (
          <p className="text-sm text-slate-500">Push notifications aren't supported in this browser.</p>
        )}
        {pushState === "supported" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Get a nudge when something new matches your taste.</p>
            <button
              type="button"
              onClick={handleEnablePush}
              className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-accent-ink hover:bg-amber-300"
            >
              <BellRing className="h-4 w-4" /> {t("notifications_enable")}
            </button>
          </div>
        )}
        {pushState === "subscribed" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-400">{t("notifications_on")}</p>
            <button
              type="button"
              onClick={handleDisablePush}
              className="rounded-lg bg-base-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-base-700"
            >
              {t("notifications_turnOff")}
            </button>
          </div>
        )}
        {pushMessage && <p className="mt-2 text-xs text-slate-500">{pushMessage}</p>}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("title_loading")}</p>
      ) : !digests || digests.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{t("notifications_empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline/5 bg-base-900">
          {digests.map((digest, i) => (
            <button
              key={digest.id}
              type="button"
              onClick={() => openDigest(digest.id, digest.readAt)}
              className={clsx(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-base-800/60",
                i !== digests.length - 1 && "border-b border-hairline/5",
              )}
            >
              <div
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  digest.readAt ? "bg-base-800 text-slate-500" : "bg-amber-400/15 text-amber-400",
                )}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={clsx("truncate text-sm", digest.readAt ? "text-slate-300" : "font-semibold text-slate-100")}>
                  Found {digest.items.length} new {digest.items.length === 1 ? "pick" : "picks"} for you
                </p>
                <p className="text-xs text-slate-500">{timeAgo(digest.generatedAt)}</p>
              </div>
              {!digest.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />}
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
