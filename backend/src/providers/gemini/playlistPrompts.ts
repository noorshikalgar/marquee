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
- "weekend_picks": a well-rounded mix for a weekend of watching, leaning on the user's top genres.
- "because_you_liked": picks that are thematically or stylistically close to specific titles the user liked (mention which in the reason).
- "hidden_gems": picks that are less mainstream (lower popularity in the candidate list) but still a strong match for the user's taste.

Pick 6-10 items per slot. Every tmdbId + mediaType you return MUST come exactly from the CANDIDATES list below — never invent one. Do not repeat the same tmdbId across slots. Each pick needs a one-sentence, specific "reason" (not generic).`;

export function buildPlaylistPrompt(
  likedTitles: LikedTitleSummary[],
  topGenres: string[],
  candidates: CandidateSummary[],
): string {
  const likedBlock =
    likedTitles.length > 0
      ? likedTitles.map((t) => `- ${t.title} (${t.mediaType}, ${t.year}) [${t.genres.join(", ")}]`).join("\n")
      : "(no likes recorded yet — lean on general popularity and variety)";

  const candidatesBlock = candidates
    .map((c) => `- tmdbId=${c.tmdbId} mediaType=${c.mediaType} "${c.title}" (${c.year}) [${c.genres.join(", ")}] — ${c.overview.slice(0, 140)}`)
    .join("\n");

  return `You are curating personalized watch playlists for Marquee, a movie/TV app.

USER'S LIKED TITLES:
${likedBlock}

USER'S TOP GENRES: ${topGenres.length > 0 ? topGenres.join(", ") : "(none yet)"}

CANDIDATES (only choose from this list):
${candidatesBlock}

${SLOT_DESCRIPTIONS}

Respond with only the JSON object matching the schema.`;
}
