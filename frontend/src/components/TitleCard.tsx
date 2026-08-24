import type { Title } from "@movie-scout/shared";
import { Bookmark, Clapperboard, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { formatLocalizedTitle } from "../hooks/useLocalizedTitles";

interface TitleCardProps {
  title: Title;
  onAddToWatchlist?: (title: Title) => void;
  inWatchlist?: boolean;
  onToggleLike?: (title: Title) => void;
  isLiked?: boolean;
  localizedTitle?: string | null;
}

export function TitleCard({
  title,
  onAddToWatchlist,
  inWatchlist,
  onToggleLike,
  isLiked,
  localizedTitle,
}: TitleCardProps) {
  const year = title.releaseDate ? title.releaseDate.slice(0, 4) : null;
  const displayTitle = formatLocalizedTitle(title.title, localizedTitle);

  return (
    <div className="group relative">
      <Link
        to={`/title/${title.mediaType}/${title.tmdbId}`}
        viewTransition
        className={clsx(
          "block overflow-hidden rounded-xl bg-base-800 ring-1 transition",
          isLiked ? "ring-2 ring-rose-500/80" : "ring-hairline/5 hover:ring-amber-400/50",
        )}
      >
        <div
          className="relative aspect-[2/3] w-full overflow-hidden bg-base-700"
          style={{ viewTransitionName: `poster-${title.mediaType}-${title.tmdbId}` }}
        >
          {title.posterUrl ? (
            <img
              src={title.posterUrl}
              alt={title.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-base-800 to-base-900">
              <Clapperboard className="h-1/4 w-1/4 text-slate-600" />
            </div>
          )}
          {onAddToWatchlist && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onAddToWatchlist(title);
              }}
              title={inWatchlist ? "In your watchlist" : "Add to watchlist"}
              className={clsx(
                "absolute right-2 top-2 rounded-full p-1.5 shadow-sm backdrop-blur transition",
                inWatchlist
                  ? "bg-amber-400 text-accent-ink"
                  : "bg-base-950/70 text-slate-200 hover:bg-amber-400 hover:text-accent-ink",
              )}
            >
              <Bookmark className="h-4 w-4" fill={inWatchlist ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <div className="relative p-2.5">
          {onToggleLike && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleLike(title);
              }}
              title={isLiked ? "Liked" : "Like"}
              className="absolute -top-[11px] right-2 leading-none transition hover:scale-110"
            >
              <Heart
                stroke="white"
                strokeWidth={2}
                className={clsx(
                  "h-[22px] w-[22px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]",
                  isLiked ? "fill-rose-500" : "fill-none",
                )}
              />
            </button>
          )}
          <p className="truncate text-sm font-medium text-slate-100" title={displayTitle}>
            {displayTitle}
          </p>
          <div className="mt-1 flex h-4 items-center gap-2 text-xs text-slate-400">
            {year && <span>{year}</span>}
            {title.voteAverage > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                {title.voteAverage.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
