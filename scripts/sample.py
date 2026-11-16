"""第 5 步：从 ml-25m 按用户抽样，生成几档不同规模的数据。

为什么按用户抽：随机抽评分行会把每个用户的评分记录切碎，"某用户的评分历史"这类查询就测不准了。
做法：用固定随机种子把用户打乱，按顺序一个个收进来，直到评分条数达到目标。
所以小档是大档的子集（嵌套），不同规模之间的对比更公平。

用法：
    python scripts/sample.py data/raw/ml-25m 100k=100000 1m=1000000 10m=10000000
输出：
    data/samples/<名字>/ 下的 movies.csv ratings.csv tags.csv links.csv，格式和原始数据一样，
    可以直接 python scripts/load.py data/samples/1m
    （全量直接用 data/raw/ml-25m，不用抽）
"""
import os
import shutil
import sys

import numpy as np
import pandas as pd

src = sys.argv[1]
targets = [(t.split("=")[0], int(t.split("=")[1])) for t in sys.argv[2:]]

print("读取 ratings.csv ...")
ratings = pd.read_csv(f"{src}/ratings.csv",
                      dtype={"userId": "int32", "movieId": "int32", "rating": "float32", "timestamp": "int64"})
tags = pd.read_csv(f"{src}/tags.csv")
print(f"共 {len(ratings):,} 条评分，{ratings.userId.nunique():,} 个用户")

per_user = ratings.groupby("userId").size()
order = per_user.sample(frac=1, random_state=42)        # 固定种子，每次结果一样，队友也能复现
cum = order.cumsum()

for name, n in targets:
    k = int(np.searchsorted(cum.values, n)) + 1         # 收到第 k 个用户时刚好达到目标
    users = set(order.index[:k])
    out = f"data/samples/{name}"
    os.makedirs(out, exist_ok=True)
    r = ratings[ratings.userId.isin(users)]
    r.to_csv(f"{out}/ratings.csv", index=False)
    tags[tags.userId.isin(users)].to_csv(f"{out}/tags.csv", index=False)
    for f in ("movies.csv", "links.csv"):                # 电影表保持完整，只有评分规模在变
        shutil.copy(f"{src}/{f}", f"{out}/{f}")
    print(f"{name:>6}: {len(users):>7,} 个用户  {len(r):>11,} 条评分  → {out}/")
