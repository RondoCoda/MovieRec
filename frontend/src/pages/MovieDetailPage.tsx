// Page 3 — Movie detail: info + half-star rating (FR-3/FR-4) + similar movies
// (FR-9). The rating box pre-fills the current user's existing rating.

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMovie,
  getMyRating,
  getPersonalizedMovies,
  getSimilarMovies,
  putRating,
} from "../api/client";
import { EmptyState, ErrorState, Loading } from "../components/AsyncStates";
import MovieCard from "../components/MovieCard";
import StarRating from "../components/StarRating";
import { useCurrentUser } from "../context/UserContext";
import type { MovieDetail, PersonalizedItem, SimilarMovie } from "../types";

export default function MovieDetailPage() {
  const { id } = useParams();
  const movieId = Number(id);
  const { userId } = useCurrentUser();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [forYou, setForYou] = useState<PersonalizedItem[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    setMovie(null);
    getMovie(movieId)
      .then(setMovie)
      .catch(setError);
    getSimilarMovies(movieId, 8).then(setSimilar).catch(() => setSimilar([]));
    getPersonalizedMovies(userId, 8).then(setForYou).catch(() => setForYou([]));
    getMyRating(userId, movieId)
      .then(setMyRating)
      .catch(() => setMyRating(null));
  }, [movieId, userId]);

  useEffect(load, [load]);

  const rate = async (value: number) => {
    setSaving(true);
    setSaveError(null);
    try {
      await putRating(userId, movieId, value);
      setMyRating(value);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save rating");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!movie) return <Loading />;

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 style={{ margin: 0 }}>{movie.title}</h1>
          <div className="detail-stats">
            <span>{movie.year ?? "—"}</span>
            <span>
              ★ {movie.avg_rating !== null ? Number(movie.avg_rating).toFixed(2) : "—"}{" "}
              ({movie.rating_count} ratings)
            </span>
          </div>
          <div className="chip-row" style={{ marginTop: 10 }}>
            {movie.genres.map((g) => (
              <span key={g} className="chip">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Your rating</h2>
        <div className="rate-box">
          <StarRating value={myRating} onChange={rate} />
          {saving && <span className="rate-hint">saving…</span>}
          {saveError && <span className="rate-hint" style={{ color: "#e05555" }}>{saveError}</span>}
          <span className="rate-hint">
            {myRating !== null
              ? "Click a star again to update."
              : "Click left half of a star for .5."}
          </span>
        </div>
      </div>

      {similar.length > 0 && (
        <>
          <h2 className="section-title">More Like This</h2>
          <div className="grid">
            {similar.map((m) => (
              <MovieCard
                key={m.movie_id}
                movie={m}
                badge={`${Math.round(m.similarity_score * 100)}% match`}
              />
            ))}
          </div>
        </>
      )}

      {forYou.length > 0 && (
        <>
          <h2 className="section-title">
            For User #{userId} · <Link to="/me/recommendations" style={{ color: "var(--accent)" }}>see all</Link>
          </h2>
          <div className="grid">
            {forYou.slice(0, 4).map((item, i) => (
              <MovieCard key={item.movie.movie_id} movie={item.movie} rank={i + 1} badge={item.reason} />
            ))}
          </div>
        </>
      )}

      {similar.length === 0 && forYou.length === 0 && (
        <EmptyState>No recommendations available for this movie yet.</EmptyState>
      )}
    </>
  );
}
