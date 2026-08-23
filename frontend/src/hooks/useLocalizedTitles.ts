import type { Title } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { useLanguage } from "../lib/i18n/LanguageContext";

interface LocalizedText {
  title: string | null;
  overview: string | null;
}

export function useLocalizedTitles(titles: Title[]) {
  const { language } = useLanguage();
  const ids = titles.map((t) => t.id).sort((a, b) => a - b);
  const key = ids.join(",");

  const { data } = useQuery({
    queryKey: ["localize", language, key],
    queryFn: () => api.post<Record<number, LocalizedText>>("/titles/localize", { titleIds: ids, lang: language }),
    enabled: language !== "en" && ids.length > 0,
    staleTime: Infinity,
  });

  return data ?? {};
}

export function formatLocalizedTitle(title: string, localizedTitle?: string | null): string {
  if (!localizedTitle || localizedTitle.trim() === title.trim()) return title;
  return `${title} (${localizedTitle})`;
}
