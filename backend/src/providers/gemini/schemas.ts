import { Type } from "@google/genai";

export const nlQuerySchema = {
  type: Type.OBJECT,
  properties: {
    mediaType: { type: Type.STRING, enum: ["movie", "tv", "all"] },
    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    originCountry: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ISO 3166-1 alpha-2 country codes, e.g. India -> IN, Japan -> JP" },
    originalLanguage: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "ISO 639-1 language codes when the query names a specific spoken/original language, e.g. Hindi -> hi, Korean -> ko, Tamil -> ta",
    },
    eraFromYear: { type: Type.INTEGER, nullable: true },
    eraToYear: { type: Type.INTEGER, nullable: true },
    sortBy: {
      type: Type.STRING,
      enum: ["popularity", "rating", "newest", "oldest"],
      description: "popularity: default general browsing. rating: query says top rated/best/highest rated/critically acclaimed/loved by audience/must-watch. newest: query says latest/newest/just released/recent. oldest: query says oldest/classic/vintage.",
    },
    minRating: {
      type: Type.NUMBER,
      nullable: true,
      description: "0-10 TMDB rating floor. Set to roughly 7 when the query implies quality (top rated, best, acclaimed, loved by audience). Leave null otherwise. A bare number before the word 'movies'/'shows' (e.g. 'top 10 movies') is a COUNT, not a quality signal — do not set this from it.",
    },
    resultCount: {
      type: Type.INTEGER,
      nullable: true,
      description: "How many results the user explicitly asked for, e.g. 'top 10 movies' -> 10, 'give me 5 shows' -> 5, 'list 20' -> 20. Null if no count was requested. This is independent of sortBy/minRating.",
    },
    candidateTitles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific real movie/show titles this query might be referring to, if any",
    },
    excludeGenres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "TMDB genre names to exclude, when the query says 'not X' / 'but not X' / 'excluding X' / 'no X'. e.g. 'Korean thrillers but not horror' -> excludeGenres: [\"Horror\"].",
    },
    watchProviders: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Streaming service names, only when the query specifically names one, e.g. 'on Netflix', 'available on Prime' -> [\"Netflix\"]. Leave empty otherwise — do not guess a service.",
    },
    wantsSimilarTo: {
      type: Type.STRING,
      nullable: true,
      description: "Set this to a real title's name ONLY when the query asks for OTHER titles similar to/like/in the style of it (e.g. 'shows like Breaking Bad' -> \"Breaking Bad\"). Do not set this when the query is just naming the title itself as what it wants (that's candidateTitles' job) — this field is specifically for 'similar to' requests.",
    },
    confidence: { type: Type.NUMBER, description: "0 to 1, how confident the interpretation is" },
    needsWebDisambiguation: {
      type: Type.BOOLEAN,
      description: "True if the query references something recent/obscure that may need a live web lookup",
    },
    reasoningNote: { type: Type.STRING, description: "One short sentence explaining the interpretation" },
  },
  required: [
    "mediaType",
    "genres",
    "keywords",
    "originCountry",
    "originalLanguage",
    "sortBy",
    "candidateTitles",
    "excludeGenres",
    "watchProviders",
    "confidence",
    "needsWebDisambiguation",
  ],
};

export interface NlQueryResult {
  mediaType: "movie" | "tv" | "all";
  genres: string[];
  keywords: string[];
  originCountry: string[];
  originalLanguage: string[];
  eraFromYear: number | null;
  eraToYear: number | null;
  sortBy: "popularity" | "rating" | "newest" | "oldest";
  minRating: number | null;
  resultCount: number | null;
  candidateTitles: string[];
  excludeGenres: string[];
  watchProviders: string[];
  wantsSimilarTo: string | null;
  confidence: number;
  needsWebDisambiguation: boolean;
  reasoningNote: string;
}

export const playlistSlotsSchema = {
  type: Type.OBJECT,
  properties: {
    slots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slot: { type: Type.STRING, enum: ["weekend_picks", "because_you_liked", "hidden_gems"] },
          slotReason: {
            type: Type.STRING,
            description: "One sentence explaining why THIS SLOT was curated the way it was, referencing the user's actual taste signals (e.g. \"You've been liking a lot of tense thrillers lately, so this leans into slow-burn suspense.\"). Specific to this user, not generic boilerplate.",
          },
          picks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tmdbId: { type: Type.INTEGER },
                mediaType: { type: Type.STRING, enum: ["movie", "tv"] },
                reason: { type: Type.STRING },
              },
              required: ["tmdbId", "mediaType", "reason"],
            },
          },
        },
        required: ["slot", "slotReason", "picks"],
      },
    },
  },
  required: ["slots"],
};

export interface PlaylistSlotsResult {
  slots: {
    slot: "weekend_picks" | "because_you_liked" | "hidden_gems";
    slotReason: string;
    picks: { tmdbId: number; mediaType: "movie" | "tv"; reason: string }[];
  }[];
}

export const digestBlurbSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tmdbId: { type: Type.INTEGER },
          mediaType: { type: Type.STRING, enum: ["movie", "tv"] },
          headline: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ["tmdbId", "mediaType", "headline", "body"],
      },
    },
  },
  required: ["items"],
};

export interface DigestBlurbResult {
  items: { tmdbId: number; mediaType: "movie" | "tv"; headline: string; body: string }[];
}

export const searchRerankSchema = {
  type: Type.OBJECT,
  properties: {
    picks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tmdbId: { type: Type.INTEGER },
          mediaType: { type: Type.STRING, enum: ["movie", "tv"] },
          reason: { type: Type.STRING, description: "One short sentence on why this is a good match for the query." },
        },
        required: ["tmdbId", "mediaType", "reason"],
      },
    },
  },
  required: ["picks"],
};

export interface SearchRerankResult {
  picks: { tmdbId: number; mediaType: "movie" | "tv"; reason: string }[];
}
