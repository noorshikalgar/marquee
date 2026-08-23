export type MediaType = "movie" | "tv";

export interface Title {
  id: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  originCountry: string[];
  originalLanguage: string;
  voteAverage: number;
  voteCount: number;
  imdbId: string | null;
  imdbUrl: string | null;
  runtime: number | null;
  popularity: number;
  localizedTitle?: string | null;
  localizedOverview?: string | null;
}

export interface WatchProvider {
  providerName: string;
  logoUrl: string;
}

export interface WatchProviders {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface CastMember {
  personId: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface CrewMember {
  personId: number;
  name: string;
  job: string;
  profileUrl: string | null;
}

export interface UserInteraction {
  id: number;
  type: InteractionType;
}

export interface TitleDetail extends Title {
  cast: CastMember[];
  crew: CrewMember[];
  watchProviders: WatchProviders;
  trailerYoutubeKey: string | null;
  similar: Title[];
  images: string[];
  userInteractions: UserInteraction[];
}

export interface PersonCredit {
  title: Title;
  role: string;
}

export interface PersonDetail {
  personId: number;
  name: string;
  profileUrl: string | null;
  biography: string;
  knownForDepartment: string | null;
  birthday: string | null;
  actingCredits: PersonCredit[];
  crewCredits: PersonCredit[];
}

export type InteractionType = "like" | "dislike" | "watched" | "not_interested";

export interface Interaction {
  id: number;
  titleId: number;
  interactionType: InteractionType;
  createdAt: string;
}

export type PlaylistKind = "manual" | "watchlist" | "ai_dynamic";

export interface Playlist {
  id: number;
  name: string;
  kind: PlaylistKind;
  description: string | null;
  isSystem: boolean;
  generatedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: number;
  playlistId: number;
  title: Title;
  position: number;
  reason: string | null;
  addedAt: string;
}

export interface NlSearchInterpretation {
  mediaType: MediaType | "all";
  genres: string[];
  keywords: string[];
  originCountry: string[];
  originalLanguage: string[];
  era: { fromYear: number | null; toYear: number | null };
  sortBy: "popularity" | "rating" | "newest" | "oldest";
  minRating: number | null;
}

export interface NlSearchResponse {
  query: string;
  interpreted: NlSearchInterpretation;
  results: Title[];
  aiUnavailable?: boolean;
}

export interface DigestItem {
  titleId: number;
  title: Title;
  headline: string;
  body: string;
  category: "new_trailer" | "upcoming" | "now_playing" | "on_the_air" | "airing_today";
}

export interface Digest {
  id: number;
  generatedAt: string;
  title: string;
  items: DigestItem[];
  pushed: boolean;
  readAt: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface ApiError {
  error: string;
  message: string;
}
