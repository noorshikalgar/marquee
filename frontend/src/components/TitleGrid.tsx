import type { Title } from "@movie-scout/shared";
import { useLocalizedTitles } from "../hooks/useLocalizedTitles";
import { useLikedTitles } from "../hooks/useLikedTitles";
import { useAddToPlaylist, useRemoveFromPlaylist, useWatchlist } from "../hooks/usePlaylists";
import { useDeleteInteraction, useRecordInteraction } from "../hooks/useTitles";
import { TitleCard } from "./TitleCard";

interface TitleGridProps {
  titles: Title[];
  hideLike?: boolean;
  hideWatchlist?: boolean;
}

export function TitleGrid({ titles, hideLike, hideWatchlist }: TitleGridProps) {
  const localized = useLocalizedTitles(titles);
  const likedTitleIds = useLikedTitles();
  const recordInteraction = useRecordInteraction();
  const deleteInteraction = useDeleteInteraction();

  const { watchlistId, data: watchlistData } = useWatchlist();
  const addToPlaylist = useAddToPlaylist();
  const removeFromPlaylist = useRemoveFromPlaylist();
  const watchlistTmdbIds = new Set(watchlistData?.items.map((i) => i.title.tmdbId) ?? []);

  if (titles.length === 0) {
    return <p className="py-12 text-center text-slate-500">Nothing here yet.</p>;
  }

  function handleToggleLike(title: Title) {
    const existingInteractionId = likedTitleIds.get(title.id);
    if (existingInteractionId) {
      deleteInteraction.mutate(existingInteractionId);
    } else {
      recordInteraction.mutate({ titleId: title.id, type: "like" });
    }
  }

  function handleToggleWatchlist(title: Title) {
    if (!watchlistId) return;
    if (watchlistTmdbIds.has(title.tmdbId)) {
      removeFromPlaylist.mutate({ playlistId: watchlistId, titleId: title.id });
    } else {
      addToPlaylist.mutate({ playlistId: watchlistId, titleId: title.id });
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {titles.map((title) => (
        <TitleCard
          key={`${title.mediaType}-${title.tmdbId}`}
          title={title}
          onAddToWatchlist={hideWatchlist ? undefined : handleToggleWatchlist}
          inWatchlist={watchlistTmdbIds.has(title.tmdbId)}
          onToggleLike={hideLike ? undefined : handleToggleLike}
          isLiked={likedTitleIds.has(title.id)}
          localizedTitle={localized[title.id]?.title}
        />
      ))}
    </div>
  );
}
