-- BRIN 的正确用法：先把 ratings 在磁盘上按时间重排（CLUSTER），再建 BRIN
-- 注意：CLUSTER 改变了数据的物理顺序，基线脚本恢复不了。做完这组实验要重新 load 一次数据。
CREATE INDEX IF NOT EXISTS idx_tmp_time ON ratings (rated_at);
CLUSTER ratings USING idx_tmp_time;
DROP INDEX idx_tmp_time;
CREATE INDEX IF NOT EXISTS idx_ratings_time_brin ON ratings USING brin (rated_at);
