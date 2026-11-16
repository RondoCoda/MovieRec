-- 复合索引 (movie_id, rating)：q4 按 movie_id 过滤、按 rating 分组，两列都在索引里，可以只读索引不回表（Index Only Scan）
CREATE INDEX IF NOT EXISTS idx_ratings_movie_rating ON ratings (movie_id, rating);
