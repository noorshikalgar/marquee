import { Bookmark } from "lucide-react";
import { TitleGrid } from "../components/TitleGrid";
import { useWatchlist } from "../hooks/usePlaylists";
import { useLanguage } from "../lib/i18n/LanguageContext";

export function WatchlistPage() {
  const { t } = useLanguage();
  const { data, isLoading } = useWatchlist();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-amber-400" />
        <h1 className="text-xl font-semibold">{t("watchlist_title")}</h1>
        {data && <span className="text-sm text-slate-500">({data.items.length})</span>}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">{t("title_loading")}</p>
      ) : (
        <TitleGrid titles={data?.items.map((i) => i.title) ?? []} hideWatchlist />
      )}
    </div>
  );
}
