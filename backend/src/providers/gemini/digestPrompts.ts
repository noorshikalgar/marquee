interface DigestCandidate {
  tmdbId: number;
  mediaType: string;
  title: string;
  category: string;
  overview: string;
}

export function buildDigestPrompt(candidates: DigestCandidate[]): string {
  const block = candidates
    .map((c) => `- tmdbId=${c.tmdbId} mediaType=${c.mediaType} category=${c.category} "${c.title}" — ${c.overview.slice(0, 160)}`)
    .join("\n");

  return `You write short, enticing daily-digest notification blurbs for Marquee, a movie/TV recommendation app.

For each candidate below, write a punchy one-line "headline" (max 8 words, e.g. "New trailer dropped" / "Now streaming" / "Coming next week") and a one-sentence "body" that makes the user want to check it out. Keep it factual to the overview given, no spoilers.

CANDIDATES (respond about every one of these, using the exact tmdbId + mediaType):
${block}

Respond with only the JSON object matching the schema.`;
}
