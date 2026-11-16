-- 某部电影的所有评分（电影详情页的平均分和评分分布）
SELECT rating, count(*)
FROM ratings
WHERE movie_id = 1
GROUP BY rating
ORDER BY rating;
