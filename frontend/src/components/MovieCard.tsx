// Movie card for grids (home, search, recommendations).

import { Link } from "react-router-dom";
import type { MovieListItem } from "../types";

interface Props {
  movie: MovieListItem;
  rank?: number;
  badge?: string;
}

export default function MovieCard({ movie, rank, badge }: Props) {
  return (
    <Link className="card" to={`/movie/${movie.movie_id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {rank !== undefined && <span className="rank">#{rank}</span>}
        {badge && <span className="chip">{badge}</span>}
      </div>
      <div className="title">{movie.title}</div>
      <div className="year">{movie.year ?? "—"}</div>
    </Link>
  );
}
