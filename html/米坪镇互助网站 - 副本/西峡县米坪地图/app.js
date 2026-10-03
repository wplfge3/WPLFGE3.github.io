const statusEl = document.getElementById("status");
const pointForm = document.getElementById("point-form");
const pointFormTitle = document.getElementById("point-form-title");
const pointNameInput = document.getElementById("point-name");
const pointTypeInput = document.getElementById("point-type");
const pointLatInput = document.getElementById("point-lat");
const pointLngInput = document.getElementById("point-lng");
const pointColorInput = document.getElementById("point-color");
const pointDescInput = document.getElementById("point-desc");
const pointSubmitButton = document.getElementById("point-submit");
const pointCancelButton = document.getElementById("point-cancel");
const pointListEl = document.getElementById("point-list");
const villageListEl = document.getElementById("village-list");
const villageToggle = document.getElementById("village-toggle");
const villageSearchInput = document.getElementById("village-search");
const villageSummaryEl = document.getElementById("village-summary");
const focusMipingButton = document.getElementById("focus-miping");

const STORAGE_KEY = "xixia-custom-points";
const DEFAULT_POINT_COLOR = "#a61e4d";

const map = L.map("map", {
  zoomControl: true,
  minZoom: 8
});

const defaultCenter = [33.3077, 111.4857];
const defaultZoom = 10;

const countyStyle = {
  color: "#bf5f2f",
  weight: 3,
  fillColor: "#f0b487",
  fillOpacity: 0.14
};

const townStyle = {
  color: "#0b6e4f",
  weight: 1.4,
  fillColor: "#0b6e4f",
  fillOpacity: 0.04
};

const mipingStyle = {
  color: "#d97706",
  weight: 3,
  fillColor: "#f59e0b",
  fillOpacity: 0.18
};

const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 18,
    attribution: "Tiles &copy; Esri"
  }
);

let activeBaseLayer = satelliteLayer;
let pointLayer = L.layerGroup().addTo(map);
let villageLayer = L.layerGroup().addTo(map);
let defaultPoints = [];
let mipingVillages = [];
let customPoints = loadCustomPoints();
let editingPointId = null;
let mipingBoundaryLayer = null;
const villageShapes = new Map();

map.setView(defaultCenter, defaultZoom);
satelliteLayer.addTo(map);

L.control.layers(
  {
    标准地图: streetLayer,
    卫星地图: satelliteLayer
  },
  null,
  {
    collapsed: false
  }
).addTo(map);

function switchBaseLayer(nextLayer) {
  if (activeBaseLayer === nextLayer) {
    return;
  }

  if (activeBaseLayer) {
    map.removeLayer(activeBaseLayer);
  }

  activeBaseLayer = nextLayer;
  activeBaseLayer.addTo(map);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function getPointColor(item) {
  return item.color || DEFAULT_POINT_COLOR;
}

function pointIcon(color) {
  const safeColor = color || DEFAULT_POINT_COLOR;
  return L.divIcon({
    className: "",
    html: `<div class="map-point" style="--point-color: ${safeColor}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12]
  });
}

function toPopupHtml(item) {
  const color = getPointColor(item);
  return [
    `<h3 class="popup-title">${item.name || "未命名点位"}</h3>`,
    item.type ? `<p class="popup-meta">类型：${item.type}</p>` : "",
    item.desc ? `<p>${item.desc}</p>` : "",
    `<p class="popup-meta">颜色：<span class="popup-color" style="background:${color}"></span>${color}</p>`,
    `<p class="popup-meta">经纬度：${Number(item.lng).toFixed(6)}, ${Number(item.lat).toFixed(6)}</p>`
  ].join("");
}

function isValidPoint(item) {
  return typeof item.lat === "number" &&
    typeof item.lng === "number" &&
    Number.isFinite(item.lat) &&
    Number.isFinite(item.lng);
}

function renderCounty(boundaryData) {
  const countyLayer = L.geoJSON(boundaryData, {
    style: countyStyle,
    onEachFeature(feature, layer) {
      const name = feature.properties?.name || feature.properties?.NAME || "西峡县";
      layer.bindPopup(
        `<h3 class="popup-title">${name}</h3><p class="popup-meta">县级边界图层</p>`
      );
    }
  }).addTo(map);

  const bounds = countyLayer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}

function renderTowns(townData) {
  return L.geoJSON(townData, {
    style(feature) {
      return feature.properties?.code === "411323107000" ? mipingStyle : townStyle;
    },
    onEachFeature(feature, layer) {
      const name = feature.properties?.name || "未命名乡镇";
      const code = feature.properties?.code || "";
      const popup = [
        `<h3 class="popup-title">${name}</h3>`,
        '<p class="popup-meta">乡镇边界图层</p>',
        code ? `<p>行政区划代码：${code}</p>` : ""
      ].join("");
      layer.bindPopup(popup);
      if (code === "411323107000") {
        mipingBoundaryLayer = layer;
        layer.bindTooltip("米坪镇", { sticky: true });
      }
    }
  }).addTo(map);
}

function renderMipingVillages(villages) {
  villageLayer.clearLayers();
  villageShapes.clear();
  villages.forEach((village) => {
    if (!Number.isFinite(village.lat) || !Number.isFinite(village.lng)) return;
    const area = L.circle([village.lat, village.lng], {
      radius: 650,
      color: "#d97706",
      weight: 1.5,
      fillColor: "#f59e0b",
      fillOpacity: 0.12
    });
    const marker = L.circleMarker([village.lat, village.lng], {
      radius: 6, color: "#fff8ef", weight: 2, fillColor: "#d97706", fillOpacity: 1
    });
    marker.bindTooltip(village.name, { permanent: true, direction: "right", className: "village-tooltip", offset: [8, 0] });
    marker.bindPopup(`<h3 class="popup-title">${village.name}</h3><p class="popup-meta">米坪镇行政村定位</p><p>行政区划代码：${village.code || "-"}</p><p class="popup-meta">中心坐标：${village.lng.toFixed(6)}, ${village.lat.toFixed(6)}</p><p class="popup-meta">橙色圆圈为约 650 米定位范围，正式村界数据接入后可替换。</p>`);
    area.bindPopup(`<h3 class="popup-title">${village.name}</h3><p class="popup-meta">约 650 米定位范围</p><p>中心坐标：${village.lng.toFixed(6)}, ${village.lat.toFixed(6)}</p>`);
    const focus = () => {
      villageShapes.forEach((item) => item.setStyle({ weight: 1.5, fillOpacity: 0.12 }));
      area.setStyle({ weight: 3, fillOpacity: 0.28 });
      map.flyToBounds(area.getBounds(), { padding: [40, 40], maxZoom: 15 });
      marker.openPopup();
      setStatus(`已定位到${village.name}，显示约 650 米范围`);
    };
    marker.on("click", focus);
    area.on("click", focus);
    villageLayer.addLayer(area);
    villageLayer.addLayer(marker);
    villageShapes.set(village.code, area);
  });
}

function renderVillageList(villages) {
  villageListEl.innerHTML = "";
  villages.forEach((village) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "village-list-btn";
    button.textContent = village.name;
    button.dataset.name = village.name;
    if (Number.isFinite(village.lat) && Number.isFinite(village.lng)) {
      button.title = "点击定位";
      button.addEventListener("click", () => {
        const area = villageShapes.get(village.code);
        if (area) {
          villageShapes.forEach((item) => item.setStyle({ weight: 1.5, fillOpacity: 0.12 }));
          area.setStyle({ weight: 3, fillOpacity: 0.28 });
          map.flyToBounds(area.getBounds(), { padding: [40, 40], maxZoom: 15 });
          area.openPopup();
          setStatus(`已定位到${village.name}，显示约 650 米范围`);
        } else {
          map.flyTo([village.lat, village.lng], Math.max(map.getZoom(), 13));
        }
      });
    } else {
      button.classList.add("is-unlocated");
      button.title = "坐标待核验";
    }
    li.appendChild(button);
    villageListEl.appendChild(li);
  });
}

function updateVillageSummary(villages) {
  const locatedCount = villages.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).length;
  villageSummaryEl.textContent = `共 ${villages.length} 个行政村，已定位 ${locatedCount} 个，待核验 ${villages.length - locatedCount} 个。`;
}

function bindMipingControls() {
  focusMipingButton.addEventListener("click", () => {
    if (!mipingBoundaryLayer) return;
    map.fitBounds(mipingBoundaryLayer.getBounds(), { padding: [36, 36] });
    mipingBoundaryLayer.openPopup();
    setStatus("已定位到米坪镇真实行政边界。");
  });

  villageSearchInput.addEventListener("input", () => {
    const keyword = villageSearchInput.value.trim();
    villageListEl.querySelectorAll(".village-list-btn").forEach((button) => {
      button.classList.toggle("is-hidden", Boolean(keyword) && !button.dataset.name.includes(keyword));
    });
  });
}

function geocodeVillage(village) {
  return new Promise((resolve) => {
    if (!window.AMap) {
      resolve(null);
      return;
    }
    const geocoder = new AMap.Geocoder({ city: "西峡县", radius: 1000 });
    const address = `河南省南阳市西峡县米坪镇${village.name}`;
    const timeoutId = window.setTimeout(() => resolve(null), 5000);
    geocoder.getLocation(address, (status, result) => {
      window.clearTimeout(timeoutId);
      if (status === "complete" && result.geocodes?.[0]?.location) {
        const location = result.geocodes[0].location;
        resolve({ ...village, lng: Number(location.lng), lat: Number(location.lat), geocoded: true });
      } else {
        resolve(null);
      }
    });
  });
}

async function geocodeMipingVillages(villages) {
  const localVillages = villages.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const unresolvedVillages = villages.filter((item) => !Number.isFinite(item.lat) || !Number.isFinite(item.lng));
  if (!window.AMap || unresolvedVillages.length === 0) return localVillages;
  await new Promise((resolve) => AMap.plugin(["AMap.Geocoder"], resolve));
  const results = await Promise.all(unresolvedVillages.map(geocodeVillage));
  return [...localVillages, ...results.filter(Boolean)];
}

function bindVillageToggle() {
  villageToggle.addEventListener("change", () => {
    if (villageToggle.checked) villageLayer.addTo(map);
    else map.removeLayer(villageLayer);
  });
}

function setFormMode(mode) {
  const editing = mode === "edit";
  pointFormTitle.textContent = editing ? "编辑点位" : "新增点位";
  pointSubmitButton.textContent = editing ? "更新点位" : "保存点位";
  pointCancelButton.hidden = !editing;
}

function populateForm(point) {
  pointNameInput.value = point.name || "";
  pointTypeInput.value = point.type || "";
  pointLatInput.value = Number(point.lat).toFixed(6);
  pointLngInput.value = Number(point.lng).toFixed(6);
  pointColorInput.value = getPointColor(point);
  pointDescInput.value = point.desc || "";
}

function resetPointForm() {
  pointForm.reset();
  pointColorInput.value = DEFAULT_POINT_COLOR;
  editingPointId = null;
  setFormMode("create");
}

function startEditPoint(pointId) {
  const point = customPoints.find((item) => item.id === pointId);
  if (!point) {
    return;
  }

  editingPointId = pointId;
  populateForm(point);
  setFormMode("edit");
  map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 13), { animate: true });
  pointNameInput.focus();
  setStatus(`正在编辑点位：${point.name}`);
}

function renderPointList() {
  pointListEl.innerHTML = "";

  if (customPoints.length === 0) {
    pointListEl.innerHTML = '<li class="point-list-empty">还没有保存自定义点位。</li>';
    return;
  }

  customPoints.forEach((item) => {
    const li = document.createElement("li");
    li.className = "saved-point-item";

    const text = document.createElement("div");
    text.className = "saved-point-text";
    text.innerHTML = [
      `<div class="saved-point-heading"><span class="saved-point-color" style="background:${getPointColor(item)}"></span><strong>${item.name}</strong></div>`,
      item.type ? `<span>${item.type}</span>` : "",
      `<span>${item.lng.toFixed(6)}, ${item.lat.toFixed(6)}</span>`
    ].join("");

    const actions = document.createElement("div");
    actions.className = "saved-point-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "saved-point-edit";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", () => {
      startEditPoint(item.id);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "saved-point-delete";
    removeButton.textContent = "删除";
    removeButton.addEventListener("click", () => {
      customPoints = customPoints.filter((entry) => entry.id !== item.id);
      if (editingPointId === item.id) {
        resetPointForm();
      }
      persistCustomPoints();
      renderPoints();
      renderPointList();
      setStatus(`已删除点位：${item.name}`);
    });

    actions.append(editButton, removeButton);
    li.append(text, actions);
    pointListEl.appendChild(li);
  });
}

function renderPoints(focusPointId = null) {
  pointLayer.clearLayers();

  let targetMarker = null;

  [...defaultPoints, ...customPoints].forEach((item) => {
    if (!isValidPoint(item)) {
      return;
    }

    const marker = L.marker([item.lat, item.lng], { icon: pointIcon(getPointColor(item)) });
    marker.bindPopup(toPopupHtml(item));
    pointLayer.addLayer(marker);

    if (focusPointId && item.id === focusPointId) {
      targetMarker = marker;
    }
  });

  return targetMarker;
}

function persistCustomPoints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customPoints));
}

function loadCustomPoints() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        ...item,
        lat: Number(item.lat),
        lng: Number(item.lng),
        color: item.color || DEFAULT_POINT_COLOR
      }))
      .filter(isValidPoint);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function fillCoordinateInputs(latlng) {
  pointLatInput.value = latlng.lat.toFixed(6);
  pointLngInput.value = latlng.lng.toFixed(6);
}

function savePoint() {
  const lat = Number(pointLatInput.value);
  const lng = Number(pointLngInput.value);
  const name = pointNameInput.value.trim();
  const type = pointTypeInput.value.trim();
  const desc = pointDescInput.value.trim();
  const color = pointColorInput.value || DEFAULT_POINT_COLOR;

  if (!name) {
    setStatus("请先填写点位名称。");
    return;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    setStatus("请输入有效的经纬度。");
    return;
  }

  let pointId = editingPointId;
  let statusText = "";

  if (editingPointId) {
    customPoints = customPoints.map((item) => (
      item.id === editingPointId
        ? { ...item, name, type, desc, lat, lng, color }
        : item
    ));
    statusText = `已更新点位：${name}`;
  } else {
    pointId = `${Date.now()}`;
    customPoints = [
      ...customPoints,
      {
        id: pointId,
        name,
        type,
        desc,
        lat,
        lng,
        color
      }
    ];
    statusText = `已保存点位：${name}`;
  }

  persistCustomPoints();
  const marker = renderPoints(pointId);
  renderPointList();
  map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
  if (marker) {
    marker.openPopup();
  }
  resetPointForm();
  setStatus(statusText);
}

function bindPointForm() {
  map.on("click", (event) => {
    fillCoordinateInputs(event.latlng);
    setStatus(editingPointId ? "已更新编辑中的点位坐标。" : "已从地图拾取经纬度，可直接填写信息后保存。");
  });

  pointForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePoint();
  });

  pointCancelButton.addEventListener("click", () => {
    resetPointForm();
    setStatus("已取消编辑，恢复新增点位模式。");
  });
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`加载失败: ${path}`);
  }
  return response.json();
}

function loadMapData() {
  const inline = window.XIXIA_MAP_DATA;
  if (inline && inline.boundary && inline.towns) {
    return Promise.resolve([inline.boundary, inline.towns, inline.points, inline.villages]);
  }
  return Promise.all([
    loadJson("./data/xixia-boundary.geojson"),
    loadJson("./data/xixia-towns.geojson"),
    loadJson("./data/points.json"),
    loadJson("./data/miping-villages.json")
  ]);
}

async function init() {
  try {
    const [boundaryData, townData, points, villageData] = await loadMapData();

    defaultPoints = Array.isArray(points)
      ? points.map((item) => ({ ...item, color: item.color || DEFAULT_POINT_COLOR }))
      : [];
    mipingVillages = Array.isArray(villageData) ? villageData : [];
    renderCounty(boundaryData);
    renderTowns(townData);
    renderVillageList(mipingVillages);
    updateVillageSummary(mipingVillages);
    const geocodedVillages = await geocodeMipingVillages(mipingVillages);
    const locatedByCode = new Map(geocodedVillages.map((item) => [item.code, item]));
    mipingVillages = mipingVillages.map((item) => locatedByCode.get(item.code) || item);
    renderMipingVillages(mipingVillages);
    renderVillageList(mipingVillages);
    updateVillageSummary(mipingVillages);
    renderPoints();
    renderPointList();
    resetPointForm();
    bindPointForm();
    bindVillageToggle();
    bindMipingControls();
    setStatus(`西峡县县界、乡镇边界和信息点已加载，米坪镇 ${mipingVillages.length} 个村庄坐标已全部定位。`);
  } catch (error) {
    console.error(error);
    setStatus("底图已打开，但业务数据未完整加载。请检查 data 目录中的 GeoJSON 和 JSON 文件。");
  }
}

init();

window.switchBaseMap = (mode) => {
  if (mode === "satellite") {
    switchBaseLayer(satelliteLayer);
  } else {
    switchBaseLayer(streetLayer);
  }

  setStatus(mode === "satellite" ? "已切换到卫星地图。" : "已切换到标准地图。");
};
