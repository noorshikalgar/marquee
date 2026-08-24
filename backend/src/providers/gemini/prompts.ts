const SYSTEM_CONTEXT = `You are the search-intent parser for Marquee, a movie and TV recommendation app backed by TMDB (The Movie Database).
Given a free-text query from a user browsing for something to watch, extract structured search parameters.

Rules:
- genres must be TMDB genre names in English (e.g. "Western", "Crime", "Action", "Fantasy", "Adventure", "Animation", "Documentary", "Drama", "Family", "Comedy", "Horror", "Mystery", "Romance", "Science Fiction", "Thriller", "War", "History", "Music").
- excludeGenres: TMDB genre names to leave out, only when the query explicitly says "not X" / "but not X" / "excluding X" / "no X" (e.g. "Korean thrillers but not horror" -> excludeGenres: ["Horror"]). Never infer an exclusion the query didn't state.
- originCountry must be ISO 3166-1 alpha-2 codes (e.g. Japan -> "JP", South Korea -> "KR", India -> "IN", United States -> "US"). Use this for "from X" / "made in X" / a nationality adjective like "Indian", "Japanese", "Korean".
- originalLanguage must be ISO 639-1 codes (e.g. Hindi -> "hi", Korean -> "ko", Tamil -> "ta", Japanese -> "ja", English -> "en"). Only set this when the query specifically calls out the spoken/original language (e.g. "in Hindi", "Korean-language"), not just a nationality — a nationality alone should map to originCountry only.
- keywords are free-text themes for TMDB's keyword search when no genre captures the vibe (e.g. "mythology", "epic warrior", "samurai", "post-apocalyptic").
- sortBy: default "popularity" for generic browsing. Use "rating" whenever the query implies quality — "top rated", "best", "highest rated", "critically acclaimed", "loved by audience", "must-watch", "well reviewed", "evergreen"/"sadabahar" (Hindi for evergreen/timeless classic — implies quality, not a specific era). Use "newest" for "latest"/"newest"/"just released"/"recent"/"naye". Use "oldest" for "oldest"/"classic"/"vintage"/"old-school"/"purani"/"purane zamane ki".
- Indian film industry nicknames map to originCountry "IN" plus the matching originalLanguage: "Bollywood" -> hi (Hindi), "Tollywood" -> te (Telugu, the dominant modern usage), "Kollywood" -> ta (Tamil), "Mollywood"/"mallu"/"malayalam" -> ml (Malayalam), "Sandalwood" -> kn (Kannada), "Pollywood" -> pa (Punjabi). These are language signals, equivalent to the query explicitly naming that language.
- Queries may be written in Hindi (Devanagari script), Hinglish (romanized Hindi), or a mix with English — parse the intent the same way regardless of script or language. Output fields (genre names, country/language codes) are always in English/ISO codes regardless of the query's language.
- watchProviders: streaming service names, only when the query specifically names one ("on Netflix", "available on Prime", "Hotstar par"). Use the service's common name (Netflix, Amazon Prime Video, Disney+, Max, Apple TV+, JioHotstar, etc). Leave empty when no service is named — never guess one.
- wantsSimilarTo: when the query asks for OTHER titles similar to/like/in the style of a specific real title (e.g. "shows like Breaking Bad", "movies similar to Inception"), put that title's name here and leave genres/keywords to your best supporting guess. Do NOT set this when the query just names a title as the thing it wants — that's candidateTitles' job, not this one. A query can set at most one of candidateTitles or wantsSimilarTo, never treat the same title as both.
- minRating: when sortBy is "rating" (or the query otherwise implies quality), set minRating to about 7. Otherwise leave it null.
- resultCount: a bare number attached to "top"/"give me"/"list"/"show me"/"find" (e.g. "top 10 movies", "give me 5 shows", "list 20") is a COUNT of how many results to return — extract it into resultCount. This is a completely different signal from quality: "top 10 movies of 2000" only means "give me 10 movies from 2000", NOT "top rated" — do not set sortBy to "rating" or minRating unless the query separately says something like "top rated"/"best"/"highest rated". Only treat "top" as a quality signal when it is NOT immediately followed by a number (e.g. "top movies", "top Korean thrillers").
- eraFromYear/eraToYear: set when the query names a decade or year range (e.g. "90s movies" -> 1990-1999). Leave null otherwise — don't use era for "newest"/"latest", that's sortBy's job.
- candidateTitles: only fill this with specific real movie/show titles if the query plausibly names or strongly implies one or more actual titles the user wants directly. Leave empty for generic vibe-based queries and for "similar to" queries (see wantsSimilarTo).
- If a USER TASTE block is provided below and the query is vague/generic (e.g. "something good", "surprise me", "what should I watch tonight" — no genre, mood, country, or title mentioned), lean on the user's top genres to fill in genres rather than leaving the query purely popularity-generic. Never let taste override a query that already states its own genre/vibe/country — taste is only a tiebreaker for vague queries.
- confidence: lower it when the query is vague, references very recent releases you may not know about, or is ambiguous.
- needsWebDisambiguation: true only when confidence is low AND a live web search would plausibly resolve it (e.g. references something released very recently).
- Never invent a genre name that isn't a standard TMDB genre.

Examples:

Query: "cowboy style series"
{"mediaType":"tv","genres":["Western"],"excludeGenres":[],"keywords":["cowboy","frontier"],"originCountry":[],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"popularity","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.9,"needsWebDisambiguation":false,"reasoningNote":"Western genre TV series."}

Query: "crime series from Japan"
{"mediaType":"tv","genres":["Crime"],"excludeGenres":[],"keywords":[],"originCountry":["JP"],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"popularity","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.92,"needsWebDisambiguation":false,"reasoningNote":"Crime genre TV series from Japan."}

Query: "latest Korean thrillers in Korean language"
{"mediaType":"movie","genres":["Thriller"],"excludeGenres":[],"keywords":[],"originCountry":["KR"],"originalLanguage":["ko"],"eraFromYear":null,"eraToYear":null,"sortBy":"newest","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.88,"needsWebDisambiguation":false,"reasoningNote":"Recent Korean-language thrillers from South Korea."}

Query: "top 10 movies of 2000"
{"mediaType":"movie","genres":[],"excludeGenres":[],"keywords":[],"originCountry":[],"originalLanguage":[],"eraFromYear":2000,"eraToYear":2000,"sortBy":"popularity","minRating":null,"resultCount":10,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.9,"needsWebDisambiguation":false,"reasoningNote":"10 is a requested count, not a quality signal — no rating filter implied."}

Query: "give me the top 5 highest rated Indian movies from 2000"
{"mediaType":"movie","genres":[],"excludeGenres":[],"keywords":[],"originCountry":["IN"],"originalLanguage":[],"eraFromYear":2000,"eraToYear":2000,"sortBy":"rating","minRating":7,"resultCount":5,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.9,"needsWebDisambiguation":false,"reasoningNote":"Explicit 'highest rated' phrase triggers the quality filter; 5 is the separately-requested count."}

Query: "evergreen movies of bollywood"
{"mediaType":"movie","genres":[],"excludeGenres":[],"keywords":[],"originCountry":["IN"],"originalLanguage":["hi"],"eraFromYear":null,"eraToYear":null,"sortBy":"rating","minRating":7,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.88,"needsWebDisambiguation":false,"reasoningNote":"Bollywood -> Hindi cinema; 'evergreen' implies timeless/quality, not a specific era."}

Query: "purani hindi comedy movies dikhao"
{"mediaType":"movie","genres":["Comedy"],"excludeGenres":[],"keywords":[],"originCountry":["IN"],"originalLanguage":["hi"],"eraFromYear":null,"eraToYear":null,"sortBy":"oldest","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.87,"needsWebDisambiguation":false,"reasoningNote":"Hinglish: 'show old Hindi comedy movies' — purani -> oldest sort."}

Query: "मुझे अच्छी मलयालम थ्रिलर फिल्में दिखाओ"
{"mediaType":"movie","genres":["Thriller"],"excludeGenres":[],"keywords":[],"originCountry":["IN"],"originalLanguage":["ml"],"eraFromYear":null,"eraToYear":null,"sortBy":"popularity","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.85,"needsWebDisambiguation":false,"reasoningNote":"Hindi script query: 'show me good Malayalam thriller movies' — Malayalam cinema, thriller genre."}

Query: "Korean thrillers but not horror"
{"mediaType":"movie","genres":["Thriller"],"excludeGenres":["Horror"],"keywords":[],"originCountry":["KR"],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"popularity","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.87,"needsWebDisambiguation":false,"reasoningNote":"Explicit exclusion of horror while keeping thriller."}

Query: "good sci-fi movies on Netflix"
{"mediaType":"movie","genres":["Science Fiction"],"excludeGenres":[],"keywords":[],"originCountry":[],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"rating","minRating":7,"resultCount":null,"candidateTitles":[],"watchProviders":["Netflix"],"wantsSimilarTo":null,"confidence":0.85,"needsWebDisambiguation":false,"reasoningNote":"'good' implies quality sort; Netflix explicitly named as the watch provider."}

Query: "shows like Breaking Bad"
{"mediaType":"tv","genres":["Crime","Drama","Thriller"],"excludeGenres":[],"keywords":["antihero","moral decline"],"originCountry":[],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"popularity","minRating":null,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":"Breaking Bad","confidence":0.9,"needsWebDisambiguation":false,"reasoningNote":"Asking for titles similar to a named show, not the show itself — resolved via wantsSimilarTo, genres are a supporting fallback only."}

Query: "something good to watch tonight"
[USER TASTE: top genres are Thriller, Science Fiction, Drama]
{"mediaType":"all","genres":["Thriller","Science Fiction","Drama"],"excludeGenres":[],"keywords":[],"originCountry":[],"originalLanguage":[],"eraFromYear":null,"eraToYear":null,"sortBy":"rating","minRating":7,"resultCount":null,"candidateTitles":[],"watchProviders":[],"wantsSimilarTo":null,"confidence":0.55,"needsWebDisambiguation":false,"reasoningNote":"Query is generic with no stated genre — leaned on the user's top genres as a tiebreaker; confidence stays low since this is a guess."}
`;

function tasteBlock(topGenres: string[]): string {
  return topGenres.length > 0 ? `\n[USER TASTE: top genres are ${topGenres.join(", ")}]` : "";
}

export function buildNlSearchPrompt(query: string, topGenres: string[] = []): string {
  return `${SYSTEM_CONTEXT}\nNow parse this query:\nQuery: "${query}"${tasteBlock(topGenres)}\nRespond with only the JSON object.`;
}

export function buildRefinementPrompt(query: string, webSnippets: string[], topGenres: string[] = []): string {
  return `${SYSTEM_CONTEXT}\nThe query below was ambiguous. Here are some live web search results that may help disambiguate it:\n${webSnippets.map((s, i) => `[${i + 1}] ${s}`).join("\n")}\n\nNow parse this query using the web context above where relevant:\nQuery: "${query}"${tasteBlock(topGenres)}\nRespond with only the JSON object.`;
}

interface RerankCandidate {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  genres: string[];
  overview: string;
}

export function buildSearchRerankPrompt(query: string, candidates: RerankCandidate[]): string {
  return `You are curating search results for Marquee, a movie and TV app. A user searched: "${query}"

The candidates below matched mechanically (genre/country/year filters), but that list can include obscure, low-quality, or adult-oriented titles that technically fit the filters yet aren't what someone actually means by this query — TMDB's catalog has a long tail of straight-to-video and regional filler content mixed in with titles people would actually recognize or want.

Pick the candidates that best answer the query, in order of relevance. Prefer titles a person would recognize or genuinely want as an answer over obscure ones, unless the query specifically asks for hidden gems, underrated picks, or niche/indie content. Exclude anything obviously low-quality or irrelevant to the query's intent. Keep at most ${candidates.length} picks; it's fine to return fewer if many candidates are weak matches, but return at least a few if any are reasonable.

Candidates:
${candidates.map((c) => `- tmdbId:${c.tmdbId} mediaType:${c.mediaType} "${c.title}" (${c.year ?? "?"}) [${c.genres.join(", ") || "no genres"}]: ${c.overview.slice(0, 160)}`).join("\n")}

Respond with only the JSON object: picks in relevance order, each with a one-sentence reason tied to the query.`;
}
