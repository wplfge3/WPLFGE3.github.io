// The brass ruler is one standard battle screen in world space. The dashed
// outline is the actual camera viewport; zooming must not change a measured shot.
const battleChart = (() => {
  const el = id => document.getElementById(id);
  const panel = el('lobRuler'), surface = el('chartCanvas');
  const ink = surface?.getContext('2d');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const put = (id, text) => { const n = el(id); if (n.textContent !== text) n.textContent = text; };
  let drag = null, folded = false, large = false, lastPaint = -Infinity, scenery = null;
  function surveyArea() {
    const w = worldWidth(), h = worldHeight(), px = w > W ? W * .23 : W * .38, py = H * .34;
    // Leave enough map margin to put zero on a fighter even near a boundary.
    const hero=state.player, enemy=hero&&measuredRival();
    const left=Math.min(-px,enemy&&enemy.x<hero.x?hero.x-W:0);
    const right=Math.max(w+px,enemy&&enemy.x>=hero.x?hero.x+W:w);
    return { left, top:-py, width:right-left, height:h + 2 * py };
  }
  function bounds() {
    // Preserve the battlefield's 2:1 screen shape even in the four-screen canyon.
    const b=surveyArea(), aspect=surface?.clientHeight ? surface.clientWidth/surface.clientHeight : 2.22;
    const width=Math.max(b.width,b.height*aspect), height=width/aspect;
    return {left:b.left-(width-b.width)/2,top:b.top-(height-b.height)/2,width,height};
  }
  function limit(x, y) {
    const b = surveyArea();
    return { x:clamp(x, b.left + W/2, b.left + b.width - W/2), y:clamp(y, b.top + H/2, b.top + b.height - H/2) };
  }
  function frame() { return state.chartFrame || limit(state.cameraX + W/2, state.cameraY + H/2); }
  function scale() { return W / LOB_CELLS; }
  function canSurvey() { return state.running && !state.gameOver && ui.littleDaveChat?.hidden !== false && !state.charging; }
  function ruler(f = frame()) {
    const target = measuredRival(), sign = target && target.x < state.player.x ? -1 : 1;
    const origin = f.x - sign * W/2, unit = scale();
    return { origin, sign, unit, count:W/unit, mark:x => sign * (x - origin)/unit };
  }
  function reset() { release(); state.chartFrame = null; scenery = null; lastPaint = -Infinity; }
  function free() { release(); state.chartFrame = null; lastPaint = -Infinity; }
  function release() {
    const id = drag?.id; drag = null;
    if (id !== undefined && surface?.hasPointerCapture(id)) surface.releasePointerCapture(id);
    surface?.classList.remove('dragging');
  }
  function pan(x, y) {
    if (!canSurvey()) return;
    state.scouting = false; state.chartFrame = limit(x,y);
    const p = cameraPosition(state.chartFrame.x,state.chartFrame.y);
    state.cameraX = p.x; state.cameraY = p.y; lastPaint = -Infinity;
  }
  function scene(g, b, w, h) {
    const ww = worldWidth(), wh = worldHeight(), art = images[state.map];
    const material = state.map === 'canyon' ? images.mipingStage : state.map === 'chaos' ? images.gothicPalace : null;
    const painted = terrainPainting?.base === state.originalTerrain ? terrainPainting : null;
    const key = [state.matchId,state.map,w,h,b.left,b.top,b.width,b.height,state.craters.length,state.tunnelBlocks.length,state.platformRevision,state.cloudPlatforms.length,!!art?.naturalWidth,!!material?.naturalWidth,!!(state.map === 'pool' && images.roseHeart.naturalWidth),!!(state.map === 'pool' && images.roseBase.naturalWidth),!!painted].join(':');
    if (scenery?.key === key) { g.drawImage(scenery.image,0,0,w,h); return; }
    const image = document.createElement('canvas'); image.width = Math.round(w*2); image.height = Math.round(h*2);
    const c = image.getContext('2d');
    c.scale(image.width/b.width,image.height/b.height); c.translate(-b.left,-b.top);
    c.fillStyle = MAP_THEMES[state.map]?.sky[0] || '#9aaab1'; c.fillRect(b.left,b.top,b.width,b.height);
    if (art?.naturalWidth) {
      if (state.map === 'canyon') c.drawImage(art,0,0,ww,wh);
      else c.drawImage(art,b.left,b.top,b.width,b.height);
    }
    c.fillStyle = '#102a3433'; c.fillRect(b.left,b.top,b.width,b.height);
    c.save(); c.beginPath();
    const step = Math.max(1,Math.floor(b.width/(w*2)));
    // Continue the distant soil beyond the playable border; a hard black block
    // below a small arena makes the instrument look like a pasted screenshot.
    const bottom=b.top+b.height, right=b.left+b.width, base=state.terrain;
    c.moveTo(b.left,bottom);c.lineTo(b.left,base[0]+42);c.quadraticCurveTo(b.left*.42,base[0]+8,0,base[0]);
    for(let x=0;x<ww;x+=step)c.lineTo(x,base[x]);
    c.lineTo(ww,base[ww-1]);c.quadraticCurveTo(ww+(right-ww)*.46,base[ww-1]+10,right,base[ww-1]+40);
    c.lineTo(right,bottom);c.closePath();c.clip();
    for(const cut of state.craters) {
      if(!cut.undercut) continue;
      c.beginPath();c.rect(b.left,b.top,b.width,b.height);traceCrater(c,cut);c.clip('evenodd');
    }
    const soil=c.createLinearGradient(0,wh*.58,0,Math.max(wh,bottom)), colors=MAP_THEMES[state.map]?.soil || ['#c6a563','#5a433c'];
    soil.addColorStop(0,colors[0]);soil.addColorStop(1,colors[colors.length-1]);c.fillStyle=soil;c.fillRect(b.left,b.top,b.width,b.height);
    if(state.map === 'canyon' && material?.naturalWidth) {
      c.drawImage(material,0,0,ww,wh);
    } else if(painted) {
      c.drawImage(painted.surface,0,painted.top);
      c.save();c.scale(-1,1);c.drawImage(painted.surface,0,painted.top);c.restore();
      c.save();c.translate(2*ww,0);c.scale(-1,1);c.drawImage(painted.surface,0,painted.top);c.restore();
    } else if(material?.naturalWidth) {
      const top=Math.min(...state.originalTerrain);for(let x=Math.floor(b.left/W)*W;x<right;x+=W)c.drawImage(material,x,top,W,Math.max(W*.32,bottom-top));
    }
    const shade=c.createLinearGradient(0,wh*.78,0,Math.max(wh+2,bottom));
    shade.addColorStop(0,'#352d3000');shade.addColorStop(Math.min(.98,(wh-wh*.78)/(Math.max(wh+2,bottom)-wh*.78)),'#44393aef');shade.addColorStop(1,'#202e38');
    c.fillStyle=shade;c.fillRect(b.left,wh*.78,b.width,bottom-wh*.78);
    c.restore();
    for(const p of state.cloudPlatforms) c.drawImage(platformSkin(p),p.left-.5,p.y);
    for(const t of state.tunnelBlocks) if(t.health>0){const x=t.x-t.width/2,y=t.y-t.height/2;c.fillStyle='#5b4840';c.fillRect(x,y,t.width,t.height);c.fillStyle='#ae9276';c.fillRect(x,y,t.width,6);}
    const veil=c.createLinearGradient(b.left,0,right,0);veil.addColorStop(0,'#10243155');veil.addColorStop(-b.left/b.width,'#10243100');veil.addColorStop((ww-b.left)/b.width,'#10243100');veil.addColorStop(1,'#10243155');c.fillStyle=veil;c.fillRect(b.left,b.top,b.width,b.height);
    scenery={key,image};g.drawImage(image,0,0,w,h);
  }
  function draw(force=false) {
    if (!ink || panel.hidden || folded) return;
    const now=performance.now(); if(!force && now-lastPaint<60)return; lastPaint=now;
    const w=surface.clientWidth,h=surface.clientHeight;if(!w||!h)return;
    const d=Math.min(3,Math.max(1,window.devicePixelRatio||1)), pw=Math.round(w*d),ph=Math.round(h*d);
    if(surface.width!==pw||surface.height!==ph){surface.width=pw;surface.height=ph;}
    ink.setTransform(pw/w,0,0,ph/h,0,0);
    const b=bounds(), sx=x=>(x-b.left)*w/b.width,sy=y=>(y-b.top)*h/b.height;
    scene(ink,b,w,h);
    const f=frame(),r=ruler(f), l=sx(f.x-W/2), top=sy(f.y-H/2),fw=W*w/b.width,fh=H*h/b.height;
    // Darken the surroundings rather than bleaching the landscape inside the frame.
    ink.fillStyle='rgba(9,20,34,.26)';ink.beginPath();ink.rect(0,0,w,h);ink.rect(l,top,fw,fh);ink.fill('evenodd');
    const vx=state.cameraX+W/2,vy=state.cameraY+H/2;
    if(Math.abs(state.zoom-1)>.005 || Math.abs(vx-f.x)>6 || Math.abs(vy-f.y)>6) {
      ink.save();ink.strokeStyle='#dfefefbc';ink.setLineDash([3,3]);ink.lineWidth=1;
      ink.strokeRect(sx(vx-viewportWidth()/2),sy(vy-viewportHeight()/2),viewportWidth()*w/b.width,viewportHeight()*h/b.height);ink.restore();
    }
    const spacing=r.unit*w/b.width, stride=spacing>14?1:spacing>8?2:spacing>4?5:10;
    ink.save(); ink.beginPath(); ink.rect(l,top,fw,fh);ink.clip();
    ink.fillStyle='#12212c99';ink.fillRect(l,top,fw,10);
    ink.font='bold 8px Arial,sans-serif';ink.textAlign='center';ink.lineWidth=.8;
    for(let i=0;i<=Math.floor(r.count+1e-7);i++){
      const x=sx(r.origin+r.sign*i*r.unit), major=i%stride===0;
      ink.strokeStyle=major?'#ffde945f':'#f8ecc32e';ink.beginPath();ink.moveTo(x,top+10);ink.lineTo(x,top+fh);ink.stroke();
      ink.fillStyle='#f8dfaa';ink.fillRect(x-.5,top+fh-(major?5:2.5),1,major?5:2.5);
      if(major || Math.abs(i-r.count)<.01) {const labelX=clamp(x,l+4,l+fw-4);if(i===0||Math.abs(i-r.count)<.01||Math.min(x-l,l+fw-x)>10)ink.fillText(i,labelX,top+8);}
    } ink.restore();
    ink.strokeStyle='#392e24';ink.lineWidth=2.8;ink.strokeRect(l,top,fw,fh);ink.strokeStyle='#f4ce8b';ink.lineWidth=1.15;ink.strokeRect(l,top,fw,fh);
    ink.strokeStyle='#fff0c0';ink.lineWidth=2.1;
    for(const [x,y,dx,dy] of [[l,top,1,1],[l+fw,top,-1,1],[l,top+fh,1,-1],[l+fw,top+fh,-1,-1]]){
      ink.beginPath();ink.moveTo(x+dx*5,y);ink.lineTo(x,y);ink.lineTo(x,y+dy*5);ink.stroke();
    }
    const impact = state.lastPlayerImpact;
    if (impact) {
      ink.beginPath();
      ink.arc(sx(impact.x), sy(impact.y), 6, 0, Math.PI * 2);
      ink.strokeStyle = '#253420cc';
      ink.lineWidth = 3;
      ink.stroke();
      ink.strokeStyle = '#c6f28ccc';
      ink.lineWidth = 1.5;
      ink.stroke();
    }
    const target=measuredRival();
    for(const p of allFighters()) if(p.health>0 && !(p.side === 'rival' && mipingRivalsOffstage())){
      const x=sx(p.x),y=sy(p.y-48),ally=p===state.player;
      ink.save();ink.translate(x,y);if(ally)ink.rotate(Math.PI/4);
      ink.fillStyle=ally?'#87ed94':'#f27170';ink.strokeStyle='#172932';ink.lineWidth=2;
      ink.beginPath();if(ally)ink.rect(-3,-3,6,6);else ink.arc(0,0,3.3,0,Math.PI*2);ink.fill();ink.stroke();
      if(p===target){ink.strokeStyle='#ffe2b2';ink.lineWidth=.9;ink.beginPath();ink.arc(0,0,4.8,0,Math.PI*2);ink.stroke();}ink.restore();
    }
    if(state.projectile){const p=state.projectile;ink.fillStyle='#fff8ba';ink.beginPath();ink.arc(sx(p.x),sy(p.y),2,0,Math.PI*2);ink.fill();}
    const fmt=n=>String(Number(n.toFixed(1)));
    put('chartCount',fmt(r.count)+' 格');put('chartAlly',fmt(r.mark(state.player.x)));put('chartEnemy',target?fmt(r.mark(target.x)):'—');
  }
  function sync() {
    if(!panel)return;
    panel.hidden=!state.running||state.gameOver||ui.littleDaveChat?.hidden===false;
    const active=canPlayerAct()&&!state.charging;
    const survey=canSurvey();
    if(!survey)free();
    if(panel.hidden)return;
    panel.classList.toggle('is-panoramic',worldWidth()>W*2);
    put('chartName',ui.mapSelect.selectedOptions?.[0]?.textContent||'战场地图');
    for(const id of ['chartZero','chartHome'])el(id).disabled=!survey;
    for(const id of ['lobNext','lobMinus','lobPlus'])el(id).disabled=!active;
    el('lobNext').hidden=aliveRivals().length<2;
    const target=measuredRival(), relativeWind=target&&target.x<state.player.x?-state.wind:state.wind;
    const fix=lobWindAdjustment(relativeWind), signed=n=>(n>0?'+':'')+Number(n.toFixed(1));
    const note=relativeWind===0?'每框12格 · 无风':(relativeWind>0?'顺风 ':'逆风 ')+Math.abs(relativeWind).toFixed(1)+' · 高抛参考 '+signed(fix.angle)+'° / '+signed(fix.power)+'力';
    el('chartHelp').title='统一弹道：角度、力度、风共同决定落点。95力高抛参考90−距数；约2.5风修正1°，余风0.5修正1力。近距离、高低差和远距离需试射微调。';
    put('chartHelp',note);lastPaint=-Infinity;draw(true);
  }
  function point(e) {const rect=surface.getBoundingClientRect(),b=bounds();return {x:b.left+(e.clientX-rect.left)*b.width/rect.width,y:b.top+(e.clientY-rect.top)*b.height/rect.height};}
  surface?.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0||!canSurvey())return;
    const p=point(e),f=frame(),inside=Math.abs(p.x-f.x)<=W/2&&Math.abs(p.y-f.y)<=H/2;
    e.preventDefault();surface.focus({preventScroll:true});surface.setPointerCapture(e.pointerId);surface.classList.add('dragging');
    drag={id:e.pointerId,dx:inside?f.x-p.x:0,dy:inside?f.y-p.y:0};pan(p.x+drag.dx,p.y+drag.dy);draw(true);
  });
  surface?.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=point(e);pan(p.x+drag.dx,p.y+drag.dy);draw(true);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])surface?.addEventListener(type,e=>{if(drag?.id===e.pointerId)release();});
  surface?.addEventListener('keydown',e=>{
    if(!canSurvey())return;const f=frame(),step=scale()*(e.shiftKey ? .1 : 1);
    const delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
    if(!delta&&e.key!=='Home')return;e.preventDefault();e.stopPropagation();if(delta)pan(f.x+delta[0],f.y+delta[1]);else free();draw(true);
  });
  el('chartFold')?.addEventListener('click',()=>{folded=!folded;free();el('chartBody').hidden=folded;el('chartFold').setAttribute('aria-expanded',String(!folded));el('chartFold').setAttribute('aria-label',folded?'展开小地图':'收起小地图');put('chartFold',folded?'▾':'▴');draw(true);});
  el('chartGrow')?.addEventListener('click',()=>{if(folded)el('chartFold').click();large=!large;panel.classList.toggle('is-large',large);el('chartGrow').setAttribute('aria-pressed',String(large));el('chartGrow').setAttribute('aria-label',large?'还原小地图':'放大小地图');draw(true);});
  el('chartZero')?.addEventListener('click',()=>{pan(state.player.x+ruler().sign*W/2,state.player.y-48);draw(true);canvas.focus();});
  el('chartHome')?.addEventListener('click',()=>{free();state.scouting=false;updateCamera();draw(true);canvas.focus();});
  return { reset,free,sync,draw,frame,bounds,ruler,pan };
})();
