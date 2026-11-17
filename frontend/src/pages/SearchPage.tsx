// Page 2 — Search: title query + genre filter + pagination (FR-2/FR-7).
// Reads ?q= and ?genre= from the URL so header search and home chips deep-link here.

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listGenres, listMovies } from "../api/client";
import { EmptyState, ErrorState, Loading } from "../components/AsyncStates";
import MovieCard from "../components/MovieCard";
import Pagination from "../components/Pagination";
import type { Genre, MovieListItem } from "../types";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const genreId = Number(params.get("genre") ?? "") || undefined;
  const page = Math.max(0, Number(params.get("page") ?? "") || 0);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<MovieListItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    listGenres()
      .then(setGenres)
      .catch(() => setGenres([]));
  }, []);

  const load = useCallback(() => {
    setError(null);
    setMovies(null);
    listMovies({ query: q || undefined, genreId, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(setMovies)
      .catch(setError);
  }, [q, genreId, page]);

  useEffect(load, [load]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.delete("page"); // filters reset pagination
    setParams(next);
  };

  return (
    <>
      <h1 className="section-title">
        {q ? `Results for “${q}”` : genreId ? "Movies by Genre" : "All Movies"}
      </h1>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button
          className={`chip${!genreId ? " active" : ""}`}
          onClick={() => update({ genre: undefined })}
        >
          All
        </button>
        {genres.map((g) => (
          <button
            key={g.genre_id}
            className={`chip${genreId === g.genre_id ? " active" : ""}`}
            onClick={() => update({ genre: String(g.genre_id) })}
          >
            {g.name}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !movies ? (
        <Loading />
      ) : movies.length === 0 ? (
        <EmptyState>No movies matched. Try another title or genre.</EmptyState>
      ) : (
        <>
          <div className="grid">
            {movies.map((m) => (
              <MovieCard key={m.movie_id} movie={m} />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            loadedCount={movies.length}
            onPage={(p) => update({ page: String(p) })}
          />
        </>
      )}
    </>
  );
}
