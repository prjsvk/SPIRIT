const BLOCKED_SITES_KEY = 'blockedSites';
const BLOCKING_ENABLED_KEY = 'blockingEnabled';

const defaultBlocked = [
  '*://*.youtube.com/*',
  '*://*.instagram.com/*',
  '*://*.tiktok.com/*',
  '*://*.twitter.com/*',
  '*://*.x.com/*',
  '*://*.snapchat.com/*'
];

const toggle = document.getElementById('blockingToggle');
const sitesListEl = document.getElementById('sitesList');
const spiritUrlEl = document.getElementById('spiritUrl');
const durationEl = document.getElementById('durationMins');
const startBtn = document.getElementById('startFocus');
const stopBtn = document.getElementById('stopFocus');
const countdownEl = document.getElementById('countdown');

async function loadState() {
  const data = await chrome.storage.sync.get([BLOCKED_SITES_KEY, BLOCKING_ENABLED_KEY]);
  const sites = data[BLOCKED_SITES_KEY] || defaultBlocked;
  const enabled = data[BLOCKING_ENABLED_KEY] === true;

  // populate UI
  toggle.checked = enabled;
  renderSites(sites);

  // load focus session settings if they exist
  const session = await chrome.storage.sync.get(['spiritUrl', 'focusExpiresAt']);
  spiritUrlEl.value = session.spiritUrl || '';
  if (session.focusExpiresAt && session.focusExpiresAt > Date.now()) {
    // show remaining time
    startCountdown(session.focusExpiresAt);
  }
}

function renderSites(sites) {
  sitesListEl.innerHTML = '';
  sites.forEach(s => {
    const li = document.createElement('li');
    // show a human-friendly host (remove scheme/wildcards/trailing globs)
    const pretty = String(s)
      .replace(/^\*?:\/\//, '') // remove scheme wildcard
      .replace(/^\*\./, '')      // remove leading *.
      .replace(/\/\*$/, '')      // remove trailing /*
      .replace(/\*$/, '');
    li.textContent = pretty;
    sitesListEl.appendChild(li);
  });
}

async function setBlockingEnabled(enabled) {
  // persist
  await chrome.storage.sync.set({ [BLOCKING_ENABLED_KEY]: enabled });
  // notify background to apply/remove rules
  chrome.runtime.sendMessage({ type: enabled ? 'ENABLE_BLOCKING' : 'DISABLE_BLOCKING' });
}

function startCountdown(expiresAt) {
  function update() {
    const ms = expiresAt - Date.now();
    if (ms <= 0) {
      countdownEl.textContent = 'Focus complete';
      return;
    }
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    countdownEl.textContent = `${mins}m ${secs}s remaining`;
    requestAnimationFrame(update);
  }
  update();
}

// UI events
toggle.addEventListener('change', (e) => {
  setBlockingEnabled(e.target.checked);
});

startBtn.addEventListener('click', async () => {
  const url = spiritUrlEl.value.trim();
  const mins = parseInt(durationEl.value, 10) || 0;
  if (!url || mins <= 0) return alert('Enter a valid spirit URL and duration (minutes).');
  const expiresAt = Date.now() + mins * 60 * 1000;
  // persist spirit URL and expiry
  await chrome.storage.sync.set({ spiritUrl: url, focusExpiresAt: expiresAt });
  chrome.runtime.sendMessage({ type: 'START_FOCUS', spiritUrl: url, expiresAt });
  startCountdown(expiresAt);
});

stopBtn.addEventListener('click', async () => {
  await chrome.storage.sync.remove(['focusExpiresAt']);
  chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
  countdownEl.textContent = 'Stopped';
});

// initialize
loadState();
