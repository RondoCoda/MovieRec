"""第 3 步：把一份 MovieLens 数据导进 PostgreSQL。

流程：建暂存表 → COPY 四个 CSV 进暂存表 → 建正式表 → 用 SQL 清洗并写入正式表 → VACUUM ANALYZE
每一步都计时，结果存进 bench/results/load_<数据集名>.csv（报告 §6 可以用）。

用法：
    python scripts/load.py data/raw/ml-latest-small
    python scripts/load.py data/samples/1m --schema sql/schema.sql

连接参数用环境变量（不写就用默认值）：
    PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE（默认库名 movierec）
"""
import argparse
import csv
import os
import time

import psycopg2

ap = argparse.ArgumentParser()
ap.add_argument("data_dir")
ap.add_argument("--schema", default="sql/schema.sql", help="正式表的建表文件")
args = ap.parse_args()

name = os.path.basename(args.data_dir.rstrip("/\\"))
conn = psycopg2.connect(dbname=os.environ.get("PGDATABASE", "movierec"))
conn.autocommit = True
cur = conn.cursor()
timings = []


def step(label, fn):
    t0 = time.perf_counter()
    fn()
    sec = time.perf_counter() - t0
    timings.append((label, round(sec, 3)))
    print(f"{sec:8.2f} s  {label}")


def run_sql(path):
    with open(path, encoding="utf-8") as f:
        cur.execute(f.read())


def copy_csv(table, fname):
    with open(os.path.join(args.data_dir, fname), encoding="utf-8") as f:
        cur.copy_expert(f"COPY staging.{table} FROM STDIN WITH (FORMAT csv, HEADER true)", f)


print(f"导入 {args.data_dir}")
step("建暂存表", lambda: run_sql("sql/staging.sql"))
for table in ("movies", "ratings", "tags", "links"):
    step(f"COPY {table}.csv", lambda t=table: copy_csv(t, f"{t}.csv"))
step("建正式表", lambda: run_sql(args.schema))
step("清洗并写入正式表", lambda: run_sql("sql/staging_to_final.sql"))
# VACUUM 更新可见性映射，之后查询才能用 Index Only Scan；ANALYZE 更新统计信息
step("VACUUM ANALYZE", lambda: cur.execute("VACUUM ANALYZE"))

print("\n正式表行数：")
for t in ("movies", "genres", "movie_genres", "users", "ratings", "tags", "movie_tags", "links"):
    cur.execute(f"SELECT count(*) FROM {t}")
    print(f"  {t:<14} {cur.fetchone()[0]:>12,}")
cur.execute("SELECT count(*) FROM staging.ratings")
print(f"  （暂存表 ratings {cur.fetchone()[0]:,} 行，和正式表不一致说明有评分被过滤掉了）")

os.makedirs("bench/results", exist_ok=True)
out = f"bench/results/load_{name}.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["step", "seconds"])
    w.writerows(timings)
print(f"\n耗时已写入 {out}")
