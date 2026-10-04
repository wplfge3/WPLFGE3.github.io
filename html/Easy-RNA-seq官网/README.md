# Easy-RNA-seq 官方网站

面向 **转录组 Windows 自动化运行程序**（`RNA-Seq//上游分析` / `BASE PAIR LAB · RNA Seq WORKBENCH`）的产品官网。
内容全部依据 `Easy-RNA-seq教程.docx` 整理，界面截图取自教程原图。

## 目录结构

```
Easy-RNA-seq官网/
├─ index.html               官网首页（功能 / 流程 / 指引 / 结果 / SRA / 环境 / 正版服务 / 视频 / FAQ）
├─ tutorial.html            完整图文教程（对照教程原文逐节展开）
├─ 启动本地预览.bat          一键起本地服务并打开浏览器（需要 Python）
├─ README.md                本文件
└─ assets/
   ├─ styles.css            全部样式（品牌配色 + 护眼模式 + 响应式）
   ├─ app.js                交互脚本（主题、导航、滚动动效、复制、标签页）
   ├─ logo.svg / favicon.svg
   └─ screenshots/          11 张界面截图（来自教程 docx，已重命名）
```

## 本地预览

两种方式都可以：

1. **直接双击 `index.html`** —— 纯静态，无需任何依赖。
2. **双击 `启动本地预览.bat`** —— 起一个本地服务（默认 `http://127.0.0.1:8080/`），
   此时浏览器的剪贴板接口可用，「复制联系方式」按钮体验最好。

> 首次打开时「复制联系方式」若提示失败，说明是 `file://` 直接打开的限制，改用方式 2 即可。

## 上线部署

站点是纯静态文件，把整个 `Easy-RNA-seq官网` 目录上传到任意静态托管即可
（学校/实验室服务器 Nginx、GitHub Pages、Gitee Pages、对象存储静态站点等）。

若部署到子路径（例如 `https://example.com/rnaseq/`），所有资源都使用相对路径，
可直接使用，无需改配置。

## 已实现的设计与功能

- **视觉识别沿用软件本体**：米色纸面（`#F6F0DE`）+ 深绿主色（`#245744`）+ 砖红点缀（`#C24A33`）
  + 青色主按钮（`#1A9DC4`），标签统一使用等宽大写字体，与软件界面的 `BASE PAIR LAB // RNA Seq WORKBENCH` 一致。
- **护眼模式**：右上角一键切换深色主题，选择记入 `localStorage`，刷新后保持。
- **主题分享链接**：支持 `?theme=dark` / `?theme=light` 强制指定主题，优先级高于本地记忆。
- **响应式**：1440 / 1024 / 768 / 390 四档视口均无横向溢出（已用 CDP 实测）。
- **可访问性**：跳转链接、`aria-selected` / `aria-expanded` / `aria-pressed`、
  `role="tablist"`、`aria-live` 提示、键盘 `Esc` 关闭菜单、`prefers-reduced-motion` 降级。
- **无外部依赖**：不加载任何 CDN、字体或图标库，完全离线可用。

## 修改内容时看这里

| 想改什么 | 改哪里 |
| --- | --- |
| 联系方式（微信 / QQ / 邮箱 / 手机 / 群号） | `index.html` 与 `tutorial.html` 中搜索 `wxid_` 或 `1050409424`；注意「复制全部联系方式」按钮里的 `data-copy` 也有一份 |
| 视频教程链接 | 搜索 `bilibili.com` |
| 十步流程名称 | `index.html` 的 `#pipeline`；顶部跑马灯 `.ticker` 里同样有一份（两份都要改） |
| 常见问题 | `index.html` 的 `#faq`，每个 `<details class="qa">` 一条 |
| 配色 / 字号 / 间距 | `assets/styles.css` 顶部的 CSS 变量（`:root` 与 `html[data-theme="dark"]`） |
| 界面截图 | 替换 `assets/screenshots/` 下的同名文件即可，无需改 HTML |

## 内容来源与口径

- 软件名称、10 个分析阶段、参数项、结果文件（gene/transcript × counts/FPKM/TPM）、
  SRA 转 FASTQ 工具说明、运行注意事项（Java / Python、路径不含中文与特殊符号）、
  联系方式与售后口径，均来自 `Easy-RNA-seq教程.docx`。
- 官网中未虚构任何下载地址、价格或功能。软件获取与服务统一引导至
  「正版服务」板块的两位联系人与售后 QQ 群。
- **软件不含激活码系统**：不需要机器码、购买订单号或任何验证步骤，打开即用。
  站点口径统一为「正版提供服务」与「我们承诺提供服务」，
  刻意保留的「无激活码系统 / 不需要激活码」表述是为了直接回答用户疑问，不是遗漏。
- 页脚已注明：本软件为独立开发的 Windows 桌面程序，与 TBtools 官方团队无从属关系。
