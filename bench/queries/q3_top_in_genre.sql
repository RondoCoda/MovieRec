-- 某个类型里评分最高的 20 部电影（至少 50 条评分）
SELECT m.movie_id, m.title, avg(r.rating) AS avg_rating, count(*) AS n
FROM genres g
JOIN movie_genres mg ON mg.genre_id = g.genre_id
JOIN movies m        ON m.movie_id  = mg.movie_id
JOIN ratings r       ON r.movie_id  = m.movie_id
WHERE g.name = 'Comedy'
GROUP BY m.movie_id, m.title
HAVING count(*) >= 50
ORDER BY avg_rating DESC
LIMIT 20;
