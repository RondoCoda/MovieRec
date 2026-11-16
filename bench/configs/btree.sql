-- 在常用的过滤和连接列上加 B 树索引
CREATE INDEX IF NOT EXISTS idx_ratings_movie      ON ratings (movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_time_btree ON ratings (rated_at);
CREATE INDEX IF NOT EXISTS idx_movie_genres_genre ON movie_genres (genre_id);
