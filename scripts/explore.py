"""第 2 步：探索 MovieLens 数据，生成给 B 的数据说明。

用法：
    python scripts/explore.py data/raw/ml-latest-small
输出：
    docs/data_notes_<数据集名>.md     数据说明（直接发给 B）
    docs/figures/<数据集名>/*.png     三张分布图（以后放进报告 §6）
"""
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

src = sys.argv[1]
name = os.path.basename(src.rstrip("/"))
fig_dir = f"docs/figures/{name}"
os.makedirs(fig_dir, exist_ok=True)

movies = pd.read_csv(f"{src}/movies.csv")
ratings = pd.read_csv(f"{src}/ratings.csv")
tags = pd.read_csv(f"{src}/tags.csv")
links = pd.read_csv(f"{src}/links.csv", dtype={"imdbId": str})

lines = [f"# MovieLens 数据说明（{name}）", ""]


def add(s=""):
    print(s)
    lines.append(s)


# ---------- 1. 文件概况 ----------
add("## 1. 文件概况")
add("")
add("| 文件 | 行数 | 字段 |")
add("| --- | --- | --- |")
for fname, df in [("movies.csv", movies), ("ratings.csv", ratings),
                  ("tags.csv", tags), ("links.csv", links)]:
    add(f"| {fname} | {len(df):,} | {', '.join(df.columns)} |")
add("")

# ---------- 2. 缺失值与重复 ----------
add("## 2. 缺失值与重复")
add("")
for fname, df in [("movies", movies), ("ratings", ratings), ("tags", tags), ("links", links)]:
    na = df.isna().sum()
    na = na[na > 0]
    add(f"- {fname}：缺失值 { {k: int(v) for k, v in na.items()} if len(na) else '无'}")
dup = ratings.duplicated(["userId", "movieId"]).sum()
add(f"- ratings 中 (userId, movieId) 重复：{dup} 条 → {'可以作主键' if dup == 0 else '不能直接作主键'}")
add(f"- ratings 引用了 movies 里不存在的电影：{(~ratings.movieId.isin(movies.movieId)).sum()} 条")
add(f"- 没有任何评分的电影：{(~movies.movieId.isin(ratings.movieId)).sum()} 部")
add("")

# ---------- 3. 需要 B 注意的结构问题 ----------
add("## 3. 表结构上要处理的问题")
add("")
g = movies.genres.str.split("|")
n_genre = g.explode().nunique()
add(f"- **genres 是多值字段**：用 `|` 拼接，例如 `{movies.genres.iloc[1]}`。"
    f"违反第一范式，需要拆成 genres 表 + movie_genres 关联表。共 {n_genre} 种取值，"
    f"每部电影平均 {g.str.len().mean():.1f} 个类型。")
no_genre = (movies.genres == "(no genres listed)").sum()
add(f"- `(no genres listed)` 表示没有类型，共 {no_genre} 部，导入时应当作“无关联记录”而不是一种类型。")
year = movies.title.str.extract(r"\((\d{4})\)\s*$")[0]
add(f"- **片名末尾带年份**，如 `{movies.title.iloc[1]}`。可拆出 year 字段；"
    f"{year.isna().sum()} 部片名没有年份，year 要允许为 NULL。")
the = movies.title.str.contains(r", The(?: \(|$)").sum()
add(f"- {the} 个片名是 `Title, The` 这种倒装写法，做标题搜索时要注意。")
add(f"- 片名最长 {movies.title.str.len().max()} 个字符，建议 VARCHAR(300) 或 TEXT。")
add(f"- **timestamp 是 Unix 秒**，范围 "
    f"{pd.to_datetime(ratings.timestamp.min(), unit='s').date()} 到 "
    f"{pd.to_datetime(ratings.timestamp.max(), unit='s').date()}，建议存成 TIMESTAMP。")
add(f"- rating 取值：{', '.join(str(x) for x in sorted(ratings.rating.unique()))}（半星制），建议 NUMERIC(2,1) + CHECK 0.5–5.0。")
raw_tags = tags.tag.nunique()
norm_tags = tags.tag.astype(str).str.strip().str.lower().nunique()
add(f"- tags 是自由文本：去空格、转小写后从 {raw_tags} 种变成 {norm_tags} 种，建议清洗后再建 tag 表。")
add(f"- links.csv 的 imdbId 有前导零（如 `{links.imdbId.iloc[1]}`），要按文本存；"
    f"tmdbId 缺失 {links.tmdbId.isna().sum()} 条。")
add("")

# ---------- 4. 分布 ----------
per_user = ratings.groupby("userId").size()
per_movie = ratings.groupby("movieId").size()
n_u, n_m = ratings.userId.nunique(), ratings.movieId.nunique()
add("## 4. 分布（推荐和性能实验要用）")
add("")
add(f"- 用户 {n_u:,} 人，有评分的电影 {n_m:,} 部，评分 {len(ratings):,} 条")
add(f"- 稀疏度：{1 - len(ratings) / (n_u * n_m):.4%}（用户-电影矩阵里没有评分的比例）")
add(f"- 平均分 {ratings.rating.mean():.2f}，众数 {ratings.rating.mode()[0]}")
add(f"- 每个用户的评分数：中位数 {per_user.median():.0f}，最少 {per_user.min()}，最多 {per_user.max()}")
add(f"- 每部电影的评分数：中位数 {per_movie.median():.0f}，最多 {per_movie.max()}")
for k in (10, 50, 100):
    add(f"  - 评分数 ≥ {k} 的电影：{(per_movie >= k).sum():,} 部（{(per_movie >= k).mean():.1%}）")
top = per_movie.sort_values(ascending=False)
share = top.head(int(len(top) * 0.1)).sum() / len(ratings)
add(f"- 最热门的 10% 电影占了 {share:.1%} 的评分（长尾）")
add("")

# ---------- 5. 图 ----------
fig, ax = plt.subplots(figsize=(6, 3.5))
ratings.rating.value_counts().sort_index().plot.bar(ax=ax, color="#4c72b0")
ax.set_xlabel("Rating"); ax.set_ylabel("Count"); ax.set_title("Rating distribution")
fig.tight_layout(); fig.savefig(f"{fig_dir}/rating_dist.png", dpi=150)

for s, label, fn in [(per_user, "Ratings per user", "per_user.png"),
                     (per_movie, "Ratings per movie", "per_movie.png")]:
    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.hist(s, bins=50, color="#4c72b0", log=True)
    ax.set_xlabel(label); ax.set_ylabel("Count (log scale)"); ax.set_title(label)
    fig.tight_layout(); fig.savefig(f"{fig_dir}/{fn}", dpi=150)

add(f"图：{fig_dir}/ 下的 rating_dist.png、per_user.png、per_movie.png")
out = f"docs/data_notes_{name}.md"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"\n已写入 {out}")
