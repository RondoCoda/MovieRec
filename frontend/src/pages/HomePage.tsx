// Page 1 — Home: popular movies grid (FR-1) + genre chips shortcut (FR-10).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularMovies, listGenres } from "../api/client";
import { ErrorState, Loading } from "../components/AsyncStates";
import MovieCard from "../components/MovieCard";
import type { Genre, MovieListItem } from "../types";

export default function HomePage() {
  const [popular, setPopular] = useState<MovieListItem[] | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [error, setError] = useState<unknown>(null);

  const load = () => {
    setError(null);
    setPopular(null);
    getPopularMovies(10)
      .then(setPopular)
      .catch(setError);
  };

  useEffect(load, []);
  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([])); // genre bar is secondary; never block the page
  }, []);

  return (
    <>
      <h1 className="section-title">Popular Movies</h1>
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !popular ? (
        <Loading />
      ) : (
        <div className="grid">
          {popular.map((m, i) => (
            <MovieCard key={m.movie_id} movie={m} rank={i + 1} />
          ))}
        </div>
      )}

      <h2 className="section-title">Browse by Genre</h2>
      <div className="chip-row">
        {genres.map((g) => (
          <Link key={g.genre_id} className="chip" to={`/search?genre=${g.genre_id}`}>
            {g.name}
          </Link>
        ))}
      </div>
    </>
  );
}
