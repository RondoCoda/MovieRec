"""Provisional Popular + per-user recommendation endpoints (integration glue, Member D).

Status: NOT final. The popularity formula awaits team/TA confirmation
(docs/recommendation-requirements-pending.md, docs/requirements.md FR-1).
Member A owns this module; review before merging to main.

Definitions implemented here:
- Popular: IMDB-style Bayesian average  (v*R + m*C) / (v + m), m = 50.
- For a user: the user's top-rated movies (>= 4.0, at most 3 seeds) feed the
  existing Genre-based Jaccard cache; similar movies are weighted by the seed
  rating, already-rated titles are excluded.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extensions import connection

from app.db import fetch_all, fetch_one, get_db

router = APIRouter(tags=["recommendations"])

BAYESIAN_M = 50.0
SEED_MIN_RATING = 4.0
SEED_LIMIT = 3
CACHE_SIZE = 50


@router.get(
    "/recommendations/popular",
    summary="Top movies by Bayesian average rating (provisional formula)",
)
def popular_movies(
    limit: int = Query(default=10, ge=1, le=50),
    db: connection = Depends(get_db),
) -> list[dict[str, Any]]:
    return fetch_all(
        db,
        """
        WITH stats AS (
            SELECT movie_id, COUNT(*)::numeric AS v, AVG(rating) AS r
            FROM ratings
            GROUP BY movie_id
        ), global AS (
            SELECT AVG(rating) AS c FROM ratings
        )
        SELECT m.movie_id,
               m.title,
               m.year,
               ROUND((COALESCE(s.v * s.r, 0) + %s * g.c)
                     / (COALESCE(s.v, 0) + %s), 4) AS score
        FROM movies AS m
        CROSS JOIN global AS g
        LEFT JOIN stats AS s ON s.movie_id = m.movie_id
        ORDER BY score DESC, m.title
        LIMIT %s
        """,
        (BAYESIAN_M, BAYESIAN_M, limit),
    )


@router.get(
    "/users/{user_id}/ratings/{movie_id}",
    summary="Get one user's current rating for a movie",
)
def get_one_rating(
    user_id: int,
    movie_id: int,
    db: connection = Depends(get_db),
) -> dict[str, Any]:
    """Returns rating=None when the user has not rated this movie yet.

    The detail page needs this instead of paging through the whole history,
    because GET /api/users/{id}/ratings caps limit at 100 and active MovieLens
    users can have far more ratings.
    """
    row = fetch_one(
        db,
        """
        SELECT r.user_id, r.movie_id, r.rating, r.rated_at
        FROM ratings AS r
        WHERE r.user_id = %s AND r.movie_id = %s
        """,
        (user_id, movie_id),
    )
    if row is None:
        exists = fetch_one(
            db, "SELECT user_id FROM users WHERE user_id = %s", (user_id,)
        )
        if exists is None:
            raise HTTPException(status_code=404, detail="User not found")
    return row or {"user_id": user_id, "movie_id": movie_id, "rating": None, "rated_at": None}


@router.get(
    "/recommendations/users/{user_id}",
    summary="Per-user recommendations from rating history (provisional)",
)
def for_user(
    user_id: int,
    limit: int = Query(default=12, ge=1, le=50),
    db: connection = Depends(get_db),
) -> list[dict[str, Any]]:
    """Genre-similarity to the user's best-rated movies, weighted by rating.

    Seeds are lazily cached through Member A's refresh_movie_similarity(),
    the same mechanism as the movie-similar endpoint.
    """
    seeds = fetch_all(
        db,
        """
        SELECT movie_id, rating
        FROM ratings
        WHERE user_id = %s AND rating >= %s
        ORDER BY rating DESC, rated_at DESC
        LIMIT %s
        """,
        (user_id, SEED_MIN_RATING, SEED_LIMIT),
    )
    if not seeds:
        return []

    # Populate the similarity cache for each seed (same pattern as
    # recommendations.py: commit before reading generated rows).
    with db:
        for seed in seeds:
            fetch_one(
                db,
                "SELECT refresh_movie_similarity(%s, %s) AS generated_count",
                (seed["movie_id"], CACHE_SIZE),
            )

    placeholders = ",".join(["%s"] * len(seeds))
    return fetch_all(
        db,
        f"""
        SELECT m.movie_id,
               m.title,
               m.year,
               ROUND(SUM(s.rating * ms.similarity_score)::numeric, 4) AS score
        FROM movie_similarity AS ms
        JOIN ratings AS s
          ON s.movie_id = ms.movie_id
         AND s.user_id = %s
        JOIN movies AS m ON m.movie_id = ms.similar_movie_id
        WHERE ms.movie_id IN ({placeholders})
          AND NOT EXISTS (
              SELECT 1 FROM ratings AS r2
              WHERE r2.user_id = %s AND r2.movie_id = ms.similar_movie_id
          )
        GROUP BY m.movie_id, m.title, m.year
        ORDER BY score DESC, m.title
        LIMIT %s
        """,
        (
            user_id,
            *[seed["movie_id"] for seed in seeds],
            user_id,
            limit,
        ),
    )
