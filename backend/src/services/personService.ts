import type { MediaType, PersonCredit, PersonDetail } from "@movie-scout/shared";
import { toTitleDtos, upsertTitles } from "../db/repositories/titlesRepo.js";
import { profileUrl } from "../providers/tmdb/imageConfig.js";
import { tmdbGet } from "../providers/tmdb/tmdbClient.js";
import { mapListItemToTitleInsert, type TmdbListItem } from "../providers/tmdb/tmdbMappers.js";

interface TmdbPersonResponse {
  id: number;
  name: string;
  profile_path: string | null;
  biography: string;
  known_for_department: string | null;
  birthday: string | null;
}

interface TmdbCreditItem extends TmdbListItem {
  media_type: "movie" | "tv";
  character?: string;
  job?: string;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbCombinedCreditsResponse {
  cast: TmdbCreditItem[];
  crew: TmdbCreditItem[];
}

function dedupeByTitle(items: TmdbCreditItem[]): TmdbCreditItem[] {
  const byKey = new Map<string, TmdbCreditItem>();
  for (const item of items) {
    const key = `${item.media_type}-${item.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()];
}

function sortByRecency(items: TmdbCreditItem[]): TmdbCreditItem[] {
  return [...items].sort((a, b) => {
    const dateA = a.release_date ?? a.first_air_date ?? "";
    const dateB = b.release_date ?? b.first_air_date ?? "";
    return dateB.localeCompare(dateA);
  });
}

async function toCredits(items: TmdbCreditItem[], roleOf: (item: TmdbCreditItem) => string): Promise<PersonCredit[]> {
  const inserts = await Promise.all(
    items.map((item) => mapListItemToTitleInsert(item, item.media_type as MediaType)),
  );
  const rows = await upsertTitles(inserts);
  const dtos = await toTitleDtos(rows);
  return dtos.map((title, i) => ({ title, role: roleOf(items[i]) }));
}

export async function getPersonDetail(personId: number): Promise<PersonDetail> {
  const [person, credits] = await Promise.all([
    tmdbGet<TmdbPersonResponse>(`/person/${personId}`),
    tmdbGet<TmdbCombinedCreditsResponse>(`/person/${personId}/combined_credits`),
  ]);

  const actingCredits = sortByRecency(dedupeByTitle(credits.cast)).slice(0, 30);
  const notableCrewJobs = new Set(["Director", "Writer", "Screenplay", "Producer", "Executive Producer", "Creator"]);
  const crewCredits = sortByRecency(dedupeByTitle(credits.crew.filter((c) => notableCrewJobs.has(c.job ?? "")))).slice(
    0,
    30,
  );

  const [actingResult, crewResult] = await Promise.all([
    toCredits(actingCredits, (item) => item.character ?? ""),
    toCredits(crewCredits, (item) => item.job ?? ""),
  ]);

  return {
    personId: person.id,
    name: person.name,
    profileUrl: await profileUrl(person.profile_path),
    biography: person.biography,
    knownForDepartment: person.known_for_department,
    birthday: person.birthday,
    actingCredits: actingResult,
    crewCredits: crewResult,
  };
}
