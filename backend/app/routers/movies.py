"""Movie browsing, title search, genre filtering, and detail endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extensions import connection

from app.db import fetch_all, fetch_one, get_db

router = APIRouter(tags=["movies"])


def escape_like(term: str) -> str:
    """Escape LIKE metacharacters so user input is treated as literal text."""
    return "%" + term.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%"


@router.get("/genres", summary="List available movie genres")
def list_genres(db: connection = Depends(get_db)) -> list[dict[str, Any]]:
    """Return labels for the UI; clients should submit genre_id for filtering."""
    return fetch_all(
        db,
        "SELECT genre_id, name FROM genres ORDER BY name, genre_id",
    )


@router.get("/movies", summary="Browse, search, and filter movies")
def list_movies(
    query: str | None = Query(default=None, min_length=1, max_length=200),
    genre_id: int | None = Query(default=None, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: connection = Depends(get_db),
) -> list[dict[str, Any]]:
    """List movies, optionally filtered by title text and/or genre_id."""
    conditions: list[str] = []
    params: list[Any] = []

    if query is not None:
        term = query.strip()
        if term:
            conditions.append("m.title ILIKE %s ESCAPE '!'")
            params.append(escape_like(term))

    if genre_id is not None:
        # This matches the recommended index movie_genres(genre_id).
        conditions.append(
            "EXISTS ("
            "SELECT 1 FROM movie_genres AS mg "
            "WHERE mg.movie_id = m.movie_id AND mg.genre_id = %s"
            ")"
        )
        params.append(genre_id)

    where_sql = " WHERE " + " AND ".join(conditions) if conditions else ""
    sql = f"""
        SELECT m.movie_id, m.title, m.year
        FROM movies AS m
        {where_sql}
        ORDER BY m.title, m.movie_id
        LIMIT %s OFFSET %s
    """
    params.extend((limit, offset))
    return fetch_all(db, sql, params)


@router.get("/movies/{movie_id}", summary="Get movie details")
def get_movie(
    movie_id: int,
    db: connection = Depends(get_db),
) -> dict[str, Any]:
    movie = fetch_one(
        db,
        """
        SELECT m.movie_id,
               m.title,
               m.year,
               (SELECT COALESCE(json_agg(g.name ORDER BY g.name), '[]'::json)
                FROM movie_genres AS mg
                JOIN genres AS g ON g.genre_id = mg.genre_id
                WHERE mg.movie_id = m.movie_id) AS genres,
               (SELECT AVG(r.rating) FROM ratings AS r
                WHERE r.movie_id = m.movie_id) AS avg_rating,
               (SELECT COUNT(*)::INTEGER FROM ratings AS r
                WHERE r.movie_id = m.movie_id) AS rating_count
        FROM movies AS m
        WHERE m.movie_id = %s
        """,
        (movie_id,),
    )
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie
