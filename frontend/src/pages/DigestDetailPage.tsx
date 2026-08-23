import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAddToPlaylist, useWatchlist } from "../hooks/usePlaylists";
import { useDigest } from "../hooks/useDigests";

export function DigestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: digest, isLoading } = useDigest(Number(id));
  const { watchlistId } = useWatchlist();
  const addToPlaylist = useAddToPlaylist();

  if (isLoading) return <div className="px-4 py-12 text-center text-slate-500">Loading…</div>;
  if (!digest) return <div className="px-4 py-12 text-center text-red-400">Couldn't find that notification.</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Link to="/notifications" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" />
        Notifications
      </Link>

      <div>
        <h1 className="text-xl font-semibold">
          {digest.items.length} new {digest.items.length === 1 ? "pick" : "picks"} for you
        </h1>
        <p className="text-sm text-slate-500">{new Date(digest.generatedAt).toLocaleDateString()}</p>
      </div>

      <div className="space-y-3">
        {digest.items.map((item) => (
          <div key={item.titleId} className="flex items-center gap-3 rounded-xl border border-hairline/5 bg-base-900 p-3">
            {item.title.posterUrl && (
              <Link to={`/title/${item.title.mediaType}/${item.title.tmdbId}`} className="shrink-0">
                <img src={item.title.posterUrl} alt={item.title.title} className="h-24 w-16 rounded-lg object-cover" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <Link to={`/title/${item.title.mediaType}/${item.title.tmdbId}`} className="truncate text-sm font-medium text-slate-100 hover:text-amber-400">
                {item.title.title}
              </Link>
              <p className="text-xs text-amber-400">{item.headline}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.body}</p>
            </div>
            <button
              type="button"
              onClick={() => watchlistId && addToPlaylist.mutate({ playlistId: watchlistId, titleId: item.titleId })}
              className="shrink-0 rounded-lg bg-base-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-amber-400 hover:text-accent-ink"
            >
              + Watchlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
