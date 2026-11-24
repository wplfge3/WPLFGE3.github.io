const titleScreen = document.getElementById('titleScreen');
const titleMenuView = document.getElementById('titleMenuView');
const almanacView = document.getElementById('almanacView');
const creditsView = document.getElementById('creditsView');
const exitDialog = document.getElementById('exitDialog');
const resetDialog = document.getElementById('resetDialog');
const exitMessage = document.getElementById('exitMessage');
const gameShell = document.querySelector('.game-shell');
const titleStartButton = document.getElementById('titleStartButton');
const titleAlmanacButton = document.getElementById('titleAlmanacButton');
const titleCreditsButton = document.getElementById('titleCreditsButton');
const titleResetButton = document.getElementById('titleResetButton');
const titleExitButton = document.getElementById('titleExitButton');
const titleMusic = document.getElementById('titleMusic');
const titleSoundButton = document.getElementById('titleSoundButton');
const exitConfirmButton = document.getElementById('exitConfirmButton');
const exitCancelButton = document.getElementById('exitCancelButton');
const resetConfirmButton = document.getElementById('resetConfirmButton');
const unlockAllButton = document.getElementById('unlockAllButton');
const resetCancelButton = document.getElementById('resetCancelButton');
const homeButton = document.getElementById('homeButton');
const titleBackButtons = [...document.querySelectorAll('[data-title-back]')];
const almanacTabButtons = [...document.querySelectorAll('[data-almanac-tab]')];
const almanacGroups = [...document.querySelectorAll('[data-almanac-group]')];
const launchParams = new URLSearchParams(window.location.search);
const isToyPage = document.documentElement?.dataset.host === 'toy';
const isAndroidApp = launchParams.has('android') || (isToyPage && window.matchMedia('(pointer: coarse)').matches);

document.body.classList.toggle('android-app', isAndroidApp);

const touchBrowser = window.matchMedia?.('(pointer: coarse)').matches && !launchParams.has('android');

async function enterMobileFullscreen() {
  if (!touchBrowser) return;
  const root = document.documentElement;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' });
      else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
    }
    await window.screen.orientation?.lock?.('landscape');
  } catch {
    // Embedded browsers can decline either request. The portrait hint stays available.
  }
}

if (touchBrowser && launchParams.has('play')) {
  gameShell.addEventListener('click', enterMobileFullscreen, { once: true });
}

if (window.matchMedia?.('(any-pointer: coarse)').matches) {
  const preventControlMenu = event => {
    if (event.target.closest?.('#battleHud, #gameCanvas, #chartCanvas')) event.preventDefault();
  };
  for (const name of ['contextmenu', 'selectstart', 'dragstart']) {
    gameShell.addEventListener(name, preventControlMenu, true);
  }
}

function syncAndroidViewportHeight() {
  if (!isAndroidApp) return;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--android-viewport-height', `${Math.round(viewportHeight)}px`);
}

function fitAndroidBattlefield() {
  if (!isAndroidApp) return;
  const viewport = document.getElementById('battleViewport');
  const gameCanvas = document.getElementById('gameCanvas');
  const rect = viewport?.getBoundingClientRect();
  if (!rect || rect.width < 1 || rect.height < 1 || !gameCanvas) return;

  const fittedWidth = Math.min(rect.width, rect.height * 2);
  gameCanvas.style.width = `${Math.floor(fittedWidth)}px`;
  gameCanvas.style.height = `${Math.floor(fittedWidth / 2)}px`;
  const guide = document.getElementById('littleDaveGuide');
  if (guide) {
    guide.style.width = gameCanvas.style.width;
    guide.style.height = gameCanvas.style.height;
  }
}

function syncAndroidLayout() {
  syncAndroidViewportHeight();
  window.requestAnimationFrame(fitAndroidBattlefield);
}

if (isAndroidApp) {
  syncAndroidLayout();
  window.addEventListener('resize', syncAndroidLayout);
  window.visualViewport?.addEventListener('resize', syncAndroidLayout);
}

let titleLevelPending = false;

function syncTitleSoundButton() {
  const muted = !audio.enabled;
  titleSoundButton.classList.toggle('muted', muted);
  titleSoundButton.textContent = muted ? '♩' : '♫';
  titleSoundButton.title = muted ? '开启音乐' : '关闭音乐';
  titleSoundButton.setAttribute('aria-label', titleSoundButton.title);
}

function playTitleMusic() {
  if (!audio.enabled || !titleMusic || document.getElementById('gardenBoot')?.open) return;
  if (audio.bgm) audio.bgm.pause();
  titleMusic.muted = false;
  titleMusic.volume = .42;
  const playback = titleMusic.play();
  if (playback && typeof playback.catch === 'function') playback.catch(() => {});
  syncTitleSoundButton();
}

function pauseTitleMusic() {
  if (titleMusic) titleMusic.pause();
}

function playTitleButton() {
  if (titleMusic.paused) playTitleMusic();
  if (typeof playSfx === 'function') playSfx('button');
}

function showTitleMenu() {
  titleMenuView.hidden = false;
  almanacView.hidden = true;
  creditsView.hidden = true;
  exitDialog.hidden = true;
  resetDialog.hidden = true;
  titleStartButton.focus();
}

function showTitleSubview(view) {
  playTitleButton();
  titleMenuView.hidden = true;
  almanacView.hidden = view !== almanacView;
  creditsView.hidden = view !== creditsView;
  exitDialog.hidden = true;
  resetDialog.hidden = true;
}

function showTitleScreen() {
  if (typeof stopCharacterVoice === 'function') stopCharacterVoice();
  titleLevelPending = false;
  state.matchId += 1;
  state.running = false;
  state.projectile = null;
  state.projectiles = [];
  state.shotQueue = [];
  state.volleyActive = false;
  state.turnPending = false;
  state.flight = null;
  state.clownFlight = null;
  state.danceSummon = null;
  state.zomboniDrop = null;
  state.newspaperRush = null;
  cancelCharge();
  levelOverlay.hidden = true;
  titleScreen.hidden = false;
  gameShell.setAttribute('aria-hidden', 'true');
  playTitleMusic();
  syncTitleSoundButton();
  showTitleMenu();
}

function enterCampaign() {
  enterMobileFullscreen();
  playTitleButton();
  pauseTitleMusic();
  titleScreen.hidden = true;
  gameShell.removeAttribute('aria-hidden');
  titleLevelPending = true;
  levelButton.click();
}

function selectAlmanacTab(groupName) {
  almanacTabButtons.forEach(button => {
    const selected = button.dataset.almanacTab === groupName;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  almanacGroups.forEach(group => { group.hidden = group.dataset.almanacGroup !== groupName; });
}

const easyModeButton = document.getElementById('easyModeButton');
const normalModeButton = document.getElementById('normalModeButton');
function selectDifficulty(difficulty) {
  state.difficulty = difficulty;
  const assisted = difficulty === 'easy';
  easyModeButton.setAttribute('aria-pressed', String(assisted));
  normalModeButton.setAttribute('aria-pressed', String(!assisted));
  document.getElementById('titleModeHint').textContent = assisted ? '弹道辅助线 · 子弹近敌追踪' : '自主瞄准';
}
easyModeButton.addEventListener('click', () => { playTitleButton(); selectDifficulty('easy'); });
normalModeButton.addEventListener('click', () => { playTitleButton(); selectDifficulty('normal'); });
titleStartButton.addEventListener('click', enterCampaign);
titleAlmanacButton.addEventListener('click', () => showTitleSubview(almanacView));
titleCreditsButton.addEventListener('click', () => showTitleSubview(creditsView));
titleResetButton.addEventListener('click', () => {
  playTitleButton();
  exitDialog.hidden = true;
  resetDialog.hidden = false;
});
titleExitButton.addEventListener('click', () => {
  playTitleButton();
  resetDialog.hidden = true;
  exitMessage.textContent = '戴夫还在等你保住他的脑子。';
  exitDialog.hidden = false;
});
titleSoundButton.addEventListener('click', () => {
  if (audio.enabled && titleMusic.paused) {
    playTitleMusic();
    return;
  }
  audio.enabled = !audio.enabled;
  if (audio.enabled) {
    playTitleMusic();
    playSfx('button');
  } else {
    pauseTitleMusic();
    if (audio.bgm) audio.bgm.pause();
  }
  syncBattleSoundButton();
  syncTitleSoundButton();
});
ui.soundButton.addEventListener('click', syncTitleSoundButton);
titleBackButtons.forEach(button => button.addEventListener('click', () => { playTitleButton(); showTitleMenu(); }));
almanacTabButtons.forEach(button => button.addEventListener('click', () => {
  playTitleButton();
  selectAlmanacTab(button.dataset.almanacTab);
}));
exitCancelButton.addEventListener('click', () => { playTitleButton(); exitDialog.hidden = true; });
resetCancelButton.addEventListener('click', () => { playTitleButton(); resetDialog.hidden = true; });
resetConfirmButton.addEventListener('click', () => {
  playTitleButton();
  if (typeof window.resetCampaignProgress === 'function') window.resetCampaignProgress();
  resetDialog.hidden = true;
});
unlockAllButton.addEventListener('click', () => {
  playTitleButton();
  if (typeof window.unlockAllCampaignStages === 'function') window.unlockAllCampaignStages();
  resetDialog.hidden = true;
});
exitConfirmButton.addEventListener('click', () => {
  playTitleButton();
  if (window.AndroidHost && typeof window.AndroidHost.exitApp === 'function') {
    window.AndroidHost.exitApp();
    return;
  }
  window.close();
  window.setTimeout(() => {
    exitMessage.textContent = '当前浏览器未允许自动关闭窗口，你仍可返回后院。';
  }, 180);
});
homeButton.addEventListener('click', () => { playTitleButton(); showTitleScreen(); });

window.handleAndroidBack = function handleAndroidBack() {
  if (titleScreen.hidden) {
    showTitleScreen();
    return 'handled';
  }
  if (!exitDialog.hidden) {
    exitDialog.hidden = true;
    return 'handled';
  }
  if (!resetDialog.hidden) {
    resetDialog.hidden = true;
    return 'handled';
  }
  if (!almanacView.hidden || !creditsView.hidden) {
    showTitleMenu();
    return 'handled';
  }
  return 'exit';
};

stageButtons.forEach(button => button.addEventListener('click', () => { titleLevelPending = false; }));
levelCloseButton.addEventListener('click', () => { if (titleLevelPending) showTitleScreen(); });
levelOverlay.addEventListener('click', event => { if (event.target === levelOverlay && titleLevelPending) showTitleScreen(); });

window.addEventListener('keydown', event => {
  if (titleScreen.hidden || event.key !== 'Escape') return;
  if (!exitDialog.hidden) exitDialog.hidden = true;
  else if (!resetDialog.hidden) resetDialog.hidden = true;
  else if (almanacView.hidden && creditsView.hidden) return;
  else showTitleMenu();
});

selectAlmanacTab('plants');
syncTitleSoundButton();
const unlockTitleMusic = event => {
  if (event.target !== titleSoundButton && !titleScreen.hidden && titleMusic.paused) playTitleMusic();
};
window.addEventListener('pointerdown', unlockTitleMusic, { capture: true });
window.addEventListener('touchstart', unlockTitleMusic, { capture: true, passive: true });
window.addEventListener('keydown', unlockTitleMusic, { capture: true });
if (launchParams.has('play')) {
  pauseTitleMusic();
  titleScreen.hidden = true;
  gameShell.removeAttribute('aria-hidden');
} else {
  titleScreen.hidden = false;
  gameShell.setAttribute('aria-hidden', 'true');
  state.running = false;
  if (!document.getElementById('gardenBoot')?.open) playTitleMusic();
}

const bootDialog = document.getElementById('gardenBoot');
const readyStages = new Set();

async function showLoading(heading, jobs) {
  const meter = document.getElementById('bootMeter');
  const percent = document.getElementById('bootPercent');
  const status = document.getElementById('bootStatus');
  const retry = document.getElementById('bootRetry');
  document.getElementById('bootHeading').textContent = heading;
  if (!bootDialog.open) bootDialog.showModal();
  meter.max = jobs.length;
  meter.value = 0;
  percent.textContent = '0%';
  let pending = jobs;
  while (pending.length) {
    retry.hidden = true;
    const failed = [];
    let cursor = 0;
    async function worker() {
      while (cursor < pending.length) {
        const job = pending[cursor++];
        status.textContent = job.label;
        try {
          await job.run();
          meter.value++;
          percent.textContent = Math.floor(meter.value * 100 / meter.max) + '%';
        } catch { failed.push(job); }
      }
    }
    await Promise.all(Array.from({length: Math.min(pending.length, 6)}, worker));
    pending = failed;
    if (failed.length) {
      status.textContent = '还有 ' + failed.length + ' 项未就绪';
      retry.hidden = false;
      await new Promise(resolve => { retry.onclick = resolve; });
      retry.onclick = null;
    }
  }
  bootDialog.close();
}

function imageJob(getImage) {
  return {label: '准备画面', async run() {
    const img = getImage();
    if (img.dataset?.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    } else if (img.complete && !img.naturalWidth) img.src = img.src;
    let timeout;
    try {
      await Promise.race([img.decode(), new Promise((_, reject) => {
        timeout = setTimeout(() => reject(Error('图片加载超时')), 60000);
      })]);
    } finally { clearTimeout(timeout); }
  }};
}

function soundJob(cue) {
  return {label: '准备音效', run: () => Promise.all(prepareBattleSounds([cue]))};
}

function musicJob(path) {
  return {label: '准备本关音乐', async run() {
    if (readyMusic.has(path) || !/^https?:$/.test(location.protocol)) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(path, {signal: controller.signal});
      if (!response.ok) throw Error(String(response.status));
      readyMusic.set(path, URL.createObjectURL(await response.blob()));
    } finally { clearTimeout(timeout); }
  }};
}

const campaignArt = {
  yard: ['earthGarden', 'rival', 'liuThrow'],
  land: ['earthGarden', 'clownZombie'],
  canyon: ['mipingStage', 'henanMi', 'berryHero', 'dogwood', 'rival', 'liuThrow', 'normalZombie', 'zombieBody', 'zombieHead'],
  pool: ['roseHeart', 'roseBase', 'rival', 'liuThrow', 'clownZombie'],
  dance: ['earthCity'],
  chaos: ['gothicPalace', 'rival', 'liuThrow', 'normalZombie', 'zombieBody', 'zombieHead', 'clownZombie', 'cattail', 'cattailPumpkin']
};
const concertArt = ['dancingZombie','dancingSummon','leadDanceSheet','backupDancer','backupDanceSheet','backupThrow',
  'danceSpotlight','newspaperReading','newspaperLost','newspaperHeadWalk'];
const concertWeapons = ['basketball','note','explodingNut','zomboniDrop','cartSmash'];
const campaignWeapons = {
  yard: ['fruitKnife'], land: ['clownBlast'], canyon: ['fruitKnife','dogwood'], pool: ['fruitKnife','clownBlast'],
  dance: concertWeapons, chaos: ['fruitKnife','clownBlast','cattailPoison','cattailStar','cattailFrost', ...concertWeapons]
};

async function prepareStage(stage) {
  const {map} = stageConfigs[stage];
  const cacheKey = map + (audio.enabled ? ':sound' : ':silent');
  if (readyStages.has(cacheKey)) return;
  const concert = map === 'dance' || map === 'chaos';
  const art = new Set([map, 'hero','peaFirePoses','littleDave','explosion','zombieDeath',
    'groundWorm','groundMouse','groundSnake', ...campaignArt[map], ...(concert ? concertArt : [])]);
  const jobs = [];
  for (const weapon of ['normal','fire','ice','potato','ultimate', ...campaignWeapons[map]]) {
    if (weapons[weapon].image) art.add(weapons[weapon].image);
    if (impactPaths[weapon]) jobs.push(imageJob(() => impactSheets[weapon]));
  }
  for (const key of art) jobs.push(imageJob(() => images[key]));
  for (const img of gameShell.querySelectorAll('img[data-src]')) {
    if (img.closest('#levelOverlay')) continue;
    if (map !== 'chaos' && img.closest('#daveOverlay,#cattailRescueOverlay,#cattailWeaponRow,#pumpkinButton')) continue;
    if (map !== 'pool' && img.matches('.garden-second-portrait')) continue;
    if (map !== 'canyon' && img.closest('[data-weapon="dogwood"]')) continue;
    jobs.push(imageJob(() => img));
  }
  if (audio.enabled) {
    for (const cue of new Set([...commonCues, ...stageCues[map]])) jobs.push(soundJob(cue));
    jobs.push(musicJob(bgmPaths[map]));
    if (concert) jobs.push(musicJob(danceSummonSong));
  }
  state.running = false;
  await showLoading('小豌豆准备进入第 ' + stage + ' 关', jobs);
  readyStages.add(cacheKey);
}

if (bootDialog?.open) {
  titleMusic.src = titleMusic.dataset.src;
  // Stream menu music through the same elements that play it. Neither track gates the cover.
  if (autoStart) {
    prepareStage(1).then(() => resetGame(false));
  } else {
    const cover = new Image();
    cover.fetchPriority = 'high';
    cover.src = 'assets/title-courtyard.webp';
    const jobs = [imageJob(() => cover), soundJob('button')];
    for (const img of titleMenuView.querySelectorAll('img')) jobs.push(imageJob(() => img));
    selectionMusic = new Audio();
    selectionMusic.preload = 'metadata';
    selectionMusic.src = selectionMusicPath;
    showLoading('小豌豆准备出发', jobs).then(() => {
      titleStartButton.focus();
      playTitleMusic();
    });
  }
}