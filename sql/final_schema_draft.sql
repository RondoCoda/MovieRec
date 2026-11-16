-- 正式表的【草稿】，只用来在 B 的 DDL 出来之前把流程跑通。
-- B 的 schema.sql 出来后：用 B 的文件替换这个文件，再按 B 的表名和字段名改 staging_to_final.sql。
DROP TABLE IF EXISTS movie_tags, tags, ratings, users, movie_genres, genres, links, movies CASCADE;

CREATE TABLE movies (
    movie_id INT PRIMARY KEY,
    title    VARCHAR(300) NOT NULL,
    year     SMALLINT                       -- 片名里没有年份时为 NULL
);
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name     VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE movie_genres (
    movie_id INT REFERENCES movies(movie_id),
    genre_id INT REFERENCES genres(genre_id),
    PRIMARY KEY (movie_id, genre_id)
);
CREATE TABLE users (
    user_id INT PRIMARY KEY
);
CREATE TABLE ratings (
    user_id  INT REFERENCES users(user_id),
    movie_id INT REFERENCES movies(movie_id),
    rating   NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 0.5 AND 5.0),
    rated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, movie_id)
);
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name   VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE movie_tags (
    user_id   INT REFERENCES users(user_id),
    movie_id  INT REFERENCES movies(movie_id),
    tag_id    INT REFERENCES tags(tag_id),
    tagged_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, movie_id, tag_id)
);
CREATE TABLE links (
    movie_id INT PRIMARY KEY REFERENCES movies(movie_id),
    imdb_id  VARCHAR(10),
    tmdb_id  INT
);
