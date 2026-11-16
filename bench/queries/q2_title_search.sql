-- 按片名模糊搜索（搜索框）
SELECT movie_id, title, year
FROM movies
WHERE title ILIKE '%star wars%';
