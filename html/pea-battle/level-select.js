const levelOverlay = document.getElementById('levelOverlay');
const levelButton = document.getElementById('levelButton');
const levelCloseButton = document.getElementById('levelCloseButton');
const stageButtons = [...document.querySelectorAll('[data-stage]')];
const resultContent = document.getElementById('resultActions');
const stageConfigs = {
  1: { map: 'yard', mode: '1v1' },
  2: { map: 'land', mode: 'clown' },
  3: { map: 'canyon', mode: '1v2' },
  4: { map: 'pool', mode: '1v2' },
  5: { map: 'dance', mode: 'dance' },
  6: { map: 'chaos', mode: 'chaos' }
};

const finalStage = Object.keys(stageConfigs).length;

let currentStage = 1;
let unlockedStage = 1;
let allStagesUnlocked = false;
try {
  unlockedStage = Math.max(1, Math.min(finalStage, Number(window.localStorage.getItem('trajectoryUnlockedStage')) || 1));
  allStagesUnlocked = window.localStorage.getItem('trajectoryAllStagesUnlocked') === '1';
} catch {}

const nextLevelButton = document.createElement('button');
nextLevelButton.className = 'primary-button next-level-button';
nextLevelButton.type = 'button';
nextLevelButton.hidden = true;
resultContent.appendChild(nextLevelButton);

const mapSelect = document.getElementById('mapSelect');
if (![...mapSelect.options].some(option => option.value === 'canyon')) {
  mapSelect.add(new Option('米坪镇', 'canyon'));
}
if (![...mapSelect.options].some(option => option.value === 'land')) {
  mapSelect.add(new Option('落日瓜市', 'land'));
}
if (![...mapSelect.options].some(option => option.value === 'dance')) {
  mapSelect.add(new Option('月夜舞台', 'dance'));
}
if (![...mapSelect.options].some(option => option.value === 'chaos')) {
  mapSelect.add(new Option('混沌屋顶', 'chaos'));
}
const modeSelect = document.getElementById('modeSelect');
if (![...modeSelect.options].some(option => option.value === 'clown')) {
  modeSelect.add(new Option('小丑首领', 'clown'));
}
if (![...modeSelect.options].some(option => option.value === 'dance')) {
  modeSelect.add(new Option('舞王尸群', 'dance'));
}
if (![...modeSelect.options].some(option => option.value === 'chaos')) {
  modeSelect.add(new Option('地狱 1 对 5', 'chaos'));
}

let resumeBattleMusic = false;
const campaignLine = document.getElementById('campaignLine');
const campaignGreetings = [
  ['戴芙', campaignLine.textContent],
  ['黛弗', '欢迎来玩，我叫黛弗，是戴芙的姐姐。戴芙，你给客人留的小板凳呢？'],
  ['戴芙', '在这儿！刚才小豌豆踩着它练高抛呢。姐，你猜它打中了什么？'],
  ['黛弗', '我猜是我的锅。刚才叮的一声，小豌豆就把头扭过去了。'],
  ['戴芙', '嘿嘿，它也想玩《TNT弹道轨迹》嘛！咱们做这个小游戏，就是想跟大家一起找回那时候的乐趣。'],
  ['黛弗', '嗯，咱们只图个开心，不商用，也不放广告。来，挑一关吧！我先把锅戴好。']
];
let campaignGreetingIndex = 0;
function showCampaignGreeting() {
  const [speaker, line] = campaignGreetings[campaignGreetingIndex];
  document.getElementById('campaignSpeaker').textContent = speaker;
  campaignLine.textContent = line;
  campaignGreetingIndex = (campaignGreetingIndex + 1) % campaignGreetings.length;
}
document.getElementById('campaignHost').addEventListener('click', showCampaignGreeting);
function openLevelSelect() {
  if (!levelOverlay.hidden) return;
  campaignGreetingIndex = 0;
  showCampaignGreeting();
  resumeBattleMusic = !!audio.bgm && !audio.bgm.paused;
  levelOverlay.hidden = false;
  startBackgroundMusic();
}

function closeLevelSelect() {
  if (levelOverlay.hidden) return;
  levelOverlay.hidden = true;
  if (audio.bgmPath === 'assets/audio/level-select-tnt.m4a.mp3') audio.bgm.pause();
  if (resumeBattleMusic && state.running && !state.gameOver) startBackgroundMusic();
  resumeBattleMusic = false;
}

function saveProgress() {
  try {
    window.localStorage.setItem('trajectoryUnlockedStage', String(unlockedStage));
    window.localStorage.setItem('trajectoryAllStagesUnlocked', allStagesUnlocked ? '1' : '0');
  } catch {}
}

function renderStageLocks() {
  stageButtons.forEach(button => {
    const stage = Number(button.dataset.stage);
    const locked = stage > unlockedStage && !allStagesUnlocked;
    button.disabled = locked;
    button.classList.toggle('locked', locked);
    button.classList.toggle('cleared', stage < unlockedStage);
    button.classList.toggle('available', !locked && stage >= unlockedStage);
    const status = button.querySelector('.level-state');
    if (status) status.textContent = locked ? '未解锁' : stage < unlockedStage ? '已通关' : '挑战';
  });
}

window.resetCampaignProgress = function resetCampaignProgress() {
  currentStage = 1;
  unlockedStage = 1;
  allStagesUnlocked = false;
  mapSelect.value = 'yard';
  modeSelect.value = '1v1';
  levelButton.textContent = '01';
  nextLevelButton.hidden = true;
  saveProgress();
  renderStageLocks();
};

window.unlockAllCampaignStages = function unlockAllCampaignStages() {
  allStagesUnlocked = true;
  saveProgress();
  renderStageLocks();
};

function startStage(stage) {
  stage = Number(stage);
  const config = stageConfigs[stage];
  if (!config || (stage > unlockedStage && !allStagesUnlocked)) return;
  currentStage = stage;
  resumeBattleMusic = false;
  closeLevelSelect();
  mapSelect.value = config.map;
  modeSelect.value = config.mode;
  mapSelect.dispatchEvent(new Event('change', { bubbles: true }));
  levelButton.textContent = String(stage).padStart(2, '0');
  if (stage === 1) openLittleDaveChat(true);
}

window.handleLevelComplete = ({ won }) => {
  nextLevelButton.hidden = true;
  if (!won || currentStage >= finalStage) return;
  const nextStage = currentStage + 1;
  unlockedStage = Math.max(unlockedStage, nextStage);
  saveProgress();
  renderStageLocks();
  nextLevelButton.textContent = '下一关 →';
  nextLevelButton.title = stageButtons.find(button => Number(button.dataset.stage) === nextStage)?.querySelector('.level-card-copy b')?.textContent || '前往下一关';
  nextLevelButton.hidden = false;
};

levelButton.addEventListener('click', openLevelSelect);
levelCloseButton.addEventListener('click', closeLevelSelect);
levelOverlay.addEventListener('click', event => {
  if (event.target === levelOverlay) closeLevelSelect();
});
stageButtons.forEach(button => button.addEventListener('click', () => startStage(button.dataset.stage)));
nextLevelButton.addEventListener('click', () => startStage(currentStage + 1));
renderStageLocks();
