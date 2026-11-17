// Types mirror the implemented backend responses (backend/app/routers/*).
// Keep field names identical to the API so mock and real mode share one code path.

export interface Genre {
  genre_id: number;
  name: string;
}

export interface MovieListItem {
  movie_id: number;
  title: string;
  year: number | null;
}

export interface MovieDetail extends MovieListItem {
  genres: string[];
  avg_rating: number | null;
  rating_count: number;
}

export interface UserSummary {
  user_id: number;
  ratings_count: number;
  tags_count: number;
  watch_count: number;
}

export interface RatingRow {
  movie_id: number;
  title: string;
  year: number | null;
  rating: number;
  rated_at: string;
}

export interface SimilarMovie extends MovieListItem {
  similarity_score: number;
  recommendation_rank: number;
}

// Composed client-side until Member A ships GET /api/recommendations/users/{id}
// (see docs/recommendation-requirements-pending.md).
export interface PersonalizedItem {
  movie: MovieListItem;
  score: number;
  reason: string;
}
