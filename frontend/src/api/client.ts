// Single API layer with a mock/real switch, so pages never know where data comes from.
// - VITE_USE_MOCK unset or "true"  -> served from src/mock/data.ts (prototype, task #2)
// - VITE_USE_MOCK=false            -> calls the FastAPI backend (task #3, just an env flip)
// Field names match the backend responses exactly (backend/app/routers/*).

import type {
  Genre,
  MovieDetail,
  MovieListItem,
  PersonalizedItem,
  RatingRow,
  SimilarMovie,
  UserSummary,
} from "../types";
import {
  GENRES,
  MOVIES,
  SEED_RATINGS,
  USERS,
  findMovie,
  type MockMovie,
} from "../mock/data";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK as string | undefined) !== "false";
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
const LATENCY = 150; // fake delay so loading states show up in the demo

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body.detail) detail =
        typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* error body was not JSON */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), LATENCY),
  );
}

function rejected<T>(status: number, message: string): Promise<T> {
  return Promise.reject(new ApiError(status, message));
}

function paginate<T>(rows: T[], limit: number, offset: number): T[] {
  return rows.slice(offset, offset + limit);
}

function toListItem(m: MockMovie): MovieListItem {
  return { movie_id: m.movie_id, title: m.title, year: m.year };
}

// PostgreSQL NUMERIC/DECIMAL columns arrive as JSON strings (e.g. "4.5").
function num(v: unknown): number {
  return typeof v === "string" ? Number(v) : (v as number);
}

function utcNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ---------------------------------------------------------------- ratings
// Mock writes are persisted to localStorage so "rate -> My Ratings" survives
// a page reload during prototyping and screen recording.

const EXTRA_KEY = "movierec.mock.ratings";

type ExtraRatings = Record<string, Record<string, { rating: number; rated_at: string }>>;

function readExtras(): ExtraRatings {
  try {
    return JSON.parse(localStorage.getItem(EXTRA_KEY) ?? "{}") as ExtraRatings;
  } catch {
    return {};
  }
}

function writeExtras(all: ExtraRatings): void {
  localStorage.setItem(EXTRA_KEY, JSON.stringify(all));
}

/** Ratings for a user = dataset seed + user's mock edits (newest first). */
export function mockRatingsOf(userId: number): RatingRow[] {
  const seed = SEED_RATINGS[userId] ?? [];
  const rows: RatingRow[] = [];
  for (const [movieId, rating, daysAgo] of seed) {
    const movie = findMovie(movieId);
    if (movie)
      rows.push({
        movie_id: movie.movie_id,
        title: movie.title,
        year: movie.year,
        rating,
        rated_at: new Date(Date.now() - daysAgo * 86400000)
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
      });
  }
  const extras = readExtras()[String(userId)] ?? {};
  for (const [movieIdStr, edit] of Object.entries(extras)) {
    const movie = findMovie(Number(movieIdStr));
    if (!movie) continue;
    const existing = rows.find((r) => r.movie_id === movie.movie_id);
    if (existing) {
      existing.rating = edit.rating;
      existing.rated_at = edit.rated_at;
    } else {
      rows.push({
        movie_id: movie.movie_id,
        title: movie.title,
        year: movie.year,
        rating: edit.rating,
        rated_at: edit.rated_at,
      });
    }
  }
  return rows.sort((a, b) => (a.rated_at < b.rated_at ? 1 : -1));
}

export function resetMockRatings(): void {
  localStorage.removeItem(EXTRA_KEY);
}

// ---------------------------------------------------------------- endpoints

export function listGenres(): Promise<Genre[]> {
  if (!USE_MOCK) return http<Genre[]>("/genres");
  return delay(GENRES);
}

export interface MovieQuery {
  query?: string;
  genreId?: number;
  limit?: number;
  offset?: number;
}

/** GET /api/movies — browse, title search, genre filter, pagination. */
export function listMovies(params: MovieQuery = {}): Promise<MovieListItem[]> {
  if (!USE_MOCK) {
    const q = new URLSearchParams();
    if (params.query) q.set("query", params.query);
    if (params.genreId) q.set("genre_id", String(params.genreId));
    q.set("limit", String(params.limit ?? 20));
    q.set("offset", String(params.offset ?? 0));
    return http<MovieListItem[]>(`/movies?${q.toString()}`);
  }
  const term = (params.query ?? "").trim().toLowerCase();
  const rows = MOVIES.filter(
    (m) =>
      (!term || m.title.toLowerCase().includes(term)) &&
      (!params.genreId || m.genreIds.includes(params.genreId)),
  )
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(toListItem);
  return delay(paginate(rows, params.limit ?? 20, params.offset ?? 0));
}

/** GET /api/movies/{id} — detail with genres, avg rating and rating count. */
export function getMovie(movieId: number): Promise<MovieDetail> {
  if (!USE_MOCK)
    return http<MovieDetail>(`/movies/${movieId}`).then((m) => ({
      ...m,
      avg_rating: m.avg_rating === null ? null : num(m.avg_rating),
    }));
  const movie = findMovie(movieId);
  if (!movie) return rejected<MovieDetail>(404, "Movie not found");
  const { genreIds: _ids, ...detail } = movie;
  void _ids;
  return delay(detail);
}

/** GET /api/users/{id} — activity counts (schema stores no profile fields). */
export function getUser(userId: number): Promise<UserSummary> {
  if (!USE_MOCK) return http<UserSummary>(`/users/${userId}`);
  if (!USERS.some((u) => u.user_id === userId))
    return rejected<UserSummary>(404, "User not found");
  return delay({
    user_id: userId,
    ratings_count: mockRatingsOf(userId).length,
    tags_count: 0,
    watch_count: 0,
  });
}

/** GET /api/users/{id}/ratings — rating history, newest first. */
export function getUserRatings(
  userId: number,
  limit = 10,
  offset = 0,
): Promise<RatingRow[]> {
  if (!USE_MOCK)
    return http<RatingRow[]>(
      `/users/${userId}/ratings?limit=${limit}&offset=${offset}`,
    ).then((rows) => rows.map((r) => ({ ...r, rating: num(r.rating) })));
  return delay(paginate(mockRatingsOf(userId), limit, offset));
}

/** GET /api/users/{uid}/ratings/{mid} — the user's current rating, or null. */
export function getMyRating(
  userId: number,
  movieId: number,
): Promise<number | null> {
  if (!USE_MOCK)
    return http<{ rating: unknown }>(`/users/${userId}/ratings/${movieId}`).then(
      (r) => (r.rating === null || r.rating === undefined ? null : num(r.rating)),
    );
  return delay(mockRatingsOf(userId).find((r) => r.movie_id === movieId)?.rating ?? null);
}

/** PUT /api/users/{uid}/ratings/{mid} — create or update a half-star rating. */
export function putRating(
  userId: number,
  movieId: number,
  rating: number,
): Promise<RatingRow> {
  if (!USE_MOCK)
    return http<RatingRow>(`/users/${userId}/ratings/${movieId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
  const movie = findMovie(movieId);
  if (!movie) return rejected<RatingRow>(404, "Movie not found");
  const all = readExtras();
  const perUser = all[String(userId)] ?? {};
  perUser[String(movieId)] = { rating, rated_at: utcNow() };
  all[String(userId)] = perUser;
  writeExtras(all);
  return delay({
    movie_id: movie.movie_id,
    title: movie.title,
    year: movie.year,
    rating,
    rated_at: perUser[String(movieId)].rated_at,
  });
}

/** GET /api/recommendations/movies/{id}/similar — Genre-based Jaccard top-N. */
export function getSimilarMovies(
  movieId: number,
  limit = 10,
): Promise<SimilarMovie[]> {
  if (!USE_MOCK)
    return http<SimilarMovie[]>(
      `/recommendations/movies/${movieId}/similar?limit=${limit}`,
    ).then((rows) =>
      rows.map((r) => ({ ...r, similarity_score: num(r.similarity_score) })),
    );
  const source = findMovie(movieId);
  if (!source) return rejected<SimilarMovie[]>(404, "Movie not found");
  const a = new Set(source.genreIds);
  const rows = MOVIES.filter((m) => m.movie_id !== movieId)
    .map((m) => {
      const b = new Set(m.genreIds);
      const intersection = [...a].filter((g) => b.has(g)).length;
      const union = new Set([...a, ...b]).size;
      return {
        movie_id: m.movie_id,
        title: m.title,
        year: m.year,
        similarity_score: union > 0 ? intersection / union : 0,
        recommendation_rank: 0,
      };
    })
    .filter((m) => m.similarity_score > 0)
    .sort(
      (x, y) =>
        y.similarity_score - x.similarity_score || y.movie_id - x.movie_id,
    )
    .slice(0, limit)
    .map((m, i) => ({ ...m, recommendation_rank: i + 1 }));
  return delay(rows);
}

/** GET /api/recommendations/popular — not implemented by Member A yet. */
export function getPopularMovies(limit = 10): Promise<MovieListItem[]> {
  if (!USE_MOCK)
    return http<MovieListItem[]>(`/recommendations/popular?limit=${limit}`);
  // Mock stand-in: avg rating weighted by how many ratings exist.
  const rows = [...MOVIES]
    .sort(
      (a, b) =>
        (b.avg_rating ?? 0) * Math.log10(b.rating_count + 1) -
        (a.avg_rating ?? 0) * Math.log10(a.rating_count + 1),
    )
    .slice(0, limit)
    .map(toListItem);
  return delay(rows);
}

/**
 * GET /api/recommendations/users/{id} — not implemented by Member A yet.
 * Mock stand-in: rating-weighted genre affinity, excluding already-rated movies.
 */
export function getPersonalizedMovies(
  userId: number,
  limit = 12,
): Promise<PersonalizedItem[]> {
  if (!USE_MOCK) {
    // Provisional endpoint returns flat rows: {movie_id,title,year,score}.
    return http<Array<{ movie_id: number; title: string; year: number | null; score: unknown }>>(
      `/recommendations/users/${userId}?limit=${limit}`,
    ).then((rows) =>
      rows.map((r) => ({
        movie: { movie_id: r.movie_id, title: r.title, year: r.year },
        score: num(r.score),
        reason: "Similar to your top-rated movies",
      })),
    );
  }
  const rated = mockRatingsOf(userId);
  if (rated.length === 0) return Promise.resolve([]);

  const affinity = new Map<number, { weight: number; count: number }>();
  for (const row of rated) {
    const movie = findMovie(row.movie_id);
    if (!movie) continue;
    for (const genreId of movie.genreIds) {
      const cur = affinity.get(genreId) ?? { weight: 0, count: 0 };
      cur.weight += row.rating;
      cur.count += 1;
      affinity.set(genreId, cur);
    }
  }
  const topRated = [...rated].sort((a, b) => b.rating - a.rating)[0];
  const alreadyRated = new Set(rated.map((r) => r.movie_id));

  const items = MOVIES.filter((m) => !alreadyRated.has(m.movie_id))
    .map((m) => {
      let raw = 0;
      const matchedGenres: string[] = [];
      for (const genreId of m.genreIds) {
        const a = affinity.get(genreId);
        if (!a) continue;
        raw += (a.weight / a.count) * (a.count / rated.length);
        matchedGenres.push(m.genres[m.genreIds.indexOf(genreId)]);
      }
      return {
        movie: { movie_id: m.movie_id, title: m.title, year: m.year },
        score: raw * Math.log10(m.rating_count + 1),
        reason:
          matchedGenres.length > 0
            ? `Matches your interest in ${matchedGenres.slice(0, 2).join(" / ")}`
            : `Because you rated ${topRated.title}`,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return delay(items);
}

export const KNOWN_USER_IDS = USERS.map((u) => u.user_id);
