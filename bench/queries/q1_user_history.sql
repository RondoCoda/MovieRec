-- 某个用户的评分历史（"我的评分"页面）
SELECT m.title, r.rating, r.rated_at
FROM ratings r JOIN movies m ON m.movie_id = r.movie_id
WHERE r.user_id = 111468
ORDER BY r.rated_at DESC;
