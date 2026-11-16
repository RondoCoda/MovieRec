-- 第 3 步 ①：暂存表。字段和原始 CSV 一模一样，全部用宽松的类型，保证 COPY 一定能成功。
-- 不加主键、不加约束：脏数据先原样进来，清洗在 staging_to_final.sql 里用 SQL 做。
DROP SCHEMA IF EXISTS staging CASCADE;
CREATE SCHEMA staging;

CREATE TABLE staging.movies  (movie_id INT,  title TEXT, genres TEXT);
CREATE TABLE staging.ratings (user_id  INT,  movie_id INT, rating NUMERIC, ts BIGINT);
CREATE TABLE staging.tags    (user_id  INT,  movie_id INT, tag TEXT,       ts BIGINT);
CREATE TABLE staging.links   (movie_id INT,  imdb_id TEXT, tmdb_id TEXT);
