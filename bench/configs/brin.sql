-- 时间范围查询：BRIN 索引只记录每一块数据页里 rated_at 的最小/最大值，体积远小于 B 树
-- 注意：只有数据在磁盘上大致按时间顺序存放时 BRIN 才有用（实验方案第 5 节会讲怎么验证）
CREATE INDEX IF NOT EXISTS idx_ratings_time_brin ON ratings USING brin (rated_at);
