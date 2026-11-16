"""Create or update a user's current rating for a movie."""

from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import connection

from app.db import fetch_one, get_db

router = APIRouter(tags=["ratings"])


class RatingInput(BaseModel):
    rating: Decimal = Field(
        ge=Decimal("0.5"),
        le=Decimal("5.0"),
        multiple_of=Decimal("0.5"),
        description="A half-star rating: 0.5, 1.0, ..., 5.0",
        examples=[4.5],
    )


@router.put(
    "/users/{user_id}/ratings/{movie_id}",
    summary="Create or update a user's rating",
)
def upsert_rating(
    user_id: int,
    movie_id: int,
    payload: RatingInput,
    db: connection = Depends(get_db),
) -> dict[str, Any]:
    """Upsert one rating, matching the (user_id, movie_id) primary key."""
    if fetch_one(db, "SELECT user_id FROM users WHERE user_id = %s", (user_id,)) is None:
        raise HTTPException(status_code=404, detail="User not found")
    if fetch_one(db, "SELECT movie_id FROM movies WHERE movie_id = %s", (movie_id,)) is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    try:
        # psycopg2 commits on successful context exit and rolls back on exceptions.
        with db:
            with db.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO ratings (user_id, movie_id, rating, rated_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                    ON CONFLICT (user_id, movie_id) DO UPDATE
                    SET rating = EXCLUDED.rating,
                        rated_at = EXCLUDED.rated_at
                    RETURNING user_id, movie_id, rating, rated_at
                    """,
                    (user_id, movie_id, payload.rating),
                )
                row = cur.fetchone()
                return dict(row)
    except Exception:
        db.rollback()
        raise
