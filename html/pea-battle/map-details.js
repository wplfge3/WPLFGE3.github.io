/* 六关地图内容扩充 · 场景道具与它们的小小反应
 *
 * 只加不改：本文件不碰 game.js 的任何一行，所有内容都挂在地图的世界坐标里，
 * 跟随镜头和缩放；每一组道具只跟一个已经存在的战斗/剧情事件绑定，
 * 平时安安静静，触发时用一个看得懂的动作回应。
 *
 * 绘制入口借用 drawLava —— 它在 draw() 里刚好排在
 * drawTerrain → drawTunnelStructures → drawCloudPlatforms 之后、
 * 角色与弹道之前，是「贴在场景上、又不挡人」的正确层。
 */
(function () {
  'use strict';
  if (typeof state === 'undefined' || typeof ctx === 'undefined') return;
  if (typeof drawLava !== 'function' || typeof terrainAt !== 'function') return;
  if (typeof ui === 'undefined' || typeof canvas === 'undefined') return;

  const PZ = window.PZMapDetails = { version: 1, scene: null, map: '', matchId: -1 };
  const stamp = () => performance.now() / 1000;

  /* ---------- 通用工具 ---------- */

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = t => t * t * (3 - 2 * t);

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
    const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
    const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
    return `rgb(${r},${g},${bl})`;
  }

  // 每个地图一套画笔：墨线颜色、木质三段色、正对镜头的线宽。
  const STYLE = {
    yard:   { ink: '#3b2415', lw: 2.1, wood: ['#e0b077', '#b3814e', '#875c34'], light: '#fff2b4' },
    land:   { ink: '#3a2230', lw: 2.0, wood: ['#d8a973', '#a97445', '#71492c'], light: '#ffbe74' },
    canyon: { ink: '#3f2a1e', lw: 4.6, wood: ['#dcab68', '#a4703c', '#6b4526'], light: '#ffe1a4' },
    pool:   { ink: '#2d1b2c', lw: 2.6, wood: ['#d8a973', '#a97445', '#71492c'], light: '#ffd6e8' },
    dance:  { ink: '#150e1f', lw: 2.9, wood: ['#6d6486', '#423a58', '#241d36'], light: '#d9b6ff' },
    chaos:  { ink: '#241b2c', lw: 2.4, wood: ['#8d7f94', '#5b5069', '#332c40'], light: '#c9d8ff' }
  };

  function pen(w) {
    ctx.lineWidth = w;
    ctx.strokeStyle = STYLE[state.map] ? STYLE[state.map].ink : '#2a1c15';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  // 接地阴影：一律压扁、贴地，不随物件升高。
  function contact(x, y, rx, ry = rx * .26, alpha = .3) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#120c0a';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function plank(x, y, w, h, tone) {
    const [hi, mid, lo] = tone;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, hi);
    g.addColorStop(.55, mid);
    g.addColorStop(1, lo);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(3, h * .3));
    ctx.fill();
    ctx.stroke();
  }

  /* ---------- 场景生命周期 ---------- */

  function buildScene() {
    scene = { map: state.map, matchId: state.matchId, data: null, t: 0, last: stamp() };
    if (state.map === 'yard') scene.data = buildYard();
    else if (state.map === 'land') scene.data = buildLand();
    else if (state.map === 'canyon') scene.data = buildCanyon();
    else if (state.map === 'pool') scene.data = buildPool();
    else if (state.map === 'dance') scene.data = buildDance();
    else if (state.map === 'chaos') scene.data = buildChaos();
    PZ.scene = scene;
  }

  let scene = null;

  function sync() {
    if (!scene || scene.map !== state.map || scene.matchId !== state.matchId) buildScene();
  }

  // 道具跟着脚下那格土的实时高度走：坑挖浅了就跟着沉下去站进坑里，
  // 整块被打穿（一次掉得比 SPAN 还多）才真的塌下去、淡出。
  function SPAN(map) {
    return map === 'canyon' ? 118 : map === 'chaos' ? 70 : 66;
  }

  function track(item) {
    if (!item || typeof item.x !== 'number') return;
    const live = terrainAt(item.x);
    if (item.fall == null && live - item.baseY > SPAN(state.map)) item.fall = .0001;
    item.groundY = item.fall != null ? item.baseY + item.fall : live;
  }

  function fallStep(item, dt) {
    if (!item || item.fall == null) return;
    item.vy = (item.vy || 0) + 1300 * dt;
    item.fall += item.vy * dt;
  }

  function anchor(item) {
    const y = item.groundY != null ? item.groundY : terrainAt(item.x);
    return { x: item.x, y, alpha: item.fall != null ? clamp(1 - item.fall / (SPAN(state.map) * 6), 0, 1) : 1 };
  }

  // 钉在台面上的物件不跟地形走
  function pinned(x, y) {
    return { x, y, alpha: 1 };
  }

  /* =========================================================
   *  01 晴日后院 —— 小戴芙昨天的练习角
   * ========================================================= */

  function buildYard() {
    const d = {
      stool: { x: 302 },
      jar: { x: 352 },
      target: { x: 462 },
      peas: [{ x: 402 }, { x: 420 }, { x: 486 }, { x: 512 }],
      swing: { angle: 0, v: 0 },
      splats: [
        { u: -.42, v: -.30, r: .30, age: 1 }, { u: .30, v: -.42, r: .24, age: 1 },
        { u: .06, v: .16, r: .27, age: 1 }, { u: -.48, v: .34, r: .21, age: 1 }
      ],
      lastHit: -9,
      pop: 0
    };
    for (const item of [d.stool, d.jar, d.target, ...d.peas]) item.baseY = terrainAt(item.x);
    return d;
  }

  function drawYard(d, dt, t) {
    const st = STYLE.yard;
    const [whi, wmid, wlo] = st.wood;

    // —— 小板凳：四条腿里有一条短了半截，所以座面是歪的
    const stool = anchor(d.stool);
    if (stool.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = stool.alpha;
      ctx.translate(stool.x, stool.y);
      contact(0, 0, 32, 7, .3);
      ctx.rotate(-.06);
      pen(st.lw);
      for (const lx of [-18, -11, 11, 18]) {
        const short = lx > 14 ? 7 : 0;
        plank(lx - 2.6, -26 + short, 5.2, 26 - short, st.wood);
      }
      plank(-25, -34, 50, 9, st.wood);
      ctx.strokeStyle = 'rgba(92,56,26,.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-19, -30.6);
      ctx.lineTo(18, -30.6);
      ctx.stroke();
      // 横撑
      plank(-17, -14, 34, 3.4, [wmid, wmid, wlo]);
      ctx.restore();
    }

    // —— 泡泡水：玻璃罐里一截皂液，铁丝圈还插在里面
    const jar = anchor(d.jar);
    if (jar.alpha > .01) {
      const bob = Math.sin(t * .8) * .6;
      ctx.save();
      ctx.globalAlpha = jar.alpha;
      ctx.translate(jar.x, jar.y + bob);
      contact(0, 0, 14, 4, .3);
      pen(st.lw * .85);
      ctx.fillStyle = 'rgba(198,240,244,.5)';
      ctx.beginPath();
      ctx.roundRect(-9, -28, 18, 28, [3.5, 3.5, 2.5, 2.5]);
      ctx.fill();
      ctx.stroke();
      const soap = ctx.createLinearGradient(0, -15, 0, 0);
      soap.addColorStop(0, 'rgba(156,232,238,.9)');
      soap.addColorStop(1, 'rgba(78,160,184,.92)');
      ctx.fillStyle = soap;
      ctx.beginPath();
      ctx.roundRect(-7.6, -15, 15.2, 14, [1, 1, 2.5, 2.5]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.72)';
      ctx.beginPath();
      ctx.ellipse(-4.4, -11.4, 1.8, 4, .2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)';
      ctx.lineWidth = .9;
      ctx.beginPath();
      ctx.ellipse(-4.8, -14.9, 6.4, 1.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 瓶颈
      ctx.fillStyle = 'rgba(196,238,242,.55)';
      ctx.beginPath();
      ctx.roundRect(-4.6, -31.5, 9.2, 4.5, 1.6);
      ctx.fill();
      pen(1.2);
      ctx.stroke();
      // 铁丝吹棒
      ctx.strokeStyle = '#6f5f48';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(2, -17); ctx.lineTo(4.4, -42); ctx.stroke();
      ctx.save();
      ctx.translate(4.4, -45);
      ctx.rotate(.22);
      ctx.strokeStyle = '#8a765a';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.4, 7.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      // 已经飘起来的泡泡
      for (let i = 0; i < 4; i++) {
        const ph = (t * .3 + i * .29) % 1;
        const bx = jar.x + 7 + Math.sin(t * .7 + i * 2) * 5 + i * 2.6;
        const by = jar.y - 52 - ph * 46;
        const r = (2.4 + i * .9) * (1 - ph * .18);
        ctx.save();
        ctx.globalAlpha = (1 - ph) * .85 * jar.alpha;
        ctx.strokeStyle = 'rgba(228,252,255,.95)';
        ctx.fillStyle = 'rgba(188,238,250,.24)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.beginPath();
        ctx.arc(bx - r * .34, by - r * .34, r * .28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // —— 练习靶：歪木桩支一块麻布靶，靶上已有几处打旧的豌豆印
    const tg = anchor(d.target);
    if (tg.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = tg.alpha;
      ctx.translate(tg.x, tg.y);
      contact(0, 0, 22, 5.4, .3);
      pen(st.lw);
      // 木桩 + 斜撑
      ctx.save();
      ctx.rotate(.05);
      plank(-3.6, -86, 7.2, 86, st.wood);
      ctx.restore();
      plank(4, -30, 3, 30, [wmid, wmid, wlo]);
      // 靶面绕钉子摆
      ctx.save();
      ctx.translate(0, -70);
      ctx.rotate(-.07 + d.swing.angle);
      const bw = 31, bh = 27;
      pen(st.lw);
      // 麻布边缘（一圈碎边）
      ctx.beginPath();
      const edge = [];
      for (let i = 0; i <= 22; i++) {
        const a = i / 22 * Math.PI * 2;
        const rr = 1 + ((i * 7) % 5) * .016;
        edge.push([Math.cos(a) * bw * rr, Math.sin(a) * bh * .92 * rr]);
      }
      ctx.moveTo(edge[0][0], edge[0][1]);
      for (const p of edge) ctx.lineTo(p[0], p[1]);
      ctx.closePath();
      ctx.fillStyle = '#d7c49a';
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.clip();
      // 麻布经纬
      ctx.strokeStyle = 'rgba(150,124,82,.3)';
      ctx.lineWidth = .8;
      for (let i = -bw; i <= bw; i += 4) {
        ctx.beginPath();
        ctx.moveTo(i, -bh); ctx.lineTo(i, bh);
        ctx.stroke();
      }
      for (let j = -bh; j <= bh; j += 4) {
        ctx.beginPath();
        ctx.moveTo(-bw, j); ctx.lineTo(bw, j);
        ctx.stroke();
      }
      // 靶环
      ctx.strokeStyle = 'rgba(178,66,52,.85)';
      for (const [r, w2] of [[22, 2.4], [14.5, 2.1], [7, 2]]) {
        ctx.lineWidth = w2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * .92, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(178,66,52,.9)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.4, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // 旧豌豆印
      for (const s of d.splats) {
        const px = s.u * bw, py = s.v * bh;
        const k = clamp(1 / s.age, 0, 1);
        ctx.globalAlpha = .35 + k * .55;
        ctx.fillStyle = s.age > .5 ? '#7d9a3c' : '#d8ea8c';
        ctx.beginPath();
        ctx.ellipse(px, py, 6.2 * s.r * 2.4, 5.4 * s.r * 2.4, s.u, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = .3 + k * .3;
        ctx.fillStyle = '#46551f';
        ctx.beginPath();
        ctx.arc(px + 1.4, py + 1, 1.5 * s.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = .3 + k * .4;
        ctx.fillStyle = '#a9bf5c';
        for (let q = 0; q < 4; q++) {
          const a = s.u * 7 + q * 1.7;
          ctx.beginPath();
          ctx.arc(px + Math.cos(a) * 9.6 * s.r * 2.4, py + Math.sin(a) * 8.4 * s.r * 2.4, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      pen(1.8);
      ctx.strokeStyle = '#6f5a3d';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    // —— 地上散着的几颗干豌豆
    for (const p of d.peas) {
      const g = anchor(p);
      if (g.alpha <= .01) continue;
      p.hop = p.hop ? Math.max(0, p.hop - dt * 2.6) : 0;
      const hop = p.hop ? Math.sin(p.hop * Math.PI) * 6 : 0;
      ctx.save();
      ctx.globalAlpha = g.alpha;
      contact(g.x, g.y, 4.8, 1.6, .26);
      pen(1.2);
      const grad = ctx.createRadialGradient(g.x - 1.6, g.y - 5 - hop, .6, g.x, g.y - 3.4 - hop, 5);
      grad.addColorStop(0, '#d8ec86');
      grad.addColorStop(1, '#74932f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - 3.4 - hop, 4.2, 3.7, .3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(g.x - 1.4, g.y - 5 - hop, 1.1, .8, -.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function reactYard(x, y, power) {
    const d = scene?.data;
    if (!d) return;
    if (Math.hypot(x - d.target.x, y - (d.target.baseY - 62)) < 190 + power * 40) {
      d.swing.v += clamp(power, .35, 1.5) * 3.1;
      d.lastHit = scene.t;
      if (d.splats.length < 7) {
        const a = (Math.random() - .5) * .7, b = (Math.random() - .5) * .7;
        d.splats.push({ u: a, v: b, r: .32, age: .35 });
      }
      for (const p of d.peas) p.hop = Math.random() * .6 + .5;
    }
  }

  /* =========================================================
   *  02 落日瓜市 —— 刚才还在做生意的那半个摊
   * ========================================================= */

  function buildLand() {
    const d = {
      table: { x: 592 },
      sign: { x: 508 },
      scale: { x: 744 },
      quarter: { x: 536 },
      broken: new Set(),
      pan: { angle: 0, v: 0 },
      magnet: 0,
      magnetHold: 0,
      lastClown: null,
      rattle: 0
    };
    for (const item of [d.table, d.sign, d.scale, d.quarter]) item.baseY = terrainAt(item.x);
    return d;
  }

  // Bounds in each prop's local drawing coordinates. Keep the space below the tabletop open.
  const marketParts = [
    ['sign', 'sign', -6, -58, 25, 19], ['sign', 'sign', -2, -22, 3, 22],
    ['largeMelon', 'table', -9, -61, 17, 17], ['smallMelon', 'table', 30, -46, 10, 10],
    ['table', 'table', 0, -38, 51, 6], ['table', 'table', -34, -14, 22, 14],
    ['table', 'table', 41, -17, 9, 17], ['quarter', 'quarter', 0, -5, 11, 11],
    ['scale', 'scale', 0, -60, 36, 4], ['scale', 'scale', 0, -30, 4, 30],
    ['scale', 'scale', 0, -5, 21, 5], ['scale', 'scale', -32, -22, 15, 12]
  ];

  function touchesMarketPart(d, part, x, y, radius) {
    const [key, parent, dx, dy, w, h] = part;
    if (d.broken.has(key)) return false;
    const a = anchor(d[parent]);
    return a.alpha > .01 && Math.hypot(Math.max(0, Math.abs(x-a.x-dx)-w),
      Math.max(0, Math.abs(y-a.y-dy)-h)) <= radius;
  }
  PZ.marketContact = (x, y) => scene?.map === 'land' &&
    marketParts.some(part => touchesMarketPart(scene.data, part, x, y, 0));

  function shatterMarket(x, y, radius) {
    const d = scene.data;
    const broken = new Set(marketParts.filter(part => touchesMarketPart(d, part, x, y, radius)).map(part => part[0]));
    if (broken.has('table')) { broken.add('largeMelon'); broken.add('smallMelon'); }
    for (const [key, parent, dx, dy, w, h] of marketParts) {
      if (!broken.has(key) || d.broken.has(key)) continue;
      const a = anchor(d[parent]);
      const melon = key === 'largeMelon' || key === 'smallMelon' || key === 'quarter';
      const colors = melon ? ['#ef6456','#bd4038','#58833c','#d5dfa0'] : ['#b77d47','#d7a86e','#835630','#efd5aa'];
      for (let i = 0; i < 6; i++) {
        const offset = Math.random()*2-1;
        state.particles.push({kind:'debris', x:a.x+dx+offset*w, y:a.y+dy+(Math.random()*2-1)*h,
          vx:offset*5, vy:-3-Math.random()*5, size:4+Math.random()*8, life:40+Math.random()*14,
          angle:Math.random()*Math.PI, spin:offset*.22, color:colors[i%colors.length]});
      }
    }
    for (const key of broken) d.broken.add(key);
  }

  function melonFace(cx, cy, r, cut) {
    // 半个西瓜的切面：绿皮、白瓤、红沙瓤、黑籽
    pen(Math.max(1, r * .12));
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * .92, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3e6f2c';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * .86, r * .8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e9f0c6';
    ctx.fill();
    const flesh = ctx.createRadialGradient(cx - r * .2, cy - r * .25, r * .1, cx, cy, r * .82);
    flesh.addColorStop(0, '#f2666a');
    flesh.addColorStop(.7, '#e04a52');
    flesh.addColorStop(1, '#c23240');
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * .76, r * .7, 0, 0, Math.PI * 2);
    ctx.fillStyle = flesh;
    ctx.fill();
    ctx.fillStyle = '#2b1a16';
    const seeds = [[-.42, -.3], [-.06, -.46], [.34, -.28], [-.3, .16], [.1, .06], [.44, .12], [-.1, .44], [.28, .46]];
    seeds.forEach(([u, v], i) => {
      if (cut && i % 3 === 0) return;
      ctx.save();
      ctx.translate(cx + u * r, cy + v * r);
      ctx.rotate(u + v);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * .075, r * .11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.fillStyle = '#ffd6d0';
    ctx.beginPath();
    ctx.ellipse(cx - r * .3, cy - r * .38, r * .22, r * .1, -.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLand(d, dt) {
    const st = STYLE.land;

    // —— 旧货摊台 + 半切西瓜
    const tb = anchor(d.table);
    if (!d.broken.has('table') && tb.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = tb.alpha;
      ctx.translate(tb.x, tb.y);
      contact(0, 0, 54, 9, .32);
      pen(st.lw);
      // X 形支腿
      for (const s of [-1, 1]) {
        ctx.strokeStyle = '#5d3a22';
        ctx.lineWidth = 5.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s * 42 + 7, -2); ctx.lineTo(s * 42 - 9, -34);
        ctx.moveTo(s * 42 - 9, -2); ctx.lineTo(s * 42 + 7, -34);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(226,170,120,.32)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s * 42 + 5, -4); ctx.lineTo(s * 42 - 11, -33);
        ctx.stroke();
      }
      // 台面
      plank(-50, -41, 100, 9, st.wood);
      ctx.strokeStyle = 'rgba(70,40,20,.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-46, -37.5); ctx.lineTo(44, -37.5);
      ctx.stroke();
      // 砧板 + 半切西瓜
      ctx.save();
      ctx.translate(-8, -41);
      ctx.rotate(-.04);
      plank(-20, -3.4, 40, 3.8, ['#c9a87a', '#a8834f', '#77552d']);
      if (!d.broken.has('largeMelon')) melonFace(0, -20, 17);
      ctx.restore();
      // 另一小块斜搁在台沿
      ctx.save();
      ctx.translate(30, -46);
      ctx.rotate(.3);
      if (!d.broken.has('smallMelon')) melonFace(0, 0, 9.5, true);
      ctx.restore();
      // 台下一个装瓜的木箱，露出半个瓜
      ctx.save();
      ctx.translate(-34, 0);
      pen(st.lw);
      plank(-22, -26, 44, 26, ['#b98b56', '#8f6236', '#5c3d22']);
      ctx.strokeStyle = 'rgba(70,40,20,.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-22, -13); ctx.lineTo(22, -13);
      ctx.stroke();
      ctx.restore();
      // 切到一半就撂下的水果刀
      ctx.save();
      ctx.translate(-30, -44);
      ctx.rotate(-.22);
      pen(1.2);
      ctx.fillStyle = '#3b2a20';
      ctx.beginPath();
      ctx.roundRect(-2, -2.6, 15, 5.2, 2.2);
      ctx.fill();
      ctx.stroke();
      const blade = ctx.createLinearGradient(13, 0, 34, 0);
      blade.addColorStop(0, '#cfd8dc');
      blade.addColorStop(.7, '#9aa8ae');
      blade.addColorStop(1, '#e6eef2');
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(13, -2.4);
      ctx.lineTo(33, -3.6);
      ctx.quadraticCurveTo(36, 0, 33, 2.2);
      ctx.lineTo(13, 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(15, -.6); ctx.lineTo(31, -1.6);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    // —— 脚边滚下去的一牙西瓜
    const q = anchor(d.quarter);
    if (!d.broken.has('quarter') && q.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = q.alpha;
      contact(q.x, q.y, 12, 3, .28);
      ctx.translate(q.x, q.y - 5);
      ctx.rotate(-.18);
      melonFace(0, 0, 11, true);
      ctx.restore();
    }

    // —— 手写瓜价牌
    const sg = anchor(d.sign);
    if (!d.broken.has('sign') && sg.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = sg.alpha;
      ctx.translate(sg.x, sg.y);
      contact(0, 0, 14, 3.6, .3);
      pen(st.lw);
      ctx.rotate(-.09);
      plank(-1.7, -50, 3.4, 50, st.wood);
      ctx.save();
      ctx.translate(0, -58);
      ctx.rotate(.06);
      plank(-25, -19, 50, 38, ['#f0dfb6', '#d8c197', '#b39b70']);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-23.5, -17.5, 47, 35, 2);
      ctx.clip();
      ctx.fillStyle = '#2f2a22';
      ctx.font = '600 11px "KaiTi","STKaiti","Kaiti SC","Microsoft YaHei",serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('沙瓤瓜', 0, -8);
      ctx.font = '600 9px "KaiTi","STKaiti","Kaiti SC","Microsoft YaHei",serif';
      ctx.fillStyle = '#8e2f22';
      ctx.fillText('两块钱一斤', 0, 3.5, 44);
      // 手画的一个小箭头 + 瓜
      ctx.strokeStyle = '#8e2f22';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-17, 11); ctx.lineTo(-9, 11); ctx.lineTo(-12.5, 8.6);
      ctx.moveTo(-9, 11); ctx.lineTo(-12.5, 13.4);
      ctx.stroke();
      ctx.fillStyle = '#4a7a33';
      ctx.beginPath();
      ctx.ellipse(10, 11, 6.4, 4.6, .1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f0e3be';
      ctx.lineWidth = .9;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(10, 11, 4.6, -1.2 + i * .5, -0.2 + i * .5);
        ctx.stroke();
      }
      ctx.restore();
      pen(1.4);
      ctx.strokeStyle = '#8b7350';
      ctx.beginPath();
      ctx.moveTo(-22, -18); ctx.lineTo(22, -18);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    // —— 一杆旧秤：秤盘里还搁着一只没称完的瓜
    const sc = anchor(d.scale);
    if (!d.broken.has('scale') && sc.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = sc.alpha;
      ctx.translate(sc.x, sc.y);
      contact(0, 0, 26, 6, .3);

      // 底座下面那块吸铁石：底座平时压着，被撞歪之后才露出半边
      if (d.magnet > .01) {
        ctx.save();
        ctx.globalAlpha = sc.alpha * clamp(d.magnet * 1.4, 0, 1);
        ctx.translate(-14, 1.5);
        ctx.rotate(-.06);
        pen(1.3);
        // 马蹄形：两道灰亮的极头，谁看都知道是块吸铁石
        const body = ctx.createLinearGradient(0, -10, 0, 1);
        body.addColorStop(0, '#9aa3b4');
        body.addColorStop(.5, '#4d5464');
        body.addColorStop(1, '#262b36');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(-9, -2.5);
        ctx.lineTo(-9, -6);
        ctx.quadraticCurveTo(-9, -9.5, -5.5, -9.5);
        ctx.lineTo(5.5, -9.5);
        ctx.quadraticCurveTo(9, -9.5, 9, -6);
        ctx.lineTo(9, -2.5);
        ctx.lineTo(4.5, -2.5);
        ctx.lineTo(4.5, -6.2);
        ctx.quadraticCurveTo(4.5, -6.8, 3.6, -6.8);
        ctx.lineTo(-3.6, -6.8);
        ctx.quadraticCurveTo(-4.5, -6.8, -4.5, -6.2);
        ctx.lineTo(-4.5, -2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 两道极头
        ctx.fillStyle = '#d8e6f6';
        ctx.fillRect(-9, -4.4, 4.5, 1.9);
        ctx.fillRect(4.5, -4.4, 4.5, 1.9);
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.fillRect(-5.4, -9, 3, 1.1);
        ctx.restore();
      }

      // 底座被撞得一倾，左边翘起来
      ctx.save();
      const tip = d.magnet * .30;
      if (tip > .002) {
        ctx.translate(19, 0);
        ctx.rotate(-tip);
        ctx.translate(-19, 0);
      }
      pen(st.lw);
      // 底座
      plank(-21, -9, 42, 9, ['#9b6f43', '#7a5330', '#4d341d']);
      ctx.fillStyle = 'rgba(255,232,190,.28)';
      ctx.fillRect(-19, -8, 36, 1.4);
      ctx.restore();

      ctx.save();
      ctx.rotate(tip * .22);
      pen(st.lw);
      // 立柱
      plank(-3.2, -60, 6.4, 52, st.wood);
      // 柱头的铜套
      ctx.fillStyle = '#8d7038';
      ctx.beginPath();
      ctx.roundRect(-4.4, -61, 8.8, 4, 1.2);
      ctx.fill();
      pen(1);
      ctx.stroke();
      // 秤杆
      ctx.save();
      ctx.translate(0, -60);
      ctx.rotate(d.pan.angle * .22);
      pen(st.lw * .8);
      plank(-36, -2.2, 72, 4.4, ['#e8cd98', '#c3a267', '#806637']);
      // 刻度
      ctx.strokeStyle = 'rgba(70,50,28,.7)';
      ctx.lineWidth = .8;
      for (let i = -30; i <= 30; i += 7) {
        ctx.beginPath();
        ctx.moveTo(i, -1); ctx.lineTo(i, 1.8);
        ctx.stroke();
      }
      // 秤砣
      ctx.fillStyle = '#55504a';
      ctx.beginPath();
      ctx.roundRect(12, -5, 8, 6.2, 1.4);
      ctx.fill();
      pen(.9);
      ctx.stroke();
      ctx.fillStyle = 'rgba(220,220,214,.35)';
      ctx.fillRect(13, -4, 4, 1.2);
      ctx.restore();
      // 秤盘吊绳 + 盘（绕挂点摆动）
      ctx.save();
      ctx.translate(-32, -59);
      ctx.rotate(d.pan.angle);
      ctx.strokeStyle = '#5e4c31';
      ctx.lineWidth = 1.6;
      for (const dx of [-13, 0, 13]) {
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(dx, 40);
        ctx.stroke();
      }
      pen(st.lw * .7);
      const panG = ctx.createLinearGradient(0, 38, 0, 50);
      panG.addColorStop(0, '#e0c188');
      panG.addColorStop(.55, '#b8935c');
      panG.addColorStop(1, '#7d5a2f');
      ctx.fillStyle = panG;
      ctx.beginPath();
      ctx.ellipse(0, 42, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,200,.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 40.4, 14, 5.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(0, 31);
      ctx.rotate(-d.pan.angle * .55);
      melonFace(0, 0, 9.4, true);
      ctx.restore();
      ctx.restore();
      ctx.restore();
      ctx.restore();
    }
  }

  function reactLand(x, y, power) {
    const d = scene?.data;
    if (!d) return;
    if (Math.hypot(x - d.scale.x, y - (d.scale.baseY - 40)) < 210) {
      d.pan.v += clamp(power, .3, 1.2) * 2.2;
      d.rattle = .5;
    }
  }

  // 瓜老板贴着摊子冲过去：秤盘猛地一晃，底座一倾，露出底下那块吸铁石。
  function watchClownJolt() {
    const d = scene?.data;
    if (!d || state.map !== 'land') return;
    const flight = state.clownFlight;
    const clown = state.rivals?.find(r => r.variant === 'clownZombie');
    const runner = flight?.fighter || clown;
    if (!runner) return;
    const near = Math.abs(runner.x - d.scale.x) < 86;
    if (near && d.lastClown !== true) {
      d.pan.v -= 4.4;
      d.magnetHold = 1.9;
      d.rattle = .8;
    }
    d.lastClown = near;
  }

  /* =========================================================
   *  03 米坪镇 —— 坡脚的晒场
   * ========================================================= */

  function berryPositions(count, rx, ry, seed) {
    // 黄金角螺旋，铺满一个椭圆，看着像随手摊开而不是摆好的
    const out = [];
    const gold = 2.39996;
    for (let i = 0; i < count; i++) {
      const a = i * gold + seed;
      const r = Math.sqrt((i + .5) / count) * .9;
      out.push({ x: Math.cos(a) * r * rx, y: Math.sin(a) * r * ry, r: 11.5 - r * 2, a });
    }
    return out;
  }

  function buildCanyon() {
    const d = {
      trayA: { x: 2258, r: 124, tilt: -.04, rock: 0, seed: .3, fresh: berryPositions(58, 108, 34, .3) },
      trayB: { x: 2502, r: 106, tilt: .06, rock: 0, seed: 1.7, fresh: berryPositions(44, 96, 30, 1.7) },
      basket: { x: 2700 },
      rake: { x: 2830 },
      loose: [{ x: 2400, r: 10 }, { x: 2420, r: 8 }, { x: 2374, r: 9 }, { x: 2446, r: 7 }],
      gift: [],
      given: false
    };
    for (const item of [d.trayA, d.trayB, d.basket, d.rake, ...d.loose]) item.baseY = terrainAt(item.x);
    return d;
  }

  function berriesInTray(list, worldX, worldY) {
    // 鲜红的一匾：亮红带高光；晒过的一匾：暗红发皱
    for (const b of list) {
      const x = worldX + b.x;
      const y = worldY + b.y;
      const r = b.r;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * .88, b.a, 0, Math.PI * 2);
      const dried = b.dried;
      if (dried) {
        ctx.fillStyle = ['#5f1a1c', '#75201f', '#8a2a24', '#4c1518'][(b.a * 37 | 0) % 4];
      } else {
        ctx.fillStyle = ['#e02840', '#f43e52', '#c81b39', '#ff5566'][(b.a * 37 | 0) % 4];
      }
      ctx.fill();
      ctx.strokeStyle = dried ? 'rgba(40,10,12,.75)' : 'rgba(120,8,26,.72)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      if (!dried) {
        ctx.fillStyle = 'rgba(255,232,232,.85)';
        ctx.beginPath();
        ctx.ellipse(x - r * .3, y - r * .34, r * .3, r * .22, -.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(38,8,10,.5)';
        ctx.lineWidth = .9;
        ctx.beginPath();
        ctx.arc(x + r * .1, y, r * .55, .5, 2.6);
        ctx.stroke();
      }
    }
  }
  const freshOf = (list) => list.map(b => ({ ...b, dried: false }));
  const driedOf = (list) => list.map(b => ({ ...b, dried: true }));

  function drawCanyon(d, dt, t) {
    const st = STYLE.canyon;

    // —— 晒场：每只匾下面垫一块粗麻布，沿着坡面铺开
    for (const item of [d.trayA, d.trayB]) {
      const g = anchor(item);
      if (g.alpha <= .01) continue;
      const slope = Math.atan2(terrainAt(item.x + 46) - terrainAt(item.x - 46), 92);
      ctx.save();
      ctx.globalAlpha = g.alpha * .95;
      ctx.translate(g.x, g.y + 1);
      ctx.rotate(slope * .8);
      const mx = item.r * 1.16, my = item.r * .3;
      ctx.beginPath();
      ctx.ellipse(0, 0, mx, my, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(198,176,126,.7)';
      ctx.fill();
      pen(1.4);
      ctx.strokeStyle = 'rgba(92,70,36,.5)';
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(126,100,58,.32)';
      ctx.lineWidth = 1.1;
      for (let x = -mx; x < mx; x += 11) {
        ctx.beginPath();
        ctx.moveTo(x, -my); ctx.lineTo(x + 7, my);
        ctx.stroke();
      }
      for (let y = -my; y < my; y += 8) {
        ctx.beginPath();
        ctx.moveTo(-mx, y); ctx.lineTo(mx, y + 1.6);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    const tray = (item, dried) => {
      const g = anchor(item);
      if (g.alpha <= .01) return;
      const rocking = Math.sin(t * 2.2) * .006 * (item === d.trayA ? 1 : .7);
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.translate(g.x, g.y - 6);
      contact(0, 6, item.r * 1.12, item.r * .2, .3);
      ctx.rotate(item.tilt + rocking + item.rock);
      const rx = item.r, ry = item.r * .36;
      // 匾壁（先画一圈厚边，再画里面，才像一只浅筐而不是一块盘子）
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = dried ? '#b08a4c' : '#bd9550';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -10, rx * .9, ry * .86, 0, 0, Math.PI * 2);
      ctx.fillStyle = dried ? '#8d6a36' : '#9a7539';
      ctx.fill();
      // 匾里的果子，堆到边沿
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -10, rx * .86, ry * .82, 0, 0, Math.PI * 2);
      ctx.clip();
      const kept = d.given ? item.fresh.slice(0, Math.floor(item.fresh.length * .68)) : item.fresh;
      berriesInTray(dried ? driedOf(kept) : freshOf(kept), 0, -14);
      ctx.restore();
      // 竹篾边圈
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 0, rx * .9, ry * .86, 0, 0, Math.PI * 2, true);
      ctx.fillStyle = dried ? '#d3ab63' : '#e0bc78';
      ctx.fill('evenodd');
      pen(st.lw * .8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(96,68,30,.5)';
      ctx.lineWidth = 1.7;
      for (let i = 0; i < 44; i++) {
        const a = i / 44 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rx * .995, Math.sin(a) * ry * .995);
        ctx.lineTo(Math.cos(a + .09) * rx * .9, Math.sin(a + .09) * ry * .86);
        ctx.stroke();
      }
      // 匾沿高光
      ctx.strokeStyle = 'rgba(255,238,190,.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -1.6, rx * .99, ry * .99, 0, Math.PI * 1.12, Math.PI * 1.92);
      ctx.stroke();
      ctx.restore();
    };

    tray(d.trayA, false);
    tray(d.trayB, true);

    // —— 采菇的竹筐
    const bk = anchor(d.basket);
    if (bk.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = bk.alpha;
      ctx.translate(bk.x, bk.y);
      contact(0, 0, 58, 12, .3);
      pen(st.lw);
      const bw = 52, bh = 66;
      ctx.beginPath();
      ctx.moveTo(-bw, -bh);
      ctx.lineTo(bw, -bh);
      ctx.lineTo(bw * .74, 0);
      ctx.lineTo(-bw * .74, 0);
      ctx.closePath();
      const bg = ctx.createLinearGradient(-bw, -bh, bw, 0);
      bg.addColorStop(0, '#dcbb7c');
      bg.addColorStop(.55, '#c19a58');
      bg.addColorStop(1, '#8a6836');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(84,58,24,.42)';
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        const topX = i / 3 * (bw - 5), botX = i / 3 * (bw * .74 - 4);
        ctx.beginPath();
        ctx.moveTo(topX, -bh + 3);
        ctx.lineTo(botX, -3);
        ctx.stroke();
      }
      // 编织横带
      for (const yy of [-bh + 18, -bh * .5, -14]) {
        ctx.strokeStyle = 'rgba(110,80,36,.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-bw + Math.abs(yy + bh) * .22, yy);
        ctx.lineTo(bw - Math.abs(yy + bh) * .22, yy);
        ctx.stroke();
      }
      // 筐口
      ctx.beginPath();
      ctx.ellipse(0, -bh, bw, 11, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e6cc92';
      ctx.fill();
      pen(st.lw * .8);
      ctx.stroke();
      // 里面的香菇
      for (const [mx, my, mr] of [[-20, -bh - 3, 19], [2, -bh - 9, 17], [22, -bh - 2, 14], [-4, -bh + 5, 15], [24, -bh + 8, 11]]) {
        ctx.save();
        ctx.translate(mx, my);
        const capG = ctx.createRadialGradient(-mr * .3, -mr * .6, mr * .2, 0, 0, mr);
        capG.addColorStop(0, '#b58454');
        capG.addColorStop(.68, '#82563a');
        capG.addColorStop(1, '#4d3020');
        ctx.fillStyle = capG;
        ctx.beginPath();
        ctx.ellipse(0, 0, mr, mr * .82, 0, Math.PI, 0);
        ctx.fill();
        pen(st.lw * .6);
        ctx.stroke();
        ctx.fillStyle = '#eddbb6';
        ctx.beginPath();
        ctx.ellipse(0, 0, mr * .82, mr * .24, 0, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(150,120,80,.5)';
        ctx.lineWidth = .8;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * mr * .3, 0);
          ctx.lineTo(i * mr * .34, mr * .2);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }

    // —— 靠在筐边的竹耙
    const rk = anchor(d.rake);
    if (rk.alpha > .01) {
      ctx.save();
      ctx.globalAlpha = rk.alpha;
      ctx.translate(rk.x, rk.y);
      contact(-6, 0, 22, 5, .24);
      pen(st.lw * .85);
      ctx.rotate(.26);
      plank(-2.2, -118, 4.4, 118, ['#e0c48c', '#bb9a5e', '#7b6034']);
      ctx.save();
      ctx.translate(0, -118);
      ctx.rotate(-.4);
      plank(-24, -2, 48, 5, ['#e6cd97', '#c2a468', '#836a3c']);
      ctx.strokeStyle = '#8a7142';
      ctx.lineWidth = 1.4;
      for (let i = -20; i <= 20; i += 4.4) {
        ctx.beginPath();
        ctx.moveTo(i, 3); ctx.lineTo(i - .6, 11);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }

    // —— 从匾边滚到泥土上的几颗果子
    for (const b of d.loose) {
      const g = anchor(b);
      if (g.alpha <= .01) continue;
      ctx.save();
      ctx.globalAlpha = g.alpha;
      contact(g.x, g.y, b.r * .9, b.r * .3, .26);
      pen(1.4);
      const grad = ctx.createRadialGradient(g.x - b.r * .3, g.y - b.r * 1.2, b.r * .1, g.x, g.y - b.r * .8, b.r);
      grad.addColorStop(0, '#f25a63');
      grad.addColorStop(1, '#b01431');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - b.r * .8, b.r, b.r * .86, .2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // —— 山茱萸复苏那一刻：晒场里的果子起来，跟着一起递过去
    if (state.berryFeeding && !d.given) {
      const prog = 1 - state.berryFeeding / 42;
      const p = state.player;
      for (const gift of d.gift) {
        const k = clamp((prog - gift.delay) / (1 - gift.delay), 0, 1);
        if (k <= 0) continue;
        const e = smooth(k);
        const cx = gift.sx + (p.x - gift.sx) * e;
        const cy = gift.sy + (p.y - 30 - gift.sy) * e - Math.sin(Math.PI * e) * 150;
        const r = 9 + e * 3;
        ctx.save();
        ctx.globalAlpha = 1 - e * .15;
        pen(st.lw * .5);
        const grad = ctx.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, r);
        grad.addColorStop(0, '#ff6a72');
        grad.addColorStop(1, '#c01b34');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (k > .92) d.given = true;
      }
    }
  }

  // 复苏开始：从两匾里各挑几颗，排队飞向豌豆
  function startBerryGift() {
    const d = scene?.data;
    if (!d || state.map !== 'canyon' || d.gift.length) return;
    const p = state.player;
    const picks = [d.trayA, d.trayB, d.trayA, d.trayB, d.trayA, d.trayB];
    picks.forEach((tray, i) => {
      d.gift.push({
        sx: tray.x - 40 + i * 14,
        sy: tray.baseY - 26 + (i % 2) * 8,
        delay: .08 * i
      });
      tray.rock = (i % 2 ? -.05 : .06);
    });
  }

  /* =========================================================
   *  04 心语玫瑰园 —— 两半截同色的缎带
   * ========================================================= */

  function buildPool() {
    const west = cloudPlatformById('rose-west');
    const east = cloudPlatformById('rose-east');
    return {
      west: west ? { x: west.x, y: west.y + west.height * .52, dir: 1 } : { x: 400, y: 966, dir: 1 },
      east: east ? { x: east.x, y: east.y + east.height * .52, dir: -1 } : { x: 2000, y: 966, dir: -1 },
      open: 0,
      target: 0,
      hold: 0,
      sway: 0
    };
  }

  // 一条带燕尾剪口的缎带：沿二次贝塞尔取样，几乎等宽，末段略微展开。
  function ribbon(x0, y0, dir, open, phase, tint) {
    const len = 62 + open * 214;
    // 收起时是垂在结下的一小截，展开时整条朝对面铺过去
    const p0 = { x: x0, y: y0 };
    const p1 = {
      x: x0 + dir * len * .42,
      y: y0 + (1 - open) * 46 + Math.sin(phase * .9) * 3
    };
    const p2 = {
      x: x0 + dir * len,
      y: y0 + (1 - open) * 92 - open * 14 + Math.sin(phase * 1.3 + 1) * 5 * open
    };
    const N = 20, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const mt = 1 - t;
      const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
      // 布面自己的一点起伏，展开时像被风撑着
      const ripple = Math.sin(t * 6.4 + phase) * (2.6 + open * 3.4) * t;
      const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y + ripple;
      const dx = 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const dy = 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      const m = Math.hypot(dx, dy) || 1;
      const twist = .22 * Math.sin(t * 3.1 + phase * .6) + .08;
      const nx = (-dy / m) * Math.cos(twist) - (dx / m) * Math.sin(twist);
      const ny = (dx / m) * Math.cos(twist) + (dy / m) * Math.sin(twist);
      // 几乎等宽，靠近燕尾才往外张一点
      const w = 10.4 * (1 - t * .16) + (t > .86 ? (t - .86) * 22 : 0);
      top.push([x + nx * w, y + ny * w]);
      bot.push([x - nx * w, y - ny * w]);
    }
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (const p of top) ctx.lineTo(p[0], p[1]);
    // 燕尾剪口：两片尖角，中间凹进去
    const tipT = top[N], tipB = bot[N];
    const dirX = (tipT[0] - top[N - 2][0]) * .5, dirY = (tipT[1] - top[N - 2][1]) * .5;
    ctx.lineTo(tipT[0] + dirX, tipT[1] + dirY);
    ctx.lineTo((tipT[0] + tipB[0]) / 2 - dirX * .4, (tipT[1] + tipB[1]) / 2 - dirY * .4);
    ctx.lineTo(tipB[0] + dirX, tipB[1] + dirY);
    for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(p0.x, p0.y, p2.x, p2.y);
    g.addColorStop(0, tint[0]);
    g.addColorStop(.42, tint[1]);
    g.addColorStop(1, tint[2]);
    ctx.fillStyle = g;
    ctx.fill();
    pen(1.6);
    ctx.stroke();
    // 缎面高光：沿上缘收一条窄亮带
    ctx.beginPath();
    for (let i = 0; i < top.length; i++) {
      const p = top[i], q = bot[i];
      const lx = p[0] * .66 + q[0] * .34, ly = p[1] * .66 + q[1] * .34;
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.strokeStyle = 'rgba(232,255,214,.55)';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // 下缘压一道暗，缎带的厚度就出来了
    ctx.beginPath();
    for (let i = 0; i < bot.length; i++) {
      const p = bot[i];
      if (i === 0) ctx.moveTo(p[0], p[1] - 1.6);
      else ctx.lineTo(p[0], p[1] - 1.6);
    }
    ctx.strokeStyle = 'rgba(22,62,28,.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawPool(d, dt, t) {
    const tint = ['#a8f07e', '#5ec44a', '#2c7f3c'];
    if (d.open < .04) {
      // 没展开时只露在蝴蝶结两侧的一小截，说明它们本来是系在这儿的
      ribbon(d.west.x + 26, d.west.y - 4, 1, 0, t * .8, tint);
      ribbon(d.east.x - 26, d.east.y - 4, -1, 0, t * .8 + 1.7, tint);
      return;
    }
    ribbon(d.west.x + 26, d.west.y - 4, 1, d.open, t, tint);
    ribbon(d.east.x - 26, d.east.y - 4, -1, d.open, t + 1.7, tint);
  }

  function unfurlRibbons() {
    const d = scene?.data;
    if (!d || state.map !== 'pool') return;
    d.target = 1;
    d.hold = 4.2;
  }

  /* =========================================================
   *  05 月夜舞台 —— 返听、灯排、前排荧光棒
   * ========================================================= */

  const DECK = [
    { left: 85, right: 357, top: 552 },
    { left: 682, right: 1238, top: 510 },
    { left: 1563, right: 1835, top: 552 }
  ];

  const glowCache = new Map();
  function glowSprite(color, h) {
    const key = color + h;
    if (glowCache.has(key)) return glowCache.get(key);
    const c = document.createElement('canvas');
    const w = 30, scale = 3;
    c.width = w * scale; c.height = h * scale;
    const g = c.getContext('2d');
    g.scale(scale, scale);
    g.translate(w / 2, h);
    // 手柄
    g.strokeStyle = '#2a2338';
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(0, -h * .45);
    g.stroke();
    // 光晕
    const halo = g.createRadialGradient(0, -h * .72, 1, 0, -h * .72, w * .62);
    halo.addColorStop(0, color);
    halo.addColorStop(.35, color.replace('rgb', 'rgba').replace(')', ',.45)'));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = halo;
    g.beginPath();
    g.arc(0, -h * .72, w * .62, 0, Math.PI * 2);
    g.fill();
    // 棒体
    g.fillStyle = '#f4fbff';
    g.beginPath();
    g.roundRect(-2.4, -h * .9, 4.8, h * .34, 2.4);
    g.fill();
    g.fillStyle = color;
    g.globalAlpha = .85;
    g.beginPath();
    g.roundRect(-1.7, -h * .87, 3.4, h * .28, 1.7);
    g.fill();
    glowCache.set(key, c);
    return c;
  }

  function crowdMember(hue, style) {
    // 一个观众：肩膀 + 头 + 两只举起来的手，全剪影，只有荧光棒是亮的
    const w = 84, h = 112;
    const c = document.createElement('canvas');
    c.width = w * 3; c.height = h * 3;
    const g = c.getContext('2d');
    g.scale(3, 3);
    const cx = 42, headY = h - 58;
    g.fillStyle = '#171029';
    // 肩
    g.beginPath();
    g.moveTo(4, h);
    g.quadraticCurveTo(6, h - 34, 27, h - 45);
    g.lineTo(57, h - 45);
    g.quadraticCurveTo(78, h - 34, 80, h);
    g.closePath();
    g.fill();
    // 头（每张剪影换个发型，前排才不像一排棋子）
    g.beginPath();
    g.ellipse(cx, headY, 12, 13, 0, 0, Math.PI * 2);
    g.fill();
    if (style === 0) {           // 丸子头
      g.beginPath();
      g.arc(cx + 9, headY - 12, 5.5, 0, Math.PI * 2);
      g.fill();
    } else if (style === 1) {    // 鸭舌帽
      g.beginPath();
      g.ellipse(cx, headY - 8, 13, 6.5, 0, Math.PI, 0);
      g.fill();
      g.beginPath();
      g.ellipse(cx + 12, headY - 6, 7, 2.6, .12, 0, Math.PI * 2);
      g.fill();
    } else if (style === 2) {    // 马尾
      g.beginPath();
      g.moveTo(cx - 10, headY - 8);
      g.quadraticCurveTo(cx - 24, headY + 2, cx - 17, headY + 18);
      g.quadraticCurveTo(cx - 13, headY + 4, cx - 8, headY - 2);
      g.closePath();
      g.fill();
    } else if (style === 3) {    // 短发翘角
      for (const dx of [-8, -1, 6]) {
        g.beginPath();
        g.moveTo(cx + dx - 3, headY - 10);
        g.lineTo(cx + dx + 1, headY - 19);
        g.lineTo(cx + dx + 3, headY - 9);
        g.closePath();
        g.fill();
      }
    }
    // 舞台的反光边
    g.strokeStyle = 'rgba(196,150,236,.55)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(cx, headY, 12, 13, 0, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
    // 手臂（左右高低不一样，前排才错落）
    const upL = h - 74 - (style % 2) * 12;
    const upR = h - 78 - ((style + 1) % 3) * 8;
    g.strokeStyle = '#171029';
    g.lineWidth = 5.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(27, h - 40); g.lineTo(19, upL);
    g.moveTo(57, h - 40); g.lineTo(65, upR);
    g.stroke();
    // 荧光棒
    const stick = glowSprite(hue, 46);
    g.drawImage(stick, 19 - 15, upL - 46, 30, 46);
    if (style % 3 !== 2) g.drawImage(stick, 65 - 15, upR - 46, 30, 46);
    return c;
  }

  function buildDance() {
    const hues = [
      'rgb(126,240,255)', 'rgb(255,142,232)', 'rgb(255,226,122)',
      'rgb(150,255,168)', 'rgb(186,150,255)'
    ];
    const sprites = [];
    hues.forEach((h, i) => sprites.push(crowdMember(h, i)));
    const crowd = [];
    let x = 34;
    let i = 0;
    while (x < 1900) {
      crowd.push({
        x,
        sprite: sprites[i % sprites.length],
        h: 94 + (i % 4) * 13 + (i % 3) * 5,
        bob: i * .7,
        base: 834 - (i % 5) * 7 - (i % 2) * 4
      });
      x += 70 + (i % 4) * 14;
      i++;
    }
    return {
      crowd,
      cheer: 0,
      beat: 0,
      lights: 0,
      monitors: [
        { x: 726, y: 510, dir: 1 }, { x: 1194, y: 510, dir: -1 },
        { x: 316, y: 552, dir: 1 }, { x: 1604, y: 552, dir: -1 }
      ]
    };
  }

  function drawDance(d, dt, t) {
    const st = STYLE.dance;
    const beatOn = d.cheer > 0;

    // —— 返听音箱：贴着台沿，斜着朝台上的人
    ctx.save();
    pen(st.lw * .9);
    for (const m of d.monitors) {
      const g = pinned(m.x, m.y);
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.translate(g.x, g.y);
      ctx.scale(m.dir, 1);
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(28, 0);
      ctx.lineTo(22, -20);
      ctx.lineTo(-16, -24);
      ctx.closePath();
      const body = ctx.createLinearGradient(0, -24, 0, 0);
      body.addColorStop(0, '#5b5474');
      body.addColorStop(.6, '#332c46');
      body.addColorStop(1, '#1d1830');
      ctx.fillStyle = body;
      ctx.fill();
      ctx.stroke();
      // 网面
      ctx.fillStyle = '#191426';
      ctx.beginPath();
      ctx.moveTo(-20, -3.4);
      ctx.lineTo(19, -3.4);
      ctx.lineTo(15, -17);
      ctx.lineTo(-13, -19.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,138,186,.35)';
      ctx.lineWidth = .7;
      for (let i = -16; i < 16; i += 3.4) {
        ctx.beginPath();
        ctx.moveTo(i, -4);
        ctx.lineTo(i - 2, -18);
        ctx.stroke();
      }
      // 台沿反光
      ctx.strokeStyle = beatOn ? 'rgba(140,255,255,.95)' : 'rgba(140,255,255,.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(22, -20); ctx.lineTo(-16, -24);
      ctx.stroke();
      // 一颗指示灯
      ctx.fillStyle = beatOn ? '#fff4a8' : '#8b6fd8';
      ctx.beginPath();
      ctx.arc(8, -8, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // —— 台沿灯排：概念上贴着每块台板的前沿
    ctx.save();
    for (const deck of DECK) {
      const y = deck.top + 12;
      const g = pinned(deck.left, y);
      if (g.alpha < .5) continue;
      ctx.strokeStyle = 'rgba(28,22,44,.9)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(deck.left + 6, y);
      ctx.lineTo(deck.right - 6, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120,110,150,.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(deck.left + 6, y - 1.2);
      ctx.lineTo(deck.right - 6, y - 1.2);
      ctx.stroke();
      for (let x = deck.left + 16; x < deck.right - 10; x += 26) {
        const phase = (x / 26 + d.beat * 2) % 2;
        const lit = beatOn ? (phase < .9 ? 1 : .25) : .35 + .12 * Math.sin(t * 1.4 + x * .05);
        ctx.fillStyle = `rgba(255,236,170,${.22 + lit * .7})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.3 + lit * .9, 0, Math.PI * 2);
        ctx.fill();
        if (lit > .7) {
          ctx.fillStyle = 'rgba(255,226,150,.16)';
          ctx.beginPath();
          ctx.arc(x, y, 7.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // —— 前排观众：高低错落，应援时两拍一起抬起来
    ctx.save();
    for (const c of d.crowd) {
      const lift = Math.sin(Math.max(0, d.cheer) * 9 + c.bob) * (d.cheer > 0 ? 1 : 0);
      const idle = Math.sin(t * 1.1 + c.bob) * 1.6;
      const y = c.base + idle - Math.max(0, lift) * 16;
      const sway = Math.sin(t * .9 + c.bob) * .012 + lift * .02;
      const g = pinned(c.x, y);
      ctx.globalAlpha = clamp(g.alpha, 0, 1) * .96;
      ctx.save();
      ctx.translate(c.x, g.y);
      ctx.rotate(sway);
      const w = c.h * 76 / 110;
      ctx.drawImage(c.sprite, -w / 2, -c.h, w, c.h);
      ctx.restore();
    }
    ctx.restore();
  }

  function cheerCrowd() {
    const d = scene?.data;
    if (!d || state.map !== 'dance') return;
    d.cheer = 1.5;
  }

  /* =========================================================
   *  06 混沌屋顶 —— 压在砖头下的请战书
   * ========================================================= */

  function buildChaos() {
    const x = 330;
    return {
      letter: { x, baseY: terrainAt(x) },
      finale: null,
      spent: false
    };
  }

  function inkStroke(points, width, color, t) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const n = points.length - 1;
    const upto = Math.max(1, Math.round(n * t));
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i <= upto; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function drawBrick(x, y, rot, dx, dy, alpha) {
    const st = STYLE.chaos;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + dx, y + dy);
    ctx.rotate(rot);
    pen(st.lw * .8);
    const bg = ctx.createLinearGradient(0, -9, 0, 4);
    bg.addColorStop(0, '#9b5b45');
    bg.addColorStop(.55, '#7d4433');
    bg.addColorStop(1, '#4f2a20');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-17, -9, 34, 13, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(224,186,150,.35)';
    ctx.fillRect(-15, -7.4, 12, 1.6);
    ctx.fillStyle = 'rgba(38,18,14,.35)';
    ctx.beginPath();
    ctx.arc(8, -3, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // flip 0=正面朝外，1=翻到背面；checkT 是那个勾的书写进度。
  // 纸是斜靠在墙头上的，所以看得到纸面，不是一条薄板。
  function drawLetter(x, y, flip, checkT) {
    const st = STYLE.chaos;
    const W2 = 44, H2 = 62;   // 半宽 / 高
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.04);
    const sx = Math.abs(Math.cos(flip * Math.PI));
    const back = flip > .5;
    ctx.scale(Math.max(.05, sx), 1);
    // 斜靠：越往上越往外偏，读起来才有倚着墙的角度
    const lean = .26;
    pen(st.lw);
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(-W2 + H2 * lean, -H2);
      ctx.quadraticCurveTo(-W2 * .2, -H2 - 4, W2 - 3 + H2 * lean * .3, -H2 + 3);
      ctx.lineTo(W2, -6);
      ctx.quadraticCurveTo(W2 + 1.6, 4, W2 - 3, 9);
      ctx.lineTo(-W2 + 3, 9);
      ctx.quadraticCurveTo(-W2 - 1, -H2 * .4, -W2 + H2 * lean, -H2);
      ctx.closePath();
    };
    outline();
    // 先落一层贴墙的影子，纸才不是贴上去的
    ctx.save();
    ctx.translate(3.4, 4.2);
    outline();
    ctx.fillStyle = 'rgba(8,6,14,.42)';
    ctx.fill();
    ctx.restore();
    outline();
    ctx.fillStyle = back ? '#e4dabf' : '#f6edd4';
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.clip();
    if (back) {
      // 背面：一个手画的勾
      if (checkT > 0) {
        const a = Math.min(1, checkT * 2.2);
        const b = clamp((checkT - .42) / .58, 0, 1);
        inkStroke([[-17, -2], [-5, 7]], 6.6, '#2b3350', a);
        if (b > 0) inkStroke([[-5, 7], [19, -30]], 6.6, '#2b3350', b);
      }
      ctx.fillStyle = 'rgba(120,104,74,.14)';
      ctx.fillRect(-W2, -6, W2 * 2, 2);
    } else {
      // 正面：几行写不成字的手写线，加一枚红印
      ctx.strokeStyle = 'rgba(58,48,38,.7)';
      ctx.lineWidth = 1.7;
      for (let r = 0; r < 6; r++) {
        const yy = -H2 + 14 + r * 8.4;
        const inset = Math.max(0, 10 - Math.abs(yy + H2 * .2) * .12);
        ctx.beginPath();
        ctx.moveTo(-W2 + 8 + inset, yy);
        let px = -W2 + 8 + inset;
        const stop = W2 - 10 - (r === 5 ? 20 : 0);
        while (px < stop) {
          px += 4.6 + (r % 2) * 2.4;
          ctx.lineTo(px, yy + (Math.sin(px * 1.7 + r) > 0 ? -1.4 : 1.1));
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(158,42,42,.85)';
      ctx.beginPath();
      ctx.roundRect(W2 - 24, -2, 12, 12, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(92,18,18,.9)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,224,214,.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(W2 - 21, 3); ctx.lineTo(W2 - 19, 6);
      ctx.moveTo(W2 - 19, 6); ctx.lineTo(W2 - 15, 1);
      ctx.stroke();
      // 翘起来的右上角：底下先压一块暗，再翻上来一块亮
      ctx.beginPath();
      ctx.moveTo(W2 + 2, -H2 * .34);
      ctx.lineTo(W2 - 17, -H2 * .2);
      ctx.lineTo(W2 - 2, -H2 * .08);
      ctx.closePath();
      ctx.fillStyle = 'rgba(74,60,40,.45)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(W2 + 2, -H2 * .34);
      ctx.lineTo(W2 - 15, -H2 * .21);
      ctx.lineTo(W2 - 2, -H2 * .11);
      ctx.closePath();
      ctx.fillStyle = '#ddd0ad';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,66,44,.7)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      // 折痕
      ctx.strokeStyle = 'rgba(150,132,96,.4)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-W2 * .1, -H2);
      ctx.lineTo(-W2 * .1 + 4, 9);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawChaos(d, t) {
    const L = anchor(d.letter);
    const f = d.finale;
    if (f == null) {
      if (d.spent) {
        drawLetter(L.x, L.y, 1, 1);
        return;
      }
      // 开场：砖头压着，纸角翘着
      drawLetter(L.x, L.y, 0, 0);
      drawBrick(L.x + 2, L.y - 2, -.13, 0, 0, 1);
      return;
    }
    // 收尾：砖头先滑开，纸翻过来，勾一笔一笔画上
    if (f < .30) {
      const k = clamp(f / .30, 0, 1);
      const e = smooth(k);
      drawLetter(L.x, L.y, 0, 0);
      drawBrick(L.x + 2, L.y - 2, -.13 + e * .62, e * 13, e * 11, 1 - e * .25);
      return;
    }
    const flip = clamp((f - .30) / .32, 0, 1);
    const check = clamp((f - .66) / .62, 0, 1);
    drawLetter(L.x, L.y, flip, check);
  }

  function startFinale() {
    const d = scene?.data;
    if (!d || state.map !== 'chaos' || d.spent) return false;
    d.finale = 0;
    if (ui.resultOverlay) ui.resultOverlay.hidden = true;
    return true;
  }

  /* =========================================================
   *  绘制与步进
   * ========================================================= */

  function step(dt) {
    const d = scene?.data;
    if (!d) return;

    if (state.map === 'yard') {
      d.swing.v += (-42 * d.swing.angle - 5.4 * d.swing.v) * dt;
      d.swing.angle = clamp(d.swing.angle + d.swing.v * dt, -.5, .5);
    }

    if (state.map === 'land') {
      d.pan.v += (-30 * d.pan.angle - 3.8 * d.pan.v) * dt;
      d.pan.angle = clamp(d.pan.angle + d.pan.v * dt, -.75, .75);
      d.rattle = Math.max(0, d.rattle - dt);
      if (d.magnetHold > 0) d.magnetHold = Math.max(0, d.magnetHold - dt);
      const want = d.magnetHold > 0 ? 1 : 0;
      d.magnet += (want - d.magnet) * Math.min(1, dt * (want ? 7 : 3.2));
      watchClownJolt();
    }

    if (state.map === 'canyon') {
      d.trayA.rock *= Math.pow(.06, dt);
      d.trayB.rock *= Math.pow(.06, dt);
      if (state.berryFeeding) startBerryGift();
      if (d.giver === undefined) d.giver = 0;
    }

    if (state.map === 'pool') {
      if (d.hold > 0) d.hold = Math.max(0, d.hold - dt);
      const want = d.hold > 0 ? 1 : (d.target > 0 ? Math.max(0, d.target - .12) : 0);
      d.open += (want - d.open) * Math.min(1, dt * 6.5);
      if (d.hold <= 0 && d.open < .02) d.target = 0;
    }

    if (state.map === 'dance') {
      if (d.cheer > 0) {
        d.cheer = Math.max(0, d.cheer - dt);
        d.beat += dt * 2.2;
      }
    }

    if (state.map === 'chaos' && d.finale != null) {
      d.finale += dt;
      if (d.finale > 2.05) {
        d.finale = null;
        d.spent = true;
        if (ui.resultOverlay) ui.resultOverlay.hidden = false;
      }
    }

    // 脚下被打穿的物件往下掉
    for (const key of Object.keys(scene.data)) {
      const item = scene.data[key];
      if (item && typeof item === 'object' && typeof item.x === 'number' && !Array.isArray(item) && item.baseY != null) {
        track(item);
        fallStep(item, dt);
      }
    }
    for (const list of [scene.data.peas, scene.data.loose]) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        track(item);
        fallStep(item, dt);
      }
    }
  }

  function paint(dt) {
    const d = scene?.data;
    if (!d) return;
    const t = scene.t;
    if (state.map === 'yard') drawYard(d, dt, t);
    else if (state.map === 'land') drawLand(d, dt);
    else if (state.map === 'canyon') drawCanyon(d, dt, t);
    else if (state.map === 'pool') drawPool(d, dt, t);
    else if (state.map === 'dance') drawDance(d, dt, t);
    else if (state.map === 'chaos') drawChaos(d, t);
  }

  function pump() {
    try {
      sync();
      const now = stamp();
      const dt = clamp(now - scene.last, 0, .06);
      scene.last = now;
      scene.t += dt;
      step(dt);
      ctx.save();
      paint(dt);
      ctx.restore();
    } catch (e) {
      // 装饰层出错不能影响战斗
      PZ.lastError = e && (e.stack || e.message);
    }
  }

  /* ---------- 接线 ---------- */

  const baseDrawLava = window.drawLava;
  window.drawLava = function () {
    pump();
    return baseDrawLava.apply(this, arguments);
  };

  const baseExplode = window.explode;
  if (typeof baseExplode === 'function') {
    window.explode = function (x, y, projectile) {
      if (state.map === 'land') {
        sync();
        shatterMarket(x, y, weapons[projectile.weapon].radius * projectile.radiusScale);
      }
      const out = baseExplode.apply(this, arguments);
      try {
        const power = projectile ? (weapons[projectile.weapon]?.radius || 60) / 82 : .6;
        if (state.map === 'yard') reactYard(x, y, power);
        if (state.map === 'land') reactLand(x, y, power);
      } catch (e) {}
      return out;
    };
  }

  const baseWinner = window.checkWinner;
  if (typeof baseWinner === 'function') {
    window.checkWinner = function () {
      const wasOver = state.gameOver;
      const out = baseWinner.apply(this, arguments);
      try {
        if (!wasOver && state.gameOver) {
          const won = aliveRivals().length === 0 && state.player.health > 0;
          if (won && state.map === 'pool') unfurlRibbons();
          if (won && state.map === 'chaos' && state.mode === 'chaos') startFinale();
        }
      } catch (e) {}
      return out;
    };
  }

  const baseSummon = window.playDanceSummonSong;
  if (typeof baseSummon === 'function') {
    window.playDanceSummonSong = function () {
      const out = baseSummon.apply(this, arguments);
      try { cheerCrowd(); } catch (e) {}
      return out;
    };
  }

  const baseLine = window.showLittleDaveLine;
  if (typeof baseLine === 'function') {
    window.showLittleDaveLine = function () {
      const out = baseLine.apply(this, arguments);
      try {
        if (state.map === 'pool') {
          const who = ui.littleDaveChat?.getAttribute('data-speaker') || '';
          if (who.indexOf('华强') >= 0 && who.indexOf('瓜老板') >= 0) unfurlRibbons();
        }
      } catch (e) {}
      return out;
    };
  }

  const baseFocus = window.cameraFocus;
  if (typeof baseFocus === 'function') {
    window.cameraFocus = function () {
      const d = scene?.data;
      if (d && d.finale != null && d.letter && Number.isFinite(d.letter.baseY)) return { x: d.letter.x, y: d.letter.baseY - 34 };
      return baseFocus.apply(this, arguments);
    };
  }

  const baseReset = window.resetGame;
  if (typeof baseReset === 'function') {
    window.resetGame = function () {
      const out = baseReset.apply(this, arguments);
      try { buildScene(); } catch (e) {}
      return out;
    };
  }

  buildScene();
})();
