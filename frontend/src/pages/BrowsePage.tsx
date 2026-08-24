import type { MediaType } from "@movie-scout/shared";
import { useState } from "react";
import clsx from "clsx";
import { TitleGrid } from "../components/TitleGrid";
import { TitleGridSkeleton } from "../components/skeletons/TitleGridSkeleton";
import { defaultDiscoverFilters, useDiscover } from "../hooks/useDiscover";
import { useCountries } from "../hooks/useMeta";
import { usePersonalized, useTrending } from "../hooks/useTitles";
import { usePreferences } from "../hooks/usePreferences";
import { useSettings } from "../hooks/useSettings";
import { useLanguage } from "../lib/i18n/LanguageContext";

type MediaFilter = "all" | MediaType;

export function BrowsePage() {
  const { language, t } = useLanguage();
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const mediaFilters: { value: MediaFilter; label: string }[] = [
    { value: "all", label: t("browse_all") },
    { value: "movie", label: t("browse_movies") },
    { value: "tv", label: t("browse_tv") },
  ];

  const trending = useTrending(mediaFilter, "week");
  const trendingTitles = trending.data?.pages.flatMap((p) => p.results) ?? [];

  const { data: preferences } = usePreferences();
  const hasTaste = (preferences?.length ?? 0) > 0;
  const personalized = usePersonalized(mediaFilter === "tv" ? "tv" : "movie", 1);

  const { data: settings } = useSettings();
  const { data: countries } = useCountries();
  const preferredCountry = settings?.preferredCountry ?? "";
  const preferredCountryName = countries?.find((c) => c.code === preferredCountry)?.name ?? preferredCountry;
  const regional = useDiscover(
    {
      ...defaultDiscoverFilters,
      mediaType: mediaFilter === "tv" ? "tv" : "movie",
      originCountry: preferredCountry,
    },
    { enabled: !!preferredCountry },
  );
  const regionalTitles = regional.data?.pages.flatMap((p) => p.results) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t("browse_title")}</h1>
        <div className="flex gap-1 rounded-lg bg-base-800 p-1">
          {mediaFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setMediaFilter(f.value)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                mediaFilter === f.value ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {hasTaste && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">{t("browse_forYou")}</h2>
          {personalized.isLoading ? (
            <TitleGridSkeleton count={6} />
          ) : (
            <TitleGrid titles={personalized.data?.results ?? []} />
          )}
        </section>
      )}

      {preferredCountry && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">
            {language === "hi" ? (
              <>
                {preferredCountryName} {t("browse_popularIn")}
              </>
            ) : (
              <>
                {t("browse_popularIn")} {preferredCountryName}
              </>
            )}
          </h2>
          {regional.isLoading ? (
            <TitleGridSkeleton count={6} />
          ) : (
            <TitleGrid titles={regionalTitles} />
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">{t("browse_trending")}</h2>
        {trending.isPending ? (
          <TitleGridSkeleton />
        ) : trending.isError ? (
          <p className="text-sm text-red-400">{t("browse_errorTrending")}</p>
        ) : (
          <>
            <TitleGrid titles={trendingTitles} />
            {trending.hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => trending.fetchNextPage()}
                  disabled={trending.isFetchingNextPage}
                  className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700 disabled:opacity-50"
                >
                  {trending.isFetchingNextPage ? t("browse_loading") : t("browse_loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
