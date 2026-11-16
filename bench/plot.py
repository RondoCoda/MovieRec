"""把 bench/results/timings.csv 画成报告用的图，并输出汇总表。

用法：
    python bench/plot.py --dataset 1m                      # 图1：某个数据规模下，各查询在各配置下的耗时
    python bench/plot.py --scaling 100k 1m 10m 25m         # 图2：每条查询的耗时随数据规模的变化

输出到 bench/results/figures/，汇总表 bench/results/summary.csv（中位数 + 相对基线的加速倍数）
"""
import argparse
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ap = argparse.ArgumentParser()
ap.add_argument("--dataset")
ap.add_argument("--scaling", nargs="*")
ap.add_argument("--baseline", default="baseline")
args = ap.parse_args()

df = pd.read_csv("bench/results/timings.csv")
os.makedirs("bench/results/figures", exist_ok=True)

# 同一组 (数据集, 配置, 查询) 可能跑过多次，取中位数，不受偶尔一次卡顿影响
med = df.groupby(["dataset", "config", "query"]).ms.median().reset_index()
base = med[med.config == args.baseline][["dataset", "query", "ms"]].rename(columns={"ms": "baseline_ms"})
summary = med.merge(base, on=["dataset", "query"], how="left")
summary["speedup"] = (summary.baseline_ms / summary.ms).round(1)
summary.round(3).to_csv("bench/results/summary.csv", index=False)
print(summary.round(2).to_string(index=False))

# 图例里配置的固定顺序（没跑过的配置会自动跳过）
ORDER = ["baseline", "btree", "trgm", "brin", "brin_sorted",
         "composite_movie_rating", "composite_rating_movie"]

if args.dataset:
    d = med[med.dataset == args.dataset].pivot(index="query", columns="config", values="ms")
    cols = [c for c in ORDER if c in d.columns] + [c for c in d.columns if c not in ORDER]
    ax = d[cols].plot.bar(figsize=(11, 4.5), logy=True, rot=20, width=0.8)
    ax.set_ylabel("Median time (ms, log scale)")
    ax.set_xlabel("")
    ax.set_title(f"Query time by index configuration ({args.dataset})")
    ax.legend(title="config", bbox_to_anchor=(1.01, 1), loc="upper left")   # 图例放到图外，不挡柱子
    plt.tight_layout()
    out = f"bench/results/figures/configs_{args.dataset}.png"
    plt.savefig(out, dpi=150)
    print("图已保存：", out)

if args.scaling:
    sub = med[med.dataset.isin(args.scaling)]
    # 只画在每一档都跑过的配置，否则只有一两个点的配置会变成散点，干扰阅读
    full = sub.groupby(["query", "config"]).dataset.nunique()
    for q, g in sub.groupby("query"):
        keep = [c for c in full[q].index if full[q][c] == len(args.scaling)]
        keep = [c for c in ORDER if c in keep] + [c for c in keep if c not in ORDER]
        p = g[g.config.isin(keep)].pivot(index="dataset", columns="config", values="ms").reindex(args.scaling)[keep]
        ax = p.plot(marker="o", figsize=(6, 4), logy=True)
        ax.set_ylabel("Median time (ms, log scale)")
        ax.set_xlabel("Dataset size (number of ratings)")
        ax.set_title(q)
        ax.legend(title="config", loc="upper left")
        plt.tight_layout()
        out = f"bench/results/figures/scaling_{q}.png"
        plt.savefig(out, dpi=150)
        plt.close()
        print("图已保存：", out)
