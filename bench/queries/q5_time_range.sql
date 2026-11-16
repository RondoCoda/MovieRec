-- 某一个月内的评分数（按时间范围查询）
SELECT count(*), avg(rating)
FROM ratings
WHERE rated_at >= '2015-01-01' AND rated_at < '2015-02-01';
