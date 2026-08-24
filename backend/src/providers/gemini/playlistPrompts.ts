interface LikedTitleSummary {
  title: string;
  mediaType: string;
  year: string;
  genres: string[];
}

interface CandidateSummary {
  tmdbId: number;
  mediaType: string;
  title: string;
  year: string;
  genres: string[];
  overview: string;
}

const SLOT_DESCRIPTIONS = `Produce exactly three slots:
- "weekend_picks": a well-rounded mix for a weekend of watching, leaning on the user's top genres. Choose from either candidate list.
- "because_you_liked": picks that are thematically or stylistically close to specific titles the user liked (mention which one in the reason). Choose from either candidate list.
- "hidden_gems": picks that are genuinely less mainstream, not just "less popular within the trending list". Choose ONLY from the GEMS CANDIDATES list for this slot — never pick a title from TRENDING CANDIDATES here.

Pick 6-10 items per slot. Every tmdbId + mediaType you return MUST come exactly from one of the two candidate lists below — never invent one. Do not repeat the same tmdbId across slots. Each pick needs a one-sentence, specific "reason" (not generic). Each slot also needs a one-sentence "slotReason" explaining why that slot was curated this way FOR THIS USER specifically — reference their actual liked titles or genres, not boilerplate.`;

export function buildPlaylistPrompt(
  likedTitles: LikedTitleSummary[],
  topGenres: string[],
  trendingCandidates: CandidateSummary[],
  gemsCandidates: CandidateSummary[],
): string {
  const likedBlock =
    likedTitles.length > 0
      ? likedTitles.map((t) => `- ${t.title} (${t.mediaType}, ${t.year}) [${t.genres.join(", ")}]`).join("\n")
      : "(no likes recorded yet — lean on general popularity and variety)";

  const fmt = (c: CandidateSummary) =>
    `- tmdbId=${c.tmdbId} mediaType=${c.mediaType} "${c.title}" (${c.year}) [${c.genres.join(", ")}] — ${c.overview.slice(0, 140)}`;

  const trendingBlock = trendingCandidates.map(fmt).join("\n");
  const gemsBlock = gemsCandidates.length > 0 ? gemsCandidates.map(fmt).join("\n") : "(none available this time)";

  return `You are curating personalized watch playlists for Marquee, a movie/TV app.

USER'S LIKED TITLES:
${likedBlock}

USER'S TOP GENRES: ${topGenres.length > 0 ? topGenres.join(", ") : "(none yet)"}

TRENDING CANDIDATES (popular right now):
${trendingBlock}

GEMS CANDIDATES (well-regarded but not mainstream-popular — hidden_gems picks MUST come only from here):
${gemsBlock}

${SLOT_DESCRIPTIONS}

Respond with only the JSON object matching the schema.`;
}
