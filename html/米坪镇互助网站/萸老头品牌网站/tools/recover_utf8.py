#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""抢救被 PowerShell Get-Content/Set-Content 编码往返破坏的 UTF-8 文本文件。

原理：原文件是 UTF-8；PowerShell 用系统 ANSI(GBK) 读，得到「乱码字符串」，再以 UTF-8 写回。
所以现在文件里是 UTF-8( GBK解码(原UTF-8字节) )。反向操作即可还原：
  当前文件 --(utf-8 解码)--> 乱码字符串 --(gb18030 编码)--> 原 UTF-8 字节 --(utf-8 解码)--> 原文
解码时被替换成 ? 的字节无法还原，会在文本里留下 U+FFFD，脚本会列出来人工修补。
"""
import io
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

if len(sys.argv) < 2:
    sys.exit("用法: python tools/recover_utf8.py <文件路径> [--apply]")

path = sys.argv[1]
apply_fix = "--apply" in sys.argv

raw = io.open(path, encoding="utf-8", errors="replace").read()
had_bom = raw.startswith("\ufeff")
if had_bom:
    raw = raw[1:]

# 已经是正常中文（含大量 CJK 且几乎无 U+FFFD）就不用修
cjk = sum(1 for ch in raw if "\u4e00" <= ch <= "\u9fff")
flagged = raw.count("\ufffd")
print(f"文件字符数 {len(raw)}，CJK 字符 {cjk}，BOM {had_bom}，可疑替换符 {flagged}")
if cjk > len(raw) * 0.1 and "锛" not in raw and "涓" not in raw:
    print("看起来没有损坏，未做修改。")
    sys.exit(0)

data = raw.encode("gb18030", errors="replace")
recovered = data.decode("utf-8", errors="replace")
bad = [i for i, ch in enumerate(recovered) if ch == "\ufffd"]
lost = raw.count("?")
print(f"乱码串里的 ? 共 {lost} 个；还原后字符数 {len(recovered)}，无法还原的位置 {len(bad)} 处")
for i in bad[:60]:
    left = recovered[max(0, i - 30):i].replace("\n", " | ")
    right = recovered[i + 1:i + 30].replace("\n", " | ")
    print(f"  @{i}  ...{left} [X] {right}...")

if apply_fix:
    io.open(path, "w", encoding="utf-8", newline="").write(recovered)
    print("已写回。")
else:
    out = path + ".recovered"
    io.open(out, "w", encoding="utf-8", newline="").write(recovered)
    print(f"预览写入 {out}（确认无误后加 --apply 覆盖原文件）")
