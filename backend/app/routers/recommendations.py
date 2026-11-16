"""Movie recommendation endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg2.extensions import connection

from app.db import fetch_all, fetch_one, get_db

router = APIRouter(tags=["recommendations"])

# Cache the top 50 results for each source movie. The public endpoint returns
# at most 50, so subsequent requests can be served from the precomputed table.
CACHE_SIZE = 50


@router.get(
    "/recommendations/movies/{movie_id}/similar",
    summary="Recommend movies with similar genres",
)
def get_similar_movies(
    movie_id: int,
    limit: int = Query(default=10, ge=1, le=CACHE_SIZE),
    db: connection = Depends(get_db),
) -> list[dict[str, Any]]:
    """Return the top-N movies ranked by Genre-based Jaccard Similarity.

    Similarity is calculated from the source and candidate movies' genre sets:
    |A intersection B| / |A union B|. The first request computes and caches
    up to 50 results; later requests read the cache.
    """
    movie = fetch_one(
        db,
        "SELECT movie_id FROM movies WHERE movie_id = %s",
        (movie_id,),
    )
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    cached = fetch_one(
        db,
        "SELECT movie_id FROM movie_similarity_cache WHERE movie_id = %s",
        (movie_id,),
    )

    if cached is None:
        # The SQL function writes the cache, so commit this transaction before
        # the following SELECT reads the generated recommendations.
        with db:
            fetch_one(
                db,
                "SELECT refresh_movie_similarity(%s, %s) AS generated_count",
                (movie_id, CACHE_SIZE),
            )

    return fetch_all(
        db,
        """
        SELECT ms.similar_movie_id AS movie_id,
               m.title,
               m.year,
               ms.similarity_score,
               ms.recommendation_rank
        FROM movie_similarity AS ms
        JOIN movies AS m ON m.movie_id = ms.similar_movie_id
        WHERE ms.movie_id = %s
        ORDER BY ms.recommendation_rank
        LIMIT %s
        """,
        (movie_id, limit),
    )
