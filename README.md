# MovieRec：电影评分与推荐平台（DSC5003 Group Project, Track 1）

> 草稿：数据与性能部分已写好，其余部分（后端、前端、推荐）由对应成员补充。

## 项目简介

<!-- 一两句话：做了什么、给谁用。由负责项目概述的成员补充 -->

## 目录结构

```text
.
├── data/          原始数据和抽样数据（不在仓库里，见“准备数据”）
├── scripts/       explore.py 数据探索 · load.py 导入数据库 · sample.py 按用户抽样
├── sql/           schema.sql 正式表 · staging*.sql 导入 SQL · queries.sql 核心查询 · recommended_indexes.sql 应用索引
├── bench/         bench.py 性能测试 · plot.py 画图 · queries/ 测试查询 · configs/ 索引配置
├── backend/       <!-- 后端负责人补充 -->
├── frontend/      <!-- 前端负责人补充 -->
└── docs/          数据说明、报告 §5、ER 图
```

## 环境要求

- PostgreSQL 18（标题索引实验还需要服务器提供 `pg_trgm`）
- Python 3.10+
- Python 包：`pip install -r requirements.txt`

## 快速开始

### 1. 从项目根目录连接 PostgreSQL 并建测试库

```bash
export PGHOST=localhost PGPORT=5432 PGUSER=postgres PGDATABASE=movierec_dev
createdb "$PGDATABASE"
```

将连接参数改成你的本机设置。需要密码时，可使用 PostgreSQL 的密码文件或在当前终端设置 `PGPASSWORD`。正式表脚本用于空测试库，每次重导或换数据规模时使用新的空库。导入脚本会重建该库的 `staging` schema。

### 2. 准备数据

开发只需从 [GroupLens](https://grouplens.org/datasets/movielens/) 下载 `ml-latest-small`，解压到 `data/raw/ml-latest-small/`。成员 C 在正式性能实验时使用 `ml-25m`。

### 3. 导入

```bash
python scripts/load.py data/raw/ml-latest-small --schema sql/schema.sql
```

### 4. 验证核心查询

```bash
psql -v ON_ERROR_STOP=1 -f sql/queries.sql -c 'EXECUTE list_genres' \
  -c "EXECUTE search_movies_by_title('star wars', 20, 0)"
```

同一 `psql` 会话先载入 `sql/queries.sql`，再运行文件末尾的 `EXECUTE` 示例。类型查询的 `genre_id` 以当前数据库返回的类型列表为准。

```bash
python bench/bench.py --dataset small --config bench/configs/baseline.sql \
  --queries bench/queries/q2_title_search.sql bench/queries/q3b_top_in_genre_id.sql
python bench/plot.py --dataset small
```

### 5. 启动后端和前端

在应用数据库建表并完成所需的数据导入后，执行推荐索引脚本。

```bash
psql -v ON_ERROR_STOP=1 -f sql/recommended_indexes.sql
psql -v ON_ERROR_STOP=1 -f sql/recommendations.sql
```

`sql/recommendations.sql` creates the lazy precomputation cache and the
`refresh_movie_similarity` function used by the Genre-based Jaccard endpoint.
类型下拉列表显示 `name`，发给 API 的参数为当前库的 `genre_id`。后端用绑定参数按 `movie_genres.genre_id` 筛选。

<!-- 后端、前端负责人补充 -->

## 复现性能实验

为各数据规模分别创建空测试库。用 `PGDATABASE` 选择当前规模对应的库，再运行该规模的导入和索引实验。计时前确认固定查询参数在当前样本中能返回预期数据（例如查询用户的评分历史）。
在独立测试库运行基准测试。测试脚本会重置二级索引；可通过 `--config sql/recommended_indexes.sql` 选择应用索引组合，计时记录中的配置名为 `recommended_indexes`。

```bash
# 生成不同规模的数据
python scripts/sample.py data/raw/ml-25m 100k=100000 1m=1000000 10m=10000000

# 在某一档数据上跑全部索引配置
export PGDATABASE=movierec_bench_1m
createdb "$PGDATABASE"
python scripts/load.py data/samples/1m --schema sql/schema.sql
python bench/bench.py --dataset 1m --config bench/configs/baseline.sql
python bench/bench.py --dataset 1m --config bench/configs/btree.sql
# ……其余配置见 bench/configs/

# 画图
python bench/plot.py --dataset 1m
python bench/plot.py --scaling 100k 1m 10m 25m
```

结果在 `bench/results/`：`timings.csv` 原始计时，`summary.csv` 汇总，`figures/` 图，`plans/` 执行计划。

## 数据集

F. M. Harper and J. A. Konstan. The MovieLens Datasets: History and Context. ACM Transactions on Interactive Intelligent Systems, 5(4), 2015.

## Backend API (Member A)

The FastAPI backend is in `backend/` and uses the PostgreSQL schema already defined in
`sql/schema.sql`. It does not create a second schema. After loading data and applying
`sql/recommended_indexes.sql` and `sql/recommendations.sql`, install the Python dependencies and configure the standard
`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` environment variables.

From the project root, start the API with:

```bash
python -m uvicorn app.main:app --app-dir backend --reload
```

Open <http://127.0.0.1:8000/docs> while the server is running. Full instructions and the
implemented endpoint list are in `backend/README.md`.

Movie Similarity currently uses the team's selected Genre-based Jaccard Similarity. Run
`sql/recommendations.sql` after importing data to create the recommendation cache and SQL
function. The first request for a movie calculates and stores its top 50 similar movies;
subsequent requests read the cache. The Popular Movies formula and final rubric compliance
remain pending the course project brief. See `docs/recommendation-requirements-pending.md`.
The development dataset choice also remains configurable until the team confirms whether
it will use the official `ml-latest-small` data or a 100k sample extracted from `ml-25m`.
