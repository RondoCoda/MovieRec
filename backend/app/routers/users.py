"""User summary and rating-history endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extensions import connection

from app.db import fetch_all, fetch_one, get_db

router = APIRouter(tags=["users", "ratings"])


@router.get("/users/{user_id}", summary="Get available user information")
def get_user(
    user_id: int,
    db: connection = Depends(get_db),
) -> dict[str, Any]:
    """The schema stores user_id only; this endpoint returns activity counts."""
    user = fetch_one(
        db,
        """
        SELECT u.user_id,
               (SELECT COUNT(*)::INTEGER FROM ratings AS r
                WHERE r.user_id = u.user_id) AS ratings_count,
               (SELECT COUNT(*)::INTEGER FROM movie_tags AS mt
                WHERE mt.user_id = u.user_id) AS tags_count,
               (SELECT COUNT(*)::INTEGER FROM watch_history AS wh
                WHERE wh.user_id = u.user_id) AS watch_count
        FROM users AS u
        WHERE u.user_id = %s
        """,
        (user_id,),
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/{user_id}/ratings", summary="Get a user's rating history")
def get_user_ratings(
    user_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: connection = Depends(get_db),
) -> list[dict[str, Any]]:
    exists = fetch_one(db, "SELECT user_id FROM users WHERE user_id = %s", (user_id,))
    if exists is None:
        raise HTTPException(status_code=404, detail="User not found")

    return fetch_all(
        db,
        """
        SELECT m.movie_id, m.title, m.year, r.rating, r.rated_at
        FROM ratings AS r
        JOIN movies AS m ON m.movie_id = r.movie_id
        WHERE r.user_id = %s
        ORDER BY r.rated_at DESC, r.movie_id
        LIMIT %s OFFSET %s
        """,
        (user_id, limit, offset),
    )
