-- 片名模糊搜索：普通 B 树帮不了 ILIKE '%xxx%'，要用 pg_trgm 扩展 + GIN 索引
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_movies_title_trgm ON movies USING gin (title gin_trgm_ops);
