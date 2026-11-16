-- MovieRec recommendation support: Genre-based Jaccard Similarity.
-- Run after sql/schema.sql and after importing the MovieLens data.
-- Similarity is calculated per source movie on first request and cached in
-- movie_similarity. This avoids building a potentially enormous all-pairs
-- genre join for the full MovieLens 25M catalogue.

BEGIN;

CREATE TABLE IF NOT EXISTS movie_similarity_cache (
    movie_id INTEGER PRIMARY KEY REFERENCES movies (movie_id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_similarity (
    movie_id INTEGER NOT NULL REFERENCES movies (movie_id) ON DELETE CASCADE,
    similar_movie_id INTEGER NOT NULL REFERENCES movies (movie_id) ON DELETE CASCADE,
    similarity_score NUMERIC(8, 6) NOT NULL
        CHECK (similarity_score > 0 AND similarity_score <= 1),
    recommendation_rank INTEGER NOT NULL CHECK (recommendation_rank >= 1),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (movie_id, similar_movie_id),
    UNIQUE (movie_id, recommendation_rank),
    CHECK (movie_id <> similar_movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_similarity_movie_rank
    ON movie_similarity (movie_id, recommendation_rank);

CREATE OR REPLACE FUNCTION refresh_movie_similarity(
    p_movie_id INTEGER,
    p_limit INTEGER DEFAULT 50
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    IF p_limit < 1 OR p_limit > 100 THEN
        RAISE EXCEPTION 'p_limit must be between 1 and 100';
    END IF;

    -- Serialize refreshes for the same source movie.
    PERFORM pg_advisory_xact_lock(72001, p_movie_id);

    IF NOT EXISTS (SELECT 1 FROM movies WHERE movie_id = p_movie_id) THEN
        RAISE EXCEPTION 'Movie % does not exist', p_movie_id
            USING ERRCODE = 'P0002';
    END IF;

    DELETE FROM movie_similarity
    WHERE movie_id = p_movie_id;

    DELETE FROM movie_similarity_cache
    WHERE movie_id = p_movie_id;

    WITH target_genres AS MATERIALIZED (
        SELECT genre_id
        FROM movie_genres
        WHERE movie_id = p_movie_id
    ),
    target_genre_count AS (
        SELECT COUNT(*)::INTEGER AS genre_count
        FROM target_genres
    ),
    candidate_intersections AS (
        SELECT mg.movie_id AS similar_movie_id,
               COUNT(*)::INTEGER AS intersection_count
        FROM movie_genres AS mg
        JOIN target_genres AS tg ON tg.genre_id = mg.genre_id
        WHERE mg.movie_id <> p_movie_id
        GROUP BY mg.movie_id
    ),
    candidate_genre_counts AS (
        SELECT mg.movie_id AS similar_movie_id,
               COUNT(*)::INTEGER AS genre_count
        FROM movie_genres AS mg
        JOIN candidate_intersections AS ci
          ON ci.similar_movie_id = mg.movie_id
        GROUP BY mg.movie_id
    ),
    scored AS (
        SELECT ci.similar_movie_id,
               ci.intersection_count,
               ci.intersection_count::NUMERIC /
                   NULLIF(tgc.genre_count + cgc.genre_count - ci.intersection_count, 0)
                   AS similarity_score
        FROM candidate_intersections AS ci
        JOIN candidate_genre_counts AS cgc
          ON cgc.similar_movie_id = ci.similar_movie_id
        CROSS JOIN target_genre_count AS tgc
    ),
    ranked AS (
        SELECT similar_movie_id,
               similarity_score,
               ROW_NUMBER() OVER (
                   ORDER BY similarity_score DESC,
                            intersection_count DESC,
                            similar_movie_id
               )::INTEGER AS recommendation_rank
        FROM scored
    )
    INSERT INTO movie_similarity (
        movie_id,
        similar_movie_id,
        similarity_score,
        recommendation_rank,
        calculated_at
    )
    SELECT p_movie_id,
           similar_movie_id,
           ROUND(similarity_score, 6)::NUMERIC(8, 6),
           recommendation_rank,
           CURRENT_TIMESTAMP
    FROM ranked
    WHERE recommendation_rank <= p_limit;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;

    -- Record that this source movie has been calculated, even if it has
    -- no genres or no other movie shares its genres.
    INSERT INTO movie_similarity_cache (movie_id, calculated_at)
    VALUES (p_movie_id, CURRENT_TIMESTAMP)
    ON CONFLICT (movie_id) DO UPDATE
       SET calculated_at = EXCLUDED.calculated_at;

    RETURN inserted_count;
END;
$$;

COMMIT;

-- Manually refresh one movie after its genre assignments change:
-- SELECT refresh_movie_similarity( movie_id_here, 50 );
