import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TitleGrid } from "../components/TitleGrid";
import { useNlSearch } from "../hooks/useSearch";
import { useLanguage } from "../lib/i18n/LanguageContext";

const EXAMPLE_QUERIES = ["cowboy style series", "crime series from Japan", "a warrior story from ancient legends"];

export function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeQuery = searchParams.get("q") ?? "";
  const [input, setInput] = useState(activeQuery);

  const nlSearch = useNlSearch(activeQuery);

  function runSearch(query: string) {
    if (!query.trim()) return;
    setInput(query);
    setSearchParams({ q: query });
  }

  const interpreted = nlSearch.data?.interpreted;
  const chips = interpreted
    ? [
        interpreted.mediaType !== "all" && interpreted.mediaType,
        ...interpreted.genres,
        ...interpreted.originCountry,
        ...interpreted.originalLanguage.map((l) => `lang: ${l}`),
        ...interpreted.keywords,
        interpreted.sortBy !== "popularity" && `sorted by ${interpreted.sortBy}`,
        interpreted.minRating && `${interpreted.minRating}+ rating`,
        interpreted.era.fromYear && `from ${interpreted.era.fromYear}`,
        interpreted.era.toYear && `to ${interpreted.era.toYear}`,
      ].filter((c): c is string => !!c)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="h-5 w-5 text-amber-400" />
            {t("search_heading")}
          </h1>
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/20 to-fuchsia-400/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/30">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        </div>
        <p className="max-w-xl text-sm text-slate-400">{t("search_subheading")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(input);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full rounded-lg border border-hairline/10 bg-base-800 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={nlSearch.isFetching}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
          >
            {nlSearch.isFetching ? t("search_searching") : t("search_button")}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => runSearch(q)}
              className="rounded-full bg-base-800 px-3 py-1 text-xs text-slate-400 transition hover:bg-base-700 hover:text-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {nlSearch.isError && <p className="text-sm text-red-400">{t("search_error")}</p>}

      {nlSearch.data && (
        <div className="space-y-4">
          {nlSearch.data.aiUnavailable && (
            <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-300 ring-1 ring-amber-400/20">
              AI search is temporarily unavailable, so these are plain text-match results instead.
            </p>
          )}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span>{t("search_understoodAs")}</span>
              {chips.map((c) => (
                <span key={c} className="rounded-full bg-base-800 px-2.5 py-0.5 text-xs capitalize text-amber-300">
                  {c}
                </span>
              ))}
            </div>
          )}
          <TitleGrid titles={nlSearch.data.results} />
        </div>
      )}
    </div>
  );
}
