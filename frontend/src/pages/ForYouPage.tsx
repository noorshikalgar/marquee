import type { Playlist, Title } from "@movie-scout/shared";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { TitleGrid } from "../components/TitleGrid";
import { TitleGridSkeleton } from "../components/skeletons/TitleGridSkeleton";
import { useLikedTitlesFull } from "../hooks/useLikedTitles";
import { useAiPlaylists, usePlaylistDetail, useRefreshAiPlaylists } from "../hooks/usePlaylists";
import { useRecordInteraction } from "../hooks/useTitles";
import { useLanguage } from "../lib/i18n/LanguageContext";

function ForYouSection({ playlist }: { playlist: Playlist }) {
  const { t } = useLanguage();
  const { data, isLoading } = usePlaylistDetail(playlist.id);
  const recordInteraction = useRecordInteraction();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const titles: Title[] = (data?.items ?? [])
    .filter((i) => !dismissed.has(i.title.id))
    .map((i) => ({ ...i.title, matchReason: i.reason }));

  function handleNotInterested(title: Title) {
    setDismissed((prev) => new Set(prev).add(title.id));
    recordInteraction.mutate({ titleId: title.id, type: "not_interested" });
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{playlist.name}</h2>
        {playlist.description && <p className="text-sm text-slate-500">{playlist.description}</p>}
      </div>
      {isLoading ? (
        <TitleGridSkeleton count={6} />
      ) : titles.length === 0 ? (
        <p className="text-sm text-slate-500">{t("forYou_empty")}</p>
      ) : (
        <TitleGrid titles={titles} onNotInterested={handleNotInterested} />
      )}
    </section>
  );
}

export function ForYouPage() {
  const { t } = useLanguage();
  const { data: playlists, isLoading } = useAiPlaylists();
  const { data: liked } = useLikedTitlesFull();
  const refresh = useRefreshAiPlaylists();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-amber-400" />
          {t("forYou_title")}
        </h1>
        <button
          type="button"
          onClick={() => refresh.mutate()}
          disabled={refresh.isPending}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
        >
          {refresh.isPending ? t("forYou_curating") : t("forYou_refresh")}
        </button>
      </div>

      {playlists && playlists.length > 0 && (
        <p className="text-xs text-slate-500">
          {liked && liked.length > 0
            ? `Based on ${liked.length} title${liked.length === 1 ? "" : "s"} you've liked, refreshed automatically every day.`
            : "You haven't liked any titles yet, so these lean on general popularity — like a few titles to sharpen them."}
        </p>
      )}

      {refresh.isError && (
        <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
          {(refresh.error as { message?: string })?.message ?? "Couldn't generate AI playlists. Is GEMINI_API_KEY configured?"}
        </p>
      )}

      {isLoading ? (
        <TitleGridSkeleton />
      ) : !playlists || playlists.length === 0 ? (
        <div className="rounded-xl border border-hairline/5 bg-base-900 p-8 text-center">
          <p className="text-sm text-slate-400">{t("forYou_empty")}</p>
        </div>
      ) : (
        playlists.map((p) => <ForYouSection key={p.id} playlist={p} />)
      )}
    </div>
  );
}
