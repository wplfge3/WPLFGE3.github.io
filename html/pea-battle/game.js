const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
function fitBattleResolution() {
  const bounds = canvas.getBoundingClientRect?.();
  if (!bounds?.width || !bounds.height) return;
  const density = window.devicePixelRatio || 1;
  const scale = Math.min(3, Math.max(1, bounds.width * density / W, bounds.height * density / H));
  const width = Math.round(W * scale);
  const height = Math.round(H * scale);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitBattleResolution).observe(canvas);
window.addEventListener('resize', fitBattleResolution);
fitBattleResolution();
const PIT_DEATH_Y = H - 28;
const CANYON_WORLD_WIDTH = W * 4;
const WAR_WORLD_WIDTH = W * 2;
const WAR_WORLD_HEIGHT = H * 2;
const ROSE_WORLD_WIDTH = W * 2;
const ROSE_WORLD_HEIGHT = H * 2.5;
const TUNNEL_STRUCTURE_LIFT = 70;
// At 60 Hz, a 78° / 95-power shot returns to its launch height after three seconds.
const PROJECTILE_TIME_SCALE = 217.26 / (60 * 3);
const SIMULATION_STEP_MS = 1000 / 60;
const CHARGE_RISE_MS = 5000;
const CHARGE_PEAK_MS = 400;
const CHARGE_FALL_MS = 3000;
// Outlines in pixels of the approved 1774 × 887 painting. A single uniform
// scale registers the scenery, solid masks, character footing and chart.
const MIPING_SCALE = CANYON_WORLD_WIDTH / 1774;
const MIPING_GROUND = [[0,694],[48,702],[102,720],[162,733],[228,724],[306,740],[376,737],[445,744],[490,735],[538,708],[593,677],[652,638],[703,606],[750,580],[793,551],[837,532],[868,526],[882,530],[898,526],[925,529],[955,540],[990,563],[1032,591],[1080,620],[1140,654],[1201,687],[1262,714],[1320,737],[1390,749],[1460,748],[1510,740],[1570,721],[1610,710],[1700,711],[1774,702]];
const MIPING_OBJECTS = [
  { id: 'shiitake-west', outline: [[0,443],[14,408],[38,378],[70,354],[105,334],[151,315],[187,308],[220,306],[263,313],[302,327],[344,351],[379,380],[409,413],[435,448],[445,472],[444,486],[430,504],[397,522],[354,536],[298,548],[250,552],[243,582],[238,626],[244,676],[254,727],[46,727],[71,661],[83,611],[92,549],[57,545],[22,535],[0,521]] },
  { id: 'shiitake-middle', outline: [[333,581],[339,552],[351,521],[375,494],[407,473],[445,458],[479,451],[519,452],[551,461],[590,476],[627,495],[662,523],[685,549],[704,579],[707,597],[699,611],[670,625],[630,632],[574,636],[574,663],[583,694],[603,721],[415,752],[435,711],[450,670],[453,635],[412,632],[372,625],[345,615],[335,603]] },
  { id: 'shiitake-east', outline: [[1186,576],[1194,544],[1212,515],[1235,492],[1275,469],[1320,452],[1360,446],[1400,448],[1438,457],[1477,475],[1513,498],[1547,528],[1574,565],[1588,590],[1585,602],[1565,615],[1526,627],[1466,636],[1469,665],[1481,700],[1498,741],[1295,747],[1315,701],[1325,663],[1329,636],[1281,635],[1237,629],[1202,617],[1188,606]] },
  { id: 'miping-stele', permanent: true, outline: [[1588,685],[1605,685],[1606,530],[1610,508],[1622,487],[1638,475],[1657,469],[1676,468],[1697,474],[1716,489],[1727,510],[1730,534],[1730,685],[1748,685],[1748,723],[1588,723]] }
];
const MARKET_PROFILE = [[0,425],[176,398],[300,407],[420,452],[540,486],[660,486],[780,442],[900,410],[1035,396],[1199,425]];
const DANCE_SCALE = 1.6;
const DANCE_PROFILE = [
  [0,403],[38,403],[53,345],[223,345],[240,385],[266,385],[281,456],
  [335,456],[351,409],[376,409],[390,364],[415,364],[426,319],
  [774,319],[785,364],[810,364],[824,409],[849,409],[865,456],
  [919,456],[934,385],[960,385],[977,345],[1147,345],[1162,403],[1199,403]
];
const MAP_THEMES = {
  yard: { sky: ['#b1d9df', '#f6e7b5'], soil: ['#81a94c', '#557734', '#9b7448', '#513b2b'], edge: '#c3d878', pit: '#3e4937', material: 'roots', light: '#fff3b0' },
  pool: { sky: ['#a88abb', '#ffcdc3'], soil: ['#ae846d', '#975c63', '#704052', '#452c42'], edge: '#bc8c72', pit: '#442338', material: 'roots', light: '#ffc0ce' },
  tunnels: { sky: ['#163e3f', '#658678'], soil: ['#748b65', '#445e50', '#715947', '#292f2c'], edge: '#aab887', pit: '#152c2d', material: 'ore', light: '#9ff3c7' },
  dance: { sky: ['#27234e', '#86567f'], soil: ['#66577d', '#423a5e', '#3e3049', '#221e35'], edge: '#b88ce1', pit: '#251d3f', material: 'stage', light: '#c695ed' },
  war: { sky: ['#9c8472', '#e3bc83'], soil: ['#a78d60', '#716444', '#865846', '#382d2c'], edge: '#d6b27e', pit: '#412b29', material: 'brick', light: '#edbe82' },
  newspaper: { sky: ['#c4cbb4', '#f1debb'], soil: ['#b8b29a', '#7b8174', '#817063', '#48444a'], edge: '#e3d7b6', pit: '#393d43', material: 'paving', light: '#eadbb5' },
  chaos: { sky: ['#302d57', '#65728a'], soil: ['#5d566f', '#423c53', '#343044', '#1b1929'], pit: '#262438', material: 'palace', light: '#b2c5ef' }
};
const GROUND_DETAILS = {
  yard: { colors: ['#be9a63', '#685035', '#8e673e'], trim: '#87a64b', life: 'worm' },
  pool: { colors: ['#e8a1a0', '#9b535f', '#833b55'], trim: '#8f955c', life: 'worm' },
  canyon: { colors: ['#c89468', '#724435', '#9b5846'], trim: '#79954a', life: 'worm' },
  land: { colors: ['#d99c75', '#764837', '#ae7357'], trim: '#c28c64', life: 'mouse' },
  tunnels: { colors: ['#c3a26d', '#475346', '#8b7251'], trim: '#7c8562', life: 'mouse' },
  dance: { colors: ['#9f80ad', '#493754', '#755c8c'], trim: '#9377b1', life: 'cable' },
  war: { colors: ['#bd9164', '#554033', '#887053'], trim: '#9e875e', life: 'embers' },
  newspaper: { colors: ['#c1b79a', '#595a52', '#9c8a6e'], trim: '#a99d82', life: 'paper' },
  chaos: { colors: ['#aea1b5', '#322c40', '#6e617b'], trim: '#b49779', life: 'crystals' }
};
const groundLifePositions = {
  yard: [412], pool: [338], canyon: [1280, 3480], land: [460], tunnels: [540],
  dance: [655], war: [760], newspaper: [655], chaos: [1190]
};
const groundAnimals = {
  worm: { image: 'groundWorm', width: 47, speed: .42, range: 11 },
  mouse: { image: 'groundMouse', width: 44, speed: .64, range: 23 },
  snake: { image: 'groundSnake', width: 49, speed: .36, range: 13 }
};

function profileHeight(points, x) {
  const index = points.findIndex(point => point[0] >= x);
  if (index <= 0) return points[index === 0 ? 0 : points.length - 1][1];
  const [left, right] = [points[index - 1], points[index]];
  const t = (x - left[0]) / (right[0] - left[0]);
  return left[1] + (right[1] - left[1]) * t * t * (3 - 2 * t);
}

const ui = {
  playerHealth: document.getElementById('playerHealth'),
  playerHealthMax: document.getElementById('playerHealthMax'),
  rivalHealth: document.getElementById('rivalHealth'),
  rivalHealthMax: document.getElementById('rivalHealthMax'),
  playerHealthBar: document.getElementById('playerHealthBar'),
  rivalHealthBar: document.getElementById('rivalHealthBar'),
  playerFighterHud: document.querySelector('.fighter-player'),
  rivalFighterHud: document.querySelector('.fighter-rival'),
  turnCopy: document.getElementById('turnCopy'),
  mobileTurn: document.getElementById('mobileTurn'),
  mobileWindArrow: document.getElementById('mobileWindArrow'),
  mobileWindValue: document.getElementById('mobileWindValue'),
  timer: document.getElementById('timer'),
  turnCountdown: document.getElementById('turnCountdown'),
  turnCountdownValue: document.getElementById('turnCountdownValue'),
  turnCountdownHint: document.getElementById('turnCountdownHint'),
  windArrow: document.getElementById('windArrow'),
  windValue: document.getElementById('windValue'),
  angleRange: document.getElementById('angleRange'),
  angleValue: document.getElementById('angleValue'),
  powerRange: document.getElementById('powerRange'),
  powerRow: document.querySelector('.power-row'),
  staminaText: document.getElementById('staminaText'),
  enchantCost: document.getElementById('enchantCost'),
  moveEnergy: document.getElementById('moveEnergy'),
  fireButton: document.getElementById('fireButton'),
  fireButtonLabel: document.getElementById('fireButtonLabel'),
  fireButtonHint: document.getElementById('fireButtonHint'),
  soundButton: document.getElementById('soundButton'),
  zoomOut: document.getElementById('zoomOut'),
  zoomIn: document.getElementById('zoomIn'),
  rageFill: document.getElementById('rageFill'),
  rageValue: document.getElementById('rageValue'),
  ultimateButton: document.getElementById('ultimateButton'),
  moveLeft: document.getElementById('moveLeft'),
  moveRight: document.getElementById('moveRight'),
  flightButton: document.getElementById('flightButton'),
  healButton: document.getElementById('healButton'),
  fireAmmo: document.getElementById('fireAmmo'),
  iceAmmo: document.getElementById('iceAmmo'),
  potatoAmmo: document.getElementById('potatoAmmo'),
  weaponButtons: [...document.querySelectorAll('#weaponTabs .weapon-button')],
  enchantButtons: [...document.querySelectorAll('.enchant-button')],
  toast: document.getElementById('toast'),
  startOverlay: document.getElementById('startOverlay'),
  resultOverlay: document.getElementById('resultOverlay'),
  againButton: document.getElementById('againButton'),
  resultImage: document.getElementById('resultImage'),
  resultTitle: document.getElementById('resultTitle'),
  resultText: document.getElementById('resultText'),
  daveOverlay: document.getElementById('daveOverlay'),
  daveStartButton: document.getElementById('daveStartButton'),
  resultDave: document.getElementById('resultDave'),
  littleDaveGuide: document.getElementById('littleDaveGuide'),
  littleDaveCharacter: document.getElementById('littleDaveCharacter'),
  littleDaveSprite: document.getElementById('littleDaveSprite'),
  littleDaveChat: document.getElementById('littleDaveChat'),
  littleDaveLine: document.getElementById('littleDaveLine'),
  littleDaveNext: document.getElementById('littleDaveNext'),
  littleDaveSkip: document.getElementById('littleDaveSkip'),
  cattailRescueOverlay: document.getElementById('cattailRescueOverlay'),
  acceptCattailButton: document.getElementById('acceptCattailButton'),
  declineCattailButton: document.getElementById('declineCattailButton'),
  normalWeaponRow: document.getElementById('normalWeaponRow'),
  cattailWeaponRow: document.getElementById('cattailWeaponRow'),
  cattailWeaponButtons: [...document.querySelectorAll('.cattail-weapon-button')],
  pumpkinButton: document.getElementById('pumpkinButton'),
  pumpkinShieldValue: document.getElementById('pumpkinShieldValue'),
  mapSelect: document.getElementById('mapSelect'),
  modeSelect: document.getElementById('modeSelect'),
  timeScaleSelect: document.getElementById('timeScaleSelect')
};

const assetPaths = {
  groundWorm: 'assets/ground/worm.png',
  groundMouse: 'assets/ground/mouse.png',
  groundSnake: 'assets/ground/snake.png',
  yard: 'assets/maps/yard-v2.png.webp',
  earthGarden: 'assets/maps/earth-garden.webp',
  earthCity: 'assets/maps/earth-city.webp',
  pool: 'assets/maps/rose-garden.webp',
  roseHeart: 'assets/maps/rose-heart.webp',
  roseBase: 'assets/maps/rose-base.webp',
  canyon: 'assets/maps/miping-hills.webp',
  mipingStage: 'assets/maps/miping-stage.webp',
  land: 'assets/maps/melon-market-v2.png.webp',
  tunnels: 'assets/maps/tunnels-v2.png.webp',
  mineBeam: 'assets/maps/mine-beam.png.webp',
  mineSlab: 'assets/maps/mine-slab.png.webp',
  dance: 'assets/maps/dance-v2.png.webp',
  war: 'assets/maps/war-v2.png.webp',
  newspaper: 'assets/maps/newspaper-v2.png.webp',
  chaos: 'assets/maps/chaos-v2.png.webp',
  gothicPalace: 'assets/maps/gothic-palace-wall.png.webp',
  hero: 'assets/hero.gif',
  peaFirePoses: 'assets/pea-fire-poses.png',
  berryHero: 'assets/berry-hero.svg',
  dogwood: 'assets/dogwood.svg',
  henanMi: 'assets/concepts/henan-mi-sprite.webp',
  littleDave: 'assets/concepts/little-dave-v1.png.webp',
  rival: 'assets/meme/liu-huaqiang-knife.png.webp',
  liuThrow: 'assets/meme/liu-knife-sheet.png.webp',
  fruitKnife: 'assets/meme/fruit-knife.png.webp',
  normalZombie: 'assets/zombie-walk.gif',
  clownZombie: 'assets/meme/melon-vendor.png.webp',
  clownZombieArmed: 'assets/meme/melon-vendor.png.webp',
  dancingZombie: 'assets/meme/cai-xukun-dance.gif',
  dancingSummon: 'assets/meme/cai-xukun-dance.gif',
  leadDanceSheet: 'assets/meme/cai-xukun-dance-sheet.png.webp',
  backupDancer: 'assets/meme/cai-chick-dance.gif',
  backupDanceSheet: 'assets/meme/cai-chick-dance-sheet.png.webp',
  backupThrow: 'assets/meme/cai-chick-throw.png',
  danceSpotlight: 'assets/dance-spotlight.png',
  newspaperReading: 'assets/newspaper-reading.gif',
  newspaperLost: 'assets/newspaper-lost.gif',
  newspaperHeadWalk: 'assets/newspaper-head-walk.gif',
  zomboni: 'assets/zomboni.gif',
  zombieNote: 'assets/zombie-note.png',
  explodingNut: 'assets/exploding-nut.gif',
  newspaperCart: 'assets/newspaper-cart.png',
  cattail: 'assets/cattail.gif',
  cattailPoison: 'assets/cattail-poison.gif',
  cattailStar: 'assets/cattail-star.gif',
  cattailFrost: 'assets/cattail-frost.gif',
  cattailPumpkin: 'assets/cattail-pumpkin.gif',
  zombieHead: 'assets/zombie-head.gif',
  zombieBody: 'assets/zombie-body.gif',
  zombieDeath: 'assets/zombie-death.gif',
  pea: 'assets/pea.gif',
  fire: 'assets/fire-pea.gif',
  ice: 'assets/ice-pea.gif',
  potato: 'assets/potato-mine.gif',
  doom: 'assets/doom-shroom.gif',
  explosion: 'assets/explosion.gif',
  tombstones: 'assets/tombstones.png',
  giantNut: 'assets/giant-nut.gif',
  pumpkinShell: 'assets/pumpkin-shell.gif',
  yardCart: 'assets/yard-cart.png'
};

const deferredMaps = new Set(['land','pool','canyon','dance','chaos','war','newspaper','tunnels']);
const images = {};
for (const [key, src] of Object.entries(assetPaths)) {
  images[key] = new Image();
  if (!deferredMaps.has(key)) images[key].src = src;
}

function prepareMapImage(map) {
  const image = images[map];
  if (image && !image.src) image.src = assetPaths[map];
  return image;
}

const weapons = {
  fruitKnife: { label: '水果飞刀', image: 'fruitKnife', damage: 28, radius: 62, crater: 40, tint: '#dce8ed', drawWidth: 48, drawHeight: 16, launchSfx: 'bladeSwish', sfx: 'bladeTick' },
  normal: { label: '普通豌豆', image: 'pea', damage: 28, radius: 62, crater: 40, tint: '#b6e65d', launchSfx: 'peaBu', sfx: 'peaBoom' },
  fire: { label: '火焰豆', image: 'fire', damage: 40, radius: 82, crater: 58, tint: '#ff813d', launchSfx: 'fireShot', sfx: 'fireImpact' },
  ice: { label: '寒冰豆', image: 'ice', damage: 22, radius: 66, crater: 43, tint: '#6ed8ff', freeze: true, attackFreezeTurns: 1, launchSfx: 'iceShot', sfx: 'iceImpact' },
  potato: { label: '土豆地雷', image: 'potato', damage: 18, radius: 112, crater: 96, tint: '#d99b4a', bigBlast: true, drawWidth: 50, drawHeight: 42, launchSfx: 'potatoShot', sfx: 'potatoImpact' }
};

weapons.basketball = { label: '篮球', damage: 24, radius: 58, crater: 30, tint: '#ed923c', knockback: 150, launchOffset: [42, 49], launchSfx: 'ballPass', sfx: 'ballBounce' };
weapons.note = { label: '报纸字条', image: 'zombieNote', damage: 10, radius: 50, crater: 26, tint: '#eee8cf', drawWidth: 44, drawHeight: 30, launchSfx: 'paperShot', sfx: 'paperImpact' };
weapons.explodingNut = { label: '爆炸坚果', image: 'explodingNut', damage: 23, radius: 108, crater: 88, tint: '#f39a42', bigBlast: true, drawWidth: 58, drawHeight: 58, launchSfx: 'potatoShot', sfx: 'heavyImpact' };
weapons.zomboniDrop = { label: '冰车空投', image: 'zomboni', damage: 22, radius: 158, crater: 132, tint: '#9bd9ed', bigBlast: true, freeze: true, sfx: 'zomboniImpact' };
weapons.cartSmash = { label: '小推车撞击', image: 'newspaperCart', damage: 27, radius: 112, crater: 58, tint: '#d94d36', knockback: 115, noSelfDamage: true, sfx: 'cartImpact' };
weapons.cattailPoison = { label: '追踪毒液', image: 'cattailPoison', damage: 10, radius: 54, crater: 24, tint: '#86d64f', homing: true, phasing: true, poisonTurns: 3, drawWidth: 42, drawHeight: 34, launchSfx: 'poisonShot', sfx: 'poisonImpact' };
weapons.cattailStar = { label: '追踪星星', image: 'cattailStar', damage: 112, radius: 78, crater: 52, tint: '#ffe261', homing: true, phasing: true, drawWidth: 46, drawHeight: 46, launchSfx: 'starShot', sfx: 'starImpact' };
weapons.cattailFrost = { label: '寒冰菇追踪弹', image: 'cattailFrost', damage: 12, radius: 72, crater: 38, tint: '#84dfff', homing: true, phasing: true, attackFreezeTurns: 2, drawWidth: 54, drawHeight: 54, launchSfx: 'frostShot', sfx: 'iceImpact' };

weapons.ultimate = { label: '末日爆发', image: 'doom', damage: 56, radius: 190, crater: 158, tint: '#f6ffb5', bigBlast: true, nuclear: true, drawWidth: 104, drawHeight: 94 };
weapons.clownBlast = { label: '小丑爆破', image: 'clownZombieArmed', damage: 999, radius: 190, crater: 112, tint: '#ffbf4b', bigBlast: true, sfx: 'clownBlast' };

weapons.dogwood = { label: '山茱萸', image: 'dogwood', damage: weapons.fire.damage * 2, radius: 82, crater: 58, tint: '#df2140', homing: true, homingRange: 210, drawWidth: 36, drawHeight: 26, launchSfx: 'shot', sfx: 'berryPop' };
const impactSheets = {};
for (const weapon of Object.keys(weapons)) {
  if (weapon === 'dogwood') continue; // The berry burst is rendered on canvas.
  const sheet = new Image();
  sheet.src = weapon === 'ultimate' ? 'assets/impacts/doom-cloud.png' : `assets/impacts/${weapon}.png`;
  impactSheets[weapon] = sheet;
}

const enchantments = {
  none: { label: '无附魔', cost: 0 },
  power: { label: '强击', cost: 40, damageMultiplier: 2, radiusMultiplier: 1.12 },
  double: { label: '两联发', cost: 50, copies: 2, damageMultiplier: .7, radiusMultiplier: .9 },
  spread: { label: '三联散射', cost: 50, offsets: [-7, 0, 7], damageMultiplier: .5, radiusMultiplier: .82, simultaneous: true }
};

const state = {
  difficulty: 'normal',
  running: false,
  gameOver: false,
  active: 'player',
  timer: 20,
  timeScale: 1,
  wind: 0,
  angle: 45,
  power: 72,
  selectedWeapon: 'normal',
  selectedEnchants: [],
  charging: false,
  chargeStartedAt: 0,
  projectile: null,
  projectiles: [],
  shotQueue: [],
  volleyActive: false,
  returningHead: null,
  flight: null,
  particles: [],
  floaters: [],
  craters: [],
  explosion: null,
  bursts: [],
  terrain: new Float32Array(W),
  cameraX: 0,
  cameraY: 0,
  zoom: 1,
  cloudPlatforms: [],
  clownFlight: null,
  danceSummon: null,
  knockback: null,
  zomboniDrop: null,
  newspaperRush: null,
  tunnelBlocks: [],
  turnPending: false,
  lastTick: performance.now(),
  frameAccumulator: 0,
  hitStopFrames: 0,
  lastShot: null,
  lastPlayerImpact: null,
  impactFocus: null,
  hitFeedback: null,
  secondBuffer: 0,
  map: 'yard',
  mode: '1v1',
  shake: 0,
  flash: 0,
  trajectoryPulse: 0,
  matchId: 0,
  aiCursor: 0,
  chaosQueue: [],
  chaosCursor: 0,
  cattailUsed: false,
  cattailOfferShown: false,
  player: null,
  rival: null,
  rivals: []
};

try {
  const savedTimeScale = Number(window.localStorage.getItem('trajectoryTimeScale'));
  if ([.35, .65, 1, 1.5].includes(savedTimeScale)) state.timeScale = savedTimeScale;
} catch {}

function gameTimeout(callback, delay) {
  return setTimeout(callback, delay / state.timeScale);
}

function worldWidth(map = state.map) {
  if (map === 'dance') return W * DANCE_SCALE;
  if (map === 'pool') return ROSE_WORLD_WIDTH;
  return map === 'canyon' ? CANYON_WORLD_WIDTH : ['war', 'chaos'].includes(map) ? WAR_WORLD_WIDTH : W;
}

function worldHeight() {
  if (state.map === 'dance') return H * DANCE_SCALE;
  if (state.map === 'pool') return ROSE_WORLD_HEIGHT;
  if (state.map === 'canyon') return Math.round(887 * MIPING_SCALE);
  return ['war', 'chaos'].includes(state.map) ? WAR_WORLD_HEIGHT : H;
}

function pitDeathY() {
  return worldHeight() - 28;
}

// One distance frame is always twelve cells, at any zoom or power.
const LOB_CELLS = 12;
// Fit all 232 angle/distance/power samples in tests/tnt-reference.json.
// Linear air resistance prevents weak low-angle shots from travelling too far.
const BALLISTICS = Object.freeze({ gravity:.32, drag:.00466597, speedScale:.454893, powerExponent:.9907993, windAcceleration:.0022 });
function projectileLaunchVelocity(angle, power, side = 'player') {
  const radians = angle * Math.PI / 180;
  const speed = BALLISTICS.speedScale * Math.max(0, power) ** BALLISTICS.powerExponent;
  return { vx: (side === 'rival' ? -1 : 1) * Math.cos(radians) * speed, vy: -Math.sin(radians) * speed };
}
function advanceProjectileMotion(p, dt, weapon, side) {
  const data = weapons[weapon];
  const assisted = side === 'player' && state.difficulty === 'easy' && !data.homing;
  const range = assisted ? weapons.dogwood.homingRange : data.homingRange;
  const target = side === 'player' && (data.homing || assisted) ? nearestAliveRival(p.x, p.y) : null;
  if (target && target.health > 0 && (!range || Math.hypot(target.x - p.x, target.y - 46 - p.y) <= range)) {
    const dx = target.x - p.x, dy = target.y - 46 - p.y;
    const length = Math.max(1, Math.hypot(dx, dy)), speed = Math.max(10.5, Math.hypot(p.vx, p.vy));
    const blend = 1 - .82 ** (dt / .72); // Original steering response per unit of flight.
    p.vx += (dx / length * speed - p.vx) * blend;
    p.vy += (dy / length * speed - p.vy) * blend;
    p.x += p.vx * dt; p.y += p.vy * dt;
  } else advanceBallisticMotion(p, dt);
}
function advanceBallisticMotion(p, dt) {
  const ax=state.wind*BALLISTICS.windAcceleration, ay=BALLISTICS.gravity, k=BALLISTICS.drag;
  const decay=Math.exp(-k*dt), travel=-Math.expm1(-k*dt)/k;
  // Exact integration of constant gravity/wind plus velocity-dependent drag.
  p.x += p.vx*travel + ax/k*(dt-travel);
  p.y += p.vy*travel + ay/k*(dt-travel);
  p.vx = p.vx*decay + ax*travel;
  p.vy = p.vy*decay + ay*travel;
}
function lobWindAdjustment(wind) {
  const whole = Math.floor((Math.abs(wind) + 1e-9) / 2.5);
  const remainder = Math.max(0, Math.abs(wind) - whole * 2.5), sign = Math.sign(wind);
  return { angle: sign * whole, power: -sign * remainder * 2 };
}

function boundPlayerX(x) {
  return Math.max(70, Math.min(worldWidth() - 70, x));
}

function advanceFlightMotion(flight, dt) {
  advanceBallisticMotion(flight, dt);
  const nextX = flight.x;
  flight.x = boundPlayerX(nextX);
  if (flight.x !== nextX) flight.vx = 0;
}

function viewportWidth() {
  return W / state.zoom;
}

function viewportHeight() {
  return H / state.zoom;
}

function platformColumn(platform, x) {
  return Math.round(x - platform.left);
}

function platformSurfaceY(platform, x, feetY = -Infinity) {
  const col = platformColumn(platform, x);
  if (col < 0 || col >= platform.terrain.length) return Infinity;
  const floor = columnFloor(platform, col, feetY);
  return floor < platform.bottom ? floor : Infinity;
}

function cloudPlatformById(id) {
  return state.cloudPlatforms.find(p => p.id === id) || null;
}

function soilPlatformAtPoint(x, y) {
  return state.cloudPlatforms.find(p => y >= p.y && y < p.bottom && y >= platformSurfaceY(p, x, y)) || null;
}

function landingPlatformAt(x, previousY, currentY) {
  let nearest = null;
  let highest = Infinity;
  for (const platform of state.cloudPlatforms) {
    const surface = platformSurfaceY(platform, x, previousY);
    if (previousY <= surface && surface <= currentY && surface < highest) {
      nearest = platform;
      highest = surface;
    }
  }
  return nearest;
}

function fighterSurfaceY(fighter) {
  const ground = groundFloorAt(fighter.x, fighter.y);
  if (!fighter.platformId) return ground;
  const platform = cloudPlatformById(fighter.platformId);
  const surface = platform && platformSurfaceY(platform, fighter.x, fighter.y);
  if (Number.isFinite(surface) && surface <= ground) return surface;
  const lower = landingPlatformAt(fighter.x, fighter.y, ground);
  fighter.platformId = lower?.id ?? null;
  return lower ? platformSurfaceY(lower, fighter.x, fighter.y) : ground;
}

// Upper and lower alpha edges of the cropped sprites, in thousandths of their height.
const HEART_PROFILE = [
  [246,320],[208,402],[187,448],[143,478],[122,495],[107,512],[84,539],[74,552],[61,562],
  [48,577],[38,585],[34,592],[29,615],[23,629],[17,640],[15,648],[11,655],[8,659],
  [6,674],[4,691],[4,705],[4,714],[6,722],[4,728],[2,733],[2,737],[4,745],
  [6,758],[6,775],[6,785],[8,794],[11,800],[13,808],[17,815],[23,827],[27,840],
  [34,851],[44,859],[51,865],[59,880],[69,893],[84,901],[103,914],[114,926],[137,941],
  [152,956],[171,975],[189,992],[211,992],[192,973],[168,954],[149,937],[131,924],[114,909],
  [105,899],[86,888],[74,878],[65,863],[57,855],[46,848],[38,840],[32,823],[27,815],
  [23,806],[17,800],[11,794],[8,787],[6,777],[6,766],[6,752],[4,743],[0,737],
  [0,731],[0,726],[2,720],[2,709],[2,701],[2,686],[4,667],[6,655],[11,651],
  [15,644],[17,636],[21,625],[27,611],[36,587],[42,581],[51,571],[59,556],[76,545],
  [97,526],[107,503],[118,493],[139,465],[183,438],[202,400],[303,331]
];
const ROSE_BASE_PROFILE = [
  [927,946],[889,975],[868,985],[846,990],[827,993],[811,994],[796,996],[783,996],[770,997],
  [755,997],[744,997],[735,997],[728,999],[724,999],[723,999],[723,999],[717,999],[696,1000],
  [496,1000],[493,1000],[517,1000],[532,1000],[542,1000],[548,1000],[552,1000],[554,1000],[552,1000],
  [549,1000],[545,1000],[539,1000],[531,1000],[520,1000],[507,1000],[494,1000],[479,1000],[466,1000],
  [456,1000],[448,1000],[441,1000],[435,1000],[432,1000],[430,1000],[428,1000],[427,1000],[427,1000],
  [428,1000],[431,1000],[435,1000],[439,1000],[444,1000],[451,1000],[444,1000],[432,1000],[423,1000],
  [379,1000],[331,1000],[299,1000],[283,1000],[272,1000],[259,1000],[194,1000],[183,1000],[177,1000],
  [173,1000],[169,1000],[168,1000],[166,1000],[166,1000],[163,1000],[156,1000],[149,1000],[141,1000],
  [127,1000],[103,1000],[65,1000],[45,1000],[35,1000],[32,1000],[32,1000],[34,1000],[39,1000],
  [44,1000],[49,1000],[52,1000],[54,1000],[55,1000],[51,1000],[42,1000],[34,1000],[27,1000],
  [18,1000],[13,1000],[7,1000],[4,1000],[1,1000],[0,1000],[0,1000],[3,1000],[6,1000],
  [11,1000],[17,1000],[21,1000],[24,1000],[24,1000],[24,1000],[25,1000],[31,1000],[44,1000],
  [58,1000],[70,1000],[82,1000],[86,1000],[83,1000],[80,1000],[80,1000],[80,1000],[82,1000],
  [86,1000],[94,1000],[121,1000],[158,1000],[176,1000],[190,1000],[200,1000],[208,1000],[215,1000],
  [224,1000],[231,1000],[239,1000],[249,1000],[262,1000],[282,1000],[318,1000],[411,1000],[425,1000],
  [437,1000],[446,1000],[461,1000],[475,1000],[465,1000],[456,1000],[448,1000],[442,1000],[437,1000],
  [432,1000],[431,1000],[428,1000],[427,1000],[427,1000],[428,1000],[430,1000],[432,1000],[437,1000],
  [441,1000],[448,1000],[458,1000],[468,1000],[480,1000],[494,1000],[510,1000],[523,1000],[532,1000],
  [539,1000],[546,1000],[551,1000],[554,1000],[555,1000],[555,1000],[552,1000],[548,1000],[541,1000],
  [531,1000],[515,1000],[500,1000],[690,1000],[707,1000],[724,1000],[725,999],[723,999],[723,999],
  [724,999],[730,999],[737,997],[748,997],[761,997],[776,996],[792,996],[810,994],[828,993],
  [848,990],[869,985],[892,975],[930,948]
];

function makeRosePlatforms() {
  // Upper pair, wide flanks, open centre and a single rose at the foot of the map.
  return [
    { id: 'rose-west', x: 400, y: 806, width: 500, height: 308, sprite: 'roseHeart' },
    { id: 'rose-east', x: 2000, y: 806, width: 500, height: 308, sprite: 'roseHeart', mirrored: true },
    { id: 'rose-upper-west', x: 900, y: 340, width: 370, height: 226, sprite: 'roseHeart' },
    { id: 'rose-upper-east', x: 1510, y: 340, width: 370, height: 226, sprite: 'roseHeart', mirrored: true },
    { id: 'rose-base', x: 1250, y: 1005, width: 2070, height: 680, sprite: 'roseBase' }
  ];
}

function initializePlatform(platform) {
  if (platform.outline) {
    const points = platform.outline.map(([x, y]) => [x * MIPING_SCALE, y * MIPING_SCALE]);
    const left = Math.floor(Math.min(...points.map(p => p[0])));
    const right = Math.ceil(Math.max(...points.map(p => p[0])));
    platform.width = right - left;
    platform.x = (left + right) / 2;
    platform.y = Math.floor(Math.min(...points.map(p => p[1])));
    platform.height = Math.ceil(Math.max(...points.map(p => p[1]))) - platform.y;
  }
  platform.left = platform.x - platform.width / 2;
  platform.bottom = platform.y + platform.height;
  platform.terrain = new Float32Array(platform.width + 1).fill(platform.y);
  platform.cavities = new Array(platform.terrain.length);
  platform.burns = [];
  if (platform.sprite) {
    const profile = platform.sprite === 'roseBase' ? ROSE_BASE_PROFILE : HEART_PROFILE;
    for (let col = 0; col <= platform.width; col++) {
      const u = (platform.mirrored ? platform.width - col : col) / platform.width * (profile.length - 1);
      const i = Math.min(Math.floor(u), profile.length - 2), t = u - i;
      const [top, bottom] = profile[i], [nextTop, nextBottom] = profile[i + 1];
      platform.terrain[col] = platform.y + (top + (nextTop - top) * t) * platform.height / 1000;
      const lower = platform.y + (bottom + (nextBottom - bottom) * t) * platform.height / 1000;
      if (lower < platform.bottom) platform.cavities[col] = [{ top: lower, bottom: platform.bottom }];
    }
    platform.originalTerrain = platform.terrain.slice();
    return platform;
  }
  if (platform.outline) {
    // Scan the actual cap, stem and monument outlines. Air below an overhang
    // is a real gap in the same columns that walking and shots query.
    for (let col = 0; col <= platform.width; col++) {
      const sample = (platform.left + col + .01) / MIPING_SCALE;
      const edges = [];
      const points = platform.outline;
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
        if (sample < Math.min(ax, bx) || sample >= Math.max(ax, bx)) continue;
        edges.push((ay + (by - ay) * (sample - ax) / (bx - ax)) * MIPING_SCALE);
      }
      edges.sort((a, b) => a - b);
      platform.terrain[col] = edges[0] ?? platform.bottom;
      for (let i = 1; i < edges.length; i += 2) {
        const bottom = edges[i + 1] ?? platform.bottom;
        if (bottom > edges[i]) (platform.cavities[col] ??= []).push({ top: edges[i], bottom });
      }
    }
    platform.originalTerrain = platform.terrain.slice();
    return platform;
  }
  platform.originalTerrain = platform.terrain.slice();
  // Taper the underside at the ends, keeping the same walkable deck height.
  for (let x = 0; x <= platform.width; x++) {
    const edge = Math.min(x, platform.width - x);
    const bevel = Math.max(0, 1 - edge / (platform.height * .8));
    const inset = Math.round(bevel * platform.height * .64);
    if (inset) platform.cavities[x] = [{ top: platform.bottom - inset, bottom: platform.bottom }];
  }
  return platform;
}

function cutPlatforms(x, y, radius, angle) {
  let exhausted = false;
  for (const platform of state.cloudPlatforms) {
    if (platform.permanent) continue;
    // Reject distant platforms before slicing any columns.
    const reach = radius * 2.1; // Include the forward offset of a grazing chip.
    if (Math.abs(x - platform.x) > platform.width / 2 + reach || y < platform.y - reach || y > platform.bottom + reach) continue;
    const cut = deformTerrain(x - platform.left, y, radius, angle, platform);
    if (!cut) continue;
    if (cut.undercut) platform.burns.push(cut);
    platform.skin = null;
    if (platform.terrain.every(top => top >= platform.bottom)) {
      platform.exhausted = true;
      exhausted = true;
    }
    state.platformRevision++;
    const debris = { ...cut, x: cut.x + platform.left };
    debris.loosened = cut.loosened.map(point => ({ x: point.x + platform.left, y: point.y }));
    spawnGroundDebris(debris);
  }
  if (exhausted) state.cloudPlatforms = state.cloudPlatforms.filter(p => !p.exhausted);
}

function tunnelBlockAt(x, y) {
  return state.tunnelBlocks.find(block => block.health > 0 && x >= block.x - block.width / 2 && x <= block.x + block.width / 2 && y >= block.y - block.height / 2 && y <= block.y + block.height / 2) || null;
}

function damageTunnelBlocks(x, y, radius, damage) {
  const broken = [];
  state.tunnelBlocks.forEach(block => {
    const dx = Math.max(Math.abs(x - block.x) - block.width / 2, 0);
    const dy = Math.max(Math.abs(y - block.y) - block.height / 2, 0);
    const edgeDistance = Math.hypot(dx, dy);
    if (edgeDistance >= radius) return;
    const dealt = Math.max(1, Math.round(damage * (1 - edgeDistance / radius * .68)));
    block.health = Math.max(0, block.health - dealt);
    if (block.health === 0) broken.push(block);
  });
  if (broken.length === 0) return;
  broken.forEach(block => {
    for (let i = 0; i < 34; i += 1) {
      const debris = block.width > block.height ? ['#a57447', '#63432f'] : ['#687d78', '#4a5958'];
      state.particles.push({ x: block.x, y: block.y, vx: (Math.random() - .5) * 8, vy: (Math.random() - .7) * 5, color: debris[i % 2], size: 3 + Math.random() * 6, life: 28 + Math.random() * 22 });
    }
  });
  state.tunnelBlocks = state.tunnelBlocks.filter(block => block.health > 0);
  showToast('矿洞吊架被打碎');
}

function makeFighter(side, variant = 'default') {
  const player = side === 'player';
  const normalZombie = variant === 'normalZombie';
  const clownZombie = variant === 'clownZombie';
  const dancingZombie = variant === 'dancingZombie';
  const backupDancer = variant === 'backupDancer';
  const newspaperZombie = variant === 'newspaperZombie';
  const cattail = player && variant === 'cattail';
  const canyon = state.map === 'canyon';
  const mipingSpawnX = (player ? 515 : normalZombie ? 1050 : 1400) * MIPING_SCALE;
  const roseSpawnX = player ? 457 : normalZombie ? 1458 : 1945;
  return {
    side,
    variant,
    imageKey: cattail ? 'cattail' : player ? 'hero' : normalZombie ? 'normalZombie' : clownZombie ? 'clownZombie' : dancingZombie ? 'dancingZombie' : backupDancer ? 'backupDancer' : newspaperZombie ? 'newspaperReading' : 'rival',
    x: state.map === 'pool' ? roseSpawnX : canyon ? mipingSpawnX : player ? (['war', 'chaos'].includes(state.map) ? 210 : 176) : clownZombie ? 1035 : normalZombie ? 900 : 1024,
    y: 0,
    health: cattail ? 300 : normalZombie ? 72 : clownZombie ? 115 : dancingZombie ? 125 : backupDancer ? 58 : newspaperZombie ? 135 : 100,
    maxHealth: cattail ? 300 : normalZombie ? 72 : clownZombie ? 115 : dancingZombie ? 125 : backupDancer ? 58 : newspaperZombie ? 135 : 100,
    stamina: 100,
    rage: 0,
    criticalRageTriggered: false,
    ammo: { fire: 3, ice: 3, potato: 3 },
    flightAvailable: player,
    flightArmed: false,
    ultimateArmed: false,
    platformId: null,
    healsRemaining: player && !cattail ? 2 : 0,
    frozenTurns: 0,
    headDetached: false,
    hitPulse: 0,
    sootFrames: 0,
    movePulse: 0,
    moveDirection: 0,
    attackPulse: 0,
    blastArmed: false,
    newspaperHealth: newspaperZombie ? 70 : 0,
    newspaperMaxHealth: newspaperZombie ? 70 : 0,
    enraged: false,
    rageTransition: 0,
    shieldHealth: 0,
    shieldMaxHealth: 50,
    pumpkinUsedThisTurn: false,
    poisonTurns: 0,
    attackFreezeTurns: 0
  };
}

const audio = { context: null, enabled: true, bgm: null, bgmPath: '', lastPlayed: {}, lastVariant: {} };
const sfxPaths = {
  aimRatchet: 'assets/audio/aim-ratchet.wav.mp3',
  flightReady: 'assets/audio/flight-ready.wav.mp3',
  doomReady: 'assets/audio/doom-ready.wav.mp3',
  supplyPick: 'assets/audio/supply-pick.wav.mp3',
  peaBu: ['assets/audio/pea-mouth-pop-1.ogg.mp3', 'assets/audio/pea-mouth-pop-2.ogg.mp3'],
  peaBoom: 'assets/audio/pea-shell-crack.ogg.mp3',
  seedPick: 'assets/audio/seed-pick.ogg.mp3',
  enchantNote: 'assets/audio/enchant-note.ogg.mp3',
  soilSoft: ['assets/audio/soil-soft.ogg.mp3', 'assets/audio/soil-soft-alt.ogg.mp3'],
  stoneTick: 'assets/audio/stone-tick.ogg.mp3',
  berryPop: 'assets/audio/berry-pop.ogg.mp3',
  step: 'assets/audio/step-pvz.ogg.mp3',
  charge: 'assets/audio/charge-pvz.ogg.mp3',
  shot: 'assets/audio/pea-bubble-launch.ogg.mp3',
  fireShot: 'assets/audio/fire-launch.ogg.mp3',
  iceShot: 'assets/audio/ice-launch.ogg.mp3',
  potatoShot: 'assets/audio/potato-pvz.ogg.mp3',
  paperShot: 'assets/audio/paper-pvz.ogg.mp3',
  poisonShot: 'assets/audio/poison-pvz.ogg.mp3',
  starShot: 'assets/audio/star-pvz.ogg.mp3',
  frostShot: 'assets/audio/frozen-pvz.ogg.mp3',
  splat: 'assets/audio/pea-bubble-hit.ogg.mp3',
  fireImpact: ['assets/audio/fire-impact-1.ogg.mp3', 'assets/audio/fire-impact-2.ogg.mp3'],
  iceImpact: 'assets/audio/ice-fracture.wav.mp3',
  potatoImpact: ['assets/audio/potato-pvz.ogg.mp3', 'assets/audio/explosion-pvz.ogg.mp3'],
  bladeSwish: 'assets/audio/blade-swish.wav.mp3',
  bladeTick: 'assets/audio/blade-tick.wav.mp3',
  ballPass: 'assets/audio/ball-pass.wav.mp3',
  ballBounce: 'assets/audio/ball-bounce.wav.mp3',
  earthThump: 'assets/audio/earth-thump.wav.mp3',
  paperImpact: 'assets/audio/paper-pvz.ogg.mp3',
  heavyImpact: ['assets/audio/bowling-impact-pvz.ogg.mp3', 'assets/audio/explosion-pvz.ogg.mp3'],
  poisonImpact: 'assets/audio/poison-pvz.ogg.mp3',
  starImpact: ['assets/audio/star-pvz.ogg.mp3', 'assets/audio/splat-1.ogg.mp3'],
  zomboniImpact: ['assets/audio/zamboni-pvz.ogg.mp3', 'assets/audio/explosion-pvz.ogg.mp3'],
  cartImpact: ['assets/audio/cart-pvz.ogg.mp3', 'assets/audio/bowling-impact-pvz.ogg.mp3'],
  blast: 'assets/audio/explosion-pvz.ogg.mp3',
  nuke: 'assets/audio/doomshroom-pvz.ogg.mp3',
  heal: 'assets/audio/heal-pvz.ogg.mp3',
  flight: 'assets/audio/flight-pvz.ogg.mp3',
  turn: 'assets/audio/turn-pvz.ogg.mp3',
  zombieTurn: ['assets/audio/groan-1.ogg.mp3', 'assets/audio/groan-2.ogg.mp3', 'assets/audio/groan-3.ogg.mp3', 'assets/audio/groan-4.ogg.mp3', 'assets/audio/groan-5.ogg.mp3', 'assets/audio/groan-6.ogg.mp3'],
  huaqiangThrow: 'assets/audio/huaqiang-throw.ogg.mp3',
  vendorChallenge: 'assets/audio/vendor-picking-a-fight.ogg.mp3',
  dancerDefeat: 'assets/audio/dance-defeat.m4a.mp3',
  win: 'assets/audio/win-pvz.ogg.mp3',
  lose: 'assets/audio/lose-pvz.ogg.mp3',
  button: 'assets/audio/button-pvz.ogg.mp3',
  clownArm: 'assets/audio/clown-arm-pvz.ogg.mp3',
  clownBlast: 'assets/audio/clown-blast-pvz.ogg.mp3',
  shieldHit: ['assets/audio/shield-hit-1.ogg.mp3', 'assets/audio/shield-hit-2.ogg.mp3'],
  shieldEquip: 'assets/audio/plantgrow.ogg.mp3',
  dance: 'assets/audio/dancer-pvz.ogg.mp3',
  summon: 'assets/audio/summon-pvz.ogg.mp3',
  newspaperRip: 'assets/audio/newspaper-rip-pvz.ogg.mp3',
  newspaperRage: ['assets/audio/newspaper-rage-1.ogg.mp3', 'assets/audio/newspaper-rage-2.ogg.mp3'],
  zomboni: 'assets/audio/zamboni-pvz.ogg.mp3',
  cart: 'assets/audio/cart-pvz.ogg.mp3',
  platformBreak: 'assets/audio/platform-break-pvz.ogg.mp3',
  dave: ['assets/audio/dave-1.ogg.mp3', 'assets/audio/dave-2.ogg.mp3', 'assets/audio/dave-3.ogg.mp3'],
  battleStart: 'assets/audio/battle-start-pvz.ogg.mp3',
  prize: 'assets/audio/prize-pvz.ogg.mp3'
};

const sfxSettings = {
  aimRatchet: { volume: .4, cooldown: 64 },
  flightReady: { volume: .45 }, doomReady: { volume: .52 }, supplyPick: { volume: .48 },
  peaBu: { volume: .58, cooldown: 55 }, peaBoom: { volume: .69, cooldown: 95 },
  seedPick: { volume: .31, cooldown: 65 }, enchantNote: { volume: .29, cooldown: 45 },
  soilSoft: { volume: .37, cooldown: 95 }, stoneTick: { volume: .34, cooldown: 100 },
  berryPop: { volume: .51, cooldown: 85 },
  huaqiangThrow: { volume: .72 },
  vendorChallenge: { volume: .72 },
  dancerDefeat: { volume: .76 },
  earthThump: { volume: .28, cooldown: 170 },
  step: { volume: .3, cooldown: 75 }, charge: { volume: .32, cooldown: 90 }, shot: { volume: .42, cooldown: 55 },
  splat: { volume: .45, cooldown: 45 }, blast: { volume: .58, cooldown: 80 }, nuke: { volume: .74, cooldown: 400 },
  zombieTurn: { volume: .28, cooldown: 900 }, button: { volume: .36, cooldown: 40 }, turn: { volume: .38, cooldown: 300 },
  dance: { volume: .5, cooldown: 600 }, summon: { volume: .52, cooldown: 280 }, shieldHit: { volume: .5, cooldown: 80 },
  win: { volume: .58, cooldown: 1000 }, lose: { volume: .56, cooldown: 1000 }
};

const readyMusic = new Map();
const bgmPaths = {
  yard: 'assets/audio/bgm-yard.ogg.mp3', pool: 'assets/audio/rose-garden-93c0046f8ec4.m4a.mp3', canyon: 'assets/audio/bgm-canyon.ogg.mp3',
  land: 'assets/audio/bgm-canyon.ogg.mp3', tunnels: 'assets/audio/bgm-canyon.ogg.mp3', dance: 'assets/audio/bgm-dance.ogg.mp3',
  war: 'assets/audio/bgm-war.ogg.mp3', newspaper: 'assets/audio/bgm-war.ogg.mp3', chaos: 'assets/audio/bgm-chaos.ogg.mp3'
};

function getAudioContext() {
  if (!audio.enabled) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audio.context) audio.context = new AudioContext();
  if (audio.context.state === 'suspended') audio.context.resume();
  return audio.context;
}

function playTone(frequency, duration, options = {}) {
  const audioContext = getAudioContext();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = options.type || 'triangle';
  oscillator.frequency.setValueAtTime(frequency, now);
  if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.08, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

let chargeVoice = null;

function stopChargeVoice() {
  if (!chargeVoice) return;
  const { tone, pulse, depth, amplitude, output } = chargeVoice;
  chargeVoice = null;
  const now = output.context.currentTime;
  const volume = output.gain.value;
  output.gain.cancelScheduledValues(now);
  output.gain.setValueAtTime(volume, now);
  output.gain.linearRampToValueAtTime(0, now + .035);
  tone.onended = () => {
    for (const node of [tone, pulse, depth, amplitude, output]) node.disconnect();
  };
  tone.stop(now + .04);
  pulse.stop(now + .04);
}

function updateChargeVoice(power) {
  if (!audio.enabled || document.hidden) return;
  if (!chargeVoice) {
    const ac = getAudioContext();
    if (!ac) return;
    const tone = ac.createOscillator(), pulse = ac.createOscillator();
    const depth = ac.createGain(), amplitude = ac.createGain(), output = ac.createGain();
    tone.type = 'triangle';
    tone.frequency.value = 174.6;
    pulse.frequency.value = 2;
    amplitude.gain.value = .65;
    depth.gain.value = .32;
    pulse.connect(depth).connect(amplitude.gain);
    tone.connect(amplitude).connect(output).connect(ac.destination);
    output.gain.setValueAtTime(0, ac.currentTime);
    tone.start(); pulse.start();
    chargeVoice = { tone, pulse, depth, amplitude, output };
  }
  const { tone, pulse, output } = chargeVoice;
  const t = power / 100, now = output.context.currentTime;
  tone.frequency.setTargetAtTime(174.6 * 2 ** (1.6 * t), now, .045);
  pulse.frequency.setTargetAtTime(2 + 5 * t * t, now, .05);
  output.gain.setTargetAtTime(.022 + .021 * t, now, .045);
}

window.addEventListener('visibilitychange', () => { if (document.hidden) stopChargeVoice(); }, true);

function playSynthSfx(name) {
  if (name === 'peaBu') playTone(275, .14, { endFrequency: 72, volume: .12, type: 'sine' });
  if (name === 'peaBoom') playTone(920, .055, { endFrequency: 460, volume: .09, type: 'triangle' });
  if (name === 'step') playTone(170, 0.06, { endFrequency: 130, volume: 0.035 });
  if (name === 'charge') playTone(280, 0.08, { endFrequency: 360, volume: 0.045, type: 'sine' });
  if (name === 'shot') playTone(250, 0.12, { endFrequency: 620, volume: 0.075 });
  if (name === 'fireShot') playTone(190, 0.16, { endFrequency: 760, volume: 0.1, type: 'sawtooth' });
  if (name === 'iceShot') playTone(690, 0.16, { endFrequency: 390, volume: 0.07, type: 'sine' });
  if (name === 'blast') playTone(130, 0.28, { endFrequency: 48, volume: 0.14, type: 'sawtooth' });
  if (name === 'heal') playTone(440, 0.13, { endFrequency: 880, volume: 0.06, type: 'sine' });
  if (name === 'flight') playTone(220, 0.26, { endFrequency: 880, volume: 0.075, type: 'sine' });
  if (name === 'turn') playTone(520, 0.1, { endFrequency: 660, volume: 0.045, type: 'sine' });
  if (name === 'win') playTone(523, 0.18, { endFrequency: 784, volume: 0.075, type: 'sine' });
  if (name === 'lose') playTone(240, 0.26, { endFrequency: 100, volume: 0.07 });
  if (name === 'nuke') {
    playTone(76, 0.8, { endFrequency: 28, volume: 0.19, type: 'sawtooth' });
    playTone(310, 0.42, { endFrequency: 54, volume: 0.11, type: 'triangle' });
  }
}

// Keep combat samples decoded across rounds so a hit never waits for media startup.
const battleSounds = new Map();
const pendingSounds = new Map();
const timedSounds = new Set();
const commonCues = ['peaBu','peaBoom','shot','fireShot','fireImpact','iceShot','iceImpact',
  'potatoShot','potatoImpact','earthThump','nuke','battleStart','platformBreak','flight'];
const stageCues = {
  yard: ['huaqiangThrow','bladeTick'],
  land: ['vendorChallenge','clownBlast'],
  canyon: ['huaqiangThrow','bladeTick','berryPop'],
  pool: ['huaqiangThrow','bladeTick','vendorChallenge','clownBlast'],
  dance: ['ballPass','ballBounce','paperShot','paperImpact','heavyImpact','zomboniImpact','cartImpact','dancerDefeat'],
  chaos: ['huaqiangThrow','bladeTick','vendorChallenge','clownBlast','ballPass','ballBounce','paperShot',
    'paperImpact','heavyImpact','zomboniImpact','cartImpact','poisonShot','poisonImpact','starShot','starImpact','frostShot']
};
function prepareBattleSounds(cues) {
  if (!/^https?:$/.test(window.location?.protocol) || !audio.enabled) return [];
  const ac = getAudioContext();
  if (!ac?.decodeAudioData) return [];
  const paths = new Set(cues.flatMap(name => sfxPaths[name] || []));
  return [...paths].map(path => {
    timedSounds.add(path);
    if (battleSounds.has(path)) return Promise.resolve();
    if (pendingSounds.has(path)) return pendingSounds.get(path);
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 10000);
    const task = fetch(path, {signal:controller.signal}).then(response => {
      if (!response.ok) throw Error(response.status);
      return response.arrayBuffer();
    }).then(data => ac.decodeAudioData(data)).then(buffer => battleSounds.set(path, buffer))
      .finally(() => { clearTimeout(deadline); pendingSounds.delete(path); });
    pendingSounds.set(path, task);
    return task;
  });
}

function playSfx(name, options = {}) {
  if (!audio.enabled) return;
  const AudioPlayer = window.Audio;
  const choices = Array.isArray(sfxPaths[name]) ? sfxPaths[name] : [sfxPaths[name]].filter(Boolean);
  if (!AudioPlayer || choices.length === 0) {
    playSynthSfx(name);
    return;
  }
  const now = performance.now();
  const settings = sfxSettings[name] || {};
  if (!options.force && audio.lastPlayed[name] !== undefined && now - audio.lastPlayed[name] < (settings.cooldown || 25)) return;
  audio.lastPlayed[name] = now;
  let source = choices[Math.floor(Math.random() * choices.length)];
  if (choices.length > 1 && source === audio.lastVariant[name]) source = choices[(choices.indexOf(source) + 1) % choices.length];
  audio.lastVariant[name] = source;
  if ((name === 'win' || name === 'lose') && audio.bgm) audio.bgm.pause();
  if (timedSounds.has(source)) {
    const buffer = battleSounds.get(source), ac = getAudioContext();
    if (!buffer || ac?.state !== 'running') {
      if (ac?.state === 'running') playSynthSfx(name);
      return;
    }
    const sample = ac.createBufferSource(), gain = ac.createGain();
    sample.buffer = buffer;
    sample.playbackRate.value = options.force ? .96 + Math.random() * .08 : options.rate || 1;
    gain.gain.value = settings.volume ?? .46;
    sample.connect(gain).connect(ac.destination);
    sample.onended = () => { sample.disconnect(); gain.disconnect(); };
    sample.start();
    return { pause: () => sample.stop(), addEventListener: (...args) => sample.addEventListener(...args) };
  }
  const sample = new AudioPlayer(source);
  if (options.rate) {
    sample.preservesPitch = false;
    sample.playbackRate = options.rate;
  }
  sample.volume = settings.volume ?? (name === 'nuke' ? .74 : name === 'blast' ? .58 : .46);
  if (options.force) sample.playbackRate = .96 + Math.random() * .08;
  sample.play().catch(() => {
    if (sample === characterVoice) stopCharacterVoice();
    playSynthSfx(name);
  });
  return sample;
}

let characterVoice = null;
let characterVoiceCue = null;
function stopCharacterVoice() {
  characterVoice?.pause();
  characterVoice = null;
  characterVoiceCue = null;
  if (audio.bgm) audio.bgm.volume = audio.musicLevel;
}

function playCharacterVoice(cue) {
  stopCharacterVoice();
  if (!cue) return;
  const voice = playSfx(cue);
  if (!voice) return;
  characterVoice = voice;
  characterVoiceCue = cue;
  if (audio.bgm) audio.bgm.volume = audio.musicLevel * .48;
  voice.addEventListener?.('ended', () => {
    if (characterVoice === voice) stopCharacterVoice();
  }, { once: true });
}

function playBackgroundMusic(path, volume) {
  if (!audio.enabled || !window.Audio) return;
  if (!audio.bgm || audio.bgmPath !== path) {
    if (audio.bgm) audio.bgm.pause();
    audio.bgm = new window.Audio(readyMusic.get(path) || path);
    audio.bgmPath = path;
    audio.bgm.loop = true;
  }
  audio.musicLevel = volume;
  audio.bgm.volume = characterVoice ? volume * .48 : volume;
  audio.bgm.play().catch(() => {});
}

function startBackgroundMusic() {
  if (document.getElementById('levelOverlay')?.hidden === false) {
    playBackgroundMusic('assets/audio/level-select-tnt.m4a.mp3', .32);
    return;
  }
  const nextPath = bgmPaths[state.map] || bgmPaths.yard;
  playBackgroundMusic(nextPath, state.map === 'chaos' ? .18 : .16);
}

function generateTerrain(map = state.map) {
  const width = worldWidth(map);
  state.terrain = new Float32Array(width);
  state.cavities = new Array(width);
  state.craters = [];
  for (let x = 0; x < width; x += 1) {
    if (map === 'pool') {
      state.terrain[x] = ROSE_WORLD_HEIGHT;
    } else if (map === 'dance') {
      state.terrain[x] = profileHeight(DANCE_PROFILE, x / DANCE_SCALE) * DANCE_SCALE;
    } else if (map === 'canyon') {
      state.terrain[x] = profileHeight(MIPING_GROUND, x / MIPING_SCALE) * MIPING_SCALE;
    } else if (map === 'land') {
      state.terrain[x] = profileHeight(MARKET_PROFILE, x) - 60 + 2 * Math.sin(x / 27);
    } else if (map === 'chaos') {
      const centralRise = Math.max(0, 520 - Math.abs(x - 1200) * .5);
      const leftRise = Math.max(0, 245 - Math.abs(x - 350) * .72);
      const rightRise = Math.max(0, 245 - Math.abs(x - 2050) * .72);
      const pyramidRise = Math.max(centralRise, leftRise, rightRise);
      const steppedRise = Math.floor(pyramidRise / 48) * 48;
      const stoneVariation = 4 * Math.sin(x / 31);
      state.terrain[x] = Math.max(390, Math.min(1040, 950 - steppedRise + stoneVariation));
    } else if (map === 'war') {
      const brokenPlateau = 74 * Math.sin(x / 137) + 36 * Math.sin(x / 49) + 19 * Math.sin(x / 21);
      const trenches = [430, 910, 1420, 1920].reduce((depth, center, index) => depth + (90 + index % 2 * 34) * Math.exp(-((x - center) ** 2) / 12500), 0);
      const ridges = [670, 1190, 1680, 2180].reduce((height, center) => height + 72 * Math.exp(-((x - center) ** 2) / 9800), 0);
      state.terrain[x] = Math.max(690, Math.min(1080, 825 + brokenPlateau + trenches - ridges));
    } else if (map === 'tunnels') {
      const terraces = 34 * Math.sin((x - 80) / 116) + 18 * Math.sin(x / 43);
      const trenches = 62 * Math.exp(-((x - 330) ** 2) / 19000) + 74 * Math.exp(-((x - 795) ** 2) / 25000);
      const berms = 58 * Math.exp(-((x - 560) ** 2) / 12000) + 50 * Math.exp(-((x - 1040) ** 2) / 13500);
      state.terrain[x] = Math.max(326, Math.min(538, 416 + terraces + trenches - berms));
    } else {
      const broadHill = 36 * Math.cos((x - 600) / 250);
      const smallRoll = 12 * Math.sin(x / 63) + 8 * Math.sin(x / 29);
      state.terrain[x] = (map === 'yard' ? 374 : 428) + broadHill + smallRoll;
    }
  }
  state.originalTerrain = state.terrain.slice();
}

const littleDaveStill = assetPaths.littleDave;
const gardenOpening = [
  ['华强', '我问你啊，戴芙，卖瓜的老板来过吗？我回摊上一看，车还在，人找不着了。'],
  ['小戴芙', '没见过。我一直在院里浇水。你找他怎么找到这儿来了？'],
  ['华强', '刚才在瓜摊上，是我犯浑，动手伤了他。我车就停在巷口，得赶紧送他去医院。'],
  ['小戴芙', '你先把刀放下。我给你开门，咱俩分头找。'],
  ['华强', '人命关天啊！我顺着地上的血点找过来，到你门口就断了。你再想想！'],
  ['小戴芙', '华强，我真的没见过他。你看着我说话，手别去推门。'],
  ['华强', '我不信。你往旁边站站，我自己进去看一眼！'],
  ['小戴芙', '豌豆，顶住门！他手里的刀还没放下！']
];
const marketOpening = [
  ['瓜老板', '你们打伤了华强？他刚从我摊前过去，脸上好大一块青！'],
  ['小戴芙', '是他拿着刀来的！我让他先把刀放下，他直接就推门了。'],
  ['瓜老板', '你瞧，我现在只能拿瓜抵着伤口，一松手我怕又出血。他是来带我去医院的！'],
  ['小戴芙', '那我们带你去医院。车就在巷口，你等着，我去把车叫过来。'],
  ['瓜老板', '你们先动手打了华强，现在又要送我去医院？我才不信！我跟你们爆了！'],
  ['小戴芙', '我真服了。']
];
const marketAside = [['ready', '豌豆，看他的瓜！他一抱紧就要往咱们这边冲，先跟他拉开点距离。']];
const roseOpening = [
  ['华强', '瓜哥，上次的事，对不住啊。你的瓜熟得很。下次我再去，买三十块钱的！'],
  ['瓜老板', '华强，你还记着呢？我那秤底下藏了吸铁石，是我有错在先。上回你跑回来要送我去医院，我就原谅你了。'],
  ['小戴芙', '豌豆，这是什么地方？连脚底下都是玫瑰花……我怎么感觉怪怪的？'],
  ['华强和瓜老板', '你竟然出现在这里！等打跑你之后，我们再唠！'],
  ['小戴芙', '我的天！']
];
const danceOpening = [
  ['小戴芙', '终于把那些家伙打跑了！豌豆，快来！演唱会要开场了，咱俩也玩会儿！'],
  ['读报僵尸', '慢着。报上说：“一名小女孩和一株豌豆，无故殴打两名男子。”我瞧瞧……一个小女孩，一个豌豆。是你们吧？'],
  ['蔡徐坤', '哇！这么无礼的家伙，可不能来听我的演唱会！兄弟们，上！'],
  ['小戴芙', '我招谁惹谁了！']
];
const mipingWelcome = [
  ['小戴芙', '豌豆，快看石碑！咱们到河南省南阳市西峡县的米坪镇啦。那边红彤彤的一大堆，就是我一路念叨的山茱萸吧？'],
  ['河南米', '可叫你认出来了！我是河南米，河南的河，南阳的南，米坪的米。你看，我头上也戴着一串呢！'],
  ['小戴芙', '我还以为那是红珠子呢！我能尝尝吗？'],
  ['河南米', '来，尝一口山茱萸果酱。先抿一点儿，这小红果酸起来可有劲儿了！'],
  ['小戴芙', '唔……酸得我眯眼了！再给我抹一勺吧。可山下怎么还晒着这么多？'],
  ['河南米', '那是乡亲们去了核、摊开晒的山萸肉。山茱萸在中医里用来补益肝肾。你听过六味地黄丸吧？里头的酒萸肉，就是用它炮制的。'],
  ['小戴芙', '原来这小红果，还占了“六味”里的一味呀！'],
  ['河南米', '对喽，六味地黄丸讲的是滋阴补肾。等你吃完，我带你上坡看看，满枝红果映着青山，那才是我们米坪的一绝！']
];
const mipingOpening = [
  ...mipingWelcome,
  ['华强', '挺有闲心啊，还吃上了？上回我想送瓜老板去医院，弥补自己犯的错。你们拦着我，还打了我一顿！'],
  ['华强', '这回我可找了个打手。飞头蛮，出来，给他们打个招呼！'],
  ['飞头蛮', '嗷呜……嗷呜！'],
  ['小戴芙', '我们都跑到这儿来了，你们还能找过来？'],
  ['华强', '我华强什么都能办到。']
];
const mipingRescue = [
  ['华强', '知道我的厉害了吧！'],
  ['河南米', '别得意，这里可是我的主场！戴芙，快让豌豆射手尝尝我们米坪的山茱萸！'],
  ['小戴芙', '豌豆，张嘴，啊——！看，我还给你编了个红果圈。戴好，咱们再来！']
];
const victoryLines = new Map([
  [gardenOpening, '华强终于放下了刀。小戴芙这才拉开院门：“走，回瓜摊。隔壁摊主兴许知道他往哪儿去了。”'],
  [marketOpening, '戴芙拉着豌豆一口气跑出瓜市：“呼……终于甩掉瓜老板了！”'],
  [mipingOpening, '戴芙：“又一次打跑了华强！不过……豌豆，你听见没？他好像说，他一定会回来的。”'],
  [roseOpening, '华强：“瓜老板～～”\n瓜老板：“华强～～～”\n戴芙：“你们不要这么暧昧～”'],
  [danceOpening, '蔡徐坤：“你干嘛？”\n读报僵尸：“别打我了，兴许我看错了～”']
]);
const dialoguePortraits = {
  '蔡徐坤': assetPaths.dancingZombie, '读报僵尸': assetPaths.newspaperReading,
  '小戴芙': littleDaveStill, '河南米': assetPaths.henanMi,
  '戴夫': 'assets/dave2.gif', '飞头蛮': assetPaths.normalZombie,
  '华强': assetPaths.rival, '瓜老板': assetPaths.clownZombie, '华强和瓜老板': assetPaths.rival
};

function mipingRivalsOffstage() {
  return littleDaveScene === 'story' && state.map === 'canyon' && littleDavePage < mipingWelcome.length;
}

function stageOpening() {
  if (state.map === 'dance' && state.mode === 'dance') return danceOpening;
  if (state.map === 'yard' && state.mode === '1v1') return gardenOpening;
  if (state.map === 'land' && state.mode === 'clown') return marketOpening;
  if (state.map === 'canyon' && state.mode === '1v2') return mipingOpening;
  if (state.map === 'pool' && state.mode === '1v2') return roseOpening;
  return null;
}

function littleDaveDialogue() {
  const opening = stageOpening();
  if (littleDaveScene === 'story') return opening;
  if (littleDaveScene === 'rescue') return mipingRescue;
  return opening === marketOpening ? marketAside : littleDaveLines;
}
const littleDaveLines = [
  ['ammo', '豌豆，别慌，我陪你打第一发。先看「弹药」这排。选「普通」能打豌豆，选「寒冰」打中他，就能冻住他一回合。'],
  ['enchants', '选好了弹药，再看「附魔」。每发最多选两次。可以挑两种各点一下，也可以在同一种上面连点两下！'],
  ['spread', '试试「双发」加「散射」？第一拨三颗一起飞，紧接着又来三颗，一共六颗！这一套刚好要 100 体力，记得先留着。'],
  ['power', '想把劲儿攒在一颗上，就连点两下「强击」。花 80 体力，这一发的基础伤害能翻到四倍。'],
  ['angle', '玩过《TNT》或《弹弹堂》吗？这里也得看风、调角度。风箭头朝右，豌豆就会往右偏。用左下角的上下键抬高或压低炮口。'],
  ['charge', '瞄好了就按住「发射」，看蓄力条往前走，到你想要的刻度就松手。要是落在他脚前，下回合看看风，试着再多蓄一点。'],
  ['ready', '好啦，轮到你了！第一颗偏了也别急，我帮你盯着落点。加油，豌豆！想再听一遍，就点点我的锅帽。']
];
let littleDavePage = 0;
let littleDaveScene = 'review';
let littleDaveSeen = false;
try { littleDaveSeen = window.localStorage.getItem('trajectoryLittleDaveSeen') === '1'; } catch {}

function showLittleDaveLine() {
  const story = littleDaveScene === 'story' || littleDaveScene === 'rescue';
  const dialogue = littleDaveDialogue();
  const [tag, line, voiceCue] = dialogue[littleDavePage];
  playCharacterVoice(voiceCue);
  const speaker = story ? tag : '小戴芙';
  const portrait = document.getElementById('gardenSpeakerPortrait');
  if (portrait) portrait.src = dialoguePortraits[speaker];
  const name = document.getElementById('gardenSpeakerName');
  if (name) name.textContent = speaker;
  ui.littleDaveChat.setAttribute('data-speaker', speaker);
  ui.littleDaveChat.setAttribute('data-topic', story ? '' : tag);
  ui.littleDaveLine.textContent = line;
  const last = littleDavePage === dialogue.length - 1;
  const lastLabel = dialogue === mipingRescue ? '吃下山茱萸' : dialogue === gardenOpening ? '听戴芙讲解' : littleDaveScene === 'review' ? '回到战斗' : '开始战斗';
  ui.littleDaveNext.textContent = last ? lastLabel : '继续 →';
  const talking = speaker === '小戴芙' && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  ui.littleDaveSprite.src = talking ? 'assets/concepts/little-dave-talk.gif' : littleDaveStill;
  if (speaker === '飞头蛮') playSfx('zombieTurn');
}

function startLittleDaveScene(scene) {
  littleDavePage = 0;
  littleDaveScene = scene;
  ui.littleDaveSkip.textContent = scene === 'story' || scene === 'rescue' ? '跳过剧情' : scene === 'tutorial' ? '跳过教学' : '关闭';
  ui.littleDaveChat.setAttribute('data-scene', scene);
  showLittleDaveLine();
}

function openLittleDaveChat(intro = false) {
  if (!ui.littleDaveChat || ui.littleDaveGuide.hidden || !ui.littleDaveChat.hidden) return;
  cancelCharge();
  if (intro) {
    state.running = false;
    ui.startOverlay.style.display = 'none';
  }
  ui.littleDaveChat.hidden = false;
  ui.littleDaveCharacter.setAttribute('aria-expanded', 'true');
  startLittleDaveScene(intro ? 'story' : 'review');
  updateUI();
  ui.littleDaveNext.focus();
}

function closeLittleDaveChat() {
  if (!ui.littleDaveChat || ui.littleDaveChat.hidden) return;
  stopCharacterVoice();
  if (littleDaveScene === 'story' && stageOpening() === gardenOpening) {
    startLittleDaveScene('tutorial');
    ui.littleDaveNext.focus();
    return;
  }
  ui.littleDaveChat.hidden = true;
  ui.littleDaveCharacter.setAttribute('aria-expanded', 'false');
  ui.littleDaveSprite.src = littleDaveStill;
  if (littleDaveScene === 'rescue') {
    littleDaveScene = 'review';
    state.berryFeeding = 42;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) reviveMipingPea();
    canvas.focus?.();
    return;
  }
  if (littleDaveScene !== 'review') {
    if (littleDaveScene === 'tutorial') {
      littleDaveSeen = true;
      try { window.localStorage.setItem('trajectoryLittleDaveSeen', '1'); } catch {}
    }
    littleDaveScene = 'review';
    state.running = true;
    startBackgroundMusic();
    playSfx('battleStart');
    showToast('绿芽队先手');
  }
  updateUI();
  canvas.focus?.();
}

function resetLittleDave(showStart) {
  if (!ui.littleDaveGuide) return;
  littleDaveScene = 'review';
  ui.littleDaveChat.hidden = true;
  ui.littleDaveCharacter.setAttribute('aria-expanded', 'false');
  ui.littleDaveSprite.src = littleDaveStill;
  const opening = stageOpening();
  ui.littleDaveChat.setAttribute('data-map', state.map);
  ui.littleDaveGuide.hidden = !opening;
  ui.littleDaveCharacter.hidden = opening === mipingOpening || opening === roseOpening || opening === danceOpening;
  if (!opening) return;
  if (!ui.littleDaveCharacter.hidden) ui.littleDaveGuide.style.setProperty('--little-dave-ground', `${(terrainAt(W * .07) + 3) / H * 100}%`);
  if (!showStart && (opening !== gardenOpening || !littleDaveSeen)) openLittleDaveChat(true);
}

function resetGame(showStart = false) {
  prepareMapImage(state.map);
  stopCharacterVoice();
  const locationLabel = document.getElementById('gardenLocation');
  if (locationLabel) locationLabel.textContent = ui.mapSelect.selectedOptions?.[0]?.textContent || '晴日后院';
  state.matchId += 1;
  battleChart.reset();
  state.aimHold = null;
  state.scouting = false;
  state.lobTarget = null;
  ui.angleRange.step = '0.1';
  state.round = 1;
  state.running = !showStart;
  state.gameOver = false;
  state.berryFeeding = 0;
  state.active = 'player';
  state.timer = 20;
  state.wind = randomWind();
  state.angle = 45;
  state.power = 72;
  state.selectedWeapon = 'normal';
  state.selectedEnchants = [];
  state.charging = false;
  state.hitStopFrames = 0;
  state.frameAccumulator = 0;
  state.projectile = null;
  state.projectiles = [];
  state.returningHead = null;
  state.secondBuffer = 0;
  state.lastTick = performance.now();
  state.lastShot = null;
  state.lastPlayerImpact = null;
  state.impactFocus = null;
  state.hitFeedback = null;
  state.shotQueue = [];
  state.volleyActive = false;
  state.flight = null;
  state.particles = [];
  state.floaters = [];
  state.explosion = null;
  state.bursts = [];
  state.turnPending = false;
  state.shake = 0;
  state.flash = 0;
  state.cameraX = 0;
  state.cameraY = 0;
  state.zoom = 1;
  state.cloudPlatforms = state.map === 'pool' ? makeRosePlatforms() : state.map === 'canyon' ? MIPING_OBJECTS.map(object => ({ ...object })) : state.map === 'war' ? [
    { id: 'war-a', x: 460, y: 570, width: 420, height: 76 },
    { id: 'war-b', x: 980, y: 355, width: 380, height: 76 },
    { id: 'war-c', x: 1510, y: 600, width: 440, height: 76 },
    { id: 'war-d', x: 2050, y: 330, width: 400, height: 76 }
  ] : state.map === 'chaos' ? [
    { id: 'stone-a', x: 520, y: 470, width: 330, height: 76 },
    { id: 'stone-b', x: 1210, y: 285, width: 390, height: 76 },
    { id: 'stone-c', x: 1940, y: 445, width: 350, height: 76 }
  ] : [];
  state.clownFlight = null;
  state.danceSummon = null;
  state.knockback = null;
  state.zomboniDrop = null;
  state.newspaperRush = null;
  state.tunnelBlocks = state.map === 'tunnels' ? [
    { id: 'shelf-a', x: 235, y: 315 - TUNNEL_STRUCTURE_LIFT, width: 210, height: 28, health: 75, maxHealth: 75 },
    { id: 'wall-a', x: 430, y: 350 - TUNNEL_STRUCTURE_LIFT, width: 32, height: 128, health: 70, maxHealth: 70 },
    { id: 'shelf-b', x: 545, y: 378 - TUNNEL_STRUCTURE_LIFT, width: 230, height: 28, health: 85, maxHealth: 85 },
    { id: 'shelf-c', x: 775, y: 280 - TUNNEL_STRUCTURE_LIFT, width: 205, height: 30, health: 75, maxHealth: 75 },
    { id: 'wall-b', x: 910, y: 330 - TUNNEL_STRUCTURE_LIFT, width: 34, height: 145, health: 80, maxHealth: 80 },
    { id: 'shelf-d', x: 1040, y: 388 - TUNNEL_STRUCTURE_LIFT, width: 230, height: 30, health: 85, maxHealth: 85 }
  ] : [];
  // Suspended mine shelves are terrain; the upright mine supports keep their durability.
  const shelves = state.tunnelBlocks.filter(block => block.width > block.height);
  for (const shelf of shelves) {
    state.cloudPlatforms.push({ id: shelf.id, x: shelf.x, y: shelf.y - shelf.height / 2, width: shelf.width, height: shelf.height });
  }
  state.tunnelBlocks = state.tunnelBlocks.filter(block => block.width <= block.height);
  state.cloudPlatforms.forEach(initializePlatform);
  state.platformRevision = 0;
  state.aiCursor = 0;
  state.chaosQueue = [];
  state.chaosCursor = 0;
  state.cattailUsed = false;
  state.cattailOfferShown = false;
  state.mode = ui.modeSelect?.value || state.mode || '1v1';
  state.player = makeFighter('player');
  state.rivals = [makeFighter('rival')];
  if (state.mode === '1v2') {
    if (state.map === 'pool') {
      state.player.x = cloudPlatformById('rose-base').x + 36;
      state.rivals[0].x = cloudPlatformById('rose-west').x + 57;
      const vendor = makeFighter('rival', 'clownZombie');
      vendor.x = cloudPlatformById('rose-east').x - 55;
      state.rivals.push(vendor);
    } else {
      state.rivals.push(makeFighter('rival', 'normalZombie'));
    }
  }
  if (state.mode === 'clown') state.rivals = [makeFighter('rival', 'clownZombie')];
  if (state.mode === 'gauntlet') {
    state.rivals = [makeFighter('rival'), makeFighter('rival', 'normalZombie'), makeFighter('rival', 'clownZombie')];
    [1110, 900, 700].forEach((x, index) => { state.rivals[index].x = x; });
  }
  if (state.mode === 'dance') {
    state.rivals = [makeFighter('rival', 'dancingZombie')];
    state.rivals[0].x = 1010;
    if (state.map === 'dance') {
      state.player.x = 171 * DANCE_SCALE;
      state.rivals[0].x = 600 * DANCE_SCALE;
      const reader = makeFighter('rival', 'newspaperZombie');
      reader.x = 1058 * DANCE_SCALE;
      state.rivals.push(reader);
    }
  }
  if (state.mode === 'war') {
    state.rivals = [makeFighter('rival'), makeFighter('rival', 'normalZombie'), makeFighter('rival', 'clownZombie'), makeFighter('rival', 'dancingZombie')];
    [2190, 1980, 1740, 1510].forEach((x, index) => { state.rivals[index].x = x; });
  }
  if (state.mode === 'newspaper') {
    state.rivals = [makeFighter('rival', 'newspaperZombie')];
    state.rivals[0].x = 1010;
  }
  if (state.mode === 'chaos') {
    state.rivals = [makeFighter('rival'), makeFighter('rival', 'normalZombie'), makeFighter('rival', 'clownZombie'), makeFighter('rival', 'dancingZombie'), makeFighter('rival', 'newspaperZombie')];
    [2200, 2010, 1810, 1600, 1390].forEach((x, index) => { state.rivals[index].x = x; });
  }
  state.rival = state.rivals[0];
  generateTerrain();
  if (state.map === 'pool' || state.map === 'canyon') {
    for (const fighter of allFighters()) {
      fighter.platformId = landingPlatformAt(fighter.x, 0, terrainAt(fighter.x))?.id ?? null;
    }
    state.zoom = state.map === 'canyon' ? .4 : state.mode === '1v2' ? .6 : .75;
  }
  settleFighters();
  if (state.map === 'dance') {
    state.zoom = 1 / DANCE_SCALE;
    const start = cameraPosition(worldWidth()/2, worldHeight()/2);
    state.cameraX = start.x;
    state.cameraY = start.y;
  }
  if (state.map === 'canyon' || state.map === 'pool') {
    const start = cameraPosition(state.player.x, state.player.y);
    state.cameraX = start.x;
    state.cameraY = start.y;
  }
  if (['war', 'chaos'].includes(state.map)) {
    state.zoom = .78;
    state.cameraX = 0;
    state.cameraY = Math.max(0, Math.min(worldHeight() - viewportHeight(), state.player.y - viewportHeight() / 2));
  }
  ui.startOverlay.style.display = showStart ? 'grid' : 'none';
  ui.resultOverlay.hidden = true;
  if (ui.resultDave) ui.resultDave.hidden = true;
  if (ui.cattailRescueOverlay) ui.cattailRescueOverlay.hidden = true;
  if (ui.normalWeaponRow) ui.normalWeaponRow.hidden = false;
  if (ui.cattailWeaponRow) ui.cattailWeaponRow.hidden = true;
  if (ui.pumpkinButton) ui.pumpkinButton.hidden = true;
  if (ui.ultimateButton) ui.ultimateButton.hidden = false;
  const ultimateIcon = ui.ultimateButton?.querySelector?.('img');
  if (ultimateIcon) ultimateIcon.src = assetPaths.doom;
  if (ui.healButton) ui.healButton.hidden = false;
  if (state.mode === 'chaos') {
    state.running = false;
    ui.startOverlay.style.display = 'none';
    ui.daveOverlay.hidden = false;
  } else if (ui.daveOverlay) {
    ui.daveOverlay.hidden = true;
  }
  ui.angleRange.value = state.angle;
  ui.powerRange.value = state.power;
  ui.angleRange.max = 170;
  setWeapon('normal');
  setEnchant('none');
  resetLittleDave(showStart);
  updateUI();
}

function randomWind() {
  const value = Math.round((Math.random() * 16 - 8) * 10) / 10;
  return Math.abs(value) < 0.6 ? 0 : value;
}

function terrainAt(x) {
  const px = Math.max(0, Math.min(worldWidth() - 1, Math.round(x)));
  return state.terrain[px];
}

// The skyline supports outdoor actors. Below it, each excavated column can
// contain several separate air gaps, ordered from roof to floor.
function groundFloorAt(x, feetY) {
  const column = Math.max(0, Math.min(state.terrain.length - 1, Math.round(x)));
  return columnFloor(state, column, feetY);
}

function columnFloor(body, column, feetY) {
  let floor = body.terrain[column];
  const gaps = body.cavities[column];
  if (gaps) {
    for (const gap of gaps) {
      if (feetY < gap.top) break;
      floor = gap.bottom;
    }
  }
  return floor;
}

function groundSolidAt(x, y) {
  return x >= 0 && x < worldWidth() && y >= groundFloorAt(x, y);
}

function caveFlightBlocked(fromX, fromY, x, y) {
  if (state.map === 'canyon' && soilPlatformAtPoint(x, y)) return true;
  // Flight positions are body centres. Once below the skyline, keep the
  // body inside the passage instead of letting it rise through a solid roof.
  if (fromY < terrainAt(fromX) && y < terrainAt(x)) return false;
  if (!state.cavities[Math.round(fromX)] && !state.cavities[Math.round(x)]) return false;
  return groundFloorAt(x, y - 18) < y + 18;
}

function settleFighters() {
  if (!state.player || !state.rival) return;
  state.player.y = fighterSurfaceY(state.player);
  state.rivals.forEach(rival => {
    rival.y = fighterSurfaceY(rival);
  });
}

function checkPitFalls() {
  if (state.gameOver || !state.player || !state.rival) return false;
  const fallen = [state.player, ...state.rivals].filter(fighter => fighter.health > 0 && fighter.y >= pitDeathY());
  if (fallen.length === 0) return false;
  fallen.forEach(fighter => {
    fighter.health = 0;
    playDancerDefeat(fighter);
    state.floaters.push({ x: fighter.x, y: Math.min(fighter.y - 90, worldHeight() - 120), text: '烧死', color: '#ffb34b', life: 90 });
  });
  state.projectile = null;
  state.projectiles = [];
  state.shotQueue = [];
  state.volleyActive = false;
  state.returningHead = null;
  state.flight = null;
  updateUI();
  checkWinner();
  if (!state.gameOver && state.running && !state.turnPending) queueNextTurn(420);
  return true;
}

function aliveRivals() {
  return state.rivals.filter(rival => rival.health > 0);
}

function allFighters() {
  return [state.player, ...state.rivals].filter(Boolean);
}

function nearestAliveRival(x, y) {
  const rivals = aliveRivals();
  if (rivals.length === 0) return state.rival;
  return rivals.reduce((best, rival) => distance(x, y, rival.x, rival.y - 48) < distance(x, y, best.x, best.y - 48) ? rival : best, rivals[0]);
}

function updateUI() {
  if (!state.charging) stopChargeVoice();
  const p = state.player;
  const r = state.rival;
  if (!p || !r) return;
  if (p.health < p.maxHealth * .2 && !p.criticalRageTriggered) {
    p.rage = 100;
    p.criticalRageTriggered = true;
  } else if (p.health >= p.maxHealth * .2) {
    p.criticalRageTriggered = false;
  }
  const rivalMaxHealth = state.rivals.reduce((total, rival) => total + (rival.maxHealth || 100) + (rival.newspaperMaxHealth || 0), 0) || 100;
  const rivalHealth = state.rivals.reduce((total, rival) => total + Math.max(0, rival.health) + Math.max(0, rival.newspaperHealth || 0), 0);
  ui.playerHealth.textContent = Math.max(0, Math.round(p.health));
  if (ui.playerHealthMax) ui.playerHealthMax.textContent = `/ ${p.maxHealth}`;
  ui.rivalHealth.textContent = Math.max(0, Math.round(rivalHealth));
  if (ui.rivalHealthMax) ui.rivalHealthMax.textContent = `/ ${rivalMaxHealth}`;
  ui.playerHealthBar.style.width = `${Math.max(0, Math.min(100, p.health / p.maxHealth * 100))}%`;
  ui.rivalHealthBar.style.width = `${Math.max(0, rivalHealth / rivalMaxHealth * 100)}%`;
  ui.playerFighterHud?.classList.toggle('critical-health', p.health > 0 && p.health / p.maxHealth <= .25);
  ui.rivalFighterHud?.classList.toggle('critical-health', rivalHealth > 0 && rivalHealth / rivalMaxHealth <= .25);
  ui.playerFighterHud?.classList.toggle('active-turn', state.active === 'player' && state.running && !state.gameOver);
  ui.rivalFighterHud?.classList.toggle('active-turn', state.active === 'rival' && state.running && !state.gameOver);
  ui.timer.classList.toggle('urgent', turnClockActive() && state.timer <= 5);
  ui.timer.textContent = state.timer;
  if (ui.turnCountdown) {
    const finishing = state.timer === 0 && state.charging;
    ui.turnCountdown.hidden = !(turnClockActive() && state.active === 'player' && state.timer <= 5);
    ui.turnCountdown.classList.toggle('is-finishing', finishing);
    ui.turnCountdownValue.textContent = state.timer;
    ui.turnCountdownHint.textContent = finishing ? '可继续蓄力 · 松开发射' : '秒后超时';
  }
  const turnText = state.active === 'player' ? '你的回合' : '对手回合';
  const frozenSkip = state.turnPending && (state.active === 'player' ? p : state.rival)?.freezeFade > 0;
  ui.turnCopy.textContent = frozenSkip ? '冻结 · 跳过回合' : state.flight ? '飞行中' : state.clownFlight ? '小丑突进中' : state.projectile || state.volleyActive ? '弹丸飞行中' : turnText;
  const mobileWindArrow = state.wind < 0 ? '←' : state.wind > 0 ? '→' : '—';
  const mobileWindValue = Math.abs(state.wind).toFixed(1);
  ui.mobileTurn.textContent = frozenSkip ? '冻结 · 跳过回合' : `${turnText} · ${state.timer}`;
  if (ui.mobileWindArrow) ui.mobileWindArrow.textContent = mobileWindArrow;
  if (ui.mobileWindValue) ui.mobileWindValue.textContent = mobileWindValue;
  ui.windValue.textContent = Math.abs(state.wind).toFixed(1);
  ui.windArrow.textContent = state.wind < 0 ? '←' : state.wind > 0 ? '→' : '—';
  ui.angleValue.textContent = formatAngle(state.angle);
  const shotReference = document.getElementById('shotReference');
  const lastPowerMark = document.getElementById('lastPowerMark');
  if (shotReference) {
    shotReference.hidden = !state.lastShot || state.active !== 'player' || !state.running || state.gameOver;
    if (state.lastShot) {
      const shot = state.lastShot;
      shotReference.textContent = `上一发 ${formatAngle(shot.angle)} · 力度 ${shot.power} · 风 ${shot.wind < 0 ? '←' : shot.wind > 0 ? '→' : '—'} ${Math.abs(shot.wind).toFixed(1)}`;
    }
  }
  if (lastPowerMark) {
    lastPowerMark.hidden = !state.lastShot || p.flightArmed;
    if (state.lastShot) lastPowerMark.style.setProperty('--last-power', `${state.lastShot.power / 100 * 100}%`);
  }
  ui.powerRow.style.setProperty('--charge-level', Math.max(0, Math.min(100, (state.power / 100) * 100)).toFixed(1));
  ui.staminaText.textContent = Math.round(p.stamina);
  const enchants = aimedEnchants();
  ui.enchantCost.textContent = `${enchants.length}/2 次 · ${getEnchantCost(enchants)} 体力`;
  ui.moveEnergy.style.width = `${p.stamina}%`;
  ui.fireAmmo.textContent = p.ammo.fire;
  ui.iceAmmo.textContent = p.ammo.ice;
  ui.potatoAmmo.textContent = p.ammo.potato;
  if (ui.pumpkinShieldValue) ui.pumpkinShieldValue.textContent = `${Math.round(p.shieldHealth || 0)}/50`;
  const busy = ui.littleDaveChat?.hidden === false || !!state.projectile || state.volleyActive || !!state.returningHead || !!state.flight || !!state.clownFlight || state.turnPending;
  ui.flightButton.classList.toggle('armed', p.flightArmed);
  ui.flightButton.disabled = !p.flightAvailable || state.active !== 'player' || busy || state.charging || state.gameOver;
  const flightCount = ui.flightButton.querySelector?.('b');
  if (flightCount) flightCount.textContent = '∞';
  ui.zoomOut.disabled = state.zoom <= minimumZoom();
  ui.zoomIn.disabled = state.zoom >= 1.6;
  const zoomPercent = document.getElementById('zoomPercent');
  if (zoomPercent) zoomPercent.textContent = Math.round(state.zoom * 100) + '%';
  updateScoutPanel();
  battleChart.sync();
  ui.healButton.disabled = p.healsRemaining <= 0 || state.active !== 'player' || busy || state.charging || state.gameOver || p.health >= p.maxHealth;
  const healCount = ui.healButton.querySelector?.('b');
  if (healCount) healCount.textContent = p.healsRemaining;
  const canAct = canPlayerAct();
  ui.rageFill.style.width = `${Math.max(0, Math.min(100, p.rage))}%`;
  ui.rageValue.textContent = `${Math.round(p.rage)}%`;
  ui.ultimateButton.disabled = !canAct || state.charging || p.flightArmed || p.rage < 100;
  ui.ultimateButton.classList.toggle('ready', p.rage >= 100 && !p.ultimateArmed);
  ui.ultimateButton.classList.toggle('armed', p.ultimateArmed);
  ui.ultimateButton.setAttribute?.('aria-pressed', String(p.ultimateArmed));
  ui.fireButton.disabled = !canAct;
  ui.fireButtonLabel.textContent = p.flightArmed ? '起飞' : p.ultimateArmed ? '发射绝技' : '发射';
  ui.fireButtonHint.textContent = state.charging ? '松开发射 · ESC 取消' : p.flightArmed ? '选角度力度' : '点按发射 · 长按蓄力';
  ui.fireButton.title = ui.fireButtonHint.textContent;
  ui.fireButton.classList.toggle('charging', state.charging);
  ui.powerRow.classList.toggle('charging', state.charging);
  ui.powerRow.classList.toggle('max-charge', state.charging && state.power >= 94);
  const freeStamina = p.stamina - getEnchantCost(enchants);
  const canWalk = !state.charging && !p.flightArmed && freeStamina >= 10 && p.frozenTurns <= 0;
  const facing = playerAimDirection(state.angle);
  ui.moveLeft.disabled = !canAct || (facing < 0 && !canWalk);
  ui.moveRight.disabled = !canAct || (facing > 0 && !canWalk);
  ui.angleRange.disabled = !canAct;
  document.getElementById('compassNeedle')?.setAttribute('transform', `rotate(${-state.angle} 60 60)`);
  for (const button of anglePadButtons) button.disabled = ui.angleRange.disabled;
  ui.powerRange.disabled = !canAct || state.charging;
  ui.weaponButtons.forEach(button => {
    const type = button.dataset.weapon;
    button.hidden = (type === 'dogwood') !== !!p.berryCrowned;
    button.classList.toggle('active', type === aimedWeapon());
    button.setAttribute?.('aria-pressed', String(type === aimedWeapon()));
    button.classList.toggle('depleted', p.ammo[type] <= 0);
    button.disabled = !canAct || state.charging || p.flightArmed;
  });
  ui.cattailWeaponButtons.forEach(button => {
    const type = button.dataset.cattailWeapon;
    button.classList.toggle('active', type === state.selectedWeapon);
    button.disabled = p.variant !== 'cattail' || !canAct || state.charging || p.flightArmed;
  });
  if (ui.pumpkinButton) {
    ui.pumpkinButton.disabled = p.variant !== 'cattail' || !canAct || state.charging || p.flightArmed || p.pumpkinUsedThisTurn || p.stamina < 30;
    ui.pumpkinButton.classList.toggle('active', (p.shieldHealth || 0) > 0);
  }
  ui.enchantButtons.forEach(button => {
    const type = button.dataset.enchant;
    const selectedCount = enchants.filter(item => item === type).length;
    const alreadySelected = selectedCount > 0;
    button.dataset.count = selectedCount > 1 ? String(selectedCount) : '';
    button.classList.toggle('active', type === 'none' ? enchants.length === 0 : alreadySelected);
    button.setAttribute?.('aria-pressed', String(type === 'none' ? enchants.length === 0 : alreadySelected));
    const canRemoveFromFullSlots = state.selectedEnchants.length >= 2 && alreadySelected;
    const nextCost = type === 'none' || canRemoveFromFullSlots ? getEnchantCost(state.selectedEnchants) : getEnchantCost([...state.selectedEnchants, type]);
    button.disabled = !canAct || state.charging || p.flightArmed || p.ultimateArmed || (type !== 'none' && state.selectedEnchants.length >= 2 && !alreadySelected) || nextCost > p.stamina;
  });
}

function formatAngle(angle) {
  if (angle === 90) return '90°';
  const elevation = Math.round(Math.min(angle, 180 - angle) * 10) / 10;
  return `${angle > 90 ? '左' : '右'} ${elevation}°`;
}

function playerAimDirection(angle) {
  if (angle === 90) return state.player.moveDirection || 1;
  return angle > 90 ? -1 : 1;
}

function getEnchantCost(types) {
  return types.reduce((total, type) => total + (enchantments[type]?.cost || 0), 0);
}

function composeEnchantment(types) {
  let shots = [{ angleOffset: 0, damageScale: 1, radiusScale: 1, waveIndex: 0 }];
  types.forEach(type => {
    const enchant = enchantments[type];
    if (!enchant) return;
    if (enchant.offsets) {
      shots = shots.flatMap(shot => enchant.offsets.map(offset => ({
        angleOffset: shot.angleOffset + offset,
        damageScale: shot.damageScale * enchant.damageMultiplier,
        radiusScale: shot.radiusScale * enchant.radiusMultiplier,
        waveIndex: shot.waveIndex
      })));
    } else if (enchant.copies) {
      const sourceShots = shots;
      const waveCount = Math.max(...sourceShots.map(shot => shot.waveIndex)) + 1;
      shots = Array.from({ length: enchant.copies }, (_, copyIndex) => sourceShots.map(shot => ({
        angleOffset: shot.angleOffset,
        damageScale: shot.damageScale * enchant.damageMultiplier,
        radiusScale: shot.radiusScale * enchant.radiusMultiplier,
        waveIndex: shot.waveIndex + copyIndex * waveCount
      }))).flat();
    } else {
      shots = shots.map(shot => ({
        angleOffset: shot.angleOffset,
        damageScale: shot.damageScale * (enchant.damageMultiplier || 1),
        radiusScale: shot.radiusScale * (enchant.radiusMultiplier || 1),
        waveIndex: shot.waveIndex
      }));
    }
  });
  return {
    cost: getEnchantCost(types),
    label: types.length ? types.map(type => enchantments[type].label).join(' + ') : '无附魔',
    shots,
    simultaneous: shots.some((shot, index) => index > 0 && shot.waveIndex === shots[index - 1].waveIndex)
  };
}

function setWeapon(type) {
  if (!weapons[type]) return;
  if ((type === 'dogwood') !== !!state.player?.berryCrowned) return;
  if (state.charging) return;
  state.player.ultimateArmed = false;
  if (checkShotAmmo(state.player, type) && type !== state.selectedWeapon) playSfx('seedPick');
  state.selectedWeapon = type;
  updateUI();
}

function setEnchant(type) {
  if (!enchantments[type] || !state.player) return;
  if (state.charging || state.player.ultimateArmed) return;
  if (type === 'none') {
    if (state.selectedEnchants.length) playSfx('button');
    state.selectedEnchants = [];
    updateUI();
    return;
  }
  if (state.player.flightArmed) return;
  if (state.selectedEnchants.length >= 2) {
    const lastIndex = state.selectedEnchants.lastIndexOf(type);
    if (lastIndex >= 0) {
      state.selectedEnchants = state.selectedEnchants.filter((_, index) => index !== lastIndex);
      playSfx('button');
    }
    else showToast('最多选择两个附魔');
    updateUI();
    return;
  }
  if (getEnchantCost([...state.selectedEnchants, type]) > state.player.stamina) {
    showToast('体力不足，无法叠加这个附魔');
    return;
  }
  state.selectedEnchants = [...state.selectedEnchants, type];
  playSfx('enchantNote', { rate: state.selectedEnchants.length === 2 ? 1.25 : 1 });
  updateUI();
}

function showToast(message, duration = 1200) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => ui.toast.classList.remove('show'), duration);
}

function canPlayerAct() {
  return state.running && !state.gameOver && state.active === 'player' &&
    (state.timer > 0 || state.charging) &&
    ui.littleDaveChat?.hidden !== false && state.player?.attackFreezeTurns <= 0 &&
    !state.projectile && !state.volleyActive && !state.returningHead && !state.flight &&
    !state.clownFlight && !state.knockback && !state.turnPending;
}

function movePlayer(direction) {
  if (!canPlayerAct()) return;
  const p = state.player;
  if (direction !== playerAimDirection(state.angle)) {
    state.angle = 180 - state.angle;
    p.moveDirection = direction;
    ui.angleRange.value = state.angle;
    updateUI();
    return;
  }
  const freeStamina = p.stamina - getEnchantCost(aimedEnchants());
  if (state.charging || freeStamina < 10 || p.frozenTurns > 0 || p.flightArmed) return;
  p.moveDirection = direction;
  const next = boundPlayerX(p.x + direction * 14);
  if (next === p.x) {
    updateUI();
    return;
  }
  const currentSurface = fighterSurfaceY(p);
  if (['canyon', 'pool'].includes(state.map) && soilPlatformAtPoint(next, currentSurface - 29)) {
    showToast('前方有阻挡，可以飞越');
    updateUI();
    return;
  }
  const platform = p.platformId && cloudPlatformById(p.platformId);
  const surface = platform ? platformSurfaceY(platform, next, currentSurface) : Infinity;
  const nextSurface = Number.isFinite(surface) ? surface : groundFloorAt(next, currentSurface);
  const climb = nextSurface - currentSurface;
  if (Math.abs(climb) > 28) {
    showToast('坡度太陡');
    updateUI();
    return;
  }
  if (nextSurface > terrainAt(next) && groundFloorAt(next, nextSurface - 48) < nextSurface) {
    showToast('洞口太窄，再挖大一点');
    updateUI();
    return;
  }
  p.x = next;
  p.stepSide = -(p.stepSide || 1);
  p.movePulse = 18;
  p.platformId = Number.isFinite(surface) ? platform.id : null;
  p.y = fighterSurfaceY(p);
  p.stamina = Math.max(0, p.stamina - 10);
  playSfx('step');
  updateUI();
}

function armFlight() {
  if (!canPlayerAct() || state.charging) return;
  const p = state.player;
  if (!p.flightAvailable || state.active !== 'player' || state.charging || state.projectile || state.volleyActive || state.flight) return;
  p.flightArmed = !p.flightArmed;
  playSfx(p.flightArmed ? 'flightReady' : 'button');
  p.ultimateArmed = false;
  state.selectedEnchants = [];
  ui.angleRange.value = state.angle;
  showToast(p.flightArmed ? '飞行已就绪：大于 90° 向左飞' : '已取消飞行');
  updateUI();
}

function useHeal() {
  if (!canPlayerAct() || state.charging) return;
  const p = state.player;
  if (p.healsRemaining <= 0 || p.health >= p.maxHealth) return;
  const amount = Math.min(24, p.maxHealth - p.health);
  p.health += amount;
  p.healsRemaining -= 1;
  playSfx('supplyPick');
  state.floaters.push({ x: p.x, y: p.y - 82, text: `+${amount}`, color: '#8eea65', life: 80 });
  showToast(`恢复 ${amount} 点生命 · 补给剩余 ${p.healsRemaining} 次`);
  updateUI();
}

function aimedWeapon() {
  if (state.player.berryCrowned) return 'dogwood';
  return state.player.ultimateArmed ? 'ultimate' : state.selectedWeapon;
}

function aimedEnchants() {
  return state.player.ultimateArmed ? [] : state.selectedEnchants;
}

function handlePrimaryAction() {
  if (state.player.flightArmed) launchFlight();
  else fireShot('player', state.angle, state.power, state.player.ultimateArmed ? 'ultimate' : aimedWeapon(), aimedEnchants());
}

function armUltimate() {
  const p = state.player;
  if (!canPlayerAct() || state.charging || p.flightArmed || p.variant === 'cattail' || p.rage < 100) return;
  p.ultimateArmed = !p.ultimateArmed;
  playSfx(p.ultimateArmed ? 'doomReady' : 'button');
  const ultimateName = p.berryCrowned ? '山茱萸大爆发' : '末日菇';
  showToast(p.ultimateArmed ? ultimateName + '已就绪，调好角度和蓄力再发射' : '已取消绝技');
  updateUI();
}

function beginCharge() {
  if (!canPlayerAct() || state.charging || state.timer <= 0) return;
  if (!state.player.flightArmed && !checkShotAmmo(state.player, aimedWeapon())) return;
  state.scouting = false;
  state.powerBeforeCharge = state.power;
  state.charging = true;
  state.chargeStartedAt = performance.now();
  state.power = 0;
  updateChargeVoice(0);
  if (!chargeVoice) playSfx('charge');
  ui.powerRange.value = state.power;
  updateUI();
}

function releaseCharge(forced = false) {
  if (!state.charging) return;
  state.charging = false;
  state.power = Math.max(0, Math.min(100, (Math.round(state.power * 2) / 2)));
  ui.powerRange.value = state.power;
  updateUI();
  handlePrimaryAction();
}

function cancelCharge() {
  if (!state.charging) return;
  state.charging = false;
  state.power = state.powerBeforeCharge ?? state.power;
  ui.powerRange.value = state.power;
  updateUI();
}

function updateCharging(now) {
  if (!state.charging) return;
  const fallStart = CHARGE_RISE_MS + CHARGE_PEAK_MS;
  const elapsed = Math.max(0, now - state.chargeStartedAt) % (fallStart + CHARGE_FALL_MS);
  const previousPower = state.power;
  const rising = elapsed < CHARGE_RISE_MS;
  const progress = rising ? elapsed / CHARGE_RISE_MS : 1 - Math.max(0, elapsed - fallStart) / CHARGE_FALL_MS;
  // Blend a linear ramp with smoothstep so the ends ease without a dead zone on press.
  const smooth = progress * progress * (3 - 2 * progress);
  state.power = 100 * (progress + smooth) / 2;
  if (state.power === 100 && previousPower < 100) {
    playTone(740, .18, { endFrequency: 990, volume: .043, type: 'sine' });
  }
  updateChargeVoice(state.power);
  ui.powerRange.value = state.power;
  ui.powerRow.style.setProperty('--charge-level', Math.max(0, Math.min(100, (state.power / 100) * 100)).toFixed(1));
  ui.powerRow.classList.toggle('max-charge', state.power >= 94);
}

function checkShotAmmo(shooter, weaponType) {
  if (!(weaponType in shooter.ammo) || shooter.ammo[weaponType] > 0) return true;
  if (shooter === state.player) showToast('没有弹药，请切换弹药');
  return false;
}

function fireShot(shooterSide, angle, power, weaponType, enchantTypes = []) {
  if (state.active !== shooterSide || state.charging || state.projectile || state.volleyActive || state.returningHead || state.flight || state.turnPending || state.gameOver || !state.running) return;
  const shooter = shooterSide === 'player' ? state.player : state.rival;
  const ultimateShot = weaponType === 'ultimate';
  if (shooter.attackFreezeTurns > 0) return;
  if (ultimateShot && (!shooter.ultimateArmed || shooter.rage < 100)) return;
  if (shooterSide === 'player' && shooter.berryCrowned) weaponType = 'dogwood';
  if (shooterSide === 'rival' && shooter.variant === 'default') weaponType = 'fruitKnife';
  if (!checkShotAmmo(shooter, weaponType)) return;
  const chosenEnchants = Array.isArray(enchantTypes) ? enchantTypes : enchantTypes === 'none' ? [] : [enchantTypes];
  const enchant = shooterSide === 'player' ? composeEnchantment(chosenEnchants) : composeEnchantment([]);
  if (shooter.stamina < enchant.cost) {
    if (shooterSide === 'player') showToast('体力不足，无法使用这个附魔');
    return;
  }
  if (ultimateShot) {
    shooter.rage = 0;
    shooter.ultimateArmed = false;
  }
  shooter.stamina -= enchant.cost;
  if (weaponType in shooter.ammo) shooter.ammo[weaponType] -= 1;
  if (shooterSide === 'player') {
    state.lastShot = { angle, power: Math.round(power * 2) / 2, wind: state.wind, weapon: weaponType };
    state.lastPlayerImpact = null;
    state.hitFeedback = null;
  }
  state.volleyActive = true;
  state.shotQueue = enchant.shots.map(shot => ({
    side: shooterSide,
    shooter,
    angle: Math.max(8, Math.min(172, angle + shot.angleOffset)),
    power,
    weapon: weaponType,
    damageScale: shot.damageScale * (shooter.variant === 'normalZombie' && weaponType === 'normal' ? 1.35 : 1),
    radiusScale: ultimateShot ? weapons.ultimate.radius / weapons[weaponType].radius : shot.radiusScale * (shooter.variant === 'normalZombie' && weaponType === 'normal' ? 1.08 : 1),
    image: shooter.variant === 'normalZombie' && weaponType === 'normal' ? 'zombieHead' : null,
    returningHead: shooter.variant === 'normalZombie' && weaponType === 'normal',
    lifeSteal: shooter.variant === 'normalZombie' && weaponType === 'normal' ? 0.45 : 0,
    waveIndex: shot.waveIndex
  }));
  const loadoutLabel = chosenEnchants.length === 0 || shooterSide === 'rival' ? weapons[weaponType].label : `${enchant.label} · ${weapons[weaponType].label}`;
  showToast(shooterSide === 'player' ? `${loadoutLabel} · 力度 ${Math.round(power)}` : loadoutLabel);
  startNextShot();
  updateUI();
}

function startNextShot() {
  if (!state.volleyActive || state.projectile || state.shotQueue.length === 0) return;
  const waveIndex = state.shotQueue[0].waveIndex ?? 0;
  const shots = [];
  while (state.shotQueue.length > 0 && (state.shotQueue[0].waveIndex ?? 0) === waveIndex) shots.push(state.shotQueue.shift());
  if (shots[0].weapon === 'fruitKnife') {
    shots[0].shooter.knifeThrow = { elapsed: 0, shots, released: false, facingRight: shots[0].angle > 90 };
    return;
  }
  state.projectiles = shots.map((shot, index) => createProjectile(shot, index === 0));
  state.projectile = state.projectiles[0] || null;
}

function createProjectile(shot, audible = true) {
  const shooter = shot.shooter || (shot.side === 'player' ? state.player : state.rival);
  const initial = projectileLaunchVelocity(shot.angle, shot.power, shot.side);
  const vx = initial.vx;
  const direction = shot.side === 'player' ? playerAimDirection(shot.angle) : (vx >= 0 ? 1 : -1);
  shooter.attackPulse = 14;
  if (shot.weapon === 'basketball') shooter.attackFacing = direction;
  state.shake = Math.max(state.shake, shot.side === 'player' ? 2.5 : 1.5);
  if (shot.returningHead) shooter.headDetached = true;
  if (audible) {
    if (shot.weapon === 'fruitKnife') playCharacterVoice('huaqiangThrow');
    else playSfx(weapons[shot.weapon]?.launchSfx || 'shot', { force: true });
  }
  const [launchX, launchY] = launchOffsetFor(shooter, shot.weapon);
  return {
    x: shooter.x + direction * launchX,
    y: shooter.y - launchY,
    ...initial,
    side: shot.side,
    shooter,
    weapon: shot.weapon,
    damageScale: shot.damageScale,
    radiusScale: shot.radiusScale,
    image: shot.image,
    returningHead: shot.returningHead,
    lifeSteal: shot.lifeSteal,
    trail: [],
    age: 0,
    trailClock: 0,
    rotation: Math.atan2(initial.vy, initial.vx)
  };
}

// Share collision queries with the aiming guide. Sample the swept segment so
// fast shots cannot tunnel through thin walls or a nearby fighter.
function projectileContact(p, x, y, age) {
  const data = weapons[p.weapon];
  const platform = soilPlatformAtPoint(x, y);
  if (platform && (!data.phasing || platform.permanent)) return { x, y };
  const target = p.side === 'player' ? nearestAliveRival(x, y) : state.player;
  const shooter = p.shooter || (p.side === 'player' ? state.player : state.rival);
  if (target?.health > 0 && age > 8 && distance(x, y, target.x, target.y - 48) < (target.side === 'rival' ? 47 : 37)) return { x, y, fighter: target };
  if (!data.phasing && age > 26 && shooter?.health > 0 && distance(x, y, shooter.x, shooter.y - 48) < 35) return { x, y, fighter: shooter };
  if (data.phasing) return null;
  if (state.map === 'land' && window.PZMapDetails?.marketContact(x, y)) return { x, y };
  if (groundSolidAt(x, y)) return { x, y };
  if (state.map === 'tunnels' && tunnelBlockAt(x, y)) return { x, y };
  return null;
}

function sweptProjectileContact(p, fromX, fromY, fromAge) {
  const steps = Math.max(1, Math.ceil(distance(fromX, fromY, p.x, p.y) / 2));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const contact = projectileContact(p, fromX + (p.x - fromX) * t, fromY + (p.y - fromY) * t, fromAge + (p.age - fromAge) * t);
    if (contact) return contact;
  }
  return null;
}

function finishProjectile(projectile, delay = 260) {
  state.projectiles = state.projectiles.filter(item => item !== projectile);
  state.projectile = state.projectiles[0] || null;
  if (state.projectiles.length === 0) resolveVolleyShot(delay);
}

function resolveVolleyShot(delay = 260) {
  state.projectile = null;
  state.projectiles = [];
  const matchId = state.matchId;
  gameTimeout(() => {
    if (state.gameOver || matchId !== state.matchId) return;
    if (state.player.health <= 0 || aliveRivals().length === 0) {
      state.shotQueue = [];
      state.volleyActive = false;
      checkWinner();
      return;
    }
    if (state.shotQueue.length > 0) {
      startNextShot();
      return;
    }
    state.volleyActive = false;
    queueNextTurn(520);
    updateUI();
  }, delay);
}

function launchFlight() {
  const p = state.player;
  if (!p.flightArmed || !p.flightAvailable || p.attackFreezeTurns > 0 || state.active !== 'player' || state.projectile || state.volleyActive || state.flight || state.turnPending || state.gameOver) return;
  const velocity = projectileLaunchVelocity(state.angle, state.power);
  p.flightArmed = false;
  p.platformId = null;
  state.flight = {
    x: p.x,
    y: p.y - 36,
    vx: velocity.vx,
    vy: velocity.vy,
    age: 0,
    trail: []
  };
  playSfx('flight');
  state.shake = Math.max(state.shake, 3);
  showToast('起飞！');
  updateUI();
}

function updateFlight() {
  const flight = state.flight;
  if (!flight) return;
  const dt = PROJECTILE_TIME_SCALE * state.timeScale;
  const steps = Math.max(1, Math.ceil(Math.hypot(flight.vx, flight.vy) * dt / 6));
  for (let i = 0; i < steps && state.flight; i++) advanceFlightStep(flight, dt / steps);
  if (!state.flight) return;
  flight.trail.push({ x: flight.x, y: flight.y, life: 24 });
  flight.trail.forEach(point => point.life -= state.timeScale);
  flight.trail = flight.trail.filter(point => point.life > 0);
}

function advanceFlightStep(flight, scale) {
  const previousX = flight.x, previousY = flight.y;
  const previousBottom = flight.y + 36;
  flight.age += scale;
  advanceFlightMotion(flight, scale);
  if (state.map === 'pool' && soilPlatformAtPoint(flight.x, flight.y)) {
    flight.x = previousX;
    flight.vx = 0;
    if (soilPlatformAtPoint(previousX, flight.y)) {
      flight.y = previousY;
      flight.vy = Math.max(0, flight.vy);
    }
  }
  const blocked = caveFlightBlocked(previousX, previousY, flight.x, flight.y);
  if (blocked) {
    flight.x = previousX;
    flight.y = previousY;
  }
  const boundedX = flight.x;
  state.player.x = boundedX;
  state.player.y = flight.y + 36;
  const cloud = flight.vy > 0 ? landingPlatformAt(boundedX, previousBottom, flight.y + 36) : null;
  const landedOnCloud = cloud && flight.y + 36 >= platformSurfaceY(cloud, boundedX, previousBottom);
  const landed = flight.age > 12 && flight.vy > 0 && groundSolidAt(boundedX, flight.y + 36);
  if (flight.y + 36 >= pitDeathY()) {
    state.player.y = pitDeathY();
    checkPitFalls();
    return;
  }
  if (landed || landedOnCloud || blocked || flight.y > worldHeight()) {
    state.player.x = boundedX;
    const support = landedOnCloud ? cloud : blocked && state.map === 'canyon' ? landingPlatformAt(boundedX, previousY, terrainAt(boundedX)) : null;
    state.player.platformId = support?.id ?? null;
    state.player.y = fighterSurfaceY(state.player);
    state.player.movePulse = 12;
    state.shake = Math.max(state.shake, Math.min(6, Math.abs(flight.vy) * .4));
    for (let i = 0; i < 12; i++) state.particles.push({ x: boundedX, y: state.player.y - 3, vx: (i - 5.5) * .65, vy: -1 - Math.random() * 1.4, size: 2 + Math.random() * 3, color: '#c5dbc0', life: 16 + Math.random() * 10 });
    playSfx('step');
    state.flight = null;
    ui.angleRange.value = state.angle;
    showToast('安全着陆');
    queueNextTurn(620);
    updateUI();
  }
}

function updateProjectile() {
  if (state.projectiles.length === 0) return;
  [...state.projectiles].forEach(updateSingleProjectile);
}

function updateSingleProjectile(p) {
  if (!state.projectiles.includes(p)) return;
  const previousX = p.x, previousY = p.y, previousAge = p.age;
  const timeStep = PROJECTILE_TIME_SCALE * state.timeScale;
  const weaponData = weapons[p.weapon];
  advanceProjectileMotion(p, timeStep, p.weapon, p.side);
  p.age += timeStep;
  p.rotation = Math.atan2(p.vy, p.vx);
  p.trailClock = (p.trailClock || 0) + timeStep;
  if (p.trailClock >= 1.25) {
    p.trailClock %= 1.25;
    p.trail.push({ x: p.x, y: p.y, life: 20 });
  }
  p.trail.forEach(point => point.life -= state.timeScale);
  p.trail = p.trail.filter(point => point.life > 0);

  const target = p.side === 'player' ? nearestAliveRival(p.x, p.y) : state.player;
  if (!target) {
    finishProjectile(p, 140);
    return;
  }
  const contact = sweptProjectileContact(p, previousX, previousY, previousAge);
  if (contact) {
    p.x = contact.x;
    p.y = contact.y;
    p.directHit = contact.fighter || null;
    if (p.side === 'player') state.lastPlayerImpact = { x: contact.x, y: contact.y };
    explode(p.x, p.y, p);
    return;
  }
  if ((!weaponData.phasing && (p.y > worldHeight() + 50)) || p.age > 900) {
    showToast('这一发飞出了后院');
    if (p.returningHead) {
      startHeadReturn(p);
      return;
    }
    finishProjectile(p, 140);
    return;
  }
}

function startHeadReturn(projectile) {
  const shooter = projectile.shooter;
  state.projectiles = state.projectiles.filter(item => item !== projectile);
  state.projectile = state.projectiles[0] || null;
  state.returningHead = {
    shooter,
    x: Math.max(-40, Math.min(worldWidth() + 40, projectile.x)),
    y: Math.max(-40, Math.min(worldHeight() + 40, projectile.y)),
    rotation: projectile.rotation || 0
  };
}

function updateReturningHead() {
  const head = state.returningHead;
  if (!head) return;
  const shooter = head.shooter;
  if (!shooter || shooter.health <= 0) {
    state.returningHead = null;
    resolveVolleyShot(180);
    return;
  }
  const [offsetX, offsetY] = launchOffsetFor(shooter, 'normal');
  const tx = shooter.x + (state.player.x > shooter.x ? 1 : -1) * offsetX;
  const ty = shooter.y - offsetY;
  const dx = tx - head.x;
  const dy = ty - head.y;
  const dist = Math.hypot(dx, dy);
  const speed = 15 * state.timeScale;
  if (dist <= speed) {
    shooter.headDetached = false;
    state.returningHead = null;
    resolveVolleyShot(220);
    return;
  }
  head.x += dx / dist * speed;
  head.y += dy / dist * speed;
  head.rotation = Math.atan2(dy, dx);
}

function fighterMapScale() {
  return ['war', 'chaos'].includes(state.map) ? .72 : 1;
}

// The 166×144 walk sprite has its head centered at (88, 46) facing left.
const flyingZombieHeight = 108;
function launchOffsetFor(shooter, weapon) {
  if (shooter.variant === 'normalZombie' && weapon === 'normal') {
    const scale = flyingZombieHeight / 144 * fighterMapScale();
    return [-5 * scale, 98 * scale - 7];
  }
  return weapons[weapon].launchOffset || [34, 58];
}

function triggerNewspaperRage(fighter) {
  if (fighter.enraged) return;
  fighter.enraged = true;
  fighter.rageTransition = 70;
  fighter.imageKey = 'newspaperLost';
  state.shake = Math.max(state.shake, 10);
  state.floaters.push({ x: fighter.x, y: fighter.y - 130, text: '报纸破碎!', color: '#ff765c', life: 100 });
  showToast('读报僵尸被激怒了！红眼模式开启');
  playSfx('newspaperRip');
  gameTimeout(() => playSfx('newspaperRage'), 220);
}

function explode(x, y, projectile) {
  const data = weapons[projectile.weapon];
  const radius = data.radius * projectile.radiusScale;
  const damage = data.damage * projectile.damageScale;
  const craterRadius = data.crater * (.82 + projectile.radiusScale * .18);
  const angle = Math.hypot(projectile.vx, projectile.vy) > .01 ? Math.atan2(projectile.vy, projectile.vx) : null;
  state.impactFocus = { x, y, life: 38 };
  state.explosion = { x, y, radius, direct: !!projectile.directHit, weapon: projectile.weapon, color: data.tint, nuclear: data.nuclear, bigBlast: data.bigBlast, life: data.nuclear ? 58 : 36, maxLife: data.nuclear ? 58 : 36 };
  state.bursts.push(state.explosion);
  state.explosion.angle = angle;
  if (state.bursts.length > 12) state.bursts.shift();
  const strongBlast = projectile.weapon === 'fire' || projectile.damageScale > 1;
  const impulse = data.nuclear ? 29 : data.bigBlast ? 16 : strongBlast ? 13 : 6;
  state.shake = Math.max(state.shake, impulse + (projectile.directHit ? 3 : 0));
  if (projectile.directHit && projectile.weapon !== 'normal') playTone(148, .09, { type: 'triangle', endFrequency: 63, volume: .045 });
  state.flash = data.nuclear ? .30 : data.bigBlast ? 0.4 : projectile.weapon === 'fire' ? 0.34 : 0.18;
  const impactSound = data.sfx || (data.nuclear ? 'nuke' : 'blast');
  playSfx(impactSound);
  const cut = deformTerrain(x, y, craterRadius, angle);
  cutPlatforms(x, y, craterRadius, angle);
  if (state.map === 'tunnels') damageTunnelBlocks(x, y, radius, data.nuclear ? damage * 2.4 : damage);
  if (cut) {
    cut.tint = data.tint;
    cut.sootOpacity = data.attackFreezeTurns ? .48 : (projectile.weapon === 'fire' || data.bigBlast ? 1 : .8);
    if (data.bigBlast) playSfx('earthThump');
    spawnGroundDebris(cut);
  }

  const fleckCount = data.nuclear ? 48 : data.bigBlast ? 30 : 16;
  const fleckLight = data.attackFreezeTurns ? '#defaff' : projectile.weapon === 'normal' ? '#e0f4a2' : '#fff0b7';
  for (let i = 0; i < fleckCount; i += 1) {
    const a = angle !== null && i % 3 ? angle + (Math.random() - .5) * 1.7 : Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5;
    state.particles.push({
      x, y: y - 5,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 1.8,
      kind: data.attackFreezeTurns ? 'iceShard' : 'spark',
      color: Math.random() > .45 ? data.tint : fleckLight,
      size: 2 + Math.random() * 6,
      life: 15 + Math.random() * 18
    });
  }

  let enemyDamage = 0;
  let hitCount = 0, defeated = 0, absorbedTotal = 0;
  allFighters().forEach(fighter => {
    if (fighter.health <= 0) return;
    if (data.noSelfDamage && fighter === projectile.shooter) return;
    const d = projectile.directHit === fighter ? 0 : distance(x, y, fighter.x, fighter.y - 42);
    if (d < radius) {
      const dealt = Math.max(5, Math.round(damage * (1 - d / radius * 0.72)));
      let healthDamage = dealt;
      if (fighter.side === 'player' && fighter.shieldHealth > 0 && projectile.side !== 'player') {
        const absorbed = Math.min(fighter.shieldHealth, healthDamage);
        fighter.shieldHealth -= absorbed;
        healthDamage -= absorbed;
        playSfx('shieldHit');
        state.floaters.push({ x: fighter.x, y: fighter.y - 120, text: `盾-${absorbed}`, color: '#ffb85c', life: 75 });
      }
      if (fighter.variant === 'newspaperZombie' && fighter.newspaperHealth > 0 && projectile.side !== fighter.side) {
        const absorbed = Math.min(fighter.newspaperHealth, dealt);
        fighter.newspaperHealth -= absorbed;
        healthDamage -= absorbed;
        if (fighter.newspaperHealth <= 0) triggerNewspaperRage(fighter);
      }
      const actualDamage = Math.min(fighter.health, Math.max(0, healthDamage));
      fighter.health = Math.max(0, fighter.health - healthDamage);
      if (fighter.health === 0) playDancerDefeat(fighter);
      fighter.healthTrail = Math.max(fighter.healthTrail ?? fighter.maxHealth, fighter.health + actualDamage);
      fighter.healthTrailDelay = 24;
      if (fighter.side === 'player' && projectile.side !== 'player') {
        fighter.rage = Math.min(100, fighter.rage + Math.max(0, Math.round(healthDamage * 1.4)));
      }
      fighter.hitPulse = 22;
      if (actualDamage > 0) fighter.sootFrames = SOOT_REACTION_FRAMES;
      fighter.hitLean = (fighter.x >= x ? 1 : -1) * Math.min(.19, .045 + dealt * .002);
      const heavyHit = dealt >= 70 || projectile.damageScale >= 1.8 || data.nuclear;
      if (fighter.side !== projectile.side) {
        const pause = heavyHit ? 5 : projectile.directHit === fighter ? 3 : 1;
        state.hitStopFrames = Math.max(state.hitStopFrames, pause);
      }
      state.floaters.push({
        x: fighter.x,
        y: fighter.y - 92,
        text: actualDamage > 0 ? (heavyHit ? `重击 -${actualDamage}` : `-${actualDamage}`) : '格挡',
        color: heavyHit ? '#fff3a3' : '#ffdf7a',
        life: heavyHit ? 94 : 80,
        size: heavyHit ? 31 : 24,
        kick: heavyHit ? 1.2 : .55
      });
      if (fighter.side !== projectile.side) {
        enemyDamage += actualDamage;
        absorbedTotal += dealt - healthDamage;
        hitCount++;
        if (fighter.health <= 0) defeated++;
      }
      if (data.knockback && fighter.side === 'player' && projectile.side !== 'player') {
        const direction = fighter.x >= x ? 1 : -1;
        const targetX = Math.max(65, Math.min(worldWidth() - 65, fighter.x + direction * data.knockback));
        state.knockback = { fighter, startX: fighter.x, startY: fighter.y, targetX, targetY: groundFloorAt(targetX, fighter.y), progress: 0 };
        state.floaters.push({ x: fighter.x, y: fighter.y - 122, text: '击飞!', color: '#fff0b0', life: 80 });
      }
      if (data.freeze && fighter.side !== projectile.side) {
        fighter.frozenTurns = 1;
        if (!data.attackFreezeTurns) state.floaters.push({ x: fighter.x, y: fighter.y - 118, text: '冻结移动', color: '#70dcff', life: 80 });
      }
      if (data.poisonTurns && fighter.side === 'rival' && projectile.side === 'player') {
        fighter.poisonTurns = Math.max(fighter.poisonTurns, data.poisonTurns);
        state.floaters.push({ x: fighter.x, y: fighter.y - 120, text: '中毒', color: '#91e85b', life: 85 });
      }
      if (data.attackFreezeTurns && fighter.side !== projectile.side && fighter.health > 0) {
        fighter.attackFreezeTurns = Math.max(fighter.attackFreezeTurns, data.attackFreezeTurns);
        fighter.frozenTurns = Math.max(fighter.frozenTurns, 1);
        state.floaters.push({ x: fighter.x, y: fighter.y - 128, text: `冻结 · 禁攻${fighter.attackFreezeTurns}回合`, color: '#87ddff', life: 90, size: 20 });
      }
    }
  });
  if (projectile.side === 'player' && hitCount) {
    const previous = state.hitFeedback;
    const total = (previous?.damage || 0) + enemyDamage;
    const kills = (previous?.defeated || 0) + defeated;
    const hits = (previous?.hits || 0) + hitCount;
    const label = kills ? `击倒 ${kills}` : hits > 1 ? `连中 ${hits}` : projectile.directHit ? '直接命中' : enemyDamage ? '爆风命中' : '击中护甲';
    state.hitFeedback = { label, damage: total, hits, defeated: kills, armor: (previous?.armor || 0) + absorbedTotal, life: 110 };
    playTone(kills ? 740 : 560, .055, { volume: .025 });
  }
  if (projectile.lifeSteal && enemyDamage > 0) {
    const shooter = projectile.shooter || (projectile.side === 'player' ? state.player : state.rival);
    const heal = Math.min(20, Math.max(6, Math.round(enemyDamage * projectile.lifeSteal)));
    const recovered = Math.min((shooter.maxHealth || 100) - shooter.health, heal);
    if (recovered > 0) {
      shooter.health += recovered;
      state.floaters.push({ x: shooter.x, y: shooter.y - 112, text: `+${recovered}`, color: '#9cff72', life: 80 });
    }
  }
  settleFighters();
  if (checkPitFalls()) return;
  if (state.player.health <= 0 && stageOpening() === mipingOpening && !state.player.berryCrowned) {
    checkWinner();
    return;
  }
  updateUI();

  if (projectile.returningHead) {
    startHeadReturn(projectile);
    return;
  }
  finishProjectile(projectile, data.knockback ? 760 : 420);
}

function updateKnockback() {
  const flight = state.knockback;
  if (!flight) return;
  flight.progress = Math.min(1, flight.progress + .045 * state.timeScale);
  const eased = 1 - (1 - flight.progress) ** 2;
  flight.fighter.x = flight.startX + (flight.targetX - flight.startX) * eased;
  flight.fighter.y = flight.startY + (flight.targetY - flight.startY) * eased - Math.sin(Math.PI * flight.progress) * 92;
  if (flight.progress < 1) return;
  flight.fighter.x = flight.targetX;
  flight.fighter.y = flight.targetY;
  state.knockback = null;
  updateUI();
}

// Draw and excavate from the same contour, including its chipped side walls.
function traceCrater(g, cut) {
  const points = cut.outline;
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
  g.closePath();
}

function craterContour(cx, cy, r, angle, body) {
  const index = Math.round(cx);
  const surface = body.terrain[index];
  const onTop = Math.abs(cy - surface) <= 6;
  const hard = ['war', 'chaos', 'newspaper', 'dance', 'tunnels'].includes(state.map);
  const dx = angle === null ? 0 : Math.cos(angle);
  const dy = angle === null ? (onTop ? 1 : 0) : Math.sin(angle);
  const slope = ((body.terrain[index + 6] ?? surface) - (body.terrain[index - 6] ?? surface)) / 12;
  const incidence = onTop ? Math.min(1, Math.abs(dy - dx * slope) / Math.hypot(1, slope)) : 0;
  const width = r * (onTop ? 1.38 - .32 * incidence : 1.27);
  const down = onTop ? r * (.28 + .86 * incidence) * (hard ? .76 : 1) : r * (hard ? .61 : .74);
  const up = onTop ? r * .30 : down;
  const top = cy - up + (onTop ? 0 : dy * r * .15);
  const height = up + down;
  const steps = Math.max(16, Math.ceil(height / 2.5));
  const left = [], right = [];
  const seed = Math.round(cx + (body.left || 0)) * 53 + Math.round(cy) * 29;
  for (let i = 0; i <= steps; i++) {
    const phase = Math.PI * i / steps;
    const v = -Math.cos(phase);
    const y = top + (v + 1) * height / 2;
    // Keep the steep shoulders, then follow an elliptical arc around the floor.
    // Sampling by angle gives the lowest point a smooth tangent.
    const cap = v > 0 ? Math.sin(phase) : Math.max(0, 1 - Math.abs(v) ** 3.6) ** .34;
    const mid = cx + dx * (onTop ? r * .30 + (y - cy) * Math.abs(dy) : r * .45 + dy * (y - cy));
    const chip = Math.min(3.5, r * .05) * cap;
    left.push({ x: mid - width * cap + chip * (groundVariation(seed + i * 17) - .5) * 2, y });
    right.push({ x: mid + width * cap + chip * (groundVariation(seed + i * 31) - .5) * 2, y });
  }
  return left.concat(right.reverse());
}

// Union one vertical slice with the existing air intervals. Solid bridges
// survive until the contour of an impact actually intersects them.
function excavateColumn(body, x, top, bottom, bottomLimit) {
  const surface = body.terrain[x];
  top = Math.max(top, surface);
  bottom = Math.min(bottom, bottomLimit);
  if (bottom <= top) return 0;
  const gaps = body.cavities[x] || [];
  let first = 0;
  while (first < gaps.length && gaps[first].bottom < top) first++;
  if (gaps[first]?.top <= top && gaps[first].bottom >= bottom) return 0;
  const thickness = bottom - top;
  let last = first;
  while (last < gaps.length && gaps[last].top <= bottom) {
    top = Math.min(top, gaps[last].top);
    bottom = Math.max(bottom, gaps[last++].bottom);
  }
  if (top <= surface) {
    body.terrain[x] = bottom;
    gaps.splice(first, last - first);
  } else {
    gaps.splice(first, last - first, { top, bottom });
  }
  body.cavities[x] = gaps.length ? gaps : undefined;
  return thickness;
}

function deformTerrain(cx, cy, radius, impactAngle = null, body = state) {
  if (body.permanent) return null;
  const limit = body === state ? worldHeight() : body.bottom;
  if (cy - radius * 1.3 >= limit) return null;
  const outline = craterContour(cx, cy, radius, impactAngle, body);
  const minX = Math.min(...outline.map(p => p.x)), maxX = Math.max(...outline.map(p => p.x));
  const start = Math.max(0, Math.ceil(minX)), end = Math.min(body.terrain.length - 1, Math.floor(maxX));
  if (end < start) return null;
  const crossings = Array.from({ length: end - start + 1 }, () => []);
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const from = Math.max(start, Math.ceil(Math.min(a.x, b.x)));
    const to = Math.min(end + 1, Math.ceil(Math.max(a.x, b.x)));
    for (let x = from; x < to; x++) {
      crossings[x - start].push(a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x));
    }
  }
  let depth = 0, undercut = false;
  const loosened = [];
  for (let x = start; x <= end; x++) {
    const edges = crossings[x - start].sort((a, b) => a - b);
    const old = body.terrain[x];
    for (let i = 0; i + 1 < edges.length; i += 2) {
      const belowSurface = edges[i] > body.terrain[x];
      const removed = excavateColumn(body, x, edges[i], edges[i + 1], limit);
      if (removed && belowSurface) undercut = true;
      depth = Math.max(depth, removed);
    }
    if (body.terrain[x] > old) loosened.push({ x, y: old });
  }
  if (!depth) return null;
  const cut = { x: (minX + maxX) / 2, y: cy, radius: (maxX - minX) / 2, depth, outline, loosened, undercut };
  if (body === state) state.craters.push(cut);
  return cut;
}

function spawnGroundDebris(cut) {
  const { colors } = GROUND_DETAILS[state.map];
  const count = Math.min(28, Math.ceil(cut.radius / 3 + cut.depth / 5));
  for (let i = 0; i < count; i++) {
    const offset = (Math.random() - .5) * 2;
    const soil = cut.loosened?.[Math.floor(Math.random() * cut.loosened.length)];
    state.particles.push({
      x: soil?.x ?? cut.x + offset * cut.radius * .55,
      y: (soil?.y ?? cut.y) - 3,
      vx: offset * (2 + Math.random() * 4),
      vy: -2 - Math.random() * Math.min(11, 4 + cut.depth * .09),
      size: 2 + Math.random() * Math.min(9, 4 + cut.radius * .08),
      life: 34 + Math.random() * 25,
      color: colors[i % colors.length],
      kind: 'debris',
      angle: Math.random() * Math.PI,
      spin: offset * .19
    });
  }
  for (let i = 0; i < 8; i++) {
    const offset = i - 3.5;
    const soil = cut.loosened?.[Math.floor(Math.random() * cut.loosened.length)];
    state.particles.push({ x: soil?.x ?? cut.x + offset * cut.radius / 5, y: (soil?.y ?? cut.y) - 2, vx: offset * .43, vy: -.6 - Math.random(), size: 9 + cut.radius * .1, color: colors[0], life: 30 + Math.random() * 14, kind: 'dust' });
  }
}

function queueNextTurn(delay) {
  state.turnPending = true;
  const matchId = state.matchId;
  gameTimeout(() => {
    if (state.gameOver || matchId !== state.matchId) return;
    state.turnPending = false;
    switchTurn();
  }, delay);
}

function consumeFrozenTurn(fighter) {
  if (!fighter || fighter.attackFreezeTurns <= 0) return false;
  fighter.attackFreezeTurns -= 1;
  fighter.frozenTurns = fighter.attackFreezeTurns > 0 ? 1 : 0;
  fighter.freezeFade = 24;
  state.floaters.push({ x: fighter.x, y: fighter.y - 122, text: fighter.attackFreezeTurns ? '冻结 · 跳过行动' : '跳过行动 · 解冻', color: '#b2efff', life: 75, size: 20 });
  if (!fighter.attackFreezeTurns) {
    for (let i = 0; i < 12; i++) state.particles.push({ x: fighter.x, y: fighter.y - 52, vx: (Math.random() - .5) * 5, vy: -Math.random() * 3, color: '#bdefff', size: 2 + Math.random() * 4, life: 20 + Math.random() * 12 });
  }
  showToast('冻结生效：跳过本次行动' + (fighter.attackFreezeTurns ? '' : '，冰层融化'));
  queueNextTurn(650);
  updateUI();
  return true;
}

function switchTurn() {
  state.scouting = false;
  state.aimHold = null;
  state.impactFocus = null;
  const outgoingFighter = state.active === 'player' ? state.player : state.rival;
  if (state.active === 'player') state.player.ultimateArmed = false;
  if (outgoingFighter?.frozenTurns > 0) outgoingFighter.frozenTurns -= 1;
  state.active = state.active === 'player' ? 'rival' : 'player';
  if (state.mode === 'chaos') {
    state.chaosQueue = [];
    state.chaosCursor = 0;
  }
  state.timer = 20;
  state.secondBuffer = 0;
  state.wind = randomWind();
  const activeFighter = state.active === 'player' ? state.player : state.rival;
  activeFighter.stamina = 100;
  if (state.active === 'player') {
    state.round++;
    for (const rival of aliveRivals()) {
      if (rival.variant === 'newspaperZombie' && rival.enraged && !rival.nextAttack) {
        rival.nextAttack = ['drop', 'nut', 'rush'][Math.floor(Math.random() * 3)];
        rival.dropX = Math.max(90, Math.min(worldWidth() - 90, state.player.x));
      }
    }
    state.selectedEnchants = [];
    state.charging = false;
    state.player.flightArmed = false;
    state.player.pumpkinUsedThisTurn = false;
    ui.angleRange.value = state.angle;
  }
  if (activeFighter.frozenTurns > 0) {
    if (state.active === 'player') showToast('寒冰未散，本回合无法移动');
  }
  if (state.active === 'player' && consumeFrozenTurn(state.player)) return;
  updateUI();
  const turnLabel = state.active === 'player' ? '轮到你了' : state.mode === 'chaos' ? '下一只僵尸行动' : '对手正在测风';
  const turnWindArrow = state.wind < 0 ? '←' : state.wind > 0 ? '→' : '—';
  showToast(`${turnLabel} · 风 ${turnWindArrow} ${Math.abs(state.wind).toFixed(1)}`, 1600);
  if (state.active === 'player') playSfx('turn');
  if (state.active === 'rival') {
    const matchId = state.matchId;
    gameTimeout(() => {
      if (matchId === state.matchId) runAI();
    }, state.mode === 'chaos' ? 460 : 900);
  }
}

function armClownBlast(rival) {
  rival.blastArmed = true;
  playSfx('clownArm');
  showToast('瓜摊老板开始蓄爆！');
  queueNextTurn(760);
  updateUI();
}

function detonateClown(rival) {
  state.volleyActive = true;
  rival.health = 0;
  explode(rival.x, rival.y - 36, { weapon: 'clownBlast', side: 'rival', shooter: rival, radiusScale: 1, damageScale: 1, returningHead: false, lifeSteal: 0 });
}

function launchClownFlight(rival) {
  const direction = state.player.x < rival.x ? -1 : 1;
  const desiredX = Math.max(80, Math.min(worldWidth() - 80, state.player.x - direction * 92));
  const travel = Math.max(-360, Math.min(360, desiredX - rival.x));
  const targetX = Math.max(80, Math.min(worldWidth() - 80, rival.x + travel));
  const playerPlatform = state.player.platformId && cloudPlatformById(state.player.platformId);
  const targetPlatform = playerPlatform && Number.isFinite(platformSurfaceY(playerPlatform, targetX)) ? playerPlatform : null;
  const targetY = targetPlatform ? platformSurfaceY(targetPlatform, targetX) : terrainAt(targetX);
  state.clownFlight = { fighter: rival, startX: rival.x, startY: rival.y, targetX, targetY, targetPlatformId: targetPlatform?.id || null, progress: 0 };
  playSfx('flight');
  showToast('瓜摊老板正在突进');
  updateUI();
}

function updateClownFlight() {
  const flight = state.clownFlight;
  if (!flight) return;
  flight.progress = Math.min(1, flight.progress + .018 * state.timeScale);
  const eased = 1 - (1 - flight.progress) ** 2;
  flight.fighter.x = flight.startX + (flight.targetX - flight.startX) * eased;
  flight.fighter.y = flight.startY + (flight.targetY - flight.startY) * eased - Math.sin(Math.PI * flight.progress) * 165;
  if (flight.progress < 1) return;
  flight.fighter.x = flight.targetX;
  flight.fighter.y = flight.targetY;
  flight.fighter.platformId = flight.targetPlatformId;
  state.clownFlight = null;
  if (distance(flight.fighter.x, flight.fighter.y, state.player.x, state.player.y) <= weapons.clownBlast.radius * .9) armClownBlast(flight.fighter);
  else queueNextTurn(560);
  updateUI();
}

function runClownAI(rival) {
  if (rival.blastArmed) {
    detonateClown(rival);
    return;
  }
  if (distance(rival.x, rival.y, state.player.x, state.player.y) <= weapons.clownBlast.radius * .9) {
    armClownBlast(rival);
    return;
  }
  launchClownFlight(rival);
}

const danceSummonSong = 'assets/audio/dance-summon-song.m4a.mp3';
function playDanceSummonSong() {
  if (!audio.enabled || !window.Audio) return;
  playBackgroundMusic(danceSummonSong, .38);
  const song = audio.bgm;
  song.currentTime = 0;
  song.loop = false;
  song.onended = () => {
    if (audio.bgm === song && audio.enabled && state.running && !state.gameOver) startBackgroundMusic();
  };
}

function playDancerDefeat(fighter) {
  if (fighter.variant !== 'dancingZombie') return;
  if (audio.bgmPath === danceSummonSong) startBackgroundMusic();
  playCharacterVoice('dancerDefeat');
}

function runDancingAI(rival) {
  const backups = state.rivals.filter(fighter => fighter.variant === 'backupDancer' && fighter.health > 0).length;
  if (backups >= 4) {
    rival.imageKey = 'dancingZombie';
    showToast('四名伴舞已到齐，舞王继续领舞');
    queueNextTurn(520);
    updateUI();
    return;
  }
  state.volleyActive = true;
  rival.imageKey = 'dancingSummon';
  const direction = state.player.x < rival.x ? -1 : 1;
  const targetX = state.map === 'dance'
    ? [514, 686, 449, 751].map(x => x * DANCE_SCALE).find(x => !aliveRivals().some(f => f.variant === 'backupDancer' && Math.abs(f.x-x)<32)) ?? rival.x
    : Math.max(['war', 'chaos'].includes(state.map) ? 240 : 470, Math.min(worldWidth() - 90, rival.x + direction * (135 + backups * 72)));
  state.danceSummon = { summoner: rival, targetX, progress: 0 };
  showToast('蔡徐坤正在从地下召唤伴舞！');
  playDanceSummonSong();
  updateUI();
}

function updateDanceSummon() {
  const summon = state.danceSummon;
  if (!summon) return;
  summon.progress = Math.min(1, summon.progress + .025 * state.timeScale);
  if (summon.progress < 1) return;
  const dancer = makeFighter('rival', 'backupDancer');
  dancer.x = summon.targetX;
  dancer.y = terrainAt(dancer.x);
  state.rivals.push(dancer);
  summon.summoner.imageKey = 'dancingZombie';
  state.danceSummon = null;
  state.volleyActive = false;
  state.floaters.push({ x: dancer.x, y: dancer.y - 105, text: '伴舞登场！', color: '#e8d4ff', life: 90 });
  showToast('背带裤伴舞加入战斗');
  playSfx('summon');
  queueNextTurn(520);
  updateUI();
}

function launchZomboniDrop(rival, lockedX = state.player.x) {
  state.volleyActive = true;
  const targetX = Math.max(90, Math.min(worldWidth() - 90, lockedX));
  state.zomboniDrop = { shooter: rival, x: targetX, y: -130, targetY: terrainAt(targetX) - 28, vy: 3.5 };
  showToast('红眼读报僵尸召唤了冰车空投！');
  playSfx('zomboni');
  updateUI();
}

function updateZomboniDrop() {
  const drop = state.zomboniDrop;
  if (!drop) return;
  drop.vy += .24 * state.timeScale;
  drop.y += drop.vy * state.timeScale;
  if (drop.y < drop.targetY) return;
  state.zomboniDrop = null;
  explode(drop.x, terrainAt(drop.x), { weapon: 'zomboniDrop', side: 'rival', shooter: drop.shooter, radiusScale: 1, damageScale: 1, returningHead: false, lifeSteal: 0 });
}

function launchNewspaperRush(rival) {
  state.volleyActive = true;
  const direction = state.player.x < rival.x ? -1 : 1;
  const targetX = Math.max(70, Math.min(worldWidth() - 70, state.player.x - direction * 62));
  state.newspaperRush = { fighter: rival, startX: rival.x, startY: rival.y, targetX, targetY: groundFloorAt(targetX, rival.y), progress: 0, direction };
  showToast('红眼读报僵尸抓起小推车冲过来了！');
  playSfx('cart');
  updateUI();
}

function updateNewspaperRush() {
  const rush = state.newspaperRush;
  if (!rush) return;
  rush.progress = Math.min(1, rush.progress + .026 * state.timeScale);
  const eased = 1 - (1 - rush.progress) ** 3;
  rush.fighter.x = rush.startX + (rush.targetX - rush.startX) * eased;
  rush.fighter.y = rush.startY + (rush.targetY - rush.startY) * eased - Math.sin(Math.PI * rush.progress) * 105;
  if (rush.progress < 1) return;
  rush.fighter.x = rush.targetX;
  rush.fighter.y = rush.targetY;
  state.newspaperRush = null;
  explode(state.player.x, state.player.y - 38, { weapon: 'cartSmash', side: 'rival', shooter: rush.fighter, radiusScale: 1, damageScale: 1, returningHead: false, lifeSteal: 0 });
}

function runNewspaperAI(rival) {
  if (!rival.enraged) {
    const solution = findAISolution('note');
    const matchId = state.matchId;
    gameTimeout(() => {
      if (matchId === state.matchId) fireShot('rival', solution.angle, solution.power, 'note');
    }, 420);
    return;
  }
  const attack = rival.nextAttack || ['drop', 'nut', 'rush'][Math.floor(Math.random() * 3)];
  const lockedX = rival.nextAttack ? rival.dropX : state.player.x;
  rival.nextAttack = null;
  if (attack === 'drop') launchZomboniDrop(rival, lockedX);
  else if (attack === 'nut') {
    const solution = findAISolution('explodingNut');
    const matchId = state.matchId;
    gameTimeout(() => {
      if (matchId === state.matchId) fireShot('rival', solution.angle, Math.max(76, solution.power), 'explodingNut');
    }, 380);
  } else launchNewspaperRush(rival);
}

function runAI() {
  if (state.active !== 'rival' || state.projectile || state.volleyActive || state.returningHead || state.flight || state.clownFlight || state.turnPending || state.gameOver || !state.running) return;
  const rivals = aliveRivals();
  if (rivals.length === 0) {
    checkWinner();
    return;
  }
  const rivalIndex = state.aiCursor % rivals.length;
  state.rival = rivals[rivalIndex];
  state.aiCursor = rivalIndex + 1;
  const rival = state.rival;
  if (rival.poisonTurns > 0) {
    const poisonDamage = Math.max(1, Math.round(rival.maxHealth * .2));
    rival.health = Math.max(0, rival.health - poisonDamage);
    rival.poisonTurns -= 1;
    state.floaters.push({ x: rival.x, y: rival.y - 112, text: `毒-${poisonDamage}`, color: '#8ee85a', life: 90 });
    updateUI();
    if (rival.health <= 0) {
      playDancerDefeat(rival);
      if (aliveRivals().length === 0) checkWinner();
      else queueNextTurn(360);
      return;
    }
  }
  if (consumeFrozenTurn(rival)) return;
  if (rival.variant === 'clownZombie') playCharacterVoice('vendorChallenge');
  else if (rival.variant !== 'default') playSfx('zombieTurn');
  if (rival.variant === 'clownZombie') {
    runClownAI(rival);
    return;
  }
  if (rival.variant === 'dancingZombie') {
    runDancingAI(rival);
    return;
  }
  if (rival.variant === 'newspaperZombie') {
    runNewspaperAI(rival);
    return;
  }
  if (rival.frozenTurns <= 0 && Math.random() > 0.48) {
    const direction = groundFloorAt(rival.x - 18, rival.y) - rival.y < 22 ? -1 : 1;
    const minX = ['pool','dance'].includes(state.map) ? 70 : state.map === 'canyon' ? 2640 : ['war', 'chaos'].includes(state.map) ? 1180 : 690;
    const maxX = ['pool','dance'].includes(state.map) ? worldWidth() - 70 : state.map === 'canyon' ? 4660 : ['war', 'chaos'].includes(state.map) ? 2290 : 1130;
    const next = Math.max(minX, Math.min(maxX, rival.x + direction * 18));
    if (state.map !== 'canyon' || !soilPlatformAtPoint(next, rival.y - 29)) rival.x = next;
    rival.y = fighterSurfaceY(rival);
    rival.movePulse = 18;
    rival.moveDirection = direction;
  }
  let weapon = rival.variant === 'default' ? 'fruitKnife' : rival.variant === 'backupDancer' ? 'basketball' : 'normal';
  if (!['default', 'normalZombie', 'backupDancer'].includes(rival.variant)) {
    if (rival.ammo.fire > 0 && Math.random() > 0.62) weapon = 'fire';
    else if (rival.ammo.ice > 0 && Math.random() > 0.72) weapon = 'ice';
    else if (rival.ammo.potato > 0 && Math.random() > 0.82) weapon = 'potato';
  }
  const solution = findAISolution(weapon);
  const matchId = state.matchId;
  gameTimeout(() => {
    if (matchId === state.matchId) fireShot('rival', solution.angle, solution.power, weapon);
  }, 500);
}

function findAISolution(weapon) {
  const targetX = state.player.x;
  const targetY = state.player.y - 48;
  const direction = targetX >= state.rival.x ? 1 : -1;
  const [launchX, launchY] = launchOffsetFor(state.rival, weapon);
  const warBattle = ['war', 'chaos'].includes(state.map);
  const minPower = 4;
  const maxPower = warBattle ? 125 : 100;
  const maxAngle = 42;
  const preferredPower = warBattle ? 75 : 55;
  const defaultBaseAngle = 34;
  let best = { angle: direction > 0 ? 180 - defaultBaseAngle : defaultBaseAngle, power: warBattle ? 96 : 72, score: Infinity };
  for (let baseAngle = 10; baseAngle <= maxAngle; baseAngle += 4) {
    for (let power = minPower; power <= maxPower; power += warBattle ? 5 : 4) {
      const x = state.rival.x + direction * launchX;
      const y = state.rival.y - launchY;
      const shot = { x, y, ...projectileLaunchVelocity(direction > 0 ? 180 - baseAngle : baseAngle, power, 'rival') };
      let closest = Infinity;
      for (let step = 0; step < 450; step += 1) {
        const oldX=shot.x, oldY=shot.y, oldAge=step*1.44;
        advanceProjectileMotion(shot, 1.44, weapon, 'rival');
        closest = Math.min(closest, distance(shot.x, shot.y, targetX, targetY));
        const hit=sweptProjectileContact({ ...shot, age:oldAge+1.44, weapon, side:'rival', shooter:state.rival },oldX,oldY,oldAge);
        if (hit || shot.y > worldHeight()+50) break;
      }
      const score = closest + Math.abs(power - preferredPower) * 0.02;
      if (score < best.score) best = { angle: direction > 0 ? 180 - baseAngle : baseAngle, power, score };
    }
  }
  const error = (Math.random() - 0.5) * 7;
  best.power = Math.max(4, Math.min(maxPower, best.power + error));
  return best;
}

function showCattailRescue() {
  state.cattailOfferShown = true;
  state.running = false;
  state.projectile = null;
  state.projectiles = [];
  state.shotQueue = [];
  state.volleyActive = false;
  state.turnPending = false;
  state.flight = null;
  state.clownFlight = null;
  state.zomboniDrop = null;
  state.newspaperRush = null;
  ui.cattailRescueOverlay.dataset.speaker = 'little';
  ui.cattailRescueOverlay.hidden = false;
  document.getElementById('callSisterButton')?.focus();
}

function acceptCattailRescue() {
  if (state.mode !== 'chaos' || !state.cattailOfferShown || state.cattailUsed) return;
  state.cattailUsed = true;
  state.cattailOfferShown = false;
  const oldX = state.player?.x || 210;
  state.player = makeFighter('player', 'cattail');
  state.player.x = Math.max(90, Math.min(worldWidth() - 90, oldX));
  if (terrainAt(state.player.x) >= pitDeathY()) state.player.x = 210;
  state.player.y = terrainAt(state.player.x);
  state.active = 'player';
  state.timer = 20;
  state.secondBuffer = 0;
  state.selectedWeapon = 'cattailPoison';
  state.selectedEnchants = [];
  state.chaosQueue = [];
  state.chaosCursor = 0;
  state.running = true;
  ui.cattailRescueOverlay.hidden = true;
  ui.normalWeaponRow.hidden = true;
  ui.cattailWeaponRow.hidden = false;
  ui.pumpkinButton.hidden = false;
  ui.ultimateButton.hidden = true;
  ui.healButton.hidden = true;
  showToast('猫尾草接管战斗：追踪毒液已就绪');
  playSfx('turn');
  updateUI();
}

function declineCattailRescue() {
  if (!state.cattailOfferShown) return;
  state.cattailUsed = true;
  state.cattailOfferShown = false;
  ui.cattailRescueOverlay.hidden = true;
  state.running = true;
  checkWinner();
}

function usePumpkinShield() {
  if (!canPlayerAct() || state.charging) return;
  const player = state.player;
  if (player?.variant !== 'cattail' || state.active !== 'player' || !state.running || state.gameOver || player.pumpkinUsedThisTurn || player.stamina < 30 || state.projectile || state.volleyActive || state.flight) return;
  player.stamina -= 30;
  player.shieldHealth = 50;
  player.pumpkinUsedThisTurn = true;
  state.floaters.push({ x: player.x, y: player.y - 112, text: '南瓜盾 +50', color: '#ffb354', life: 95 });
  playSfx('shieldEquip');
  showToast('南瓜护盾已装备');
  updateUI();
}

function beginMipingRescue() {
  if (littleDaveScene === 'rescue' || state.berryFeeding) return;
  state.matchId++; // Invalidate delayed volleys and AI turns from the interrupted attack.
  state.running = false;
  state.charging = state.turnPending = state.volleyActive = state.scouting = false;
  state.projectiles = [];
  state.shotQueue = [];
  state.projectile = state.returningHead = state.flight = state.knockback = state.impactFocus = state.chartFrame = null;
  for (const rival of state.rivals) {
    rival.headDetached = false;
    rival.knifeThrow = null;
  }
  const p = state.player;
  if (p.y >= pitDeathY()) {
    // The local landmark always survives, even if all surrounding soil has fallen away.
    const stele = cloudPlatformById('miping-stele');
    p.x = stele.x;
    p.y = platformSurfaceY(stele, p.x);
    p.platformId = stele.id;
  }
  state.zoom = Math.max(.85, state.zoom);
  const view = cameraPosition(p.x, p.y - 95);
  state.cameraX = view.x;
  state.cameraY = view.y;
  ui.littleDaveChat.hidden = false;
  startLittleDaveScene('rescue');
  ui.littleDaveNext.focus();
  updateUI();
}

function reviveMipingPea() {
  const p = state.player;
  Object.assign(p, { berryCrowned: true, imageKey: 'berryHero', health: p.maxHealth, healthTrail: p.maxHealth,
    stamina: 100, hitPulse: 0, sootFrames: 0, frozenTurns: 0, attackFreezeTurns: 0, freezeFade: 0,
    flightArmed: false, ultimateArmed: false });
  state.berryFeeding = 0;
  state.selectedWeapon = 'dogwood';
  state.selectedEnchants = [];
  state.active = 'player';
  state.timer = 20;
  state.secondBuffer = 0;
  state.running = true;
  const ultimateIcon = ui.ultimateButton.querySelector?.('img');
  if (ultimateIcon) ultimateIcon.src = assetPaths.dogwood;
  state.floaters.push({ x: p.x, y: p.y - 103, text: '红果复苏', color: '#ffcebf', life: 80 });
  playSfx('heal');
  showToast('山茱萸 · 靠近敌人时追踪');
  checkWinner();
  updateUI();
}

function checkWinner() {
  if (state.gameOver) return;
  const enemiesDown = aliveRivals().length === 0;
  const playerDown = state.player.health <= 0;
  if (!enemiesDown && !playerDown) return;
  if (playerDown && stageOpening() === mipingOpening && !state.player.berryCrowned) {
    beginMipingRescue();
    return;
  }
  if (playerDown && state.mode === 'chaos' && !state.cattailUsed) {
    if (!state.cattailOfferShown) showCattailRescue();
    return;
  }
  state.gameOver = true;
  if (characterVoiceCue !== 'dancerDefeat') stopCharacterVoice();
  state.running = false;
  const won = enemiesDown && !playerDown;
  const draw = enemiesDown && playerDown;
  const chaosVictory = state.mode === 'chaos' && won;
  ui.againButton.textContent = chaosVictory ? '恭喜通过' : '再战本关';
  ui.againButton.dataset.action = chaosVictory ? 'home' : 'retry';
  ui.resultOverlay.dataset.outcome = won ? 'win' : draw ? 'draw' : 'loss';
  const stamp = document.getElementById('resultStamp');
  if (stamp) stamp.textContent = chaosVictory ? '通关' : won ? '胜利' : draw ? '平局' : '惜败';
  ui.resultImage.src = chaosVictory ? 'assets/chaos-trophy.png' : won ? 'assets/garden-victory.webp' : 'assets/garden-retry.webp';
  if (ui.resultDave) ui.resultDave.hidden = !chaosVictory;
  ui.resultTitle.textContent = chaosVictory ? '花园里的安稳日子' : draw ? '一同栽进土里' : won ? '这片花园，守住了' : '花盆碎了，芽还在';
  ui.resultText.textContent = chaosVictory ? '他们说到做到，再也没来纠缠小戴芙。小戴芙和姐姐黛弗带着小豌豆、小猫草回到花园，终于过上了没人打扰的日子。' : draw ? '最后一声闷响过后，坑里只剩一颗豌豆，和半张被压皱的报纸。' : won ? '向日葵数了数弹坑，挑了最圆的那个，把明年春天的种子埋了进去。' : '小戴芙从兜里摸出一颗豌豆：“刚才那阵风我记住了。咱们再种一次？”';
  if (won && victoryLines.has(stageOpening())) ui.resultText.textContent = victoryLines.get(stageOpening());
  ui.resultOverlay.hidden = false;
  if (typeof window.handleLevelComplete === 'function') window.handleLevelComplete({ won, draw });
  playSfx(won || draw ? 'win' : 'lose');
  if (chaosVictory) gameTimeout(() => playSfx('prize'), 650);
  updateUI();
}

function turnClockActive() {
  return ui.littleDaveChat?.hidden !== false && state.running && !state.gameOver && !state.projectile && !state.volleyActive && !state.returningHead && !state.flight && !state.clownFlight && !state.turnPending;
}

function finishTimedTurn() {
  if (state.active === 'player') {
    // A charge started in time belongs to this turn, even after the clock ends.
    if (state.charging) return;
    showToast('时间到，自动发射');
    handlePrimaryAction();
  } else runAI();
}

function updateTimer(delta) {
  if (!turnClockActive()) return;
  if (state.timer === 0) {
    if (!state.charging) { finishTimedTurn(); updateUI(); }
    return;
  }
  state.secondBuffer += delta;
  if (state.secondBuffer < 1000) return;
  const seconds = Math.floor(state.secondBuffer / 1000);
  state.secondBuffer %= 1000;
  state.timer = Math.max(0, state.timer - seconds);
  if (state.active === 'player' && state.timer > 0 && state.timer <= 5) playTone(state.timer <= 2 ? 880 : 660, .07, { volume:.04, type:'sine' });
  if (state.timer === 0) finishTimedTurn();
  updateUI();
}

function updateEffects() {
  const scale = state.timeScale;
  if (state.impactFocus && (state.impactFocus.life -= scale) <= 0 && !state.volleyActive && !state.turnPending) state.impactFocus = null;
  if (state.hitFeedback) state.hitFeedback.life = Math.max(0, state.hitFeedback.life - scale);
  allFighters().forEach(fighter => {
    fighter.sootFrames = Math.max(0, fighter.sootFrames - scale);
    fighter.healthTrail ??= fighter.health;
    fighter.healthTrailDelay = Math.max(0, (fighter.healthTrailDelay || 0) - scale);
    if (!fighter.healthTrailDelay) fighter.healthTrail += (fighter.health - fighter.healthTrail) * (1 - .88 ** scale);
    if (fighter.health > fighter.healthTrail) fighter.healthTrail = fighter.health;
  });
  // A dense volley must not keep accumulating off-screen effect objects.
  if (state.particles.length > 420) state.particles.splice(0, state.particles.length - 420);
  state.trajectoryPulse += 0.05 * scale;
  if (state.shake > 0) state.shake *= .84 ** scale;
  if (state.flash > 0) state.flash *= .85 ** scale;
  state.bursts.forEach(burst => { burst.life -= scale; });
  state.bursts = state.bursts.filter(burst => burst.life > 0);
  state.explosion = state.bursts[state.bursts.length - 1] || null;
  state.particles.forEach(p => {
    p.x += p.vx * scale;
    p.y += p.vy * scale;
    if (p.kind === 'dust') p.size += .35 * scale;
    else p.vy += (p.kind === 'debris' ? .31 : .16) * scale;
    if (p.kind === 'debris') {
      p.angle += p.spin * scale;
      const floor = groundFloorAt(p.x, p.y + p.size / 3) - p.size / 3;
      if (p.vy > 0 && p.y >= floor) {
        p.y = floor;
        p.vy *= -.27;
        p.vx *= .52;
        p.life = Math.min(p.life, 15);
      }
    }
    p.vx *= .985 ** scale;
    p.life -= scale;
  });
  state.particles = state.particles.filter(p => p.life > 0);
  state.floaters.forEach(f => {
    if (f.maxLife === undefined) {
      f.maxLife = f.life;
      f.age = 0;
    }
    f.age += scale;
    f.y -= (f.rise || .45) * scale;
    f.x += Math.sin(f.age * .12) * (f.kick || 0) * .12 * scale;
    f.life -= scale;
  });
  state.floaters = state.floaters.filter(f => f.life > 0);
  if (state.player) {
    const open = state.player.gliderOpen || 0;
    state.player.gliderOpen = state.flight ? Math.min(1, open + scale / 16) : Math.max(0, open - scale / 12);
    state.player.freezeFade = Math.max(0, (state.player.freezeFade || 0) - scale);
    state.player.hitPulse = Math.max(0, state.player.hitPulse - scale);
    state.player.movePulse = Math.max(0, state.player.movePulse - scale);
    state.player.attackPulse = Math.max(0, state.player.attackPulse - scale);
  }
  state.rivals.forEach(rival => {
    rival.freezeFade = Math.max(0, (rival.freezeFade || 0) - scale);
    const throwing = rival.knifeThrow;
    if (throwing && state.running && !state.gameOver) {
      if (rival.health <= 0) {
        rival.knifeThrow = null;
        if (!throwing.released) resolveVolleyShot(260);
      } else {
        throwing.elapsed += scale;
        if (!throwing.released && throwing.elapsed >= 24) {
          throwing.released = true;
          state.projectiles = throwing.shots.map((shot, index) => createProjectile(shot, index === 0));
          state.projectile = state.projectiles[0] || null;
        }
        if (throwing.elapsed >= 54) rival.knifeThrow = null;
      }
    }
    rival.hitPulse = Math.max(0, rival.hitPulse - scale);
    rival.movePulse = Math.max(0, rival.movePulse - scale);
    rival.attackPulse = Math.max(0, rival.attackPulse - scale);
    if (rival.rageTransition > 0) {
      rival.rageTransition = Math.max(0, rival.rageTransition - scale);
      if (rival.rageTransition === 0 && rival.variant === 'newspaperZombie') rival.imageKey = 'newspaperHeadWalk';
    }
  });
}

function updateCamera() {
  if (!canPlayerAct() || state.charging) state.scouting = false;
  const focus = cameraFocus();
  const lead = Math.max(-100, Math.min(100, (focus?.vx || 0) * 8));
  const target = cameraPosition((focus?.x || 0) + lead, focus?.y || 0);
  const blend = 1 - (state.projectile || state.flight ? .88 : .93) ** state.timeScale;
  state.cameraX += (target.x - state.cameraX) * blend;
  state.cameraY += (target.y - state.cameraY) * blend;
}

function nextRival() {
  const living = aliveRivals();
  return living[state.aiCursor % living.length];
}

const scoutNames = { default: '华强', normalZombie: '飞头僵尸', clownZombie: '瓜摊老板', dancingZombie: '舞王', backupDancer: '篮球伴舞', newspaperZombie: '读报僵尸' };
function enemyIntent(rival) {
  if (rival.attackFreezeTurns) return '冰封 · 跳过行动';
  if (rival.variant === 'clownZombie') {
    if (rival.blastArmed) return '即将自爆';
    return distance(rival.x, rival.y, state.player.x, state.player.y) <= weapons.clownBlast.radius * .9 ? '准备蓄爆' : '向你突进';
  }
  if (rival.variant === 'newspaperZombie') {
    if (!rival.enraged) return '掷出报纸';
    return ({ drop: '冰车 · 落点已锁定', rush: '推车突袭', nut: '爆炸坚果' })[rival.nextAttack] || '狂暴反击';
  }
  if (rival.variant === 'dancingZombie') return aliveRivals().filter(f => f.variant === 'backupDancer').length < 4 ? '召唤伴舞' : '继续领舞';
  return ({ default: '投掷飞刀', normalZombie: '飞头攻击', backupDancer: '投掷篮球' })[rival.variant] || '准备攻击';
}

function updateScoutPanel() {
  const panel = document.getElementById('enemyScout');
  if (!panel) return;
  const rival = measuredRival();
  panel.hidden = !rival || !canPlayerAct() || state.charging;
  if (panel.hidden) return;
  panel.setAttribute('aria-pressed', String(state.scouting));
  document.getElementById('scoutTurn').textContent = '第 ' + state.round + ' 回合 · ' + (state.scouting ? '返回瞄准 ↶' : '查看对手 ↗');
  document.getElementById('scoutAction').textContent = scoutNames[rival.variant] + ' · ' + enemyIntent(rival);
}

function measuredRival() {
  return aliveRivals().includes(state.lobTarget) ? state.lobTarget : nextRival();
}

function cameraFocus() {
  if (littleDaveScene === 'rescue' || state.berryFeeding) return state.player;
  if (littleDaveScene === 'story' && state.map === 'canyon' && !mipingRivalsOffstage()) return state.rival;
  return state.chartFrame || state.projectile || state.flight || (state.scouting && measuredRival()) || state.impactFocus || (state.active === 'rival' ? state.rival : state.player);
}

function minimumZoom() {
  if (state.map === 'dance') return 1 / DANCE_SCALE;
  if (state.map === 'pool') return Math.min(W / ROSE_WORLD_WIDTH, H / ROSE_WORLD_HEIGHT);
  if (state.map === 'canyon') return W / CANYON_WORLD_WIDTH;
  return worldWidth() > W ? .55 : 1;
}

function cameraPosition(x, y) {
  const clampAxis = (point, world, view, screen) => world <= view ? (world - screen) / 2 :
    Math.max((view - screen) / 2, Math.min(world - (view + screen) / 2, point - screen / 2));
  return { x: clampAxis(x, worldWidth(), viewportWidth(), W), y: clampAxis(y, worldHeight(), viewportHeight(), H) };
}

function setZoom(direction) {
  state.zoom = Math.max(minimumZoom(), Math.min(1.6, Math.round((state.zoom + direction * .1) * 100) / 100));
  const focus = cameraFocus();
  const position = cameraPosition(focus?.x || 0, focus?.y || 0);
  state.cameraX = position.x;
  state.cameraY = position.y;
  updateUI();
}

function draw() {
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.save();
  const sx = state.shake > .5 ? Math.sin(state.trajectoryPulse * 39) * state.shake * .45 : 0;
  const sy = state.shake > .5 ? Math.cos(state.trajectoryPulse * 31) * state.shake * .3 : 0;
  drawBackground();
  drawSceneLighting();
  ctx.translate(W / 2 + sx, H / 2 + sy);
  ctx.scale(state.zoom, state.zoom);
  ctx.translate(-W / 2 - state.cameraX, -H / 2 - state.cameraY);
  if (state.map === 'dance') drawConcertRig();
  drawTerrain();
  drawTunnelStructures();
  drawCloudPlatforms();
  drawLava();
  if (canPlayerAct()) drawEnemyWarning();
  if (state.running && state.active === 'player' && !state.projectile && !state.volleyActive && !state.flight && !state.turnPending) {
    if (state.difficulty === 'easy') drawTrajectory();
    drawPlayerChargeMeter();
  }
  drawFlightTrail();
  drawZomboniDrop();
  if (stageOpening() === mipingOpening) drawMipingCompanions();
  if (state.map === 'dance' && state.mode === 'dance') drawCompanion(images.littleDave, 115 * DANCE_SCALE, terrainAt(115 * DANCE_SCALE), 84);
  if (state.map === 'pool' && state.mode === '1v2') {
    const flower = cloudPlatformById('rose-base');
    if (flower) {
      const x = flower.x - 52;
      drawCompanion(images.littleDave, x, platformSurfaceY(flower, x), 90);
    }
  }
  drawFighter(state.player);
  if (!mipingRivalsOffstage()) state.rivals.forEach(drawFighter);
  if (canPlayerAct() && !state.scouting) drawAimDial();
  drawProjectile();
  drawReturningHead();
  drawEffects();
  ctx.restore();
  battleChart.draw();
  if (state.projectile) drawProjectilePointer(state.projectile);
  if (state.flash > .01) {
    const flashColor = state.explosion?.nuclear ? '226,188,255' : state.explosion && weapons[state.explosion.weapon].attackFreezeTurns ? '189,237,255' : '255,242,177';
    ctx.fillStyle = `rgba(${flashColor},${state.flash})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawCombatFeedback();
}

function drawProjectilePointer(p) {
  const x = (p.x - state.cameraX - W / 2) * state.zoom + W / 2;
  const y = (p.y - state.cameraY - H / 2) * state.zoom + H / 2;
  if (y >= 0 && x >= 0 && x <= W) return;
  const px = Math.max(28, Math.min(W - 28, x)), py = Math.max(19, Math.min(H - 24, y));
  ctx.save();
  ctx.translate(px, py);
  ctx.fillStyle = '#183230df'; ctx.beginPath(); ctx.roundRect(-22, -9, 44, 18, 9); ctx.fill();
  ctx.fillStyle = weapons[p.weapon].tint; ctx.textAlign = 'center'; ctx.font = 'bold 11px Microsoft YaHei,sans-serif';
  ctx.fillText(p.vy < 0 ? '↑ 上升' : '↓ 回落', 0, 4);
  ctx.restore();
}

function drawThemedMapBackground() {
  const image = images.land;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#5c416c');
  sky.addColorStop(1, '#edab77');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  if (image?.complete && image.naturalWidth) {
    const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    ctx.drawImage(image, (W - width) / 2, (H - height) / 2, width, height);
  }
  ctx.save();
  for (let i = 0; i < 13; i++) {
    const x = 36 + i * 91 + Math.sin(state.trajectoryPulse * .35 + i) * 8;
    const y = 226 + i % 3 * 43 + Math.cos(state.trajectoryPulse * .45 + i) * 12;
    ctx.globalAlpha = .22 + (Math.sin(state.trajectoryPulse + i) + 1) * .15;
    ctx.fillStyle = '#ffe5a1';
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawThemedSoil(startX, endX) {
  // Clip to the actual destructible terrain so texture follows newly blasted craters.
  ctx.save();
  ctx.clip();
  const canyon = state.map === 'canyon';
  ctx.lineWidth = canyon ? 3 : 2;
  for (let depth = 18; depth < 230; depth += canyon ? 29 : 24) {
    ctx.strokeStyle = depth % 2 ? 'rgba(53,34,43,.22)' : 'rgba(255,211,156,.24)';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += 8) {
      const y = canyon ? state.originalTerrain[x] + depth + Math.sin(x / 53 + depth) * 5 : 380 + depth;
      if (x === startX) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (!canyon) {
      const offset = Math.floor(depth / 24) % 2 * 28;
      for (let x = Math.floor(startX / 56) * 56 + offset; x <= endX; x += 56) {
        ctx.beginPath(); ctx.moveTo(x, 380 + depth); ctx.lineTo(x + 3, 404 + depth); ctx.stroke();
      }
    }
  }
  if (canyon) {
    ctx.strokeStyle = 'rgba(50,45,48,.25)';
    for (let x = Math.floor(startX / 107) * 107; x < endX; x += 107) {
      const y = state.originalTerrain[x] + 33;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 28); ctx.lineTo(x + 7, y + 48); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMapAmbience(theme) {
  const pulse = state.trajectoryPulse;
  ctx.save();
  if (state.map === 'dance') {
    [0, 1].forEach(side => {
      const origin = side ? W - 155 : 155;
      const target = W * (.4 + side * .2) + Math.sin(pulse * .27 + side * 2) * 170;
      const beam = ctx.createLinearGradient(origin, 80, target, H * .8);
      beam.addColorStop(0, side ? 'rgba(239,140,226,.13)' : 'rgba(108,231,232,.13)');
      beam.addColorStop(1, 'rgba(160,160,230,0)');
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(origin, 80); ctx.lineTo(target - 100, H * .8); ctx.lineTo(target + 100, H * .8); ctx.closePath(); ctx.fill();
    });
  }
  const paper = state.map === 'newspaper';
  const petals = state.map === 'pool';
  const leaves = petals || state.map === 'yard' || state.map === 'chaos';
  const count = paper ? 6 : 14;
  for (let i = 0; i < count; i++) {
    const speed = state.map === 'chaos' ? 24 : paper ? 12 : 3;
    const x = ((i * 191 + pulse * speed) % (W + 80)) - 40;
    const y = petals ? (pulse * 4 + i * 79) % (H + 20) - 10 : 120 + i % 5 * 51 + Math.sin(pulse * .4 + i) * 17;
    ctx.save(); ctx.translate(x, y);
    ctx.globalAlpha = paper ? .45 : leaves ? .24 : .18 + .14 * Math.sin(pulse + i) ** 2;
    ctx.fillStyle = petals && i % 2 ? '#cf567b' : theme.light;
    if (paper) {
      ctx.rotate(Math.sin(pulse * .4 + i) * .6);
      ctx.fillRect(-5, -4, 10, 8);
      ctx.strokeStyle = '#8a7967'; ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(3, -1); ctx.moveTo(-3, 2); ctx.lineTo(2, 2); ctx.stroke();
    } else {
      ctx.rotate(pulse * .15 + i);
      ctx.beginPath(); ctx.ellipse(0, 0, leaves ? 4 : 1.5, leaves ? 1.7 : 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawMapMaterial(theme, startX, endX) {
  // The current terrain path is also the texture mask; crater holes stay clear.
  ctx.save(); ctx.clip();
  const material = theme.material;
  if (['brick', 'paving', 'tile', 'stage'].includes(material)) {
    const cellW = material === 'stage' ? 102 : material === 'tile' ? 42 : 64;
    const cellH = material === 'tile' ? 26 : material === 'stage' ? 22 : 32;
    const top = Math.max(0, Math.floor(Math.min(...state.terrain.subarray(startX, endX + 1)) / cellH) * cellH);
    const bottom = Math.min(worldHeight(), state.cameraY + viewportHeight() + cellH);
    ctx.lineWidth = 1.5;
    for (let y = top; y < bottom; y += cellH) {
      const stagger = Math.floor(y / cellH) % 2 * cellW / 2;
      for (let x = Math.floor(startX / cellW) * cellW - cellW + stagger; x < endX; x += cellW) {
        ctx.strokeStyle = 'rgba(21,27,38,.27)';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(231,224,183,.16)';
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + cellW - 4, y + 4); ctx.stroke();
        if (material === 'tile') {
          ctx.strokeStyle = 'rgba(165,213,195,.25)';
          ctx.beginPath(); ctx.arc(x + cellW / 2, y + cellH / 2, cellW / 2 - 4, .12, Math.PI - .12); ctx.stroke();
        }
      }
    }
  } else {
    for (let x = Math.floor(startX / 134) * 134; x < endX; x += 134) {
      const y = state.originalTerrain[x] + 16;
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(27,38,35,.3)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 27); ctx.lineTo(x - 5, y + 49); ctx.lineTo(x + 13, y + 72); ctx.stroke();
      if (material === 'roots') {
        ctx.strokeStyle = 'rgba(203,172,103,.28)';
        ctx.beginPath(); ctx.moveTo(x + 8, y + 27); ctx.lineTo(x + 31, y + 41); ctx.stroke();
      } else if (material === 'ore') {
        ctx.fillStyle = Math.floor(x / 134) % 2 ? 'rgba(115,210,184,.42)' : 'rgba(239,186,88,.45)';
        ctx.beginPath(); ctx.moveTo(x + 24, y + 31); ctx.lineTo(x + 32, y + 19); ctx.lineTo(x + 38, y + 39); ctx.lineTo(x + 28, y + 45); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(155,194,190,.22)';
        ctx.beginPath(); ctx.ellipse(x + 30, y + 33, 14, 7, .25, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawBackground() {
  if (state.map === 'canyon') {
    ctx.fillStyle = '#80b9ef';
    ctx.fillRect(0, 0, W, H);
    if (images.canyon.complete && images.canyon.naturalWidth) {
      const left = W / 2 - (state.cameraX + W / 2) * state.zoom;
      const top = H / 2 - (state.cameraY + H / 2) * state.zoom;
      ctx.drawImage(images.canyon, left, top, worldWidth() * state.zoom, worldHeight() * state.zoom);
    }
    return;
  }
  if (state.map === 'land') {
    drawThemedMapBackground();
    return;
  }
  const theme = MAP_THEMES[state.map];
  const image = images[state.map];
  if (image?.complete && image.naturalWidth) {
    const wide = ['pool', 'war', 'chaos'].includes(state.map);
    const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight) * (wide ? 1.12 : 1);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const panX = wide ? Math.max(0, Math.min(1, state.cameraX / (worldWidth() - W))) : .5;
    const panY = wide ? Math.max(0, Math.min(1, state.cameraY / (worldHeight() - H))) : .5;
    ctx.drawImage(image, -(width - W) * panX, -(height - H) * panY, width, height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, theme?.sky[0] || '#7ec6de');
    gradient.addColorStop(1, theme?.sky[1] || '#cadb8b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }
  if (theme) drawMapAmbience(theme);
}

// Far scenery moves by a fraction of the camera travel. Everything in this
// layer is drawn before the terrain and actors, including the hanging lights.
const sceneLights = {
  yard:      { x: 215, y: -40, color: '#ffe59a', shape: 'sun' },
  land:      { x: 970, y: 85, color: '#ffbf76', shape: 'lantern' },
  tunnels:   { x: 225, y: 64, color: '#ffcd79', shape: 'lamp' },
  dance:     { x: 815, y: 48, color: '#ddb5ff', shape: 'mirror' },
  war:       { x: 980, y: 75, color: '#ffc79a', shape: 'sun' },
  newspaper: { x: 185, y: 55, color: '#f7dca2', shape: 'lamp' },
  chaos:     { x: 950, y: 112, color: '#ddb3ff', shape: 'rose' }
};

function drawSceneLighting() {
  const light = sceneLights[state.map];
  if (!light) return;
  const t = state.trajectoryPulse;
  const x = light.x - state.cameraX * .07;
  ctx.save();
  ctx.translate(x, light.y - state.cameraY * .035);
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 205);
  halo.addColorStop(0, light.color + '50');
  halo.addColorStop(1, light.color + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(-205, -205, 410, 410);
  if (light.shape === 'rose') {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#51465c';
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = i % 2 ? '#ac869f' : '#8499ba';
      ctx.beginPath(); ctx.ellipse(0, -20, 8, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, 39, 0, Math.PI * 2); ctx.stroke();
  } else if (['lamp', 'mirror', 'lantern'].includes(light.shape)) {
    ctx.strokeStyle = '#453e42'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -160); ctx.lineTo(0, -13); ctx.stroke();
    ctx.rotate(Math.sin(t * .37) * .045);
    ctx.fillStyle = light.color;
    ctx.beginPath(); ctx.ellipse(0, 0, light.shape === 'lantern' ? 21 : 13, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (light.shape === 'mirror') {
      ctx.beginPath(); ctx.ellipse(0, 0, 6, 17, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-12, -2, 24, 3); ctx.strokeRect(-12, -2, 24, 3);
    } else {
      ctx.fillStyle = '#584743'; ctx.fillRect(-12, -16, 24, 4); ctx.fillRect(-10, 13, 20, 4);
      ctx.fillRect(-1, -13, 2, 26);
    }
  }
  const shafts = ctx.createLinearGradient(0, 0, 0, 430);
  shafts.addColorStop(0, light.color + '24'); shafts.addColorStop(1, light.color + '00');
  ctx.fillStyle = shafts;
  const slope = light.x < W / 2 ? 1 : -1;
  for (let i = 0; i < 3; i++) {
    const start = (i - 1) * (light.shape === 'sun' ? 48 : 8);
    const end = start + slope * (90 + i * 42) + Math.sin(t * .18 + i) * 13;
    ctx.beginPath(); ctx.moveTo(start, 10); ctx.lineTo(end - 22, 430);
    ctx.lineTo(end + 40, 430); ctx.lineTo(start + 6, 10); ctx.fill();
  }
  ctx.restore();
}

function drawLava() {
  const theme = MAP_THEMES[state.map];
  if (theme) {
    const y = pitDeathY() - 14;
    const depth = ctx.createLinearGradient(0, y, 0, worldHeight());
    depth.addColorStop(0, 'rgba(20,25,35,0)');
    depth.addColorStop(1, theme.pit);
    ctx.fillStyle = depth;
    ctx.fillRect(state.cameraX, y, viewportWidth(), worldHeight() - y);
    return;
  }
  if (state.map === 'canyon' || state.map === 'land') {
    const y = pitDeathY() - 14;
    const mist = ctx.createLinearGradient(0, y, 0, worldHeight());
    const canyon = state.map === 'canyon';
    mist.addColorStop(0, canyon ? 'rgba(137,80,34,0)' : 'rgba(45,24,41,0)');
    mist.addColorStop(1, canyon ? '#9f632f' : '#291e2e');
    ctx.fillStyle = mist;
    ctx.fillRect(state.cameraX, y, viewportWidth(), worldHeight() - y);
    return;
  }
  const lavaTop = pitDeathY() - 14;
  const gradient = ctx.createLinearGradient(0, lavaTop, 0, worldHeight());
  gradient.addColorStop(0, 'rgba(255, 211, 74, .92)');
  gradient.addColorStop(.35, 'rgba(246, 99, 32, .96)');
  gradient.addColorStop(1, 'rgba(95, 16, 10, 1)');
  ctx.fillStyle = gradient;
  const startX = state.cameraX;
  const visibleWidth = viewportWidth();
  const endX = startX + visibleWidth;
  ctx.fillRect(startX, lavaTop, visibleWidth, worldHeight() - lavaTop);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let x = startX - 20; x < endX + 40; x += 72) {
    const y = lavaTop + 12 + Math.sin(x * .025) * 3;
    ctx.fillStyle = 'rgba(255, 235, 117, .58)';
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function traceGround(startX, endX, base = state.originalTerrain) {
  ctx.beginPath();
  ctx.moveTo(startX, base[startX]);
  for (let x = startX + 2; x < endX; x += 2) ctx.lineTo(x, base[x]);
  ctx.lineTo(endX, base[endX]);
}

function drawGothicPalace(startX, endX) {
  const wall = images.gothicPalace;
  if (!wall?.complete || !wall.naturalWidth) return;
  ctx.save();
  traceGround(startX, endX);
  ctx.lineTo(endX, worldHeight());
  ctx.lineTo(startX, worldHeight());
  ctx.closePath();
  ctx.clip();

  // Anchor the windows and stonework to the world so they stay fixed when the ground breaks.
  const top = 346;
  const height = worldHeight() - top;
  ctx.drawImage(wall, 0, top, worldWidth(), height);
  const shade = ctx.createLinearGradient(0, top, 0, worldHeight());
  shade.addColorStop(0, 'rgba(23,19,36,0)');
  shade.addColorStop(.76, 'rgba(23,19,36,.06)');
  shade.addColorStop(1, 'rgba(19,16,30,.5)');
  ctx.fillStyle = shade;
  ctx.fillRect(startX, top, endX - startX, height);
  ctx.restore();
}

function groundVariation(x) {
  return ((Math.imul(x + 331, 1597334677) >>> 17) % 997) / 997;
}

function drawGroundLife(x, y, detail) {
  const kind = detail.life;
  const phase = state.trajectoryPulse * 1.9 + x * .07;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = .8;
  const animal = groundAnimals[kind];
  if (animal) {
    const sprite = images[animal.image];
    if (sprite?.complete && sprite.naturalWidth && sprite.naturalHeight) {
      const pace = phase * animal.speed;
      const direction = Math.cos(pace) < 0 ? -1 : 1;
      const stride = Math.sin(pace * 5);
      const width = animal.width;
      const height = width * sprite.naturalHeight / sprite.naturalWidth;
      ctx.translate(Math.sin(pace) * animal.range, -Math.max(0, stride) * 1.7);
      ctx.scale(direction * (1 + stride * .07), 1 - stride * .09);
      ctx.globalAlpha = .94;
      ctx.drawImage(sprite, -width / 2, -height + 5, width, height);
    }
  } else if (kind === 'cable' || kind === 'paper') {
    if (kind === 'cable') {
      ctx.strokeStyle = '#c68ed0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-23, -6); ctx.quadraticCurveTo(-13, 17, 22, 0); ctx.stroke();
      ctx.fillStyle = '#f0c8ff'; ctx.fillRect(Math.sin(phase) * 14, 3, 3, 2);
    } else {
      ctx.rotate(-.3 + Math.sin(phase) * .13);
      ctx.fillStyle = detail.colors[0]; ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = detail.colors[1];
      for (let row = -3; row <= 3; row += 3) ctx.fillRect(-7, row, 11 - row, 1);
    }
  } else {
    const crystals = kind === 'crystals';
    ctx.fillStyle = kind === 'embers' ? '#efac69' : '#a9ddd3';
    for (let i = 0; i < 3; i++) {
      const rise = (phase * 1.5 + i * 5) % 20;
      ctx.globalAlpha = .2 + (1 - rise / 20) * .5;
      const px = (i - 1.5) * 8;
      ctx.beginPath();
      if (crystals) {
        ctx.moveTo(px - 3, 5); ctx.lineTo(px + 2, -3 - i * 2); ctx.lineTo(px + 5, 4); ctx.closePath();
      } else ctx.arc(px, 10 - rise, kind === 'bubbles' ? 2.5 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

const terrainArt = {
  yard: ['earthGarden', 1], land: ['earthGarden', 3],
  tunnels: ['earthCity', 0], dance: ['earthCity', 1],
  war: ['earthCity', 2], newspaper: ['earthCity', 3]
};
let terrainPainting = null;

let scorchedLipTexture = null;
let lastScorchedCut = null;
const scorchedGroundTiles = new Map();
function drawPaintedGround(startX, endX) {
  if (state.map === 'canyon') {
    if (!images.mipingStage.complete || !images.mipingStage.naturalWidth) return false;
    ctx.drawImage(images.mipingStage, 0, 0, worldWidth(), worldHeight());
    return true;
  }
  const panel = terrainArt[state.map];
  if (!panel) return false;
  const atlas = images[panel[0]];
  if (!atlas.complete || !atlas.naturalWidth) return false;
  const base = state.originalTerrain;
  if (terrainPainting?.base !== base) {
    // Bake the height warp once. Explosions only change the live clipping path.
    let top = worldHeight();
    for (const y of base) top = Math.min(top, y);
    top = Math.floor(top) - 2;
    const surface = document.createElement('canvas');
    surface.width = base.length;
    surface.height = worldHeight() - top + 2;
    const painter = surface.getContext('2d');
    if (!painter) return false;
    const fullTexture = panel.length === 1;
    const width = fullTexture ? atlas.naturalWidth : Math.floor(atlas.naturalWidth / 2);
    const height = fullTexture ? atlas.naturalHeight : Math.floor(atlas.naturalHeight / 2);
    const sx = fullTexture ? 0 : (panel[1] % 2) * width + 3;
    const sy = fullTexture ? 0 : Math.floor(panel[1] / 2) * Math.ceil(atlas.naturalHeight / 2) + 3;
    const span = state.map === 'war' ? 940 : 760;
    for (let x = 0; x < base.length; x++) {
      const tileX = x % span;
      const u = Math.floor(x / span) % 2 ? span - 1 - tileX : tileX;
      const y = Math.floor(base[x]) - top - 2;
      const depth = Math.max(span * .34, surface.height - y);
      painter.drawImage(atlas, sx + u / span * (width - 7), sy,
        (width - 7) / span, height - 6, x, y, 1, depth);
    }
    terrainPainting = { base, surface, top };
  }
  ctx.save();
  ctx.clip();
  const length = endX - startX + 1;
  const { surface, top } = terrainPainting;
  ctx.drawImage(surface, startX, 0, length, surface.height, startX, top, length, surface.height);
  ctx.restore();
  return true;
}

function drawGroundDetails(startX, endX, painted = false) {
  const detail = GROUND_DETAILS[state.map];
  const { colors } = detail;
  const base = state.originalTerrain;
  ctx.save();
  traceGround(startX, endX);
  ctx.lineTo(endX, worldHeight());
  ctx.lineTo(startX, worldHeight());
  ctx.closePath();
  ctx.clip();
  for (let x = Math.ceil(startX / 40) * 40; !painted && x < endX; x += 40) {
    const variation = groundVariation(x);
    const y = base[x] + 14 + variation * 108;
    ctx.globalAlpha = .39;
    ctx.fillStyle = colors[1];
    ctx.beginPath(); ctx.ellipse(x, y, 2 + variation * 5, 1.5 + variation * 2, variation - .5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .33;
    ctx.fillStyle = colors[0]; ctx.fillRect(x - 2, y - 2, 3 + variation * 3, 1.2);
  }
  ctx.globalAlpha = 1;
  for (const x of groundLifePositions[state.map]) {
    if (x < startX - 55 || x > endX + 55) continue;
    const y = base[x] + 49;
    if (groundSolidAt(x, y - 21) && y < worldHeight() - 31) drawGroundLife(x, y, detail);
  }
  if (painted) {
    ctx.restore();
    return;
  }
  traceGround(startX, endX);
  ctx.lineWidth = 24; ctx.strokeStyle = colors[1]; ctx.stroke();
  ctx.lineWidth = 11; ctx.strokeStyle = colors[2]; ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = colors[0]; ctx.stroke();
  for (let x = Math.ceil(startX / 5) * 5; x < endX; x += 5) {
    const y = base[x];
    const variation = groundVariation(x);
    ctx.fillStyle = detail.trim;
    ctx.fillRect(x, y, 5, 2 + variation * 7);
  }
  ctx.restore();
}

function makeScorchedLipTexture() {
  const strip = document.createElement('canvas');
  strip.width = 256;
  strip.height = 32;
  const ink = strip.getContext('2d');
  for (let x = 0; x < strip.width; x++) {
    const t = 2 * Math.PI * x / strip.width;
    const pocket = .5 + .5 * Math.sin(5 * t + 1.8 * Math.sin(2 * t));
    const seam = .23 + pocket * .16 + groundVariation(x) * .035;
    const fade = ink.createLinearGradient(0, 0, 0, strip.height);
    fade.addColorStop(0, '#121113');
    fade.addColorStop(seam - .08, '#21191a');
    fade.addColorStop(seam, '#392021');
    fade.addColorStop(seam + .09, pocket > .57 ? '#764030' : '#4d302a');
    fade.addColorStop(seam + .20, 'rgba(76,43,34,.84)');
    fade.addColorStop(.83, 'rgba(49,32,32,.32)');
    fade.addColorStop(1, 'rgba(49,32,32,0)');
    ink.fillStyle = fade;
    ink.fillRect(x, 0, 1, strip.height);
    if (pocket > .76 && groundVariation(x * 13) > .79) {
      ink.fillStyle = '#9a5a3e';
      ink.fillRect(x, (seam + .11) * strip.height, 1, 1);
    }
  }
  return strip;
}

// Sample one world-anchored strip along the surviving collision surface.
function drawScorchedLip(g, x, y, width, exposure, worldX, slope) {
  scorchedLipTexture ??= makeScorchedLipTexture();
  const strip = scorchedLipTexture;
  const u = ((worldX % strip.width) + strip.width) % strip.width;
  const depth = Math.min(1, exposure / 8) * Math.min(2.2, Math.hypot(1, slope)) * (17 + 3 * Math.sin(worldX * .12));
  g.drawImage(strip, u, 0, 1, strip.height, x, Math.floor(y) - 1, width, depth + 2);
}

function drawGroundBurns(startX, endX) {
  const latest = state.craters[state.craters.length - 1];
  if (latest !== lastScorchedCut) {
    scorchedGroundTiles.clear();
    lastScorchedCut = latest;
  }
  // Bake at world resolution so adjoining columns stay seamless at fractional zoom.
  for (let left = startX - startX % 128; left <= endX; left += 128) {
    if (!scorchedGroundTiles.has(left)) {
      const right = Math.min(left + 128, state.terrain.length);
      let top = Infinity, bottom = -Infinity;
      for (let x = left; x < right; x++) {
        if (state.terrain[x] - state.originalTerrain[x] < 1.5) continue;
        top = Math.min(top, Math.floor(state.terrain[x]) - 2);
        bottom = Math.max(bottom, Math.ceil(state.terrain[x]) + 48);
      }
      let tile = null;
      if (bottom > top) {
        const surface = document.createElement('canvas');
        surface.width = right - left;
        surface.height = bottom - top;
        const g = surface.getContext('2d');
        for (let x = left; x < right; x++) {
          const y = state.terrain[x];
          const exposed = y - state.originalTerrain[x];
          if (exposed < 1.5) continue;
          const slope = ((state.terrain[x + 3] ?? y) - (state.terrain[x - 3] ?? y)) / 6;
          drawScorchedLip(g, x - left, y - top, 1, exposed, x, slope);
        }
        tile = { surface, top };
      }
      scorchedGroundTiles.set(left, tile);
    }
    const tile = scorchedGroundTiles.get(left);
    if (tile) ctx.drawImage(tile.surface, left, tile.top);
  }
}

function drawCavityBurn(g, cut) {
  g.save();
  g.beginPath();
  traceCrater(g, cut);
  g.lineJoin = 'round';
  if (cut.tint) {
    g.globalAlpha = .14;
    g.strokeStyle = cut.tint;
    g.lineWidth = 13;
    g.stroke();
  }
  g.globalAlpha = cut.sootOpacity ?? .9;
  for (const [width, color] of [[17,'rgba(46,33,37,.25)'],[10,'rgba(37,27,30,.55)'],[5,'#201a20']]) {
    g.lineWidth = width;
    g.strokeStyle = color;
    g.stroke();
  }
  g.restore();
}

function drawTerrain() {
  if (state.map === 'pool') return; // The rose itself is the lowest playable surface.
  const viewLeft = state.cameraX + (W - viewportWidth()) / 2;
  const startX = Math.max(0, Math.floor(viewLeft) - 18);
  const endX = Math.min(worldWidth() - 1, Math.ceil(viewLeft + viewportWidth()) + 18);
  const cuts = state.craters.filter(cut => cut.x + (cut.radius + 10) >= startX && cut.x - (cut.radius + 10) <= endX);
  ctx.save();
  traceGround(startX, endX, state.terrain);
  ctx.lineTo(endX, worldHeight());
  ctx.lineTo(startX, worldHeight());
  ctx.closePath();
  ctx.clip();
  // Intersect each inverse cut separately so overlapping blasts stay empty.
  for (const cut of cuts) {
    if (!cut.undercut) continue; // The live skyline already contains this bite.
    ctx.beginPath();
    ctx.rect(-1, -1, worldWidth() + 2, worldHeight() + 2);
    traceCrater(ctx, cut);

    ctx.clip('evenodd');
  }
  ctx.beginPath();
  ctx.rect(startX, 0, endX - startX + 1, worldHeight());
  const soil = ctx.createLinearGradient(0, ['war', 'chaos'].includes(state.map) ? 680 : 370, 0, worldHeight());
  const theme = MAP_THEMES[state.map];
  if (theme) {
    [0, .08, .28, 1].forEach((stop, index) => soil.addColorStop(stop, theme.soil[index]));
  } else if (state.map === 'canyon') {
    soil.addColorStop(0, '#95a856');
    soil.addColorStop(.22, '#876343');
    soil.addColorStop(.65, '#674739');
    soil.addColorStop(1, '#46362c');
  } else if (state.map === 'land') {
    soil.addColorStop(0, '#d99870');
    soil.addColorStop(.24, '#a76155');
    soil.addColorStop(.65, '#704453');
    soil.addColorStop(1, '#392a3b');
  } else {
    soil.addColorStop(0, '#72a944');
    soil.addColorStop(.065, '#3f7a32');
    soil.addColorStop(.08, '#8a5d3a');
    soil.addColorStop(1, '#4b3024');
  }
  ctx.fillStyle = soil;
  ctx.fill();
  const painted = drawPaintedGround(startX, endX);
  if (!painted) {
    if (state.map === 'chaos') drawGothicPalace(startX, endX);
    else if (state.map === 'canyon' || state.map === 'land') drawThemedSoil(startX, endX);
    else if (theme) drawMapMaterial(theme, startX, endX);
  }
  if (state.map !== 'canyon') drawGroundDetails(startX, endX, painted);
  if (state.map === 'dance') drawDanceApron();
  if (cuts.some(cut => cut.loosened.length)) drawGroundBurns(startX, endX);
  for (const cut of cuts) if (cut.undercut) drawCavityBurn(ctx, cut);
  ctx.restore();
}

const SOOT_REACTION_FRAMES = 74;

// Fixed stage fascia; the terrain mask above also cuts its lights and metalwork.
function drawDanceApron() {
  ctx.save();
  ctx.scale(DANCE_SCALE, DANCE_SCALE);
  for (const [left, right, top] of [[53,223,345],[426,774,319],[977,1147,345]]) {
    const width = right-left;
    const metal = ctx.createLinearGradient(0,top,0,top+51);
    metal.addColorStop(0,'#a49ebd'); metal.addColorStop(.16,'#433d59');
    metal.addColorStop(.28,'#201e31'); metal.addColorStop(1,'#343347');
    ctx.fillStyle = metal;
    ctx.fillRect(left,top,width,51);
    ctx.fillStyle = '#91dfe0'; ctx.fillRect(left+2,top+4,width-4,2);
    ctx.strokeStyle = '#655e79'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x=left+5; x+30<right; x+=40) {
      ctx.moveTo(x,top+42); ctx.lineTo(x+15,top+15); ctx.lineTo(x+30,top+42);
    }
    ctx.stroke();
    for (let x=left+19;x<right-7;x+=40) {
      ctx.fillStyle = '#211d30'; ctx.fillRect(x-8,top+10,16,7);
      ctx.fillStyle = '#edbcec'; ctx.fillRect(x-5,top+12,10,2);
    }
  }
  ctx.restore();
}

function drawConcertRig() {
  ctx.save();
  ctx.scale(DANCE_SCALE, DANCE_SCALE);
  // An arched lighting bridge frames the lead performer. Beams stay behind the playable deck.
  const roof = x => 184 - 60 * Math.sin(Math.PI * (x - 373) / 454);
  for (let x = 373; x < 827; x += 22) {
    const end = Math.min(827, x + 22);
    const y = roof(x), next = roof(end);
    ctx.strokeStyle = '#51475d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(end,next); ctx.lineTo(x,y+10);
    ctx.lineTo(end,next+10); ctx.stroke();
  }
  for (const x of [373,817]) {
    ctx.fillStyle = '#444054'; ctx.fillRect(x,182,4,230); ctx.fillRect(x+9,182,4,230);
    ctx.strokeStyle = '#726883'; ctx.lineWidth = 2; ctx.beginPath();
    for(let y=192;y<402;y+=20){ctx.moveTo(x,y);ctx.lineTo(x+11,y+10);ctx.lineTo(x,y+20);}
    ctx.stroke();
  }
  for (const [i,x] of [396,468,542,658,732,804].entries()) {
    const y=roof(x)+13, target=x+(600-x)*.42+28*Math.sin(state.trajectoryPulse*.18+i);
    const beam=ctx.createLinearGradient(x,y,target,340);
    beam.addColorStop(0,i%2?'rgba(255,175,227,.35)':'rgba(137,239,255,.35)');
    beam.addColorStop(1,'rgba(255,245,230,0)');
    ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);
    ctx.lineTo(target+39,340);ctx.lineTo(target-39,340);ctx.fill();
    ctx.fillStyle='#322e43';ctx.fillRect(x-7,y-7,14,10);
    ctx.fillStyle=i%2?'#ffd6f2':'#b8faff';ctx.fillRect(x-5,y+1,10,3);
  }
  ctx.restore();
}
// Eye centers in each sprite's own frame, before its facing and pose transforms.
const sootFaceAnchors = {
  hero: [.50, .18], cattail: [.61, .49], normalZombie: [.52, .33],
  newspaperZombie: [.43, .35], clownZombie: [.48, .20], default: [.46, .22],
  dancingZombie: [.49, .25], backupDancer: [.52, .34]
};

function drawFighterPose(fighter, sprite, ...rects) {
  if (!fighter.sootFrames) {
    ctx.drawImage(sprite, ...rects);
    return;
  }
  const age = SOOT_REACTION_FRAMES - fighter.sootFrames;
  const soot = Math.min(1, fighter.sootFrames / 24);
  ctx.save();
  ctx.filter = `grayscale(${soot}) brightness(${1 - soot * .92})`;
  ctx.drawImage(sprite, ...rects);
  ctx.restore();
  if (fighter.headDetached) return;

  const [x, y, w, h] = rects.slice(-4);
  const face = sootFaceAnchors[fighter.side === 'player' && fighter.variant !== 'cattail' ? 'hero' : fighter.variant];
  if (!face) return;
  ctx.save();
  ctx.filter = 'none';
  ctx.translate(x + w * face[0], y + h * face[1]);
  ctx.scale(h / 100, h / 100);
  ctx.globalAlpha *= soot;
  const blink = 1 - .83 * Math.max(0, 1 - Math.abs(age - 24) / 4);
  for (const side of [-1, 1]) {
    const eyeX = side * 4.55;
    ctx.fillStyle = '#fff7db';
    ctx.beginPath();
    ctx.ellipse(eyeX, 0, 4.1, 5.1 * blink, side * .20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#272127';
    ctx.beginPath();
    ctx.ellipse(eyeX - side * .75, .75 * blink, 1.35, 1.65 * blink, 0, 0, Math.PI * 2);
    ctx.fill();

    const fall = (age - (side < 0 ? 14 : 23)) / 34;
    if (fall <= 0 || fall >= 1) continue;
    ctx.save();
    ctx.translate(side * (7 + 3 * fall), 3 + 18 * fall * fall);
    ctx.scale(Math.min(1, fall * 6), Math.min(1, fall * 6));
    ctx.globalAlpha *= Math.min(1, (1 - fall) * 5);
    ctx.fillStyle = '#84d7f4';
    ctx.beginPath();
    ctx.moveTo(0, -2.2);
    ctx.bezierCurveTo(-1.2, .4, -3, 2.4, -2.2, 4.3);
    ctx.bezierCurveTo(-.8, 7, 3.1, 5.5, 2.5, 2.8);
    ctx.quadraticCurveTo(2, .9, 0, -2.2);
    ctx.fill();
    ctx.fillStyle = '#e1faff';
    ctx.fillRect(-1.4, 2.5, 1, 1.7);
    ctx.restore();
  }
  ctx.restore();
}

function drawCompanion(sprite, x, y, height) {
  if (!sprite?.complete || !sprite.naturalWidth || !Number.isFinite(y)) return;
  const width = height * sprite.naturalWidth / sprite.naturalHeight;
  ctx.drawImage(sprite, x - width / 2, y - height + 7, width, height);
}

function drawMipingCompanions() {
  const p = state.player;
  const side = p.x < 185 ? 1 : -1;
  const platform = cloudPlatformById(p.platformId);
  let dave;
  for (const [sprite, offset, height] of [[images.henanMi, 145, 76], [images.littleDave, 76, 84]]) {
    const x = p.x + offset * side;
    const surface = platform ? platformSurfaceY(platform, x, p.y - height) : Infinity;
    const y = Number.isFinite(surface) ? surface : groundFloorAt(x, p.y - height);
    if (sprite === images.littleDave) dave = { x, y: y - height * .52 };
    drawCompanion(sprite, x, y, height);
  }
  if (state.berryFeeding && images.dogwood.naturalWidth) {
    const t = 1 - state.berryFeeding / 42;
    const x = dave.x + (p.x - dave.x) * t;
    const y = dave.y + (p.y - 28 - dave.y) * t - 38 * Math.sin(Math.PI * t);
    ctx.drawImage(images.dogwood, x - 13, y - 9, 26, 18);
  }
}

// The two leaf blades unfold from the stalk and hang above the head on curved stems.
function drawPeaGlider(open, phase) {
  ctx.save();
  ctx.translate(-.05, -.21 - .89 * open);
  ctx.rotate(.045 * Math.sin(phase) * open);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.strokeStyle = '#44632b';
    ctx.lineWidth = .021;
    ctx.beginPath();
    ctx.moveTo(.025, .89 * open);
    ctx.quadraticCurveTo(.19 * open, .56 * open, .49 * open, .02);
    ctx.stroke();
    ctx.scale(open, open);
    const leaf = ctx.createLinearGradient(0, -.22, .09, .12);
    leaf.addColorStop(0, '#ddf78e'); leaf.addColorStop(.4, '#9ed44c'); leaf.addColorStop(1, '#428a35');
    ctx.fillStyle = leaf;
    ctx.strokeStyle = '#36582d';
    ctx.lineWidth = .027;
    ctx.beginPath();
    ctx.moveTo(-.025, -.19);
    ctx.bezierCurveTo(.25, -.31, .66, -.12, .86, .14);
    ctx.bezierCurveTo(.66, .07, .57, .13, .49, .06);
    ctx.bezierCurveTo(.24, .1, .10, -.025, -.025, -.19);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5e9638'; ctx.lineWidth = .014;
    ctx.beginPath(); ctx.moveTo(.015, -.17); ctx.quadraticCurveTo(.40, -.14, .79, .1);
    ctx.moveTo(.32, -.105); ctx.lineTo(.44, -.17);
    ctx.moveTo(.47, -.05); ctx.lineTo(.54, .035);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawPeaAction(fighter, image, w, h, charge) {
  const phase = state.trajectoryPulse * 1.6;
  const progress = fighter.gliderOpen || 0;
  const glide = progress * progress * (3 - 2 * progress);
  const shot = fighter.attackPulse / 14;
  const puff = Math.max(charge * .55, shot * shot);
  const step = fighter.movePulse > 0 ? Math.sin(Math.PI * fighter.movePulse / 18) * (fighter.stepSide || 1) : 0;
  ctx.save();
  ctx.translate(0, 7);
  ctx.scale(w, h);
  if (glide > .001) drawPeaGlider(glide, phase);
  const firingArt = images.peaFirePoses;
  if (!fighter.sootFrames && firingArt?.naturalWidth && (shot > 0 || (state.charging && !fighter.flightArmed))) {
    // The GIF poses are packed by phase so a held charge can stop on any frame.
    const frame = shot > 0 ? 16 + Math.min(7, Math.floor((1 - shot) * 8)) : Math.round(charge * 15);
    ctx.drawImage(firingArt, frame * 152, fighter.berryCrowned ? 134 : 0, 152, 134,
      -70 / 92, -121 / 92, 152 / 92, 134 / 92);
  } else if (fighter.sootFrames || !(puff || step || glide)) {
    drawFighterPose(fighter, image, -.5, -1, 1, 1);
  } else {
    const sw = image.naturalWidth, sh = image.naturalHeight;
    const neck = fighter.berryCrowned ? .62 : .53;
    const ankle = fighter.berryCrowned ? .76 : .69;
    // Stretch the head about the neck. The muzzle flares while the stem stays planted.
    ctx.drawImage(image, 0, neck * sh, sw, (ankle-neck) * sh, -.5, neck-1, 1, ankle-neck+.006);
    const snout = .74;
    const cheekWidth = snout * (1 + .16 * puff);
    const cheekX = -.5 - .075 * puff;
    const cheekY = -1 - .10 * puff;
    ctx.drawImage(image, 0, 0, sw * snout, neck * sh,
      cheekX, cheekY, cheekWidth, neck + .10 * puff);
    ctx.drawImage(image, sw * snout, 0, sw * (1 - snout), neck * sh,
      cheekX + cheekWidth, cheekY - .025 * puff, (1 - snout) * (1 + .42 * puff), neck + .15 * puff);
    const heel = fighter.berryCrowned ? .49 : .45;
    for (const side of [-1, 1]) {
      const x = side < 0 ? 0 : heel, width = side < 0 ? heel : 1-heel;
      const stride = step * side * (1-glide);
      ctx.save();
      ctx.translate(heel-.5, ankle-1);
      ctx.rotate(step * .30 * (1 - glide) + side * glide * (-.36 + .045 * Math.sin(phase)));
      ctx.drawImage(image, x*sw, ankle*sh, width*sw, (1-ankle)*sh,
        x-heel, 0, width, (1-ankle)*(1-.27*Math.max(0,stride)));
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawFighter(fighter) {
  if (!fighter) return;
  const isPlayer = fighter.side === 'player';
  const memeSkin = !isPlayer && assetPaths[fighter.imageKey || 'rival']?.startsWith('assets/meme/');
  if (!isPlayer && fighter.health <= 0) {
    if (memeSkin) {
      const fallen = images[fighter.imageKey || 'rival'];
      if (fallen?.complete && fallen.naturalWidth) {
        ctx.save();
        ctx.globalAlpha = .65;
        ctx.translate(fighter.x, fighter.y - 12);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(fallen, -24, -44, 64 * fallen.naturalWidth / fallen.naturalHeight, 64);
        ctx.restore();
      }
      return;
    }
    const deathImage = images.zombieDeath;
    if (deathImage?.complete && deathImage.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = .78;
      ctx.drawImage(deathImage, fighter.x - 48, fighter.y - 72, 96, 72);
      ctx.restore();
    }
    return;
  }
  const fighterImageKey = fighter.blastArmed ? 'clownZombieArmed' : fighter.headDetached ? 'zombieBody' : fighter.imageKey || (isPlayer ? 'hero' : 'rival');
  const image = images[fighterImageKey];
  let w = isPlayer ? fighter.variant === 'cattail' ? 104 : 92 : fighter.variant === 'clownZombie' ? 108 : fighter.variant === 'dancingZombie' ? 112 : fighter.variant === 'backupDancer' ? 88 : fighter.variant === 'newspaperZombie' ? 112 : fighter.variant === 'normalZombie' ? 96 : 128;
  let h = isPlayer ? fighter.variant === 'cattail' ? 108 : 92 : fighter.variant === 'clownZombie' ? 116 : fighter.variant === 'dancingZombie' ? 132 : fighter.variant === 'backupDancer' ? 106 : fighter.variant === 'newspaperZombie' ? 124 : fighter.variant === 'normalZombie' ? flyingZombieHeight : 112;
  // Preserve the new portraits' proportions instead of stretching to the old GIF box.
  if ((memeSkin || fighter.variant === 'normalZombie') && image?.naturalWidth && image.naturalHeight) w = h * image.naturalWidth / image.naturalHeight;
  w *= fighterMapScale();
  h *= fighterMapScale();
  const x = fighter.x - w / 2;
  const y = fighter.y - h + 7;
  const dancing = fighter.variant === 'dancingZombie';
  const dancePhase = state.trajectoryPulse * 2.35 + fighter.x * .01;
  const animatedPeashooter = isPlayer && fighter.variant !== 'cattail';
  const animatedZombie = !isPlayer && !dancing;

  if (dancing && images.danceSpotlight?.complete && images.danceSpotlight.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = .32 + Math.sin(dancePhase * .5) * .1;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(images.danceSpotlight, fighter.x - 108, fighter.y - 225, 216, 230);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = .25;
  ctx.fillStyle = '#0a0b08';
  ctx.beginPath();
  ctx.ellipse(fighter.x, fighter.y + 2, isPlayer ? 34 : 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (fighter.frozenTurns > 0 || fighter.attackFreezeTurns > 0 || fighter.freezeFade > 0) {
    ctx.save();
    if (!fighter.frozenTurns && !fighter.attackFreezeTurns) ctx.globalAlpha = Math.min(1, fighter.freezeFade / 24);
    ctx.fillStyle = 'rgba(105,220,255,.28)';
    ctx.strokeStyle = '#9be8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 10, w - 8, h - 5, 12);
    ctx.fill();
    ctx.stroke();
    if (fighter.attackFreezeTurns > 0) {
      ctx.fillStyle = '#b8efff'; ctx.strokeStyle = '#243e58'; ctx.lineWidth = 3;
      ctx.font = 'bold 13px Microsoft YaHei, sans-serif'; ctx.textAlign = 'center';
      ctx.strokeText(`冰封 · 禁攻${fighter.attackFreezeTurns}次`, fighter.x, y - 36);
      ctx.fillText(`冰封 · 禁攻${fighter.attackFreezeTurns}次`, fighter.x, y - 36);
    }
    ctx.restore();
  }
  ctx.save();
  if (fighter.hitPulse > 0) {
    const progress = 1 - fighter.hitPulse / 22;
    const recoil = Math.sin(Math.min(1, progress * 1.7) * Math.PI) * (1 - progress);
    ctx.translate(fighter.x, fighter.y);
    ctx.rotate((fighter.hitLean || 0) * recoil);
    ctx.scale(1 + recoil * .09, 1 - recoil * .1);
    ctx.translate(-fighter.x, -fighter.y);
    if (progress < .18) ctx.filter = 'brightness(1.28)';
  }
  if (image?.complete && image.naturalWidth) {
    const shouldFlip = isPlayer ? playerAimDirection(state.angle) < 0 : state.player.x > fighter.x;
    if (fighter.variant === 'backupDancer' && fighter.attackPulse > 0 && images.backupThrow?.complete && images.backupThrow.naturalWidth && images.backupThrow.naturalHeight) {
      const pose = images.backupThrow;
      const poseWidth = h * pose.naturalWidth / pose.naturalHeight;
      ctx.save();
      ctx.translate(fighter.x, fighter.y);
      ctx.scale(fighter.attackFacing, 1);
      drawFighterPose(fighter, pose, -poseWidth / 2, -h + 7, poseWidth, h);
      ctx.restore();
    } else if (fighter.variant === 'backupDancer' && images.backupDanceSheet?.complete && images.backupDanceSheet.naturalWidth) {
      const sheet = images.backupDanceSheet;
      const cellWidth = sheet.naturalWidth / 4;
      const cellHeight = sheet.naturalHeight / 2;
      // trajectoryPulse advances .05 per 60 Hz tick, giving the same 10 fps as the GIF.
      const frame = Math.floor(state.trajectoryPulse * 10 / 3 + fighter.x * .013) % 8;
      ctx.save();
      ctx.translate(fighter.x, 0);
      ctx.scale(state.player.x >= fighter.x ? 1 : -1, 1);
      drawFighterPose(fighter, sheet, frame % 4 * cellWidth, Math.floor(frame / 4) * cellHeight, cellWidth, cellHeight, -w / 2, y, w, h);
      ctx.restore();
    } else if (!isPlayer && fighter.variant === 'default' && images.liuThrow?.complete && images.liuThrow.naturalWidth) {
      drawLiuThrow(fighter, h, shouldFlip);
    } else if (dancing && images.leadDanceSheet?.complete && images.leadDanceSheet.naturalWidth && images.leadDanceSheet.naturalHeight) {
      const sheet = images.leadDanceSheet;
      const cellWidth = sheet.naturalWidth / 4;
      const cellHeight = sheet.naturalHeight / 2;
      const frame = Math.floor(state.trajectoryPulse * 10 / 3) % 8;
      ctx.save();
      ctx.translate(fighter.x, fighter.y);
      ctx.scale(shouldFlip ? -1 : 1, 1);
      drawFighterPose(fighter, sheet, frame % 4 * cellWidth, Math.floor(frame / 4) * cellHeight, cellWidth, cellHeight, -h / 2, -h + 7, h, h);
      ctx.restore();
    } else if (dancing) {
      const bob = Math.abs(Math.sin(dancePhase * 1.4)) * 9;
      const sway = Math.sin(dancePhase) * .095;
      const pulse = 1 + Math.sin(dancePhase * 2) * .035;
      ctx.save();
      ctx.translate(fighter.x, fighter.y - bob);
      ctx.rotate(sway);
      ctx.scale((shouldFlip ? -1 : 1) * pulse, 1 / pulse);
      drawFighterPose(fighter, image, -w / 2, -h + 7, w, h);
      ctx.restore();
    } else if (animatedPeashooter) {
      const idlePhase = state.trajectoryPulse * 1.35;
      const moving = Math.min(1, (fighter.movePulse || 0) / 10);
      const bob = Math.sin(idlePhase * 1.7) * 2.2 - Math.abs(Math.sin(idlePhase * 3.1)) * 5 * moving;
      const sway = Math.sin(idlePhase) * .025 + (fighter.moveDirection || 0) * .055 * moving;
      const breathe = 1 + Math.sin(idlePhase * 1.4) * .018;
      const recoil = Math.sin(Math.min(1, (fighter.attackPulse || 0) / 14) * Math.PI) * 7;
      const charge = state.charging ? state.power / 100 : 0;
      ctx.save();
      ctx.translate(fighter.x + (shouldFlip ? recoil : -recoil), fighter.y + bob + charge * 2);
      if (fighter.health <= 0 && (littleDaveScene === 'rescue' || state.berryFeeding)) {
        ctx.rotate(-.5);
        ctx.scale(1, .62);
      }
      ctx.rotate(sway + (shouldFlip ? 1 : -1) * charge * .085);
      ctx.scale((shouldFlip ? -1 : 1) * breathe * (1 + charge * .075), (1 - charge * .09) / breathe);
      drawPeaAction(fighter, image, w, h, fighter.flightArmed ? 0 : charge);
      ctx.restore();
    } else if (animatedZombie) {
      const phase = state.trajectoryPulse * (fighter.variant === 'clownZombie' ? 2.25 : fighter.variant === 'backupDancer' ? 2.05 : 1.45) + fighter.x * .012;
      const moving = Math.min(1, (fighter.movePulse || 0) / 10);
      const attacking = Math.min(1, (fighter.attackPulse || 0) / 9);
      const variantBob = fighter.variant === 'backupDancer' ? 4.5 : fighter.variant === 'clownZombie' ? 3.2 : fighter.variant === 'newspaperZombie' ? 1.8 : 2.7;
      const variantSway = fighter.variant === 'clownZombie' ? .055 : fighter.variant === 'backupDancer' ? .04 : fighter.variant === 'newspaperZombie' ? .018 : .032;
      const bob = -Math.abs(Math.sin(phase * 1.55)) * variantBob - Math.abs(Math.sin(phase * 3.2)) * 5 * moving;
      const sway = Math.sin(phase) * variantSway + (fighter.moveDirection || 0) * .045 * moving;
      const shuffle = Math.sin(phase * 1.55) * (1.8 + moving * 2.5);
      const recoil = (shouldFlip ? -1 : 1) * attacking * 7;
      const twitch = fighter.blastArmed ? Math.sin(phase * 7) * .035 : 0;
      const pulse = 1 + Math.sin(phase * 1.8) * (fighter.variant === 'newspaperZombie' ? .01 : .018);
      ctx.save();
      ctx.translate(fighter.x + shuffle + recoil, fighter.y + bob);
      ctx.rotate(sway + twitch);
      ctx.scale((shouldFlip ? -1 : 1) * pulse, 1 / pulse);
      const bodyOffset = fighter.headDetached ? -9 * h / 144 : 0;
      drawFighterPose(fighter, image, -w / 2 + bodyOffset, -h + 7, w, h);
      ctx.restore();
    } else if (shouldFlip) {
      ctx.save();
      ctx.translate(fighter.x, 0);
      ctx.scale(-1, 1);
      drawFighterPose(fighter, image, -w / 2, y, w, h);
      ctx.restore();
    } else {
      drawFighterPose(fighter, image, x, y, w, h);
    }
  }
  ctx.restore();

  if (isPlayer && fighter.variant === 'cattail' && fighter.shieldHealth > 0) {
    const shell = images.cattailPumpkin;
    const shellW = w * 1.16;
    const shellH = h * .72;
    if (shell?.complete && shell.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = .84;
      ctx.drawImage(shell, fighter.x - shellW / 2, fighter.y - shellH + 9, shellW, shellH);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(24,18,12,.86)';
    ctx.fillRect(fighter.x - 34, y - 11, 68, 6);
    ctx.fillStyle = '#ffad42';
    ctx.fillRect(fighter.x - 34, y - 11, 68 * fighter.shieldHealth / fighter.shieldMaxHealth, 6);
    ctx.strokeStyle = 'rgba(255,238,184,.7)';
    ctx.strokeRect(fighter.x - 34, y - 11, 68, 6);
  }

  if (fighter.variant === 'newspaperZombie' && fighter.newspaperHealth > 0) {
    const paperWidth = 64;
    ctx.fillStyle = 'rgba(20, 17, 13, .82)';
    ctx.fillRect(fighter.x - paperWidth / 2, y - 13, paperWidth, 6);
    ctx.fillStyle = '#e8dfb9';
    ctx.fillRect(fighter.x - paperWidth / 2, y - 13, paperWidth * fighter.newspaperHealth / fighter.newspaperMaxHealth, 6);
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.strokeRect(fighter.x - paperWidth / 2, y - 13, paperWidth, 6);
  }

  if (state.newspaperRush?.fighter === fighter && images.newspaperCart?.complete && images.newspaperCart.naturalWidth) {
    const direction = state.newspaperRush.direction;
    ctx.save();
    ctx.translate(fighter.x + direction * 30, fighter.y - 42);
    if (direction < 0) ctx.scale(-1, 1);
    ctx.drawImage(images.newspaperCart, -33, -25, 66, 50);
    ctx.restore();
  }

  if (state.running && !state.gameOver && (isPlayer || state.rivals.length > 1 || fighter.health < fighter.maxHealth)) {
    const barY = y - 28;
    const barW = 52;
    ctx.fillStyle = 'rgba(15,24,22,.85)';
    ctx.fillRect(fighter.x - barW / 2 - 2, barY - 2, barW + 4, 9);
    ctx.fillStyle = '#ffe0a3';
    ctx.fillRect(fighter.x - barW / 2, barY, barW * Math.min(1, (fighter.healthTrail ?? fighter.health) / fighter.maxHealth), 5);
    ctx.fillStyle = fighter.attackFreezeTurns > 0 ? '#8ae5ff' : isPlayer ? '#97d65e' : '#f18c67';
    ctx.fillRect(fighter.x - barW / 2, barY, barW * fighter.health / fighter.maxHealth, 5);
    ctx.fillStyle = 'rgba(15,24,22,.85)';
    ctx.fillRect(fighter.x - barW / 2 - 2, barY + 7, barW + 4, 5);
    ctx.fillStyle = '#65cde1';
    ctx.fillRect(fighter.x - barW / 2, barY + 8, barW * fighter.stamina / 100, 3);
  }
  if ((isPlayer ? state.active === 'player' : state.active === 'rival' && state.rival === fighter) && state.running && !state.gameOver) {
    ctx.fillStyle = '#ffe472';
    ctx.beginPath();
    const bob = Math.sin(state.trajectoryPulse * 2) * 2;
    ctx.moveTo(fighter.x, y - 34 + bob);
    ctx.lineTo(fighter.x - 6, y - 43 + bob);
    ctx.lineTo(fighter.x + 6, y - 43 + bob);
    ctx.closePath();
    ctx.fill();
  }
  if (isPlayer && fighter.flightArmed) {
    ctx.strokeStyle = `rgba(103,216,255,${.55 + Math.sin(state.trajectoryPulse) * .25})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(fighter.x, fighter.y - 43, 50, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function sampleAimTrajectory(angle, weaponType, flying) {
  const player = state.player;
  const [launchX, launchY] = weapons[weaponType].launchOffset || [34, 58];
  const sample = {
    x: flying ? player.x : player.x + playerAimDirection(angle) * launchX,
    y: player.y - (flying ? 36 : launchY),
    ...projectileLaunchVelocity(angle, state.power),
    side: 'player', weapon: weaponType, shooter: player, age: 0
  };
  const points = [{ x: sample.x, y: sample.y, length: 0 }];
  const dt = PROJECTILE_TIME_SCALE * state.timeScale;
  const steps = Math.ceil(31.68 / dt);
  let impact = null;
  for (let step = 0; step < steps; step++) {
    const prev = points[points.length - 1], prevAge = sample.age;
    if (flying) advanceFlightMotion(sample, dt);
    else advanceProjectileMotion(sample, dt, weaponType, 'player');
    sample.age += dt;
    if (!flying) impact = sweptProjectileContact(sample, prev.x, prev.y, prevAge);
    const { x, y } = impact || sample;
    points.push({ x, y, length: prev.length + Math.hypot(x - prev.x, y - prev.y) });
    if (impact) break;
    if (flying && (x < 0 || x >= worldWidth() || caveFlightBlocked(prev.x, prev.y, x, y) ||
        (sample.vy > 0 && (landingPlatformAt(x, prev.y + 36, y + 36) || (sample.age > 12 && groundSolidAt(x, y + 36)))))) break;
  }
  return { points, impact };
}

// A soft bead with a tapered tail. Bake once per colour for both desktop and touch.
const aimBeads = new Map();
function aimBead(tint) {
  if (aimBeads.has(tint)) return aimBeads.get(tint);
  const bead = document.createElement('canvas');
  bead.width = 56;
  bead.height = 32;
  const g = bead.getContext('2d');
  g.scale(4, 4);
  g.translate(8, 4);
  g.save();
  g.scale(1.6, 1);
  const halo = g.createRadialGradient(0, 0, .6, 0, 0, 3.7);
  halo.addColorStop(0, '#3159538f');
  halo.addColorStop(.58, '#39665b49');
  halo.addColorStop(1, '#28505100');
  g.fillStyle = halo;
  g.fillRect(-4, -4, 8, 8);
  g.restore();
  const light = g.createLinearGradient(-7, 0, 2, 0);
  light.addColorStop(0, tint + '00');
  light.addColorStop(.48, tint);
  light.addColorStop(.84, '#ffffed');
  light.addColorStop(1, '#fffffa');
  g.fillStyle = light;
  g.beginPath();
  g.moveTo(-7, 0);
  g.quadraticCurveTo(-2, -.8, -.3, -1.45);
  g.bezierCurveTo(2.45, -2.1, 2.45, 2.1, -.3, 1.45);
  g.quadraticCurveTo(-2, .8, -7, 0);
  g.fill();
  aimBeads.set(tint, bead);
  return bead;
}

function drawTrajectory() {
  const flying = state.player.flightArmed;
  const weaponType = aimedWeapon();
  const offsets = flying ? [0] : new Set(composeEnchantment(aimedEnchants()).shots.map(shot => shot.angleOffset));
  const bead = aimBead(flying ? '#afeefe' : weapons[weaponType].tint);
  const unit = 1 / state.zoom;
  for (const offset of offsets) {
    const angle = Math.max(8, Math.min(172, state.angle + offset));
    const { points } = sampleAimTrajectory(angle, weaponType, flying);
    const total = points[points.length - 1].length / 3;
    if (total <= 0) continue;
    const cut = points.findIndex(point => point.length >= total);
    const before = points[cut - 1], after = points[cut];
    const fraction = (total - before.length) / (after.length - before.length);
    points.length = cut;
    points.push({
      x: before.x + (after.x - before.x) * fraction,
      y: before.y + (after.y - before.y) * fraction,
      length: total
    });
    const main = offset === 0;
    // Space marks along the arc in screen pixels, independent of shot speed or zoom.
    let next = 4 * unit;
    ctx.save();
    if (main) {
      const start = points[0], end = points[points.length - 1];
      const thread = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      thread.addColorStop(0, '#fffad677');
      thread.addColorStop(.65, '#faffed30');
      thread.addColorStop(1, '#faffed00');
      ctx.strokeStyle = thread;
      ctx.lineWidth = .85 * unit;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (const point of points) ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const length = b.length - a.length;
      while (length > 0 && next <= b.length) {
        const t = (next - a.length) / length;
        const progress = next / total;
        const size = unit * (main ? 1 : .82) * (1 - .30 * progress);
        ctx.save();
        ctx.translate(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
        ctx.globalAlpha = (main ? 1 : .78) * (1 - .66 * progress ** 2);
        ctx.drawImage(bead, -8 * size, -4 * size, 14 * size, 8 * size);
        ctx.restore();
        next += (11 + 4 * progress) * unit;
      }
    }
    ctx.restore();
  }
}

function drawPlayerChargeMeter() {
  ctx.save();
  const px = state.player.x, py = state.player.y + 15;
  ctx.fillStyle = 'rgba(14,26,22,.82)'; ctx.fillRect(px - 37, py, 74, 7);
  ctx.fillStyle = state.charging ? `hsl(${160 - 1.18 * state.power}, 84%, 69%)` : state.player.flightArmed ? '#8be9ff' : '#a5d779';
  ctx.fillRect(px - 35, py + 2, 70 * state.power / 100, 3);
  if (state.lastShot) {
    const mark = px - 35 + 70 * state.lastShot.power / 100;
    ctx.fillStyle = '#fff6d5'; ctx.fillRect(mark - 1, py - 2, 2, 11);
  }
  ctx.restore();
}

function drawCombatFeedback() {
  if (!state.running || state.gameOver) return;
  const hit = state.hitFeedback;
  if (hit?.life > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, hit.life / 18);
    ctx.translate(W / 2, 136 - Math.min(8, (110 - hit.life) * .15));
    const pop = 1 + Math.max(0, hit.life - 100) * .012;
    ctx.scale(pop, pop);
    ctx.textAlign = 'center';
    ctx.font = '900 25px Microsoft YaHei, sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,24,22,.8)';
    ctx.fillStyle = hit.defeated ? '#fff0a2' : '#e9ffda';
    const text = `${hit.label}  ${hit.damage > 0 ? `−${hit.damage}` : `护甲 −${hit.armor}`}`;
    ctx.strokeText(text, 0, 0); ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

function drawAimDial() {
  const p = state.player;
  const sign = playerAimDirection(state.angle);
  const angle = -Math.min(state.angle, 180 - state.angle) * Math.PI / 180;
  const accent = p.flightArmed ? '#81e8ff' : '#ffda72';
  const origin = weapons[aimedWeapon()].launchOffset || [34, 58];
  ctx.save();
  ctx.translate(p.x + (p.flightArmed ? 0 : sign * origin[0]), p.y - (p.flightArmed ? 36 : origin[1]));
  ctx.save(); ctx.scale(sign, 1);
  const dialShade = ctx.createRadialGradient(0, 0, 3, 0, 0, 40);
  dialShade.addColorStop(0, 'rgba(20,39,35,.12)');
  dialShade.addColorStop(1, 'rgba(20,39,35,.72)');
  ctx.fillStyle = dialShade;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,40,-Math.PI/2,0); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(210,234,214,.6)';
  ctx.beginPath(); ctx.arc(0,0,40,-Math.PI/2,0); ctx.stroke();
  for (let deg = 0; deg <= 90; deg += 10) {
    const a = -deg * Math.PI / 180;
    const major = deg % 30 === 0;
    const inner = major ? 34 : 37;
    ctx.strokeStyle = major ? '#e4efdc' : '#9fb7ad';
    ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
    ctx.lineTo(Math.cos(a)*40,Math.sin(a)*40); ctx.stroke();
  }
  ctx.rotate(angle);
  ctx.lineJoin = 'round';
  ctx.fillStyle = accent; ctx.strokeStyle = '#283b34'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(7, -2.5); ctx.lineTo(44, 0); ctx.lineTo(7, 2.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = p.flightArmed ? '#e2fbff' : '#fff4c9';
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(7, -1.9); ctx.lineTo(40, 0); ctx.fill();
  ctx.fillStyle = '#273d35';
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.font = 'bold 14px Microsoft YaHei, sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 4; ctx.strokeStyle = '#252e31'; ctx.fillStyle = accent;
  const label = (Math.round(Math.min(state.angle, 180 - state.angle) * 10) / 10) + '°';
  ctx.strokeText(label,sign*29,16); ctx.fillText(label,sign*29,16);
  ctx.restore();
}

function drawEnemyWarning() {
  const rival = measuredRival();
  if (!rival) return;
  ctx.save();
  const armed = rival.blastArmed;
  const drop = rival.nextAttack === 'drop';
  if ((armed || drop) && !rival.attackFreezeTurns) {
    const x = armed ? rival.x : rival.dropX;
    const y = armed ? rival.y - 36 : terrainAt(x);
    const r = armed ? weapons.clownBlast.radius : weapons.zomboniDrop.radius;
    ctx.fillStyle = 'rgba(242,98,58,.11)'; ctx.strokeStyle = '#ffab7e';
    ctx.lineWidth = 2; ctx.setLineDash([8,6]);
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x-9,y); ctx.lineTo(x+9,y); ctx.moveTo(x,y-9); ctx.lineTo(x,y+9); ctx.stroke();
  }
  if (state.scouting) {
    ctx.strokeStyle = '#ffd57c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(rival.x,rival.y,41,10,0,0,Math.PI*2); ctx.stroke();
  }
  ctx.restore();
}

function drawFlightTrail() {
  if (!state.flight) return;
  state.flight.trail.forEach(point => {
    ctx.fillStyle = `rgba(112,222,255,${point.life / 32})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2 + point.life / 12, 0, Math.PI * 2);
    ctx.fill();
  });
}

// The release frame and projectile share the same simulation clock (including slow motion).
function drawLiuThrow(fighter, height, facingRight) {
  const sheet = images.liuThrow;
  const cellW = sheet.naturalWidth / 4;
  const cellH = sheet.naturalHeight / 2;
  const throwing = fighter.knifeThrow;
  const elapsed = throwing?.elapsed || 0;
  const frame = throwing ? Math.min(7, Math.floor(elapsed / 6)) : 0;
  const width = height * cellW / cellH;
  const progress = Math.min(1, elapsed / 54);
  const lean = throwing ? Math.sin(progress * Math.PI) * .035 : Math.sin(state.trajectoryPulse) * .012;
  const breath = 1 + Math.sin(state.trajectoryPulse * 1.2) * .008;
  ctx.save();
  ctx.translate(fighter.x, fighter.y + 7);
  ctx.scale((throwing ? throwing.facingRight : facingRight) ? -1 : 1, 1);
  ctx.rotate(-lean);
  ctx.scale(breath, 1 / breath);
  drawFighterPose(fighter, sheet, (frame % 4) * cellW, Math.floor(frame / 4) * cellH, cellW, cellH, -width / 2, -height, width, height);
  ctx.restore();
}

function drawProjectile() {
  state.projectiles.forEach(drawSingleProjectile);
}

function drawZomboniDrop() {
  const drop = state.zomboniDrop;
  if (!drop) return;
  ctx.save();
  ctx.translate(drop.x, drop.y);
  ctx.rotate(Math.sin(drop.y * .025) * .08);
  if (images.zomboni?.complete && images.zomboni.naturalWidth) ctx.drawImage(images.zomboni, -82, -54, 164, 108);
  else {
    ctx.fillStyle = '#8fc6d8';
    ctx.fillRect(-65, -34, 130, 68);
  }
  ctx.restore();
}

function drawBasketball() {
  const fill = ctx.createRadialGradient(-4, -5, 1, 1, 1, 15);
  fill.addColorStop(0, '#ffc774');
  fill.addColorStop(.55, '#f49440');
  fill.addColorStop(1, '#b45024');
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = '#502a22'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -3, 14, 0);
  ctx.moveTo(0, -14); ctx.quadraticCurveTo(5, 0, 0, 14);
  ctx.moveTo(-11, -10); ctx.bezierCurveTo(-4, -6, -4, 6, -11, 10);
  ctx.moveTo(11, -10); ctx.bezierCurveTo(4, -6, 4, 6, 11, 10);
  ctx.stroke();
}

function drawSingleProjectile(p) {
  const weapon = weapons[p.weapon];
  ctx.save();
  ctx.globalAlpha = .28;
  ctx.strokeStyle = weapon.tint;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  if (p.trail.length) {
    ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y);
    p.trail.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  p.trail.forEach((point, index) => {
    const strength = Math.min(1, point.life / 20);
    const age = 20 - point.life;
    ctx.globalAlpha = strength * .76;
    ctx.fillStyle = weapon.tint;
    ctx.beginPath();
    if (p.weapon === 'fire') {
      ctx.fillStyle = index % 2 ? '#ffb343' : '#fa6135';
      ctx.ellipse(point.x, point.y - age * .32, 3 + strength * 6, 1 + strength * 3, p.rotation, 0, Math.PI * 2);
    } else if (weapon.attackFreezeTurns || p.weapon === 'cattailStar') {
      const r = 2 + strength * 3;
      ctx.moveTo(point.x, point.y - r); ctx.lineTo(point.x + r * .55, point.y);
      ctx.lineTo(point.x, point.y + r); ctx.lineTo(point.x - r * .55, point.y);
    } else if (p.weapon === 'potato' || p.weapon === 'explodingNut') {
      ctx.globalAlpha *= .5; ctx.fillStyle = '#7c7060';
      ctx.arc(point.x, point.y - age * .4, 2 + age * .25, 0, Math.PI * 2);
    } else if (p.weapon === 'basketball') {
      if (index % 3) return;
      ctx.strokeStyle = '#ffbd74'; ctx.lineWidth = 1.7;
      ctx.arc(point.x, point.y, 6 + strength * 6, p.rotation + 2, p.rotation + 4.2);
      ctx.stroke(); return;
    } else {
      ctx.ellipse(point.x, point.y, 1 + strength * 5, 1 + strength, p.rotation, 0, Math.PI * 2);
    }
    ctx.fill();
  });
  ctx.restore();
  if (p.image === 'zombieHead') {
    drawFlyingZombieHead(p);
    return;
  }
  const image = images[p.image || weapon.image];
  const drawWidth = weapon.drawWidth || 46;
  const drawHeight = weapon.drawHeight || 28;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.weapon === 'basketball') {
    ctx.rotate(p.age * .23 * Math.sign(p.vx));
    drawBasketball();
    ctx.restore();
    return;
  }
  ctx.rotate(p.rotation);
  if (p.vx < 0 && p.weapon !== 'fruitKnife') ctx.scale(1, -1);
  if (image?.complete && image.naturalWidth) ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  else {
    ctx.fillStyle = weapon.tint;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Bake the same solid column intervals used by shots, walking and landing.
function platformSkin(platform) {
  const panel = terrainArt[state.map];
  const art = platform.sprite ? images[platform.sprite] : platform.outline ? images.mipingStage : panel ? images[panel[0]] : images.gothicPalace;
  const textured = !!(art?.complete && art.naturalWidth);
  if (platform.skin && platform.textured === textured) return platform.skin;
  const skin = document.createElement('canvas');
  skin.width = platform.terrain.length;
  skin.height = platform.height;
  const g = skin.getContext('2d');
  g.beginPath();
  for (let x = 0; x < skin.width; x++) {
    let top = platform.terrain[x];
    for (const gap of platform.cavities[x] || []) {
      g.rect(x, top - platform.y, 1, gap.top - top);
      top = gap.bottom;
    }
    g.rect(x, top - platform.y, 1, platform.bottom - top);
  }
  g.clip();
  const detail = GROUND_DETAILS[state.map];
  g.fillStyle = detail.colors[1];
  g.fillRect(0, 0, skin.width, skin.height);
  if (platform.sprite && textured) {
    g.save();
    if (platform.mirrored) { g.translate(platform.width, 0); g.scale(-1, 1); }
    g.drawImage(art, 0, 0, platform.width, platform.height);
    g.restore();
  } else if (platform.outline && textured) {
    g.drawImage(art, -platform.left, -platform.y, worldWidth(), worldHeight());
  } else if (textured) {
    const cell = panel?.[1];
    const width = cell === undefined ? art.naturalWidth : Math.floor(art.naturalWidth / 2);
    const height = cell === undefined ? art.naturalHeight : Math.floor(art.naturalHeight / 2);
    const sx = cell === undefined ? 0 : (cell % 2) * width;
    const sy = cell === undefined ? 0 : Math.floor(cell / 2) * height;
    const cropHeight = Math.min(height - 4, (width - 4) * skin.height / skin.width);
    g.drawImage(art, sx + 2, sy + 2, width - 4, cropHeight, 0, 0, skin.width, skin.height);
  }
  for (let x = 0; x < skin.width; x++) {
    const surface = platform.terrain[x] - platform.y;
    const exposed = platform.terrain[x] - platform.originalTerrain[x];
    if (exposed > 1) {
      const top = platform.terrain[x];
      const slope = ((platform.terrain[x + 3] ?? top) - (platform.terrain[x - 3] ?? top)) / 6;
      drawScorchedLip(g, x, surface, 1, exposed, Math.round(platform.left + x), slope);
    } else if (!platform.outline && !platform.sprite) {
      g.fillStyle = detail.trim;
      g.fillRect(x, surface, 1, 2 + groundVariation(x));
    }
  }
  g.translate(0, -platform.y);
  for (const cut of platform.burns) drawCavityBurn(g, cut);
  platform.skin = skin;
  platform.textured = textured;
  return skin;
}

function drawCloudPlatforms() {
  const left = state.cameraX + (W - viewportWidth()) / 2;
  for (const platform of state.cloudPlatforms) {
    if (platform.left + platform.width < left || platform.left > left + viewportWidth()) continue;
    ctx.drawImage(platformSkin(platform), platform.left - .5, platform.y);
  }
}

function drawTunnelStructures() {
  if (state.map !== 'tunnels') return;
  state.tunnelBlocks.forEach(block => {
    if (block.health <= 0) return;
    const horizontal = block.width > block.height;
    const left = block.x - block.width / 2;
    const top = block.y - block.height / 2;
    const ratio = Math.max(0, Math.min(1, block.health / block.maxHealth));
    const sprite = horizontal ? images.mineBeam : images.mineSlab;
    // Crop only transparent padding; the visible sprite occupies the existing hitbox.
    const crop = horizontal ? [30, 282, 2114, 200] : [104, 44, 506, 2090];
    ctx.save();
    const anchors = horizontal ? [left + block.width * .16, left + block.width * .84] : [block.x];
    // Hanging ropes are background decoration, not extra collision geometry.
    anchors.forEach(x => {
      const ropeTop = -12;
      const fade = ctx.createLinearGradient(0, 0, 0, top);
      fade.addColorStop(0, 'rgba(39,42,35,0)');
      fade.addColorStop(.22, 'rgba(50,45,33,.32)');
      fade.addColorStop(1, 'rgba(54,40,26,.8)');
      ctx.strokeStyle = fade; ctx.lineWidth = horizontal ? 2.5 : 3;
      ctx.beginPath(); ctx.moveTo(x - 5, ropeTop); ctx.quadraticCurveTo(x - 3, top * .6, x, top + 3); ctx.stroke();
      ctx.strokeStyle = 'rgba(193,165,111,.4)'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(x - 3, top * .45); ctx.lineTo(x + .7, top + 3); ctx.stroke();
      ctx.strokeStyle = '#75634b'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(x, top + 2, 2.7, 4, 0, 0, Math.PI * 2); ctx.stroke();
    });
    if (sprite?.complete && sprite.naturalWidth) {
      ctx.drawImage(sprite, ...crop, left, top, block.width, block.height);
    } else {
      const timber = ctx.createLinearGradient(left, top, left + block.width, top + block.height);
      timber.addColorStop(0, '#aa7949'); timber.addColorStop(1, '#4e382c');
      ctx.fillStyle = timber; ctx.strokeStyle = '#382c25'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(left, top, block.width, block.height, 3); ctx.fill(); ctx.stroke();
    }
    if (ratio < .75) {
      ctx.save();
      ctx.beginPath(); ctx.rect(left, top, block.width, block.height); ctx.clip();
      ctx.strokeStyle = 'rgba(32,28,24,.82)'; ctx.lineWidth = 1.4;
      const cracks = ratio < .35 ? 3 : 1;
      for (let i = 0; i < cracks; i++) {
        const x = left + block.width * (.32 + i * .19);
        const y = top + (horizontal ? 2 : block.height * (.2 + i * .21));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 9); ctx.lineTo(x + 3, y + 16); ctx.lineTo(x - 3, y + 26); ctx.stroke();
      }
      ctx.restore();
    }
    if (ratio < 1) {
      const barWidth = horizontal ? 46 : 26;
      ctx.fillStyle = 'rgba(26,32,29,.8)';
      ctx.beginPath(); ctx.roundRect(block.x - barWidth / 2 - 1, top - 10, barWidth + 2, 4, 2); ctx.fill();
      ctx.fillStyle = ratio > .4 ? '#c4b279' : '#d48e61';
      ctx.fillRect(block.x - barWidth / 2, top - 9, barWidth * ratio, 2);
    }
    ctx.restore();
  });
}

function drawReturningHead() {
  const head = state.returningHead;
  if (head) drawFlyingZombieHead(head);
}

function drawFlyingZombieHead(head) {
  const image = images.zombieHead;
  if (!image?.complete || !image.naturalWidth) return;
  const scale = flyingZombieHeight / 144 * fighterMapScale();
  const facingRight = state.player.x > head.shooter.x;
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.scale(facingRight ? -scale : scale, scale);
  ctx.rotate(-.24 * Math.sin(head.rotation));
  // The GIF's 150×186 canvas includes a baked fall; use the visible first-frame
  // head at its native pixel scale and let the game's trajectory supply motion.
  ctx.drawImage(image, 11, 16, 48, 47, -24, -23.5, 48, 47);
  ctx.restore();
}

// Roll individual lobes outward. Their lit faces point back toward the flash.
function drawImpact(burst, t) {
  const sheet = impactSheets[burst.weapon];
  if (sheet?.complete && sheet.naturalWidth) {
    if (burst.weapon === 'ultimate') {
      const frameWidth = Math.floor(sheet.naturalWidth / 10);
      const frame = Math.min(9, Math.floor(t * 10));
      const rise = Math.min(1, t / .18);
      const height = burst.radius * 1.85 * (1 - .65 * (1 - rise) ** 2);
      const width = height * frameWidth / sheet.naturalHeight;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - t) / .22);
      ctx.drawImage(sheet, frame * frameWidth, 0, frameWidth, sheet.naturalHeight,
        burst.x - width / 2, burst.y - height + 6, width, height);
      ctx.restore();
      return;
    }
    const frame = Math.min(15, Math.floor(t * 16));
    const cell = sheet.naturalWidth / 4;
    const size = burst.radius * (burst.direct ? 2.7 : 2.45);
    ctx.save();
    ctx.translate(burst.x, burst.y);
    if (burst.angle != null) {
      ctx.rotate(burst.angle);
      const impulse = (1 - t) ** 2;
      ctx.translate(size * .13 * Math.min(1, t * 8), 0);
      ctx.scale(1 + .46 * impulse, 1 - .24 * impulse);
    }
    ctx.drawImage(sheet, (frame % 4) * cell, Math.floor(frame / 4) * cell, cell, cell,
      -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }
  const ice = !!weapons[burst.weapon].attackFreezeTurns;
  const hot = burst.weapon === 'fire' || burst.bigBlast || burst.nuclear;
  const berry = burst.weapon === 'dogwood';
  const light = berry ? '#ffb6a6' : ice ? '#dcffff' : hot ? '#fff29d' : '#fff8b6';
  const flame = berry ? '#f32943' : ice ? '#74d8ff' : hot ? '#ff962d' : '#c6d968';
  const expansion = 1 - (1 - t) ** 3;
  const seed = Math.round(burst.x * 5 + burst.y * 13);
  const heat = Math.max(0, 1 - t / (hot ? .64 : .43));
  const mix = (cold, lit) => 'rgb(' + cold.map((v, i) => Math.round(v + (lit[i] - v) * heat)).join(',') + ')';
  const core = berry ? mix([205,63,74], [255,173,147]) : mix(ice ? [221,230,238] : [181,166,153], ice ? [220,255,255] : [255,247,166]);
  const body = berry ? mix([145,33,59], [250,52,64]) : mix(ice ? [141,171,188] : [139,126,119], ice ? [116,216,255] : hot ? [255,150,45] : [198,217,104]);
  const shadow = berry ? '#7a1a35' : hot ? mix([96,83,90], [179,79,40]) : ice ? '#59788e' : '#60535a';
  ctx.save();
  ctx.translate(burst.x, burst.y);
  ctx.scale(burst.radius, burst.radius);
  const count = burst.bigBlast || burst.nuclear ? 16 : 10;
  for (let i = 0; i < count; i++) {
    const noise = groundVariation(seed + i * 173);
    const angle = i * Math.PI * 2 / count + noise * .55;
    const reach = (.24 + .63 * noise) * expansion;
    const x = Math.cos(angle) * reach;
    const y = Math.sin(angle) * reach * .79 - t * t * (burst.nuclear ? 1 : .47);
    const size = (.13 + noise * .19) * (.32 + expansion);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + t * (noise - .5));
    ctx.scale(size, size * (.82 + noise * .25));
    const roll = ctx.createRadialGradient(-.45, -.12, .03, .04, .09, 1.16);
    roll.addColorStop(0, core);
    roll.addColorStop(.40, body);
    roll.addColorStop(.78, shadow);
    roll.addColorStop(1, ice ? '#4b6277' : '#413d49');
    ctx.globalAlpha = Math.min(1, t * 24) * (1 - t ** 1.6);
    ctx.fillStyle = roll;
    ctx.beginPath(); ctx.moveTo(-.98, -.16);
    ctx.bezierCurveTo(-1.17,-.68,-.64,-1.06,-.26,-.91);
    ctx.bezierCurveTo(.05,-1.22,.65,-1.04,.72,-.65);
    ctx.bezierCurveTo(1.15,-.51,1.2,.11,.91,.35);
    ctx.bezierCurveTo(.96,.85,.43,1.03,.13,.83);
    ctx.bezierCurveTo(-.43,1.12,-1.08,.69,-.98,-.16);
    ctx.fill();ctx.restore();
  }
  // Nested irregular flash silhouettes contract while the smoke keeps expanding.
  if (t < .48) {
    ctx.rotate(groundVariation(seed) * 2);
    const flash = (.45 + .65 * Math.min(1,t * 12)) * (1 - t / .48) * (burst.direct ? 1.16 : 1);
    for (const [scale,color] of [[1,flame],[.68,light],[.34,'#ffffef']]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const angle = i * Math.PI / 13;
        const radius = flash * scale * (i % 2 ? .17 : .46 + groundVariation(seed + i * 97) * .66);
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
        if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

function drawEffects() {
  for (const burst of state.bursts) drawImpact(burst, 1 - burst.life / burst.maxLife);
  state.particles.forEach(p => {
    if (p.kind === 'spark' || p.kind === 'iceShard') {
      const shard = p.kind === 'iceShard';
      const length = p.size * (shard ? 1.5 : .6) + Math.hypot(p.vx, p.vy) * 1.5;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.globalAlpha = Math.min(1, p.life / 12);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(-2, -p.size * (shard ? .42 : .17));
      ctx.lineTo(2, 0); ctx.lineTo(-2, p.size * (shard ? .42 : .17)); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if (p.kind === 'debris') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = Math.min(1, p.life / 12);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.moveTo(-p.size * .55, 0); ctx.lineTo(0, -p.size * .46);
      ctx.lineTo(p.size * .48, -p.size * .13); ctx.lineTo(p.size * .31, p.size * .39);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }
    if (p.kind === 'dust') {
      ctx.globalAlpha = Math.min(.22, p.life / 125);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * .56, 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  state.floaters.forEach(f => {
    ctx.globalAlpha = Math.min(1, f.life / 24);
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(30,20,14,.75)';
    const pop = Math.min(1, (f.age || 6) / 6);
    const size = f.size || 24;
    ctx.lineWidth = Math.max(3, size * .16);
    ctx.font = `900 ${size}px Microsoft YaHei, sans-serif`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(.72 + pop * .28, .72 + pop * .28);
    ctx.strokeText(f.text, 0, 0);
    ctx.fillText(f.text, 0, 0);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function stepSimulation() {
  if (littleDaveScene === 'rescue' || state.berryFeeding) {
    updateEffects();
    if (state.berryFeeding && --state.berryFeeding === 0) reviveMipingPea();
    return;
  }
  if (state.aimHold) {
    if (!canPlayerAct() || !battleKeysAvailable()) state.aimHold = null;
    else {
      const hold = state.aimHold;
      hold.elapsed += SIMULATION_STEP_MS;
      if (hold.elapsed >= hold.next) {
        changeAim(hold.direction);
        hold.next += hold.elapsed < 650 ? 70 : 34;
      }
    }
  }
  if (state.hitStopFrames > 0) {
    state.hitStopFrames -= 1;
    updateEffects();
    return;
  }
  const scaledDelta = SIMULATION_STEP_MS * state.timeScale;
  updateTimer(scaledDelta);
  updateFlight();
  updateClownFlight();
  updateDanceSummon();
  updateKnockback();
  updateZomboniDrop();
  updateNewspaperRush();
  updateProjectile();
  updateReturningHead();
  updateEffects();
  updateCamera();
  checkPitFalls();
}

function loop(now) {
  updateCharging(now);
  const delta = Math.max(0, Math.min(100, now - state.lastTick));
  state.lastTick = now;
  state.frameAccumulator += delta;
  while (state.frameAccumulator + .000001 >= SIMULATION_STEP_MS) {
    state.frameAccumulator = Math.max(0, state.frameAccumulator - SIMULATION_STEP_MS);
    stepSimulation();
  }
  draw();
  requestAnimationFrame(loop);
}

ui.angleRange.addEventListener('input', event => {
  setPlayerAngle(Number(event.target.value));
});
ui.powerRange.addEventListener('input', event => {
  state.power = Number(event.target.value);
  updateUI();
});
ui.weaponButtons.forEach(button => button.addEventListener('click', () => setWeapon(button.dataset.weapon)));
ui.cattailWeaponButtons.forEach(button => button.addEventListener('click', () => setWeapon(button.dataset.cattailWeapon)));
ui.enchantButtons.forEach(button => button.addEventListener('click', () => setEnchant(button.dataset.enchant)));
function syncBattleSoundButton() {
  ui.soundButton.setAttribute('data-muted', String(!audio.enabled));
  ui.soundButton.title = audio.enabled ? '关闭音效' : '开启音效';
  ui.soundButton.setAttribute('aria-label', ui.soundButton.title);
}
ui.soundButton.addEventListener('click', () => {
  audio.enabled = !audio.enabled;
  if (!audio.enabled) stopCharacterVoice();
  if (!audio.enabled) stopChargeVoice();
  syncBattleSoundButton();
  if (audio.enabled) {
    Promise.allSettled(prepareBattleSounds([...commonCues, ...(stageCues[state.map] || [])]));
    startBackgroundMusic();
    playSfx('turn');
  } else if (audio.bgm) {
    audio.bgm.pause();
  }
});
ui.zoomOut.addEventListener('click', () => setZoom(-1));
ui.zoomIn.addEventListener('click', () => setZoom(1));
document.getElementById('enemyScout')?.addEventListener('click', () => {
  if (!canPlayerAct() || state.charging) return;
  battleChart.free();
  state.scouting = !state.scouting;
  updateUI();
});
for (const id of ['lobNext', 'lobMinus', 'lobPlus']) {
  document.getElementById(id)?.addEventListener('click', () => {
    if (!canPlayerAct() || state.charging) return;
    if (id === 'lobNext') {
      const rivals = aliveRivals();
      state.lobTarget = rivals[(rivals.indexOf(measuredRival()) + 1) % rivals.length];
    } else changeAim(id === 'lobPlus' ? .1 : -.1);
    updateUI(); canvas.focus?.({ preventScroll: true });
  });
}
let lastWheelZoom = -Infinity;
canvas.addEventListener('wheel', event => {
  if (!battleKeysAvailable() || event.ctrlKey || !event.deltaY) return;
  event.preventDefault();
  const now = performance.now();
  if (now - lastWheelZoom < 75) return;
  lastWheelZoom = now;
  setZoom(event.deltaY < 0 ? 1 : -1);
}, { passive: false });
let firePointerId = null;
ui.fireButton.addEventListener('pointerdown', event => {
  if (firePointerId !== null || state.charging || !canPlayerAct() || (event.button !== undefined && event.button !== 0)) return;
  firePointerId = event.pointerId;
  event.preventDefault();
  startBackgroundMusic();
  if (ui.fireButton.setPointerCapture) ui.fireButton.setPointerCapture(event.pointerId);
  beginCharge();
});
ui.fireButton.addEventListener('pointerup', event => {
  if (event.pointerId !== firePointerId) return;
  firePointerId = null;
  event.preventDefault();
  // Tap to fire the selected power; hold to use the charge-and-release meter.
  // Holding the same button still runs the ordinary charge-and-release meter.
  if (state.charging && performance.now() - state.chargeStartedAt < 220) {
    state.power = state.powerBeforeCharge;
  }
  releaseCharge();
});
function cancelPointerCharge(event) {
  if (event.pointerId !== firePointerId) return;
  firePointerId = null;
  cancelCharge();
}
ui.fireButton.addEventListener('pointercancel', cancelPointerCharge);
ui.fireButton.addEventListener('lostpointercapture', cancelPointerCharge);
ui.fireButton.addEventListener('click', event => {
  if (event.detail === 0 && canPlayerAct() && !state.charging) handlePrimaryAction();
});
ui.moveLeft.addEventListener('click', () => movePlayer(-1));
ui.moveRight.addEventListener('click', () => movePlayer(1));
ui.flightButton.addEventListener('click', armFlight);
ui.healButton.addEventListener('click', useHeal);
ui.ultimateButton.addEventListener('click', () => {
  armUltimate();
  canvas.focus?.({ preventScroll: true });
});
ui.pumpkinButton?.addEventListener('click', usePumpkinShield);
ui.acceptCattailButton?.addEventListener('click', acceptCattailRescue);
document.getElementById('callSisterButton')?.addEventListener('click', () => {
  ui.cattailRescueOverlay.dataset.speaker = 'sister';
  playSfx('shieldEquip');
  ui.acceptCattailButton.focus();
});
ui.declineCattailButton?.addEventListener('click', declineCattailRescue);
document.getElementById('startButton').addEventListener('click', () => {
  if (ui.littleDaveGuide && !ui.littleDaveGuide.hidden && (stageOpening() !== gardenOpening || !littleDaveSeen)) {
    openLittleDaveChat(true);
    updateUI();
    return;
  }
  ui.startOverlay.style.display = 'none';
  state.running = true;
  startBackgroundMusic();
  playSfx('battleStart');
  showToast('绿芽队先手');
  updateUI();
});
ui.littleDaveCharacter?.addEventListener('click', () => {
  if (state.running && state.active === 'player' && !state.gameOver && !state.turnPending && !state.volleyActive && !state.projectile && !state.flight) openLittleDaveChat();
});
ui.littleDaveNext?.addEventListener('click', () => {
  if (++littleDavePage >= littleDaveDialogue().length) closeLittleDaveChat();
  else showLittleDaveLine();
});
ui.littleDaveSkip?.addEventListener('click', closeLittleDaveChat);
ui.littleDaveChat?.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeLittleDaveChat();
});
ui.againButton.addEventListener('click', () => {
  if (ui.againButton.dataset.action === 'home') {
    ui.resultOverlay.hidden = true;
    showTitleScreen();
    return;
  }
  resetGame(false);
  startBackgroundMusic();
});
document.getElementById('resetButton').addEventListener('click', () => { resetGame(false); startBackgroundMusic(); });
ui.mapSelect.addEventListener('change', event => {
  state.map = event.target.value;
  resetGame(false);
  startBackgroundMusic();
  showToast(state.map === 'yard' ? '已进入晴日后院' : state.map === 'pool' ? '已进入心语玫瑰园' : state.map === 'canyon' ? '已进入米坪镇' : state.map === 'land' ? '已进入落日瓜市' : state.map === 'dance' ? '已进入月夜舞台' : state.map === 'war' ? '已进入全面战争' : state.map === 'newspaper' ? '已进入未铺草前院' : state.map === 'chaos' ? '已进入金字塔屋顶' : '已进入地道前线');
});
ui.daveStartButton?.addEventListener('click', () => {
  ui.daveOverlay.hidden = true;
  state.running = true;
  startBackgroundMusic();
  playSfx('battleStart');
  showToast('地狱乱斗开始：你的回合');
  updateUI();
});
ui.modeSelect?.addEventListener('change', event => {
  state.mode = event.target.value;
  resetGame(false);
  if (stageOpening() === roseOpening) return;
  showToast(state.mode === '1v2' ? '已进入 1v2：普通僵尸加入' : state.mode === 'dance' ? '舞王召唤战开始' : state.mode === 'war' ? '1v4 全面战争开始' : state.mode === 'newspaper' ? '读报僵尸首领战开始' : state.mode === 'chaos' ? '最终关 1v5：玩家与僵尸交替行动' : state.mode === 'gauntlet' ? '三僵尸挑战开始' : state.mode === 'clown' ? '小丑首领战开始' : '已回到 1v1');
});
ui.timeScaleSelect.value = String(state.timeScale);
ui.timeScaleSelect.addEventListener('change', event => {
  const nextScale = Number(event.target.value);
  if (![.35, .65, 1, 1.5].includes(nextScale)) return;
  state.timeScale = nextScale;
  try { window.localStorage.setItem('trajectoryTimeScale', String(nextScale)); } catch {}
  const label = { '.35': '很慢', '.65': '慢', '1': '标准', '1.5': '快' }[String(nextScale).replace(/^0/, '')] || '标准';
  showToast(`游戏流速：${label}`);
});

function battleKeysAvailable() {
  return state.running && !state.gameOver && document.getElementById('levelOverlay')?.hidden !== false &&
    document.getElementById('titleScreen')?.hidden !== false && ui.littleDaveChat?.hidden !== false;
}

const aimKeyDirections = new Map([['ArrowUp', 1], ['KeyW', 1], ['ArrowDown', -1], ['KeyS', -1]]);

const anglePadButtons = ['angleUp', 'angleDown'].map(id => document.getElementById(id)).filter(Boolean);
for (const button of anglePadButtons) {
  const direction = button.id === 'angleUp' ? 1 : -1;
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !canPlayerAct()) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    changeAim(direction);
    state.aimHold = { code: button.id, direction, elapsed: 0, next: 190 };
  });
  button.addEventListener('lostpointercapture', () => {
    if (state.aimHold?.code === button.id) state.aimHold = null;
  });
  button.addEventListener('click', event => {
    if (!event.detail && canPlayerAct()) changeAim(direction);
  });
}

function changeAim(direction) {
  state.scouting = false;
  const facing = playerAimDirection(state.angle);
  const elevation = Math.min(state.angle, 180 - state.angle);
  const tenths = Math.max(100, Math.min(900, Math.round((elevation + direction) * 10)));
  const next = (facing < 0 ? 1800 - tenths : tenths) / 10;
  setPlayerAngle(next);
}

function setPlayerAngle(next) {
  if (next === state.angle) return;
  if (next === 90) state.player.moveDirection = playerAimDirection(state.angle);
  const rising = Math.min(next, 180 - next) > Math.min(state.angle, 180 - state.angle);
  state.angle = next;
  ui.angleRange.value = next;
  playSfx('aimRatchet', { rate: rising ? 1.06 : .94 });
  updateUI();
}

window.addEventListener('keydown', event => {
  if (!battleKeysAvailable() || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = document.activeElement;
  if (target?.isContentEditable || target?.tagName === 'SELECT' || (target?.tagName === 'INPUT' && target.type !== 'range')) return;
  if (ui.littleDaveChat?.hidden === false || document.activeElement.id?.startsWith('littleDave')) return;
  if (event.code === 'Escape') { cancelCharge(); return; }
  if (event.code === 'KeyQ') {
    event.preventDefault();
    if (!event.repeat) armUltimate();
    return;
  }
  if (['Minus', 'NumpadSubtract', 'Equal', 'NumpadAdd'].includes(event.code)) {
    event.preventDefault();
    setZoom(event.code === 'Minus' || event.code === 'NumpadSubtract' ? -1 : 1);
    return;
  }
  const aimKey = aimKeyDirections.get(event.code);
  if (aimKey !== undefined) {
    const direction = aimKey * (event.shiftKey ? .1 : 1);
    if (!canPlayerAct()) return;
    event.preventDefault();
    if (!event.repeat) {
      changeAim(direction);
      state.aimHold = { code: event.code, direction, elapsed: 0, next: 190 };
    }
    return;
  }
  if (event.code === 'KeyA' || event.code === 'KeyD') {
    event.preventDefault();
    movePlayer(event.code === 'KeyA' ? -1 : 1);
    return;
  }
  if (['INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName) && event.code !== 'Space' && !(event.code === 'Enter' && document.activeElement.type === 'range')) return;
  if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat) beginCharge();
    return;
  }
  if (!canPlayerAct() || state.charging) return;
  if (event.code === 'Enter') {
    event.preventDefault();
    if (!event.repeat) handlePrimaryAction();
    return;
  }
  if (event.code === 'Digit1') setWeapon('normal');
  if (event.code === 'Digit2') setWeapon('fire');
  if (event.code === 'Digit3') setWeapon('ice');
  if (event.code === 'Digit4') armFlight();
  if (event.code === 'Digit5') setWeapon('potato');
  ui.angleRange.value = state.angle;
  ui.powerRange.value = state.power;
  updateUI();
});

window.addEventListener('keyup', event => {
  if (state.aimHold?.code === event.code) state.aimHold = null;
  if (document.activeElement.id?.startsWith('littleDave')) return;
  if (event.code !== 'Space') return;
  event.preventDefault();
  releaseCharge();
});

// Losing focus must not leave a held charge running behind another window.
window.addEventListener('blur', () => { firePointerId = null; state.aimHold = null; cancelCharge(); updateUI(); });

const autoStart = new URLSearchParams(window.location.search).has('play');
resetGame(!autoStart || document.getElementById('gardenBoot')?.open === true);
requestAnimationFrame(loop);
