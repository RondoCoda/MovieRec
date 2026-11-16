-- 基线：只有主键自带的索引，删掉所有实验用的索引（新增配置时，把它的索引名也加到这里）
DROP INDEX IF EXISTS idx_ratings_movie, idx_ratings_time_btree, idx_ratings_time_brin,
                     idx_movies_title_trgm, idx_movie_genres_genre, idx_tmp_time,
                     idx_ratings_movie_rating, idx_ratings_rating_movie;
