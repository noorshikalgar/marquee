import type { CrewMember } from "@movie-scout/shared";
import { Bookmark, ExternalLink, Eye, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import clsx from "clsx";
import { BackButton } from "../components/BackButton";
import { ImageCarousel } from "../components/ImageCarousel";
import { TitleDetailSkeleton } from "../components/skeletons/TitleDetailSkeleton";
import { TitleGrid } from "../components/TitleGrid";
import { useAddToPlaylist, useRemoveFromPlaylist, useWatchlist } from "../hooks/usePlaylists";
import { useDeleteInteraction, useRecordInteraction, useTitleDetail } from "../hooks/useTitles";
import { formatLocalizedTitle } from "../hooks/useLocalizedTitles";
import { useLanguage } from "../lib/i18n/LanguageContext";
import type { TranslationKey } from "../lib/i18n/translations";
import { formatReleaseDate } from "../lib/formatDate";

export function TitleDetailPage() {
  const { t, language } = useLanguage();
  const { mediaType, tmdbId } = useParams<{ mediaType: "movie" | "tv"; tmdbId: string }>();
  const { data: title, isLoading, isError } = useTitleDetail(mediaType ?? "movie", Number(tmdbId));
  const recordInteraction = useRecordInteraction();
  const deleteInteraction = useDeleteInteraction();
  const { watchlistId, data: watchlistData } = useWatchlist();
  const addToPlaylist = useAddToPlaylist();
  const removeFromPlaylist = useRemoveFromPlaylist();
  const { scrollY } = useScroll();
  const backdropY = useTransform(scrollY, [0, 700], [0, 180]);
  const backdropScale = useTransform(scrollY, [0, 700], [1, 1.15]);

  const inWatchlist = title ? (watchlistData?.items.some((i) => i.title.tmdbId === title.tmdbId) ?? false) : false;

  if (isLoading) return <TitleDetailSkeleton />;
  if (isError || !title) return <div className="px-4 py-12 text-center text-red-400">{t("title_error")}</div>;

  const displayTitle = formatLocalizedTitle(title.title, title.localizedTitle);
  const displayOverview = title.localizedOverview || title.overview;

  function toggleInteraction(type: "like" | "dislike" | "watched") {
    if (!title) return;
    const existing = title.userInteractions.find((i) => i.type === type);
    if (existing) {
      deleteInteraction.mutate(existing.id);
    } else {
      recordInteraction.mutate({ titleId: title.id, type });
      // Marking something watched means it's no longer "want to watch" — clear it out.
      if (type === "watched" && watchlistId && inWatchlist) {
        removeFromPlaylist.mutate({ playlistId: watchlistId, titleId: title.id });
      }
    }
  }

  function toggleWatchlist() {
    if (!title || !watchlistId) return;
    if (inWatchlist) {
      removeFromPlaylist.mutate({ playlistId: watchlistId, titleId: title.id });
    } else {
      addToPlaylist.mutate({ playlistId: watchlistId, titleId: title.id });
    }
  }

  const hasLiked = title.userInteractions.some((i) => i.type === "like");
  const hasDisliked = title.userInteractions.some((i) => i.type === "dislike");
  const hasWatched = title.userInteractions.some((i) => i.type === "watched");

  return (
    <div>
      <div className={clsx("relative overflow-hidden", title.backdropUrl && "min-h-96 sm:min-h-[28rem] md:min-h-[34rem]")}>
        <div className="absolute inset-x-0 top-4 z-10">
          <div className="mx-auto max-w-6xl px-4">
            <BackButton overlay />
          </div>
        </div>
        {title.backdropUrl && (
          <>
            <motion.img
              src={title.backdropUrl}
              alt=""
              style={{ y: backdropY, scale: backdropScale }}
              className="absolute inset-0 h-full w-full object-cover object-top will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/55 to-base-950/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-base-950/85 via-base-950/20 to-transparent" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-24 sm:pb-16 sm:pt-36">
          <div className="flex flex-col gap-6 sm:flex-row">
            <motion.div
              layoutId={`poster-${title.mediaType}-${title.tmdbId}`}
              className="aspect-[2/3] w-40 shrink-0 self-start overflow-hidden rounded-xl shadow-2xl ring-1 ring-hairline/10 sm:w-56"
            >
              {title.posterUrl && <img src={title.posterUrl} alt={title.title} className="h-full w-full object-cover" />}
            </motion.div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-50 [text-shadow:0_2px_16px_rgb(0_0_0_/_85%)] sm:text-3xl">
                  {displayTitle}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-200 [text-shadow:0_1px_8px_rgb(0_0_0_/_85%)]">
                  {title.releaseDate && <span>{formatReleaseDate(title.releaseDate, language)}</span>}
                  {title.runtime && <span>{title.runtime} min</span>}
                  {title.voteAverage > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="h-4 w-4 fill-current" />
                      {title.voteAverage.toFixed(1)} ({title.voteCount.toLocaleString()})
                    </span>
                  )}
                  {title.imdbUrl && (
                    <a
                      href={title.imdbUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-slate-200 hover:text-amber-400"
                    >
                      IMDb <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {title.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-base-950/70 px-2.5 py-0.5 text-xs text-slate-200 ring-1 ring-hairline/10 backdrop-blur-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                {title.crew.length > 0 && <CrewLines crew={title.crew} t={t} />}
              </div>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-200 [text-shadow:0_1px_8px_rgb(0_0_0_/_85%)]">
                {displayOverview}
              </p>

              <div className="flex flex-wrap gap-2">
                <ActionButton
                  icon={ThumbsUp}
                  label={t("title_like")}
                  active={hasLiked}
                  onClick={() => toggleInteraction("like")}
                />
                <ActionButton
                  icon={ThumbsDown}
                  label={t("title_notForMe")}
                  active={hasDisliked}
                  onClick={() => toggleInteraction("dislike")}
                />
                <ActionButton
                  icon={Eye}
                  label={t("title_watched")}
                  active={hasWatched}
                  onClick={() => toggleInteraction("watched")}
                />
                <ActionButton
                  icon={Bookmark}
                  label={inWatchlist ? t("title_inWatchlist") : t("title_addToWatchlist")}
                  active={inWatchlist}
                  onClick={toggleWatchlist}
                />
              </div>

              {(title.watchProviders.flatrate.length > 0 || title.watchProviders.rent.length > 0 || title.watchProviders.buy.length > 0) && (
                <WatchProvidersSection watchProviders={title.watchProviders} t={t} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12">
        {title.trailerYoutubeKey && (
          <section className="mt-10 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">{t("title_trailer")}</h2>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-base-800">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${title.trailerYoutubeKey}`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {title.images.length > 0 && (
          <section className="mt-10 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">{t("title_photos")}</h2>
            <ImageCarousel images={title.images} title={displayTitle} />
          </section>
        )}

        {title.cast.length > 0 && (
          <section className="mt-10 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">{t("title_cast")}</h2>
            <div className="flex flex-wrap gap-4">
              {title.cast.map((c) => (
                <Link key={`${c.personId}-${c.character}`} to={`/person/${c.personId}`} className="w-24 text-center">
                  <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-base-800 ring-1 ring-transparent transition hover:ring-amber-400/60">
                    {c.profileUrl && <img src={c.profileUrl} alt={c.name} className="h-full w-full object-cover" />}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium text-slate-200">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {title.similar.length > 0 && (
          <section className="mt-10 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">{t("title_similar")}</h2>
            <TitleGrid titles={title.similar} />
          </section>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof ThumbsUp;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={clsx(
        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-3 sm:py-1.5",
        active ? "bg-amber-400 text-accent-ink" : "bg-base-800 text-slate-200 hover:bg-base-700",
      )}
    >
      <Icon className="h-4 w-4" fill={active ? "currentColor" : "none"} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CrewLines({ crew, t }: { crew: CrewMember[]; t: (key: TranslationKey) => string }) {
  const byJob = new Map<string, CrewMember[]>();
  for (const member of crew) {
    const list = byJob.get(member.job) ?? [];
    list.push(member);
    byJob.set(member.job, list);
  }

  const jobLabel = (job: string) => {
    if (job === "Writer") return t("title_writtenBy");
    if (job === "Director") return t("title_director");
    if (job === "Producer") return t("title_producers");
    return job;
  };

  return (
    <div className="mt-3 space-y-1 text-sm text-slate-300 [text-shadow:0_1px_6px_rgb(0_0_0_/_75%)]">
      {[...byJob.entries()].map(([job, members]) => (
        <p key={job}>
          <span className="text-slate-400">{jobLabel(job)}: </span>
          {members.map((m, i) => (
            <span key={m.personId}>
              <Link to={`/person/${m.personId}`} className="text-slate-300 hover:text-amber-400 hover:underline">
                {m.name}
              </Link>
              {i < members.length - 1 && ", "}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function WatchProvidersSection({
  watchProviders,
  t,
}: {
  watchProviders: import("@movie-scout/shared").WatchProviders;
  t: (key: TranslationKey) => string;
}) {
  const groups = [
    { label: t("title_stream"), list: watchProviders.flatrate },
    { label: t("title_rent"), list: watchProviders.rent },
    { label: t("title_buy"), list: watchProviders.buy },
  ].filter((g) => g.list.length > 0);

  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.label} className="flex items-center gap-2 text-sm">
          <span className="w-14 text-slate-500">{g.label}</span>
          <div className="flex gap-2">
            {g.list.map((p) => (
              <img
                key={p.providerName}
                src={p.logoUrl}
                alt={p.providerName}
                title={p.providerName}
                className="h-8 w-8 rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
      {watchProviders.link && (
        <a
          href={watchProviders.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400"
        >
          {t("title_moreWatchOptions")} <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
