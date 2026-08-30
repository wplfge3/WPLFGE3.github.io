"use strict";

// 官方链接仅用于查看公开原文，页面主体服务由大家参与和互助完成。
const siteData = {
  contactEmail: "2192341537@qq.com",
  notice: "这是米坪镇大家互助信息板：欢迎通过邮箱投稿农产交换、邻里互助、失物招领和本地活动。官方资料仅作原文参考，不代替日常沟通。",
  routes: [
    {
      id: "county",
      from: "米坪镇",
      to: "西峡县城",
      note: "固定班次等待大家补充",
      departures: [],
      via: "米坪镇距县城约58公里，欢迎分享拼车和出行信息",
      duration: "信息由发布者自行核实",
      actionLabel: "发布出行信息",
      actionFilter: "help",
      sourceUrl: "https://www.xixia.gov.cn/zfxxgk/dfbmptlj/"
    }
  ],
  passengerSources: [
    {
      id: "north-mountain",
      title: "北山发车时间表",
      subtitle: "本地整理表 · 含预计经过米坪时间",
      icon: "calendar-clock",
      localFile: "北山发车时间表.xlsx",
      actionLabel: "下载 Excel"
    },
    {
      id: "old-station",
      title: "老汽车站发车表",
      subtitle: "西峡县捷安达车站 · 政府公开原文",
      icon: "landmark",
      sourceUrl: "https://www.xixia.gov.cn/2026/01-21/1376725.html",
      actionLabel: "查看政府原文"
    }
  ],
  northSchedule: [
    { group: "北山班次", departure: "5:30", plate: "豫RD1728", route: "卢氏", returnTime: "12:20-17:00", owner: "陈军", phone: "13462651600", passesMiping: true, mipingTime: "6:00" },
    { group: "北山班次", departure: "6:00", plate: "豫M62988", route: "三门峡", returnTime: "10:30-17:10", owner: "封彦祥", phone: "15838767571", passesMiping: true, mipingTime: "6:30" },
    { group: "北山班次", departure: "6:40", plate: "豫RD1529", route: "桑坪", returnTime: "10:40-13:10", owner: "秦国文", phone: "15890892028", passesMiping: true, mipingTime: "7:05" },
    { group: "北山班次", departure: "7:20", plate: "豫RD2665", route: "桑坪", returnTime: "11:35-14:20", owner: "李满朝", phone: "13782013516", passesMiping: true, mipingTime: "7:45" },
    { group: "北山班次", departure: "8:00", plate: "豫R46549", route: "桑坪", returnTime: "12:15-14:50", owner: "杜建党", phone: "13937762943", passesMiping: true, mipingTime: "8:25" },
    { group: "北山班次", departure: "8:30", plate: "豫RD1338", route: "桑坪", returnTime: "12:55-15:30", owner: "李建华", phone: "13409273332", passesMiping: true, mipingTime: "8:55" },
    { group: "北山班次", departure: "9:00", plate: "豫RD1938", route: "桑坪", returnTime: "13:35-16:10", owner: "孙铁华", phone: "13462652877", passesMiping: true, mipingTime: "9:25" },
    { group: "北山班次", departure: "9:30 轮班发车", plate: "豫RD1185", route: "黄沙", returnTime: "14:20-16:50", owner: "吕小敏", phone: "13598209254", passesMiping: true, mipingTime: "9:50" },
    { group: "北山班次", departure: "10:05和15:30轮班", plate: "豫RD1358", route: "官坡", returnTime: "5:30-11:20", owner: "任红彬", phone: "17537766115", passesMiping: true, mipingTime: "10:35和16:00" },
    { group: "北山班次", departure: "10:05和15:30轮班", plate: "豫RD1939", route: "黄草", returnTime: "6:20-7:50", owner: "焦云普", phone: "13598211773", passesMiping: true, mipingTime: "10:25和15:50" },
    { group: "北山班次", departure: "10:50和14:30轮班", plate: "豫RD9986", route: "五里川", returnTime: "6:20-9:20", owner: "李丰银", phone: "15893365267", passesMiping: true, mipingTime: "11:20和15:00" },
    { group: "北山班次", departure: "10:50和14:30轮班", plate: "豫RD1938", route: "长探河", returnTime: "6:20-9:10", owner: "鲁文娇", phone: "13525119855", passesMiping: true, mipingTime: "11:10和14:50" },
    { group: "北山班次", departure: "11:30和14:00轮班", plate: "豫RD0399", route: "关山", returnTime: "7:00-10:00", owner: "高长根", phone: "13782024567", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "11:30和14:00轮班", plate: "豫RD1908", route: "堂坪", returnTime: "6:40-9:20", owner: "李书伟", phone: "13782137226", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "11:50", plate: "豫R49688", route: "回龙寺", returnTime: "7:05-9:30", owner: "陈铁良", phone: "13462567089", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "12:10", plate: "豫RD1888", route: "包沟", returnTime: "5:50-9:00", owner: "王松", phone: "13462366146", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "13:00和15:00轮班", plate: "豫RD1258", route: "烟镇", returnTime: "7:00-10:40", owner: "魏普顺", phone: "13623777022", passesMiping: true, mipingTime: "13:25和15:25" },
    { group: "北山班次", departure: "13:00和15:00轮班", plate: "豫RD1856", route: "桑坪", returnTime: "5:30-8:40", owner: "高爱民", phone: "13693882156", passesMiping: true, mipingTime: "13:25和15:25" },
    { group: "北山班次", departure: "13:20和15:30轮班", plate: "豫RD9567", route: "万沟", returnTime: "6:50-10:00", owner: "宋海刚", phone: "13513771731", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "13:20和15:30轮班", plate: "豫RD1836", route: "行上", returnTime: "5:30-7:50", owner: "杜洪华", phone: "15139016185", passesMiping: false, mipingTime: "—" },
    { group: "北山班次", departure: "16:10", plate: "豫RD9663", route: "王庄", returnTime: "5:00-7:30", owner: "宋海刚", phone: "13513771731", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "6:00", plate: "豫R46749", route: "栾川", returnTime: "12:40-16:00", owner: "梁国民", phone: "13569216718", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "7:00", plate: "豫R49621", route: "太平镇", returnTime: "13:30-15:50", owner: "黄可", phone: "13782070602", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "8:00", plate: "豫RD2000", route: "二郎坪", returnTime: "12:30-14:00", owner: "杨小刚", phone: "13462654454", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "（胶带遮挡，无法辨认）", plate: "（无法辨认）", route: "（无法辨认）", returnTime: "（无法辨认）", owner: "（无法辨认）", phone: "", passesMiping: null, mipingTime: "待确认" },
    { group: "另一组班次", departure: "9:10", plate: "豫RD9898", route: "栾川", returnTime: "14:40-18:00", owner: "汪洪海", phone: "15136686237", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "10:00", plate: "豫R47018", route: "二郎坪", returnTime: "13:30-14:50", owner: "刘彦青", phone: "13462626879", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "12:10", plate: "豫RD1088", route: "上口", returnTime: "6:10-10:00", owner: "苗金旺", phone: "18203835916", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "12:40", plate: "豫CE8215", route: "栾川", returnTime: "6:50-10:30", owner: "苗丰各", phone: "13937721067", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "13:40", plate: "豫R49326", route: "二郎坪", returnTime: "16:30-18:00", owner: "靳小红", phone: "15838402862", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "14:10", plate: "豫RD9199", route: "太平镇", returnTime: "7:00-9:40", owner: "张小红", phone: "13849700413", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "15:00", plate: "豫R47579", route: "鱼库", returnTime: "9:00-11:20", owner: "贾建立", phone: "13693852686", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "15:30", plate: "豫CN0098", route: "栾川", returnTime: "9:10-12:10", owner: "宋炎", phone: "15136686253", passesMiping: false, mipingTime: "—" },
    { group: "另一组班次", departure: "16:30", plate: "豫R47018", route: "二郎坪", returnTime: "7:20-8:40", owner: "刘彦青", phone: "13462626879", passesMiping: false, mipingTime: "—" }
  ],
  events: [
    {
      day: "22",
      month: "5月",
      type: "村情动态",
      title: "大庄村开展移风易俗主题宣讲",
      time: "2026年5月22日发布",
      place: "西峡县米坪镇大庄村",
      detail: "大庄村红白理事会围绕婚事新办、丧事简办和村规民约开展宣传。",
      sourceUrl: "https://www.xixia.gov.cn/2026/05-22/1406909.html"
    },
    {
      day: "23",
      month: "1月",
      type: "邻里关怀",
      title: "高庄村老年助餐点建设信息",
      time: "2026年1月23日公开",
      place: "西峡县米坪镇高庄村",
      detail: "县政府公开答复显示，高庄村老年助餐点正在建设，后续以本地公告为准。",
      sourceUrl: "https://www.xixia.gov.cn/2026/01-23/1381039.html"
    },
    {
      day: "—",
      month: "镇情",
      type: "产业资料",
      title: "香菇、中药材与山茱萸",
      time: "2025年7月公开资料",
      place: "米坪镇北部山区",
      detail: "公开镇情资料介绍了米坪镇特色产业、村庄概况和省级非遗“靠山红”。",
      sourceUrl: "https://www.xixia.gov.cn/ifile/20251124/1763977725546uHT6TSra.pdf"
    }
  ],
  services: [
    {
      title: "米坪客车出行",
      subtitle: "北山班车 · 老汽车站时刻表",
      icon: "bus-front",
      section: "#bus"
    },
    {
      title: "农产品交换",
      subtitle: "发布自家农产、寻找买家",
      icon: "wheat",
      feedCategory: "trade"
    },
    {
      title: "邻里互助",
      subtitle: "拼车、搭把手、临时帮工",
      icon: "hand-helping",
      feedCategory: "help"
    },
    {
      title: "失物招领",
      subtitle: "本地拾到或寻找失物",
      icon: "search-check",
      feedCategory: "lost"
    },
    {
      title: "房屋与场地",
      subtitle: "出租、借用和寻找场地",
      icon: "house",
      feedCategory: "house"
    },
    {
      title: "本地活动",
      subtitle: "发布广场、文化和公益活动",
      icon: "calendar-days",
      feedCategory: "culture"
    },
    {
      title: "就业互助",
      subtitle: "发布零工、招工和技能交换",
      icon: "briefcase-business",
      feedCategory: "job"
    },
    {
      title: "西峡县政府网站",
      subtitle: "只读查看米坪镇公开原文",
      icon: "globe-2",
      sourceUrl: "https://www.xixia.gov.cn/zfxxgk/dfbmptlj/"
    }
  ],
  feedCategories: [
    { id: "all", label: "全部" },
    { id: "public", label: "公开资料" },
    { id: "trade", label: "农产交换" },
    { id: "help", label: "邻里互助" },
    { id: "lost", label: "失物招领" },
    { id: "house", label: "房屋场地" },
    { id: "culture", label: "本地活动" },
    { id: "job", label: "就业互助" }
  ],
  feed: [
    {
      category: "public",
      label: "公开资料",
      icon: "bell-ring",
      title: "米坪镇公开村情与产业资料",
      detail: "米坪镇位于西峡县北部山区，距县城58公里，辖17个行政村、204个村民小组。",
      date: "2025-07",
      sourceUrl: "https://www.xixia.gov.cn/ifile/20251124/1763977725546uHT6TSra.pdf"
    },
    {
      category: "public",
      label: "公开资料",
      icon: "sprout",
      title: "米坪镇特色产业：中药材与山茱萸",
      detail: "公开资料显示，中药材种植面积超6万亩，山茱萸年均交易量约占全国70%。欢迎大家补充具体供求。",
      date: "2025-07",
      sourceUrl: "https://www.xixia.gov.cn/ifile/20251124/1763977725546uHT6TSra.pdf"
    },
    {
      category: "public",
      label: "公开资料",
      icon: "heart-handshake",
      title: "大庄村开展移风易俗主题宣讲",
      detail: "大庄村红白理事会倡导婚事新办、丧事简办，推动大家共同维护文明乡风。",
      date: "2026-05-22",
      sourceUrl: "https://www.xixia.gov.cn/2026/05-22/1406909.html"
    },
    {
      category: "public",
      label: "公开资料",
      icon: "utensils",
      title: "高庄村老年助餐点建设中",
      detail: "县政府公开答复显示，高庄村老年助餐点正在建设，开放时间和参与方式等待本地公告。",
      date: "2026-01-23",
      sourceUrl: "https://www.xixia.gov.cn/2026/01-23/1381039.html"
    }
  ]
};

const state = {
  activeFeedCategory: "all",
  activeScheduleFilter: "all",
  visibleFeedCount: 5,
  toastTimer: null
};

const routeList = document.querySelector("#route-list");
const eventGrid = document.querySelector("#event-grid");
const serviceGrid = document.querySelector("#service-grid");
const feedFilters = document.querySelector("#feed-filters");
const feedList = document.querySelector("#feed-list");
const loadMoreButton = document.querySelector("#load-more");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#site-search");
const searchResults = document.querySelector("#search-results");
const submitDialog = document.querySelector("#submit-dialog");
const submitForm = document.querySelector("#submit-form");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const toast = document.querySelector("#toast");
const passengerSourceGrid = document.querySelector("#passenger-source-grid");
const scheduleFilters = document.querySelector("#schedule-filters");
const scheduleBody = document.querySelector("#schedule-body");
const scheduleSummary = document.querySelector("#schedule-summary");
const scheduleDetails = document.querySelector("#schedule-details");
const introVideo = document.querySelector("#intro-video");
const introVideoPlay = document.querySelector("#intro-video-play");

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }
}

function renderRoutes() {
  routeList.innerHTML = siteData.routes.map((route) => `
    <article class="route-row reveal" data-search-id="route-${escapeHTML(route.id)}">
      <div class="route-name">
        <span class="route-icon"><i data-lucide="bus-front"></i></span>
        <div>
          <strong>${escapeHTML(route.from)} → ${escapeHTML(route.to)}</strong>
          <small>${escapeHTML(route.note)}</small>
        </div>
      </div>
      <div class="route-times">
        <span>${route.departures.length ? "参考发车时间" : "班车信息"}</span>
        <div class="time-group">
          ${route.departures.length
            ? route.departures.map((time) => `<strong>${escapeHTML(time)}</strong>`).join("")
            : `<strong class="time-pending">见下方北山发车表</strong>`}
        </div>
      </div>
      <div class="route-meta">
        <span>${escapeHTML(route.via)}</span>
        <strong>${escapeHTML(route.duration)}</strong>
      </div>
      ${route.actionLabel
        ? `<button class="button button-secondary route-publish publish-trigger" type="button" data-submission-type="${escapeHTML(route.actionFilter || "")}"><i data-lucide="send"></i> ${escapeHTML(route.actionLabel)}</button>`
        : `<button class="button button-secondary route-contact" type="button" data-route="${escapeHTML(route.from)}至${escapeHTML(route.to)}"><i data-lucide="circle-help"></i> 信息待补</button>`}
    </article>
  `).join("");
}

function renderPassengerSources() {
  passengerSourceGrid.innerHTML = siteData.passengerSources.map((source) => {
    const href = source.localFile || source.sourceUrl;
    const actionAttrs = source.localFile
      ? `download="${escapeHTML(source.localFile)}"`
      : `target="_blank" rel="noopener"`;

    return `
      <article class="passenger-source reveal">
        <span class="passenger-source-icon"><i data-lucide="${escapeHTML(source.icon)}"></i></span>
        <div class="passenger-source-copy">
          <strong>${escapeHTML(source.title)}</strong>
          <small>${escapeHTML(source.subtitle)}</small>
        </div>
        <a class="text-button passenger-source-action" href="${escapeHTML(href)}" ${actionAttrs}>${escapeHTML(source.actionLabel)} <i data-lucide="external-link"></i></a>
      </article>
    `;
  }).join("");
}

function getScheduleCounts() {
  return siteData.northSchedule.reduce((counts, item) => {
    counts.all += 1;
    if (item.passesMiping === true) counts.pass += 1;
    else if (item.passesMiping === false) counts.other += 1;
    else counts.unknown += 1;
    return counts;
  }, { all: 0, pass: 0, other: 0, unknown: 0 });
}

function renderScheduleFilters() {
  const counts = getScheduleCounts();
  const filters = [
    { id: "all", label: "全部班次" },
    { id: "pass", label: "经过米坪" },
    { id: "other", label: "其他班次" },
    { id: "unknown", label: "待确认" }
  ];

  scheduleFilters.innerHTML = filters.map((filter) => `
    <button class="schedule-filter${state.activeScheduleFilter === filter.id ? " is-active" : ""}" type="button" data-schedule-filter="${filter.id}" aria-pressed="${state.activeScheduleFilter === filter.id}">
      ${escapeHTML(filter.label)} <span>${counts[filter.id]}</span>
    </button>
  `).join("");

  scheduleSummary.textContent = `共 ${counts.all} 条班次 · ${counts.pass} 条经过米坪 · 表格整理于 2026 年 1 月 21 日`;
}

function renderSchedule() {
  const filteredItems = siteData.northSchedule.filter((item) => {
    if (state.activeScheduleFilter === "all") return true;
    if (state.activeScheduleFilter === "pass") return item.passesMiping === true;
    if (state.activeScheduleFilter === "other") return item.passesMiping === false;
    return item.passesMiping === null;
  });

  let previousGroup = "";
  scheduleBody.innerHTML = filteredItems.map((item) => {
    const groupRow = previousGroup !== item.group
      ? `<tr class="schedule-group-row"><th colspan="8">${escapeHTML(item.group)}</th></tr>`
      : "";
    previousGroup = item.group;
    const statusClass = item.passesMiping === true ? "is-pass" : item.passesMiping === false ? "is-other" : "is-unknown";
    const statusLabel = item.passesMiping === true ? "经过米坪" : item.passesMiping === false ? "不经过" : "待确认";
    const phoneCell = item.phone
      ? `<a href="tel:${escapeHTML(item.phone)}">${escapeHTML(item.phone)}</a>`
      : "—";

    return `${groupRow}
      <tr class="schedule-row ${statusClass}">
        <td><strong>${escapeHTML(item.departure)}</strong></td>
        <td>${escapeHTML(item.plate)}</td>
        <td>${escapeHTML(item.route)}</td>
        <td>${escapeHTML(item.returnTime)}</td>
        <td>${escapeHTML(item.owner)}</td>
        <td>${phoneCell}</td>
        <td><span class="schedule-status ${statusClass}">${statusLabel}</span></td>
        <td>${escapeHTML(item.mipingTime)}</td>
      </tr>`;
  }).join("");
}

function setScheduleFilter(filter) {
  const validFilters = ["all", "pass", "other", "unknown"];
  state.activeScheduleFilter = validFilters.includes(filter) ? filter : "all";
  renderScheduleFilters();
  renderSchedule();
}

function renderEvents() {
  eventGrid.innerHTML = siteData.events.map((event, index) => `
    <article class="event-card reveal" data-search-id="event-${index}">
      <div class="event-topline">
        <div class="date-block"><strong>${escapeHTML(event.day)}</strong><span>${escapeHTML(event.month)}</span></div>
        <div>
          <span class="event-type">${escapeHTML(event.type)}</span>
          ${event.sourceUrl ? `<a class="source-link" href="${escapeHTML(event.sourceUrl)}" target="_blank" rel="noopener">查看来源 <i data-lucide="external-link"></i></a>` : ""}
        </div>
      </div>
      <h3>${escapeHTML(event.title)}</h3>
      <p class="event-detail"><i data-lucide="clock-3"></i><span>${escapeHTML(event.time)}</span></p>
      <p class="event-detail"><i data-lucide="map-pin"></i><span>${escapeHTML(event.place)}</span></p>
      <p class="event-detail"><i data-lucide="clipboard-list"></i><span>${escapeHTML(event.detail)}</span></p>
    </article>
  `).join("");
}

function renderServices() {
  serviceGrid.innerHTML = siteData.services.map((service) => {
    const href = service.feedCategory ? "#local-info" : service.section || service.sourceUrl || "#services";
    const linkAttrs = service.feedCategory
      ? `data-feed-filter="${escapeHTML(service.feedCategory)}"`
      : service.section
        ? `data-section-target="${escapeHTML(service.section)}"`
        : 'target="_blank" rel="noopener"';

    return `
    <a class="service-item reveal" href="${escapeHTML(href)}" ${linkAttrs}>
      <span class="service-item-icon"><i data-lucide="${escapeHTML(service.icon)}"></i></span>
      <span>
        <strong>${escapeHTML(service.title)}</strong>
        <small>${escapeHTML(service.subtitle)}</small>
      </span>
      <i class="service-item-arrow" data-lucide="external-link" aria-hidden="true"></i>
    </a>
  `;
  }).join("");
}

function renderFilters() {
  feedFilters.innerHTML = siteData.feedCategories.map((category) => `
    <button
      class="filter-button${state.activeFeedCategory === category.id ? " is-active" : ""}"
      type="button"
      data-feed-filter="${escapeHTML(category.id)}"
      aria-pressed="${state.activeFeedCategory === category.id}"
    >${escapeHTML(category.label)}</button>
  `).join("");
}

function getFilteredFeed() {
  if (state.activeFeedCategory === "all") return siteData.feed;
  return siteData.feed.filter((item) => item.category === state.activeFeedCategory);
}

function renderFeed() {
  const filteredItems = getFilteredFeed();
  const visibleItems = filteredItems.slice(0, state.visibleFeedCount);

  feedList.innerHTML = visibleItems.length ? visibleItems.map((item, index) => `
    <article class="feed-item reveal" data-search-id="feed-${escapeHTML(item.category)}-${index}">
      <span class="feed-category"><i data-lucide="${escapeHTML(item.icon)}"></i>${escapeHTML(item.label)}</span>
      <div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.detail)}</p>
        ${item.sourceUrl ? `<a class="feed-source" href="${escapeHTML(item.sourceUrl)}" target="_blank" rel="noopener">官方来源 <i data-lucide="external-link"></i></a>` : ""}
      </div>
      <time class="feed-date">${escapeHTML(item.date)}</time>
    </article>
  `).join("") : `<p class="search-empty">这个分类暂时还没有信息。</p>`;

  loadMoreButton.hidden = visibleItems.length >= filteredItems.length;
  refreshIcons();
  observeReveals();
}

function setFeedCategory(category) {
  const exists = siteData.feedCategories.some((item) => item.id === category);
  state.activeFeedCategory = exists ? category : "all";
  state.visibleFeedCount = 5;
  renderFilters();
  renderFeed();
}

function buildSearchCatalog() {
  const routes = siteData.routes.map((route) => ({
    title: `${route.from}至${route.to}班车`,
    description: route.departures.length
      ? `发车 ${route.departures.join("、")} · ${route.note}`
      : `固定时刻暂未公开 · ${route.note}`,
    section: "#bus",
    icon: "bus-front",
    keywords: `${route.from} ${route.to} 班车 客车 发车 出行 ${route.via}`
  }));

  const events = siteData.events.map((event) => ({
    title: event.title,
    description: `${event.time} · ${event.place}`,
    section: "#events",
    icon: "calendar-days",
    keywords: `${event.type} 活动 ${event.title} ${event.detail}`
  }));

  const services = siteData.services.map((service) => ({
    title: service.title,
    description: service.subtitle,
    section: service.section || "#services",
    icon: service.icon,
    keywords: `${service.title} ${service.subtitle} 互助 发布 交换`
  }));

  const passengerSources = siteData.passengerSources.map((source) => ({
    title: source.title,
    description: source.subtitle,
    section: "#bus",
    icon: source.icon,
    keywords: `${source.title} ${source.subtitle} 客运 出行 发车 时刻表 汽车站`
  }));

  const feed = siteData.feed.map((item) => ({
    title: item.title,
    description: `${item.label} · ${item.detail}`,
    section: "#local-info",
    icon: item.icon,
    keywords: `${item.label} ${item.title} ${item.detail}`
  }));

  return [...routes, ...events, ...services, ...passengerSources, ...feed];
}

const searchCatalog = buildSearchCatalog();

function searchSite(query) {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return [];

  const terms = normalized.split(/\s+/).filter(Boolean);
  return searchCatalog.filter((item) => {
    const haystack = `${item.title} ${item.description} ${item.keywords}`.toLocaleLowerCase("zh-CN");
    return terms.every((term) => haystack.includes(term));
  }).slice(0, 8);
}

function renderSearchResults(query) {
  const normalized = query.trim();
  if (!normalized) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    return;
  }

  const results = searchSite(normalized);
  searchResults.hidden = false;
  searchResults.innerHTML = results.length ? results.map((item) => `
    <a class="search-result-item" href="${escapeHTML(item.section)}">
      <span class="search-result-icon"><i data-lucide="${escapeHTML(item.icon)}"></i></span>
      <span class="search-result-copy">
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.description)}</small>
      </span>
    </a>
  `).join("") : `<p class="search-empty">暂时没有找到“${escapeHTML(normalized)}”，可以提交信息补充。</p>`;
  refreshIcons();
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  toast.querySelector("span").textContent = message;
  toast.hidden = false;
  state.toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function openSubmissionDialog(type = "") {
  const typeSelect = submitForm.elements.type;
  if (type && [...typeSelect.options].some((option) => option.value === type)) {
    typeSelect.value = type;
  }

  if (typeof submitDialog.showModal === "function") {
    submitDialog.showModal();
  } else {
    submitDialog.setAttribute("open", "");
  }
  document.body.classList.add("dialog-open");
}

function closeSubmissionDialog() {
  if (typeof submitDialog.close === "function") {
    submitDialog.close();
  } else {
    submitDialog.removeAttribute("open");
  }
  document.body.classList.remove("dialog-open");
}

let revealObserver;

function observeReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -40px", threshold: 0.06 });
  }

  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));
}

function initializePage() {
  document.querySelector("#notice-text").textContent = siteData.notice;
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());

  renderRoutes();
  renderPassengerSources();
  renderScheduleFilters();
  renderSchedule();
  renderEvents();
  renderServices();
  renderFilters();
  renderFeed();
  refreshIcons();
  observeReveals();

  const initialQuery = new URLSearchParams(window.location.search).get("q");
  if (initialQuery) {
    searchInput.value = initialQuery;
    renderSearchResults(initialQuery);
  }
}

searchInput.addEventListener("input", (event) => renderSearchResults(event.target.value));

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSearchResults(searchInput.value);
});

searchResults.addEventListener("click", (event) => {
  if (event.target.closest('a[href="#bus"]')) scheduleDetails.open = true;
  window.setTimeout(() => {
    searchResults.hidden = true;
  }, 120);
});

document.addEventListener("click", (event) => {
  if (!searchForm.contains(event.target)) {
    searchResults.hidden = true;
  }
});

feedFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-feed-filter]");
  if (!button) return;
  setFeedCategory(button.dataset.feedFilter);
});

scheduleFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-schedule-filter]");
  if (!button) return;
  setScheduleFilter(button.dataset.scheduleFilter);
});

introVideoPlay.addEventListener("click", () => {
  introVideo.play().catch(() => showToast("视频暂时无法播放，请检查浏览器权限。"));
});

introVideo.addEventListener("play", () => {
  introVideoPlay.hidden = true;
});

introVideo.addEventListener("pause", () => {
  introVideoPlay.hidden = false;
});

introVideo.addEventListener("ended", () => {
  introVideoPlay.hidden = false;
});

document.querySelectorAll("[data-feed-filter]").forEach((link) => {
  if (link.closest("#feed-filters")) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setFeedCategory(link.dataset.feedFilter);
    document.querySelector("#local-info").scrollIntoView({ behavior: "smooth" });
  });
});

loadMoreButton.addEventListener("click", () => {
  state.visibleFeedCount += 3;
  renderFeed();
});

document.addEventListener("click", (event) => {
  const publishButton = event.target.closest(".publish-trigger");
  const feedbackButton = event.target.closest(".feedback-trigger");
  const routeButton = event.target.closest(".route-contact");
  const serviceButton = event.target.closest(".service-item");

  if (publishButton) openSubmissionDialog(publishButton.dataset.submissionType || "");
  if (feedbackButton) openSubmissionDialog("feedback");
  if (routeButton) showToast(`${routeButton.dataset.route}暂无公开固定时刻，欢迎大家补充出行信息。`);
  if (serviceButton?.dataset.feedFilter) {
    event.preventDefault();
    setFeedCategory(serviceButton.dataset.feedFilter);
    document.querySelector("#local-info").scrollIntoView({ behavior: "smooth" });
  }
  if (serviceButton?.dataset.sectionTarget) {
    event.preventDefault();
    if (serviceButton.dataset.sectionTarget === "#bus") scheduleDetails.open = true;
    document.querySelector(serviceButton.dataset.sectionTarget)?.scrollIntoView({ behavior: "smooth" });
  }
});

document.querySelectorAll(".dialog-close").forEach((button) => {
  button.addEventListener("click", closeSubmissionDialog);
});

submitDialog.addEventListener("click", (event) => {
  if (event.target === submitDialog) closeSubmissionDialog();
});

submitDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

submitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(submitForm);
  const typeLabel = submitForm.elements.type.selectedOptions[0]?.textContent.trim() || "未选择";
  const title = String(formData.get("title") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const contact = String(formData.get("contact") || "").trim() || "未填写";
  const subject = `[米坪镇生活通投稿] ${title || typeLabel}`;
  const body = [
    "信息类型：" + typeLabel,
    "标题：" + (title || "未填写"),
    "详细内容：" + (detail || "未填写"),
    "联系方式：" + contact,
    "",
    "我已了解：当前页面不能直接接收投稿，请以邮件发送为准。"
  ].join("\n");

  window.location.href = `mailto:${siteData.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  closeSubmissionDialog();
  submitForm.reset();
  showToast("已生成邮件，请在邮件客户端中检查并点击发送。");
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "打开导航" : "关闭导航");
  mobileNav.hidden = isOpen;
  menuToggle.innerHTML = `<i data-lucide="${isOpen ? "menu" : "x"}" aria-hidden="true"></i>`;
  refreshIcons();
});

mobileNav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  mobileNav.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "打开导航");
  menuToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
  refreshIcons();
});

window.addEventListener("scroll", () => {
  document.querySelector(".site-header").classList.toggle("is-scrolled", window.scrollY > 8);
}, { passive: true });

initializePage();
