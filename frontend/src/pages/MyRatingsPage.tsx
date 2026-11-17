// Page 4 — My Ratings: history table, newest first, inline edit (FR-5/FR-8).

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserRatings, putRating } from "../api/client";
import { EmptyState, ErrorState, Loading } from "../components/AsyncStates";
import Pagination from "../components/Pagination";
import StarRating from "../components/StarRating";
import { useCurrentUser } from "../context/UserContext";
import type { RatingRow } from "../types";

const PAGE_SIZE = 10;

export default function MyRatingsPage() {
  const { userId } = useCurrentUser();
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<RatingRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setRows(null);
    getUserRatings(userId, PAGE_SIZE, page * PAGE_SIZE)
      .then(setRows)
      .catch(setError);
  }, [userId, page]);

  useEffect(load, [load]);
  useEffect(() => setPage(0), [userId]);

  const saveRating = async (movieId: number, value: number) => {
    setSaveError(null);
    try {
      await putRating(userId, movieId, value);
      setEditing(null);
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <>
      <h1 className="section-title">My Ratings · user #{userId}</h1>
      {saveError && <p style={{ color: "#e05555" }}>{saveError}</p>}
      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>
          No ratings yet. <Link to="/" style={{ color: "var(--accent)" }}>Find a movie</Link> and rate it.
        </EmptyState>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Year</th>
                <th>My rating</th>
                <th>When (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.movie_id}>
                  <td>
                    <Link to={`/movie/${r.movie_id}`} style={{ color: "var(--accent)" }}>
                      {r.title}
                    </Link>
                  </td>
                  <td>{r.year ?? "—"}</td>
                  <td>
                    {editing === r.movie_id ? (
                      <StarRating
                        value={r.rating}
                        onChange={(v) => saveRating(r.movie_id, v)}
                      />
                    ) : (
                      <span
                        style={{ cursor: "pointer" }}
                        title="Click to edit"
                        onClick={() => setEditing(r.movie_id)}
                      >
                        <StarRating value={r.rating} readonly />
                      </span>
                    )}
                  </td>
                  <td className="muted">{r.rated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={PAGE_SIZE} loadedCount={rows.length} onPage={setPage} />
        </>
      )}
    </>
  );
}
