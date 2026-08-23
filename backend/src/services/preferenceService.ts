import { listInteractions } from "../db/repositories/interactionsRepo.js";
import { replaceAllPreferences } from "../db/repositories/preferencesRepo.js";
import { getTitleById } from "../db/repositories/titlesRepo.js";
import { listPreferences } from "../db/repositories/preferencesRepo.js";

const WEIGHT_BY_TYPE: Record<string, number> = {
  like: 2,
  watched: 1,
  dislike: -2,
  not_interested: -1,
};

export function recalculatePreferences(userId: number) {
  const allInteractions = listInteractions(userId);
  const genreWeights = new Map<string, number>();
  const countryWeights = new Map<string, number>();

  for (const interaction of allInteractions) {
    const title = getTitleById(interaction.titleId);
    if (!title) continue;
    const weight = WEIGHT_BY_TYPE[interaction.interactionType] ?? 0;

    for (const genre of title.genres) {
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + weight);
    }
    for (const country of title.originCountry) {
      countryWeights.set(country, (countryWeights.get(country) ?? 0) + weight);
    }
  }

  const entries = [
    ...[...genreWeights.entries()]
      .filter(([, w]) => w > 0)
      .map(([value, weight]) => ({ prefType: "genre" as const, value, weight })),
    ...[...countryWeights.entries()]
      .filter(([, w]) => w > 0)
      .map(([value, weight]) => ({ prefType: "origin_country" as const, value, weight })),
  ];

  replaceAllPreferences(userId, entries);
  return listPreferences(userId);
}
