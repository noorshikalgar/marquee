import type { MediaType } from "@movie-scout/shared";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { TitleGrid } from "../components/TitleGrid";
import { TitleGridSkeleton } from "../components/skeletons/TitleGridSkeleton";
import { useUpcoming, type UpcomingBucket } from "../hooks/useUpcoming";
import { useLanguage } from "../lib/i18n/LanguageContext";

export function ComingSoonPage() {
  const { t } = useLanguage();
  const [mediaType, setMediaType] = useState<MediaType>("movie");

  const buckets: { value: UpcomingBucket; label: string; desc?: string }[] = [
    { value: "soon", label: t("comingSoon_soon"), desc: t("comingSoon_soonDesc") },
    { value: "this_year", label: t("comingSoon_thisYear") },
    { value: "next_year", label: t("comingSoon_nextYear") },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarClock className="h-5 w-5 text-amber-400" />
          {t("comingSoon_title")}
        </h1>
        <div className="flex gap-1 rounded-lg bg-base-800 p-1">
          {(["movie", "tv"] as const).map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => setMediaType(mt)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                mediaType === mt ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
              )}
            >
              {mt === "movie" ? t("browse_movies") : t("browse_tv")}
            </button>
          ))}
        </div>
      </div>

      {buckets.map((bucket) => (
        <BucketSection
          key={bucket.value}
          mediaType={mediaType}
          bucket={bucket.value}
          label={bucket.label}
          desc={bucket.desc}
          emptyLabel={t("comingSoon_empty")}
        />
      ))}
    </div>
  );
}

function BucketSection({
  mediaType,
  bucket,
  label,
  desc,
  emptyLabel,
}: {
  mediaType: MediaType;
  bucket: UpcomingBucket;
  label: string;
  desc?: string;
  emptyLabel: string;
}) {
  const { t } = useLanguage();
  const upcoming = useUpcoming(mediaType, bucket);
  const titles = upcoming.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{label}</h2>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      {upcoming.isPending ? (
        <TitleGridSkeleton count={6} />
      ) : titles.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <>
          <TitleGrid titles={titles} />
          {upcoming.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => upcoming.fetchNextPage()}
                disabled={upcoming.isFetchingNextPage}
                className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700 disabled:opacity-50"
              >
                {upcoming.isFetchingNextPage ? t("browse_loading") : t("browse_loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
