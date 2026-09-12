# 西峡县 Leaflet 交互地图

## 文件说明

- `index.html`：页面入口
- `styles.css`：页面样式
- `app.js`：Leaflet 地图初始化与图层加载逻辑
- `data/xixia-boundary.geojson`：西峡县真实县级边界
- `data/xixia-towns.geojson`：西峡县真实乡镇级边界
- `data/points.json`：示例信息点
- `data/miping-villages.json`：米坪镇 17 个行政村名录及坐标（坐标来自 `村子经纬度.txt`），页面会优先使用本地坐标

## 使用方式

在当前目录启动一个本地静态服务，然后用浏览器打开页面。

```powershell
python -m http.server 8000
```

访问：

```text
http://localhost:8000
```

## 当前边界数据

县级边界数据来源：

```text
https://github.com/zhChuXiao/ChinaGeoJson/blob/master/county/西峡县.json
```

乡镇级边界数据来源：

```text
https://map.ruiduobao.com/downloadCountyBatch/county/411323?format=gson&year=2023&village=none
```

当前项目已安装西峡县 19 个乡镇（含街道、乡）的边界数据，可直接用于分区高亮、弹窗信息展示和后续业务图层叠加。

米坪镇已作为专题区域突出显示，并提供一键定位、村名筛选和坐标核验状态。当前下载到的米坪镇数据只包含镇级边界，不包含 17 个行政村边界；页面不会把镇界误标为村界。

地图右上角已加入底图切换，可在标准地图和卫星地图之间一键切换。

## 如何添加新的信息点

在 `data/points.json` 中新增对象：

```json
{
  "name": "某个点位",
  "lng": 111.5000,
  "lat": 33.3000,
  "type": "类别",
  "desc": "描述信息"
}
```

如果后续需要按乡镇着色、点击筛选或挂接指标数据，直接基于 `data/xixia-towns.geojson` 的 `name` / `code` 字段扩展即可。

自定义点位会保存到浏览器 `localStorage`，刷新后仍然保留，但不会直接回写到 `data/points.json`。

新增点位时可以选择颜色；在“已保存点位”列表中点击“编辑”即可修改名称、类型、经纬度、颜色和说明，点击“更新点位”后立即生效。
---

## 一键启动

Windows 下直接双击 `启动西峡县地图.bat` 即可。

- 自动启动本地静态服务
- 自动打开浏览器
- 默认优先使用 `http://localhost:8000/`
- 如果 8000 端口被占用，会自动尝试后续端口
- 停止服务时，关闭启动后的 PowerShell 窗口或按 `Ctrl + C`

当前一键启动脚本基于本机 `Node.js` 运行，不需要再手动执行 `python -m http.server`。
