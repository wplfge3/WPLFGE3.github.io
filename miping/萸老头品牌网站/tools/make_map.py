#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
由公开 GeoJSON 边界数据生成「萸老头」品牌站用的产区示意地图（纯静态 SVG）。

输入（site/data/）：
  xixia-boundary.geojson   西峡县县级边界
  miping-villages.geojson  米坪镇 17 个行政村边界（约）
输出：
  assets/miping-map.svg

用法：
  python tools/make_map.py
"""
from __future__ import annotations

import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
DATA = os.path.join(SITE, "data")
OUT = os.path.join(SITE, "assets", "miping-map.svg")

WIDTH, HEIGHT = 1000.0, 720.0
PAD = 58.0
TOLERANCE = 0.0016  # 投影坐标简化容差（度·cos 修正后）

# 需要标注的行政村
LABEL_ALL = False
KEY_VILLAGES = ["行上村", "米坪村", "河西村", "石门村", "关山村", "大庄村"]
FOCUS = "行上村"


def load(name):
    with open(os.path.join(DATA, name), "r", encoding="utf-8") as fh:
        return json.load(fh)


def rings(geometry):
    """把 Polygon / MultiPolygon 统一成环列表。"""
    kind = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if kind == "Polygon":
        return [(coords, False)]
    if kind == "MultiPolygon":
        out = []
        for polygon in coords:
            for index, ring in enumerate(polygon):
                out.append((ring, index > 0))
        return out
    return []


def project(lon, lat, lon0, lat0):
    return (lon - lon0) * math.cos(math.radians(lat0)) * 1000.0, (lat0 - lat) * 1000.0


def simplify(points, tolerance):
    """Douglas-Peucker，保留闭合环的首尾。"""
    if len(points) < 5:
        return points
    closed = points[0] == points[-1]
    core = points[:-1] if closed else points
    if len(core) < 3:
        return points
    tol2 = tolerance * tolerance

    def rdp(seq):
        if len(seq) < 3:
            return seq
        (x1, y1), (x2, y2) = seq[0], seq[-1]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy)
        idx, best = -1, -1.0
        for i in range(1, len(seq) - 1):
            px, py = seq[i]
            if norm == 0:
                dist = math.hypot(px - x1, py - y1)
            else:
                dist = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
            if dist > best:
                idx, best = i, dist
        if best <= tolerance:
            return [seq[0], seq[-1]]
        left = rdp(seq[: idx + 1])
        right = rdp(seq[idx:])
        return left[:-1] + right

    out = rdp(core)
    if closed:
        out = out + [out[0]]
    return out


def feature_name(feature):
    props = feature.get("properties") or {}
    for key in ("name", "NAME", "Name", "XZQMC", "mc", "村名", "village"):
        if props.get(key):
            return str(props[key]).strip()
    return ""


def main():
    boundary = load("xixia-boundary.geojson")
    villages = load("miping-villages.geojson")
    centers = json.load(open(os.path.join(DATA, "miping-villages.json"), "r", encoding="utf-8"))

    lons, lats = [], []
    for feature in boundary.get("features", []):
        for ring, _ in rings(feature.get("geometry") or {}):
            for lon, lat in ring:
                lons.append(lon)
                lats.append(lat)
    for feature in villages.get("features", []):
        for ring, _ in rings(feature.get("geometry") or {}):
            for lon, lat in ring:
                lons.append(lon)
                lats.append(lat)
    if not lons:
        sys.exit("没有读到任何边界坐标")

    lon0, lat0 = min(lons), max(lats)

    def fit(points):
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return min(xs), max(xs), min(ys), max(ys)

    projected = [project(lo, la, lon0, lat0) for lo, la in zip(lons, lats)]
    minx, maxx, miny, maxy = fit(projected)

    # 画布聚焦到米坪镇：用镇域边界 + 17 个村中心点定框，再向外留出约 1/3 余量，
    # 这样县界仍能作为环境出现，但镇域与村点看得清楚。
    focus_points = [project(item["lng"], item["lat"], lon0, lat0) for item in centers]
    for feature in villages.get("features", []):
        for ring, _ in rings(feature.get("geometry") or {}):
            for lon, lat in ring:
                focus_points.append(project(lon, lat, lon0, lat0))
    fx0, fx1, fy0, fy1 = fit(focus_points)
    margin_x = (fx1 - fx0) * 0.34
    margin_y = (fy1 - fy0) * 0.34
    minx, maxx = fx0 - margin_x, fx1 + margin_x
    miny, maxy = fy0 - margin_y, fy1 + margin_y

    scale = min((WIDTH - 2 * PAD) / max(maxx - minx, 1e-6), (HEIGHT - 2 * PAD) / max(maxy - miny, 1e-6))
    offset_x = (WIDTH - (maxx - minx) * scale) / 2.0
    offset_y = (HEIGHT - (maxy - miny) * scale) / 2.0

    def to_svg(lon, lat):
        x, y = project(lon, lat, lon0, lat0)
        return (x - minx) * scale + offset_x, (y - miny) * scale + offset_y

    def path_of(feature, tolerance):
        chunks = []
        for ring, _ in rings(feature.get("geometry") or {}):
            pts = [to_svg(lo, la) for lo, la in ring]
            pts = simplify(pts, tolerance)
            if len(pts) < 3:
                continue
            d = "M" + " L".join(f"{p[0]:.1f} {p[1]:.1f}" for p in pts) + " Z"
            chunks.append(d)
        return " ".join(chunks)

    county_d = " ".join(
        path_of(feature, TOLERANCE * 1.2) for feature in boundary.get("features", [])
    )

    village_shapes = []
    for feature in villages.get("features", []):
        name = feature_name(feature)
        village_shapes.append((name, path_of(feature, TOLERANCE)))

    points = []
    for item in centers:
        x, y = to_svg(item["lng"], item["lat"])
        points.append((item["name"], x, y))

    # 图面刻度：以米坪镇中心为原点画一条 5 公里的比例尺
    # 投影坐标里 1 公里对应的图面长度（经纬方向同比，故可直接画圆）
    units_per_km = 1000.0 / 111.32
    scale_bar_px = 5.0 * units_per_km * scale

    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH:.0f} {HEIGHT:.0f}" '
        f'role="img" aria-labelledby="mapTitle mapDesc" width="{WIDTH:.0f}" height="{HEIGHT:.0f}">'
    )
    parts.append(
        "<title id=\"mapTitle\">米坪镇产区示意地图</title>"
        "<desc id=\"mapDesc\">依据公开行政边界数据绘制的河南省南阳市西峡县米坪镇及周边示意地图，"
        "标注米坪镇 17 个行政村中心位置，其中行上村为萸老头品牌种植与加工基地所在村。</desc>"
    )
    parts.append(
        """<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#fbf7ee"/><stop offset="100%" stop-color="#f2ebdb"/>
  </linearGradient>
  <linearGradient id="town" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#d8e4d5"/><stop offset="100%" stop-color="#c2d4c0"/>
  </linearGradient>
  <linearGradient id="focus" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e2b3ae"/><stop offset="100%" stop-color="#c9766e"/>
  </linearGradient>
  <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="7" stroke="#9fb79c" stroke-width="1" opacity="0.5"/>
  </pattern>
</defs>"""
    )
    parts.append(f'<rect width="{WIDTH:.0f}" height="{HEIGHT:.0f}" fill="url(#paper)"/>')

    # 经纬网
    grid = []
    for lon in [x / 10 for x in range(int(min(lons) * 10) + 1, int(max(lons) * 10) + 1)]:
        gx, _ = to_svg(lon, lat0)
        if PAD * 0.4 < gx < WIDTH - PAD * 0.4:
            grid.append(f'<line x1="{gx:.1f}" y1="20" x2="{gx:.1f}" y2="{HEIGHT-46:.0f}"/>')
    for lat in [x / 10 for x in range(int(min(lats) * 10) + 1, int(max(lats) * 10) + 1)]:
        _, gy = to_svg(lon0, lat)
        if PAD * 0.4 < gy < HEIGHT - PAD * 0.4:
            grid.append(f'<line x1="20" y1="{gy:.1f}" x2="{WIDTH-20:.0f}" y2="{gy:.1f}"/>')
    parts.append(
        '<g stroke="#8d9c8a" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.35">'
        + "".join(grid)
        + "</g>"
    )

    parts.append(f'<path d="{county_d}" fill="#e8e6d8" fill-opacity="0.55" stroke="#a9ab93" stroke-width="1.1" stroke-dasharray="6 4"/>')

    for name, d in village_shapes:
        if not d:
            continue
        if name == FOCUS:
            fill, stroke, width = "url(#focus)", "#8f2f28", "1.6"
        else:
            fill, stroke, width = "url(#town)", "#7f9a7c", "1"
        parts.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" fill-opacity="0.92" stroke-linejoin="round"/>')

    parts.append(f'<path d="{county_d}" fill="none" stroke="#6f7a63" stroke-width="1.6" opacity="0.75"/>')

    # 行上村基地示意范围（半径约 650 米，与参考地图口径一致，不代表法定村界）
    focus_point = next(((x, y) for name, x, y in points if name == FOCUS), None)
    if focus_point:
        radius_px = 0.65 * units_per_km * scale
        fx, fy = focus_point
        parts.append(
            f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{radius_px:.1f}" fill="#b3242a" fill-opacity="0.07" '
            'stroke="#8f2f28" stroke-width="1" stroke-dasharray="4 4"/>'
        )

    for name, x, y in points:
        if name == FOCUS:
            parts.append(
                f'<g><circle cx="{x:.1f}" cy="{y:.1f}" r="14" fill="#b3242a" opacity="0.14"/>'
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="#b3242a" stroke="#fbf7ee" stroke-width="2"/></g>'
            )
        else:
            parts.append(
                f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.4" fill="#3f5b46" stroke="#fbf7ee" stroke-width="1.4"/>'
            )

    labelled = []
    label_points = sorted(points, key=lambda item: 0 if item[0] == FOCUS else 1)
    for name, x, y in label_points:
        if not (LABEL_ALL or name in KEY_VILLAGES):
            continue
        if any(abs(x - px) < 74 and abs(y - py) < 30 for px, py in labelled):
            continue
        labelled.append((x, y))
        focus = name == FOCUS
        anchor = "start" if x < WIDTH - 150 else "end"
        dx = 12 if anchor == "start" else -12
        size = 17 if focus else 14
        weight = 700 if focus else 500
        color = "#8f2f28" if focus else "#2b3a2f"
        parts.append(
            f'<text x="{x + dx:.1f}" y="{y + 5:.1f}" text-anchor="{anchor}" font-size="{size}" '
            f'font-weight="{weight}" fill="{color}" letter-spacing="1" '
            f'style="font-family:\'Songti SC\',\'SimSun\',serif;paint-order:stroke;stroke:#fbf7ee;stroke-width:3.4px;stroke-linejoin:round">{name}</text>'
        )

    # 指北针
    parts.append(
        f'<g transform="translate({WIDTH-72:.0f},72)">'
        '<circle r="26" fill="#fbf7ee" stroke="#c6bfa8" stroke-width="1"/>'
        '<path d="M0 -17 L7 8 L0 3 L-7 8 Z" fill="#b3242a"/>'
        '<text y="-32" text-anchor="middle" font-size="13" fill="#5b6553" letter-spacing="1" '
        'style="font-family:\'Songti SC\',\'SimSun\',serif">北</text></g>'
    )

    # 比例尺
    bar_x, bar_y = PAD, HEIGHT - 40
    parts.append(
        f'<g><line x1="{bar_x:.0f}" y1="{bar_y:.0f}" x2="{bar_x + scale_bar_px:.1f}" y2="{bar_y:.0f}" '
        'stroke="#4a5a48" stroke-width="2"/>'
        f'<line x1="{bar_x:.0f}" y1="{bar_y-5:.0f}" x2="{bar_x:.0f}" y2="{bar_y+5:.0f}" stroke="#4a5a48" stroke-width="2"/>'
        f'<line x1="{bar_x + scale_bar_px:.1f}" y1="{bar_y-5:.0f}" x2="{bar_x + scale_bar_px:.1f}" y2="{bar_y+5:.0f}" stroke="#4a5a48" stroke-width="2"/>'
        f'<text x="{bar_x + scale_bar_px/2:.1f}" y="{bar_y - 10:.0f}" text-anchor="middle" font-size="13" fill="#4a5a48">5 公里</text></g>'
    )

    parts.append(
        f'<text x="{PAD:.0f}" y="{HEIGHT-14:.0f}" font-size="12.5" fill="#7c8371" '
        'style="font-family:sans-serif">底图数据：公开行政边界数据 · 仅作产区位置示意，不作为权属依据</text>'
    )
    parts.append("</svg>")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts))

    size = os.path.getsize(OUT)
    total_points = sum(len(d.split("L")) for _, d in village_shapes)
    print(f"县级环点数 {len(lons)} / 村界折点 {total_points}")
    print(f"写出 {OUT}  {size/1024:.1f} KB")
    print("行政村：", "、".join(name or "(未命名)" for name, _ in village_shapes))
    missing = [n for n, _, _ in points if n not in [x for x, _ in village_shapes]]
    if missing:
        print("注意：以下村在边界数据中没有对应面：", "、".join(missing))


if __name__ == "__main__":
    main()
