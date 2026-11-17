// Page 5 — For You: personalized recommendations for the current user (FR-6/US-6).

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPersonalizedMovies, getUser } from "../api/client";
import { EmptyState, ErrorState, Loading } from "../components/AsyncStates";
import MovieCard from "../components/MovieCard";
import { useCurrentUser } from "../context/UserContext";
import type { PersonalizedItem, UserSummary } from "../types";

export default function ForYouPage() {
  const { userId } = useCurrentUser();
  const [items, setItems] = useState<PersonalizedItem[] | null>(null);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    setItems(null);
    getPersonalizedMovies(userId, 12)
      .then(setItems)
      .catch(setError);
    getUser(userId).then(setSummary).catch(() => setSummary(null));
  }, [userId]);

  useEffect(load, [load]);

  return (
    <>
      <h1 className="section-title">For You · user #{userId}</h1>
      {summary && (
        <p className="rate-hint">
          Based on your {summary.ratings_count} rating
          {summary.ratings_count === 1 ? "" : "s"}.{" "}
          <Link to="/me/ratings" style={{ color: "var(--accent)" }}>
            View history
          </Link>
        </p>
      )}
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState>
          Not enough ratings to personalize yet.{" "}
          <Link to="/search" style={{ color: "var(--accent)" }}>
            Rate a few movies
          </Link>{" "}
          first.
        </EmptyState>
      ) : (
        <div className="grid">
          {items.map((item, i) => (
            <MovieCard
              key={item.movie.movie_id}
              movie={item.movie}
              rank={i + 1}
              badge={item.reason}
            />
          ))}
        </div>
      )}
    </>
  );
}
