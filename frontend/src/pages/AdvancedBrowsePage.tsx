import type { MediaType } from "@movie-scout/shared";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { TitleGrid } from "../components/TitleGrid";
import { TitleGridSkeleton } from "../components/skeletons/TitleGridSkeleton";
import { defaultDiscoverFilters, useDiscover, type DiscoverFilters } from "../hooks/useDiscover";
import { useCountries, useGenres, useLanguages } from "../hooks/useMeta";
import { useLanguage } from "../lib/i18n/LanguageContext";

const RATING_OPTIONS = ["6", "7", "7.5", "8", "8.5"];
const CURRENT_YEAR = new Date().getFullYear();

function filtersFromParams(params: URLSearchParams): DiscoverFilters {
  return {
    mediaType: params.get("type") === "tv" ? "tv" : "movie",
    genreIds: (params.get("genres") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number),
    originCountry: params.get("country") ?? "",
    originalLanguage: params.get("lang") ?? "",
    fromYear: params.get("from") ?? "",
    toYear: params.get("to") ?? "",
    minRating: params.get("rating") ?? "",
    sortBy: params.get("sort") ?? "popularity",
  };
}

function filtersToParams(filters: DiscoverFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.mediaType !== "movie") params.set("type", filters.mediaType);
  if (filters.genreIds.length > 0) params.set("genres", filters.genreIds.join(","));
  if (filters.originCountry) params.set("country", filters.originCountry);
  if (filters.originalLanguage) params.set("lang", filters.originalLanguage);
  if (filters.fromYear) params.set("from", filters.fromYear);
  if (filters.toYear) params.set("to", filters.toYear);
  if (filters.minRating) params.set("rating", filters.minRating);
  if (filters.sortBy !== "popularity") params.set("sort", filters.sortBy);
  return params;
}

export function AdvancedBrowsePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const { data: genres } = useGenres(filters.mediaType);
  const { data: countries } = useCountries();
  const { data: languages } = useLanguages();
  const discover = useDiscover(filters);
  const titles = discover.data?.pages.flatMap((p) => p.results) ?? [];

  function update(patch: Partial<DiscoverFilters>) {
    setSearchParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  }

  function toggleGenre(id: number) {
    const next = filters.genreIds.includes(id)
      ? filters.genreIds.filter((g) => g !== id)
      : [...filters.genreIds, id];
    update({ genreIds: next });
  }

  function resetFilters() {
    setSearchParams(filtersToParams({ ...defaultDiscoverFilters, mediaType: filters.mediaType }), { replace: true });
  }

  const hasActiveFilters =
    filters.genreIds.length > 0 ||
    !!filters.originCountry ||
    !!filters.originalLanguage ||
    !!filters.fromYear ||
    !!filters.toYear ||
    !!filters.minRating ||
    filters.sortBy !== "popularity";

  const selectClass =
    "rounded-lg border border-hairline/10 bg-base-800 px-3 py-1.5 text-sm text-slate-200 focus:border-amber-400 focus:outline-none";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <SlidersHorizontal className="h-5 w-5 text-amber-400" />
          {t("discover_title")}
        </h1>
        <div className="flex gap-1 rounded-lg bg-base-800 p-1">
          {(["movie", "tv"] as MediaType[]).map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => update({ mediaType: mt, genreIds: [] })}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                filters.mediaType === mt ? "bg-amber-400 text-accent-ink" : "text-slate-400 hover:text-slate-100",
              )}
            >
              {mt === "movie" ? t("browse_movies") : t("browse_tv")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-hairline/5 bg-base-900 p-4">
        <div className="flex flex-wrap gap-2">
          {(genres ?? []).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                filters.genreIds.includes(g.id)
                  ? "bg-amber-400 text-accent-ink"
                  : "bg-base-800 text-slate-300 hover:bg-base-700",
              )}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.originCountry}
            onChange={(e) => update({ originCountry: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("discover_anyCountry")}</option>
            {(countries ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.originalLanguage}
            onChange={(e) => update({ originalLanguage: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("discover_anyLanguage")}</option>
            {(languages ?? []).map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("discover_fromYear")}
              value={filters.fromYear}
              onChange={(e) => update({ fromYear: e.target.value })}
              min={1900}
              max={CURRENT_YEAR + 5}
              className={clsx(selectClass, "w-24")}
            />
            <span className="text-slate-500">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t("discover_toYear")}
              value={filters.toYear}
              onChange={(e) => update({ toYear: e.target.value })}
              min={1900}
              max={CURRENT_YEAR + 5}
              className={clsx(selectClass, "w-24")}
            />
          </div>

          <select
            value={filters.minRating}
            onChange={(e) => update({ minRating: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("discover_anyRating")}</option>
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}+
              </option>
            ))}
          </select>

          <select value={filters.sortBy} onChange={(e) => update({ sortBy: e.target.value })} className={selectClass}>
            <option value="popularity">{t("discover_sortPopularity")}</option>
            <option value="rating">{t("discover_sortRating")}</option>
            <option value="newest">{t("discover_sortNewest")}</option>
            <option value="oldest">{t("discover_sortOldest")}</option>
            <option value="title">{t("discover_sortTitle")}</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:text-amber-400"
            >
              <X className="h-3.5 w-3.5" />
              {t("discover_reset")}
            </button>
          )}
        </div>
      </div>

      {discover.isPending ? (
        <TitleGridSkeleton />
      ) : discover.isError ? (
        <p className="text-sm text-red-400">{t("browse_errorTrending")}</p>
      ) : (
        <>
          <TitleGrid titles={titles} />
          {discover.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => discover.fetchNextPage()}
                disabled={discover.isFetchingNextPage}
                className="rounded-lg bg-base-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-base-700 disabled:opacity-50"
              >
                {discover.isFetchingNextPage ? t("browse_loading") : t("browse_loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
