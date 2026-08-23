import type { Language } from "./i18n/translations";

const LOCALES: Record<Language, string> = { en: "en-US", hi: "hi-IN" };

export function formatReleaseDate(dateStr: string, language: Language): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(LOCALES[language], { year: "numeric", month: "long", day: "numeric" });
}
