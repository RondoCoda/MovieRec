# MovieLens 数据说明（ml-25m）

## 1. 文件概况

| 文件 | 行数 | 字段 |
| --- | --- | --- |
| movies.csv | 62,423 | movieId, title, genres |
| ratings.csv | 25,000,095 | userId, movieId, rating, timestamp |
| tags.csv | 1,093,360 | userId, movieId, tag, timestamp |
| links.csv | 62,423 | movieId, imdbId, tmdbId |

## 2. 缺失值与重复

- movies：缺失值 无
- ratings：缺失值 无
- tags：缺失值 {'tag': 16}
- links：缺失值 {'tmdbId': 107}
- ratings 中 (userId, movieId) 重复：0 条 → 可以作主键
- ratings 引用了 movies 里不存在的电影：0 条
- 没有任何评分的电影：3376 部

## 3. 表结构上要处理的问题

- **genres 是多值字段**：用 `|` 拼接，例如 `Adventure|Children|Fantasy`。违反第一范式，需要拆成 genres 表 + movie_genres 关联表。共 20 种取值，每部电影平均 1.8 个类型。
- `(no genres listed)` 表示没有类型，共 5062 部，导入时应当作“无关联记录”而不是一种类型。
- **片名末尾带年份**，如 `Jumanji (1995)`。可拆出 year 字段；412 部片名没有年份，year 要允许为 NULL。
- 4514 个片名是 `Title, The` 这种倒装写法，做标题搜索时要注意。
- 片名最长 191 个字符，建议 VARCHAR(300) 或 TEXT。
- **timestamp 是 Unix 秒**，范围 1995-01-09 到 2019-11-21，建议存成 TIMESTAMP。
- rating 取值：0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0（半星制），建议 NUMERIC(2,1) + CHECK 0.5–5.0。
- tags 是自由文本：去空格、转小写后从 73050 种变成 65403 种，建议清洗后再建 tag 表。
- links.csv 的 imdbId 有前导零（如 `0113497`），要按文本存；tmdbId 缺失 107 条。

## 4. 分布（推荐和性能实验要用）

- 用户 162,541 人，有评分的电影 59,047 部，评分 25,000,095 条
- 稀疏度：99.7395%（用户-电影矩阵里没有评分的比例）
- 平均分 3.53，众数 4.0
- 每个用户的评分数：中位数 71，最少 20，最多 32202
- 每部电影的评分数：中位数 6，最多 81491
  - 评分数 ≥ 10 的电影：24,330 部（41.2%）
  - 评分数 ≥ 50 的电影：13,176 部（22.3%）
  - 评分数 ≥ 100 的电影：10,326 部（17.5%）
- 最热门的 10% 电影占了 94.0% 的评分（长尾）

图：docs/figures/ml-25m/ 下的 rating_dist.png、per_user.png、per_movie.png
