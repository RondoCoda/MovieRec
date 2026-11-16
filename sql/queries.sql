-- MovieRec core queries for PostgreSQL 18.
-- Run this file in the same session as EXECUTE (e.g. psql: \i sql/queries.sql).
-- In application code, use the SELECT bodies with your driver's bound parameters.
-- Use the genre list below to get genre_id values for the current database.

-- Film title contains a literal string (case-insensitive). Parameters: term, page size, offset.
PREPARE search_movies_by_title(TEXT, INTEGER, INTEGER) AS
SELECT movie_id, title, year
FROM movies
WHERE title ILIKE '%' || replace(replace(replace($1, '!', '!!'), '%', '!%'), '_', '!_') || '%'
      ESCAPE '!'
ORDER BY title, movie_id
LIMIT $2 OFFSET $3;

-- Genre selector. Displays name and sends genre_id when selected.
PREPARE list_genres AS
SELECT genre_id, name
FROM genres
ORDER BY name;

-- Browse one genre. Parameters: genre_id, page size, offset.
PREPARE list_movies_by_genre(INTEGER, INTEGER, INTEGER) AS
SELECT m.movie_id, m.title, m.year
FROM movie_genres AS mg
JOIN movies AS m ON m.movie_id = mg.movie_id
WHERE mg.genre_id = $1
ORDER BY m.title, m.movie_id
LIMIT $2 OFFSET $3;

-- Show a user's current ratings, most recently rated first.
-- Parameters: user_id, page size, offset.
PREPARE list_user_ratings(INTEGER, INTEGER, INTEGER) AS
SELECT m.movie_id, m.title, m.year, r.rating, r.rated_at
FROM ratings AS r
JOIN movies AS m ON m.movie_id = r.movie_id
WHERE r.user_id = $1
ORDER BY r.rated_at DESC, r.movie_id
LIMIT $2 OFFSET $3;

-- Top-N in one genre. Parameters: genre_id, minimum rating count, N.
PREPARE top_movies_in_genre(INTEGER, INTEGER, INTEGER) AS
SELECT m.movie_id, m.title, avg(r.rating) AS avg_rating, count(*) AS rating_count
FROM movie_genres AS mg
JOIN movies AS m ON m.movie_id = mg.movie_id
JOIN ratings AS r ON r.movie_id = mg.movie_id
WHERE mg.genre_id = $1
GROUP BY m.movie_id, m.title
HAVING count(*) >= $2
ORDER BY avg_rating DESC, rating_count DESC, m.movie_id
LIMIT $3;

-- Top-N in every genre. Parameters: minimum rating count, N per genre.
PREPARE top_movies_by_genre(INTEGER, INTEGER) AS
WITH movie_scores AS (
    SELECT movie_id, avg(rating) AS avg_rating, count(*) AS rating_count
    FROM ratings
    GROUP BY movie_id
    HAVING count(*) >= $1
), ranked AS (
    SELECT mg.genre_id, s.movie_id, s.avg_rating, s.rating_count,
           row_number() OVER (
               PARTITION BY mg.genre_id
               ORDER BY s.avg_rating DESC, s.rating_count DESC, s.movie_id
           ) AS genre_rank
    FROM movie_scores AS s
    JOIN movie_genres AS mg ON mg.movie_id = s.movie_id
)
SELECT r.genre_id, g.name AS genre_name, r.genre_rank,
       m.movie_id, m.title, r.avg_rating, r.rating_count
FROM ranked AS r
JOIN genres AS g ON g.genre_id = r.genre_id
JOIN movies AS m ON m.movie_id = r.movie_id
WHERE r.genre_rank <= $2
ORDER BY r.genre_id, r.genre_rank;

-- Examples (use genre_id 5 only if list_genres shows it is the intended genre).
-- EXECUTE list_genres;
-- EXECUTE search_movies_by_title('star wars', 20, 0);
-- EXECUTE list_movies_by_genre(5, 20, 0);
-- EXECUTE list_user_ratings(1, 20, 0);
-- EXECUTE top_movies_in_genre(5, 50, 20);
-- EXECUTE top_movies_by_genre(50, 20);
-- EXPLAIN (ANALYZE, BUFFERS) EXECUTE top_movies_in_genre(5, 50, 20);
