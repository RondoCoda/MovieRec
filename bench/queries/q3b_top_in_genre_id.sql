-- 同 q3，但直接用 genre_id 过滤，让优化器能用到该类型的真实频率
SELECT m.movie_id, m.title, avg(r.rating) AS avg_rating, count(*) AS n
FROM movie_genres mg
JOIN movies m  ON m.movie_id = mg.movie_id
JOIN ratings r ON r.movie_id = m.movie_id
WHERE mg.genre_id = 5
GROUP BY m.movie_id, m.title
HAVING count(*) >= 50
ORDER BY avg_rating DESC
LIMIT 20;