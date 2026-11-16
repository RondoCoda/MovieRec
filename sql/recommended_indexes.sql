-- Application indexes corresponding to the 25M recommended query plans.
-- Run after schema.sql and, when using MovieLens, after the bulk import.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_movies_title_trgm
    ON movies USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ratings_movie_rating
    ON ratings (movie_id, rating);

CREATE INDEX IF NOT EXISTS idx_movie_genres_genre
    ON movie_genres (genre_id);

COMMIT;
