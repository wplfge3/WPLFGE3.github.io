#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把「文章/*.md」编译成与品牌站同款式的文章页（文章/*.html）。

设计要点：
- Markdown 里 `<!-- PUBLISH-CUT` 之后的内容不会进入网页（可以放心写发布前备注）；
- 只支持文章需要的几种语法：# 标题、## 小标题、> 引用、- 列表、普通段落、--- 分隔线；
- 页头页脚与首页风格一致，样式直接复用 styles.css。

用法：
  python tools/md2article.py                       # 编译 文章/ 下所有 md
  python tools/md2article.py 文章/xxx.md           # 只编译指定文件
"""
from __future__ import annotations

import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
ARTICLES = os.path.join(SITE, "文章")

CUT = "<!-- PUBLISH-CUT"

TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#1f4130">
<title>{title}｜萸老头</title>
<meta name="description" content="{description}">
<meta name="keywords" content="西峡山茱萸,米坪镇,中药材延链增值,药食同源,萸老头,道地药材">
<meta name="author" content="萸老头 · 南阳晟行农业发展有限公司">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<meta property="og:locale" content="zh_CN">
<meta property="og:type" content="article">
<meta property="og:site_name" content="萸老头">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="../assets/cornus-officinalis.jpg">
<meta property="article:published_time" content="{iso_date}">
<link rel="stylesheet" href="../styles.css?v=2">
<script>document.documentElement.classList.add('js');</script>
</head>
<body>
<a class="skip-link" href="#main">跳到主要内容</a>

<header class="site-header" id="top">
  <div class="wrap header-inner">
    <a class="brand" href="../index.html" aria-label="萸老头首页">
      <span class="seal" aria-hidden="true">萸</span>
      <span class="brand-copy">
        <strong>萸老头</strong>
        <small>伏牛山道地药材</small>
      </span>
    </a>
    <nav class="main-nav" aria-label="文章导航">
      <a href="../index.html#story">品牌故事</a>
      <a href="../index.html#products">道地药材</a>
      <a href="../index.html#research">科研依据</a>
      <a href="../index.html#silver">银发食养</a>
      <a href="../index.html#contact">联系订购</a>
    </nav>
    <div class="header-cta">
      <a class="btn btn--line btn--sm" href="../index.html"><i data-lucide="arrow-left"></i><span>返回首页</span></a>
      <a class="btn btn--seal btn--sm" href="../index.html#contact"><i data-lucide="message-circle"></i><span>微信咨询</span></a>
    </div>
  </div>
</header>

<main id="main">
  <article>
    <div class="article-hero">
      <div class="wrap">
        <p class="kicker">{kicker}</p>
        <h1 class="article-title">{title}</h1>
        <div class="article-meta">
          <span><i data-lucide="newspaper"></i>产业观察</span>
          <span><i data-lucide="calendar-days"></i>{date}</span>
          <span><i data-lucide="map-pin"></i>河南省南阳市西峡县</span>
          <span><i data-lucide="clock"></i>约 {minutes} 分钟读完</span>
        </div>
      </div>
    </div>

    <div class="article-body">
{body}
    </div>

    <div class="article-cta">
      <div>
        <h3>想尝尝这颗伏牛山的红果？</h3>
        <p>野生山茱萸（萸肉）、九蒸九晒黄精，产地仓直发，支持先看样再下单。</p>
      </div>
      <div class="cta-row" style="margin-top:0">
        <a class="btn btn--seal" href="../index.html#products"><i data-lucide="shopping-bag"></i>看道地药材</a>
        <a class="btn btn--line" href="../index.html#contact"><i data-lucide="message-circle"></i>联系订购</a>
      </div>
    </div>

    <div class="article-foot">
      <p><strong>资料来源：</strong>{sources}</p>
      <p><strong>免责说明：</strong>本文为产业观察报道，所述内容为产地、工艺、产业链与农户增收情况，<strong>不涉及任何疾病预防或治疗功效</strong>。文中产品属于传统药食两用农产品，不能代替药物；孕妇、哺乳期妇女及婴幼儿等特殊人群不推荐食用，正在服药或有慢性疾病者请先咨询医师或药师。</p>
      <p><a href="../index.html">← 返回萸老头首页</a></p>
    </div>
  </article>
</main>

<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <span class="seal seal--sm" aria-hidden="true">萸</span>
      <div><strong>萸老头</strong><p>伏牛山道地药材。看得见的源头，信得过的品质。</p></div>
    </div>
    <div class="footer-bottom">
      <p>© <span id="year">2026</span> 萸老头 · 南阳晟行农业发展有限公司　产地：河南省南阳市西峡县米坪镇行上村</p>
      <p><a href="../index.html#douyin">抖音专卖店</a>　·　<a href="../index.html#contact">联系订购</a></p>
    </div>
  </div>
</footer>

<script src="../assets/lucide.min.js"></script>
<script>lucide.createIcons();document.getElementById('year').textContent=new Date().getFullYear();</script>
</body>
</html>
"""


def smart_quotes(text: str) -> str:
    """把成对的直引号转成中文弯引号，避免正文里出现 "..."。"""
    out: list[str] = []
    open_q = True
    for ch in text:
        if ch == '"':
            out.append("“" if open_q else "”")
            open_q = not open_q
        else:
            out.append(ch)
    return "".join(out)


def inline(text: str) -> str:
    """转义后处理行内语法：**粗体**、`代码`、[文字](链接)。"""
    out = html.escape(smart_quotes(text), quote=False)
    out = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"`(.+?)`", r"<code>\1</code>", out)
    out = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', out)
    return out


def convert(markdown: str) -> tuple[str, str]:
    """返回 (标题, 正文 HTML)。"""
    body_lines: list[str] = []
    title = ""
    list_open = False
    para: list[str] = []

    def flush_para() -> None:
        nonlocal para
        if para:
            body_lines.append("<p>" + inline("".join(para)) + "</p>")
            para = []

    def close_list() -> None:
        nonlocal list_open
        if list_open:
            body_lines.append("</ul>")
            list_open = False

    for raw in markdown.splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_para()
            close_list()
            continue
        if stripped == "---":
            flush_para()
            close_list()
            body_lines.append("<hr>")
            continue
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            continue
        if stripped.startswith("## "):
            flush_para()
            close_list()
            body_lines.append("<h2>" + inline(stripped[3:].strip()) + "</h2>")
            continue
        if stripped.startswith(">"):
            flush_para()
            close_list()
            body_lines.append("<blockquote><p>" + inline(stripped.lstrip("> ").strip()) + "</p></blockquote>")
            continue
        if stripped.startswith("- "):
            flush_para()
            if not list_open:
                body_lines.append("<ul>")
                list_open = True
            body_lines.append("<li>" + inline(stripped[2:].strip()) + "</li>")
            continue

        para.append(stripped)

    flush_para()
    close_list()
    return title, "\n      ".join(body_lines)


def build(path: str) -> str:
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()

    head, _, _tail = raw.partition(CUT)
    title, body = convert(head.strip())

    name = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(ARTICLES, name + ".html")

    plain = re.sub(r"[<>\s#*>\[\]()\-]", "", head)
    description = plain[:96] + "……"

    rendered = TEMPLATE.format(
        title=html.escape(title, quote=True),
        description=html.escape(description, quote=True),
        kicker="产业观察",
        date="2026 年 10 月",
        iso_date="2026-10-04",
        minutes=max(1, round(len(plain) / 400)),
        body=body,
        sources="中国日报网、南阳市人民政府、南阳晚报、河南日报农村版、西峡文明网公开报道；"
                "国家卫生健康委员会与国家市场监督管理总局 2023 年第 9 号公告；国家统计局人口数据；"
                "国务院办公厅国办发〔2024〕1 号文件。",
    )

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(rendered)

    print(f"{os.path.basename(path)} -> {os.path.basename(out)}  （标题：{title}，正文 {len(body)} 字符）")
    return out


def main() -> None:
    args = sys.argv[1:]
    if args:
        targets = args
    else:
        targets = [os.path.join(ARTICLES, n) for n in sorted(os.listdir(ARTICLES)) if n.endswith(".md")]
    if not targets:
        print("文章/ 下没有 .md 文件")
        return
    for path in targets:
        build(path)


if __name__ == "__main__":
    main()
