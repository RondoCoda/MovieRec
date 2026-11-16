"""第 4 步：性能测试脚本。

做三件事：
  1. 先把索引恢复到基线，再执行一个"配置"文件（比如建索引），记录它花了多久、索引占多大
     这样每个配置都是"基线 + 这一组索引"，结果互不干扰
  2. 把每条查询先预热几次，再正式跑 N 次，记录每次耗时（毫秒）
  3. 每条查询保存一份 EXPLAIN (ANALYZE, BUFFERS) 执行计划，用来解释为什么快/慢

用法：
    python bench/bench.py --dataset small --config bench/configs/baseline.sql
    python bench/bench.py --dataset small --config bench/configs/btree.sql --runs 20
    python bench/bench.py --dataset small --config bench/configs/btree.sql --queries bench/queries/q1_user_history.sql

结果：
    bench/results/timings.csv              每次运行一行，持续追加，画图用
    bench/results/index_build.csv          每个配置的执行耗时和当时的索引总大小
    bench/results/plans/<数据集>/<配置>/<查询>.txt   执行计划
"""
import argparse
import csv
import glob
import os
import statistics
import time
from datetime import datetime

import psycopg2

ap = argparse.ArgumentParser()
ap.add_argument("--dataset", required=True, help="数据规模的名字，比如 small / 100k / 1m / 25m")
ap.add_argument("--config", required=True, help="bench/configs/ 下的一个 .sql 文件")
ap.add_argument("--queries", nargs="*", default=sorted(glob.glob("bench/queries/*.sql")))
ap.add_argument("--runs", type=int, default=10, help="正式计时的次数")
ap.add_argument("--warmup", type=int, default=2, help="预热次数（不计入结果）")
ap.add_argument("--reset", default="bench/configs/baseline.sql",
                help="每次先执行它，把索引恢复到基线，保证各配置互不影响")
args = ap.parse_args()

config = os.path.splitext(os.path.basename(args.config))[0]
conn = psycopg2.connect(dbname=os.environ.get("PGDATABASE", "movierec"))
conn.autocommit = True
cur = conn.cursor()
os.makedirs("bench/results", exist_ok=True)


def append_csv(path, header, rows):
    new = not os.path.exists(path)
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(header)
        w.writerows(rows)


# ---------- 1. 先恢复基线，再执行配置 ----------
with open(args.reset, encoding="utf-8") as f:
    cur.execute(f.read())
with open(args.config, encoding="utf-8") as f:
    t0 = time.perf_counter()
    cur.execute(f.read())
    build_s = time.perf_counter() - t0
cur.execute("ANALYZE")
cur.execute("""
    SELECT coalesce(sum(pg_relation_size(indexrelid)), 0)
    FROM pg_stat_user_indexes WHERE schemaname = 'public'
""")
index_mb = cur.fetchone()[0] / 1024 / 1024
print(f"[{args.dataset} / {config}] 配置执行 {build_s:.2f} s，索引共 {index_mb:.1f} MB")
append_csv("bench/results/index_build.csv",
           ["time", "dataset", "config", "build_seconds", "total_index_mb"],
           [[datetime.now().isoformat(timespec="seconds"), args.dataset, config,
             round(build_s, 3), round(index_mb, 2)]])

# ---------- 2 + 3. 跑查询 ----------
plan_dir = f"bench/results/plans/{args.dataset}/{config}"
os.makedirs(plan_dir, exist_ok=True)
rows = []
for qpath in args.queries:
    qname = os.path.splitext(os.path.basename(qpath))[0]
    with open(qpath, encoding="utf-8") as f:
        sql = f.read().strip().rstrip(";")

    for _ in range(args.warmup):          # 预热：把数据读进缓存，排除第一次读磁盘的影响
        cur.execute(sql)
        cur.fetchall()

    times = []
    for i in range(args.runs):
        t0 = time.perf_counter()
        cur.execute(sql)
        n = len(cur.fetchall())
        ms = (time.perf_counter() - t0) * 1000
        times.append(ms)
        rows.append([args.dataset, config, qname, i + 1, round(ms, 3), n])

    cur.execute("EXPLAIN (ANALYZE, BUFFERS) " + sql)
    plan = "\n".join(r[0] for r in cur.fetchall())
    with open(f"{plan_dir}/{qname}.txt", "w", encoding="utf-8") as f:
        f.write(sql + "\n\n" + plan + "\n")

    first_line = plan.splitlines()[0][:60]
    print(f"  {qname:<22} 中位数 {statistics.median(times):9.2f} ms   返回 {n} 行   {first_line}")

append_csv("bench/results/timings.csv",
           ["dataset", "config", "query", "run", "ms", "rows"], rows)
print(f"已追加 {len(rows)} 行到 bench/results/timings.csv，执行计划在 {plan_dir}/")
