#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把整页长截图切成便于查看/交付的分屏图，并丢弃「纯背景」空屏。

输入：
  preview/_full-desktop.png   （Chrome 整页长截图，1440 宽）
  preview/_full-mobile.png    （Chrome 整页长截图，430 宽）
输出：
  preview/desktop-01.png ... desktop-NN.png
  preview/mobile-01.png  ... mobile-NN.png
原始长图处理完会被删除。

Chrome 的截图窗口高度是故意给足的（长于页面），底部会留下大片背景色；
这里按屏统计灰度极差，极差很小的屏判为空白并丢弃。

用法：python tools/make_preview.py
"""
from __future__ import annotations

import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
PREVIEW = os.path.join(SITE, "preview")

JOBS = [
    {"source": "_full-desktop.png", "prefix": "desktop", "tile": 1500, "ratio": 0.04, "crop": None},
    {"source": "_full-mobile.png", "prefix": "mobile", "tile": 1400, "ratio": 0.05, "crop": 390},
]


def is_blank(tile: Image.Image, min_content_ratio: float) -> bool:
    """与整屏中位灰度相差明显的像素占比过小，判为纯背景屏。

    这样可以把页面底部的大片留白（以及只画了固定悬浮按钮的那一屏）一起丢掉。
    """
    arr = np.asarray(tile.convert("L"), dtype=np.int16)
    median = float(np.median(arr))
    ratio = float((np.abs(arr - median) > 8).mean())
    return ratio < min_content_ratio


def slice_image(path: str, prefix: str, tile_height: int, min_content_ratio: float, crop: int | None) -> list[str]:
    image = Image.open(path)
    if crop:
        image = image.crop((0, 0, crop, image.size[1]))
    width, height = image.size
    written: list[str] = []
    index = 0
    top = 0

    while top < height:
        bottom = min(top + tile_height, height)
        tile = image.crop((0, top, width, bottom))
        if is_blank(tile, min_content_ratio):
            tile.close()
        else:
            index += 1
            name = f"{prefix}-{index:02d}.png"
            tile.save(os.path.join(PREVIEW, name), optimize=True)
            written.append(name)
        top = bottom

    image.close()
    print(f"{os.path.basename(path)} {width}x{height} -> 有效 {len(written)} 屏（已丢弃空屏）")
    return written


def main() -> None:
    for job in JOBS:
        source, prefix = job["source"], job["prefix"]
        path = os.path.join(PREVIEW, source)
        if not os.path.exists(path):
            print(f"跳过（不存在）：{source}")
            continue
        for old in os.listdir(PREVIEW):
            if old.startswith(prefix + "-") and old.endswith(".png"):
                os.remove(os.path.join(PREVIEW, old))
        names = slice_image(path, prefix, job["tile"], job["ratio"], job["crop"])
        print("  " + ", ".join(names))
        os.remove(path)


if __name__ == "__main__":
    main()
