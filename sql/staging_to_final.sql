-- 第 3 步 ③：把暂存表的数据清洗后写进正式表。每一段对应 data_notes 里发现的一个问题。
-- 顺序有讲究：先写被引用的表（movies、genres、users、tags），再写引用它们的表，否则外键会报错。
BEGIN;

-- 1) 电影：从片名末尾拆出年份，标题去掉年份和多余空格
INSERT INTO movies (movie_id, title, year)
SELECT movie_id,
       trim(regexp_replace(title, '\s*\(\d{4}\)\s*$', '')),
       substring(title FROM '\((\d{4})\)\s*$')::SMALLINT
FROM staging.movies;

-- 2) 类型：把 'Action|Comedy' 拆成多行（第一范式），'(no genres listed)' 不算类型
INSERT INTO genres (name)
SELECT DISTINCT g
FROM staging.movies, string_to_table(genres, '|') AS g
WHERE g <> '(no genres listed)'
ORDER BY g;

INSERT INTO movie_genres (movie_id, genre_id)
SELECT DISTINCT m.movie_id, g.genre_id
FROM staging.movies m, string_to_table(m.genres, '|') AS gname
JOIN genres g ON g.name = gname;

-- 3) 用户：MovieLens 没有用户文件，从评分和标签里收集所有出现过的 userId
INSERT INTO users (user_id)
SELECT user_id FROM staging.ratings
UNION
SELECT user_id FROM staging.tags;

-- 4) 评分：Unix 秒转成 TIMESTAMP；只保留电影存在的评分（防外键报错）
INSERT INTO ratings (user_id, movie_id, rating, rated_at)
SELECT r.user_id, r.movie_id, r.rating, to_timestamp(r.ts) AT TIME ZONE 'UTC'
FROM staging.ratings r
WHERE EXISTS (SELECT 1 FROM movies m WHERE m.movie_id = r.movie_id);

-- 5) 标签：去首尾空格、转小写后去重
INSERT INTO tags (name)
SELECT DISTINCT lower(trim(tag))
FROM staging.tags
WHERE tag IS NOT NULL AND trim(tag) <> '';

INSERT INTO movie_tags (user_id, movie_id, tag_id, tagged_at)
SELECT t.user_id, t.movie_id, tg.tag_id, min(to_timestamp(t.ts) AT TIME ZONE 'UTC')
FROM staging.tags t
JOIN tags tg ON tg.name = lower(trim(t.tag))
WHERE EXISTS (SELECT 1 FROM movies m WHERE m.movie_id = t.movie_id)
GROUP BY t.user_id, t.movie_id, tg.tag_id;     -- 清洗后同一人对同一部电影的同一标签只留一条

-- 6) 外部链接：imdbId 保留前导零，tmdbId 空值转 NULL
INSERT INTO links (movie_id, imdb_id, tmdb_id)
SELECT movie_id, imdb_id, NULLIF(tmdb_id, '')::INT
FROM staging.links;

COMMIT;

-- 导入后 load.py 会接着执行 VACUUM ANALYZE（它不能放在事务里，所以不写在这个文件里）
