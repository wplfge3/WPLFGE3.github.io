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
if (bootDialog?.open) {

  const meter = document.getElementById('bootMeter');
  const percent = document.getElementById('bootPercent');
  const status = document.getElementById('bootStatus');
  const retry = document.getElementById('bootRetry');
  const jobs = [];
  function add(label, run) { jobs.push({label, run}); }
  for (const {map} of Object.values(stageConfigs)) prepareMapImage(map);
  const cover = new Image();
  cover.src = 'assets/title-courtyard.webp';
  const art = [...Object.values(images), ...Object.values(impactSheets), cover, ...document.images];
  const unique = new Map(art.filter(img => img.src).map(img => [img.src, img]));
  for (const img of unique.values()) add('加载花园和角色', async () => {
    if (img.complete && !img.naturalWidth) img.src = img.src;
    let timeout;
    try {
      await Promise.race([
        img.decode(),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('图片加载超时')), 60000); })
      ]);
    } finally {
      clearTimeout(timeout);
    }
  });
  const web = /^https?:$/.test(location.protocol);
  for (const cue of Object.keys(sfxPaths)) add('准备战斗音效', () => Promise.all(prepareBattleSounds([cue])));
  const songs = new Set([...Object.values(bgmPaths), titleMusic.dataset.src, danceSummonSong, 'assets/audio/level-select-tnt.m4a.mp3']);
  for (const song of songs) add('收好音乐唱片', async () => {
    if (web) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(song, {signal:controller.signal});
        if (!response.ok) throw Error(String(response.status));
        readyMusic.set(song, URL.createObjectURL(await response.blob()));
      } finally { clearTimeout(timeout); }
    }
    if (song === titleMusic.dataset.src) titleMusic.src = readyMusic.get(song) || song;
  });
  let done = 0;
  meter.max = jobs.length;
  async function load(batch) {
    retry.hidden = true;
    const failed = [];
    let cursor = 0;
    async function worker() {
      while (cursor < batch.length) {
        const job = batch[cursor++];
        status.textContent = job.label;
        try {
          await job.run();
          meter.value = ++done;
          percent.textContent = Math.floor(done / meter.max * 100) + '%';
        } catch { failed.push(job); }
      }
    }
    await Promise.all(Array.from({length:6}, worker));
    if (failed.length) {
      status.textContent = '还有 ' + failed.length + ' 项未就绪';
      retry.hidden = false;
      retry.onclick = () => load(failed);
      return;
    }
    bootDialog.close();
    if (autoStart) resetGame(false);
    else { titleStartButton.focus(); playTitleMusic(); }
  }
  load(jobs);
}
