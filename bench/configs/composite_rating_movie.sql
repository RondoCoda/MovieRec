-- 同样两列，顺序反过来 (rating, movie_id)：第一列不是过滤条件，q4 基本用不上它
CREATE INDEX IF NOT EXISTS idx_ratings_rating_movie ON ratings (rating, movie_id);
