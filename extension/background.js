// background service worker for Spirit Focus - Website Blocker

const BLOCKED_SITES_KEY = 'blockedSites';
const BLOCKING_ENABLED_KEY = 'blockingEnabled';
const RULE_ID_BASE = 1000; // base for dynamic rule ids

const defaultBlocked = [
  '*://*.youtube.com/*',
  '*://*.instagram.com/*',
  '*://*.tiktok.com/*',
  '*://*.twitter.com/*',
  '*://*.x.com/*',
  '*://*.snapchat.com/*'
];

// Build declarativeNetRequest rule objects from patterns
function buildRulesFromPatterns(patterns) {
  // declarativeNetRequest urlFilter is a substring or regex. We'll convert
  // the simple match patterns like '*://*.youtube.com/*' into a safe host
  // substring such as 'youtube.com'. This avoids complex parsing and is
  // effective for blocking main frame navigations.
  return patterns.map((pattern, index) => {
    // extract host-like part
    const host = String(pattern)
      .replace(/^\*:\/\//, '')
      .replace(/^\*\./, '')
      .replace(/\/\*$/, '')
      .replace(/\*$/, '');

    return {
      id: RULE_ID_BASE + index,
      priority: 1,
      action: { type: 'block' },
      condition: {
        // use a simple substring filter to match URLs containing the host
        urlFilter: host,
        resourceTypes: ['main_frame']
      }
    };
  });
}

async function applyBlockingRules(patterns) {
  const rules = buildRulesFromPatterns(patterns);
  try {
    // remove any existing dynamic rules in our id range
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const idsToRemove = existing.map(r => r.id).filter(id => id >= RULE_ID_BASE && id < RULE_ID_BASE + 10000);
    if (idsToRemove.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: idsToRemove });
    }
    // add new rules
    const addRules = rules.map(r => ({ id: r.id, priority: r.priority, action: r.action, condition: r.condition }));
    if (addRules.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ addRules });
    }
    console.log('Blocking rules applied:', addRules.length);
  } catch (err) {
    console.error('Failed to apply blocking rules', err);
  }
}

// Add redirect rules to send blocked navigations to a given spiritUrl
async function applyRedirectRules(patterns, spiritUrl) {
  // build redirect rules similar to block rules but with action redirect
  const rules = patterns.map((pattern, index) => {
    const host = String(pattern)
      .replace(/^\*:\/\//, '')
      .replace(/^\*\./, '')
      .replace(/\/\*$/, '')
      .replace(/\*$/, '');
    return {
      id: RULE_ID_BASE + 500 + index,
      priority: 1,
      action: { type: 'redirect', redirect: { url: spiritUrl } },
      condition: { urlFilter: host, resourceTypes: ['main_frame'] }
    };
  });

  try {
    // remove any existing redirect rules in our range
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const idsToRemove = existing.map(r => r.id).filter(id => id >= RULE_ID_BASE + 500 && id < RULE_ID_BASE + 50000);
    if (idsToRemove.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: idsToRemove });
    }
    const addRules = rules.map(r => ({ id: r.id, priority: r.priority, action: r.action, condition: r.condition }));
    if (addRules.length) await chrome.declarativeNetRequest.updateDynamicRules({ addRules });
    console.log('Redirect rules applied:', addRules.length);
  } catch (err) {
    console.error('Failed to apply redirect rules', err);
  }
}

async function clearRedirectRules() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const idsToRemove = existing.map(r => r.id).filter(id => id >= RULE_ID_BASE + 500 && id < RULE_ID_BASE + 50000);
    if (idsToRemove.length) await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: idsToRemove });
  } catch (err) {
    console.error('Failed to clear redirect rules', err);
  }
}

async function clearBlockingRules() {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const idsToRemove = existing.map(r => r.id).filter(id => id >= RULE_ID_BASE && id < RULE_ID_BASE + 10000);
    if (idsToRemove.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: idsToRemove });
      console.log('Removed blocking rules:', idsToRemove.length);
    } else {
      console.log('No blocking rules to remove');
    }
  } catch (err) {
    console.error('Failed to clear blocking rules', err);
  }
}

// Load stored state on startup and apply rules if enabled
async function initFromStorage() {
  const data = await chrome.storage.sync.get([BLOCKED_SITES_KEY, BLOCKING_ENABLED_KEY]);
  const sites = data[BLOCKED_SITES_KEY] || defaultBlocked;
  const enabled = data[BLOCKING_ENABLED_KEY] === true;
  if (enabled) {
    await applyBlockingRules(sites);
  } else {
    await clearBlockingRules();
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === 'ENABLE_BLOCKING') {
      const data = await chrome.storage.sync.get(BLOCKED_SITES_KEY);
      const sites = data[BLOCKED_SITES_KEY] || defaultBlocked;
      await applyBlockingRules(sites);
      sendResponse && sendResponse({ success: true });
    } else if (message?.type === 'DISABLE_BLOCKING') {
      await clearBlockingRules();
      sendResponse && sendResponse({ success: true });
    } else if (message?.type === 'START_FOCUS') {
      // message: { spiritUrl, expiresAt }
      const spiritUrl = message.spiritUrl;
      const expiresAt = message.expiresAt;
      if (!spiritUrl || !expiresAt) return sendResponse && sendResponse({ success: false });
      // persist and set an alarm to stop focus when time elapses
  await chrome.storage.sync.set({ spiritUrl, focusExpiresAt: expiresAt });
  const deltaMin = Math.max(0.1, Math.ceil((expiresAt - Date.now()) / 60000));
  chrome.alarms.create('endFocus', { delayInMinutes: deltaMin });
  // apply redirect rules for blocked sites to spiritUrl
  const data = await chrome.storage.sync.get(BLOCKED_SITES_KEY);
  const sites = data[BLOCKED_SITES_KEY] || defaultBlocked;
  await applyRedirectRules(sites, spiritUrl);
  // open spirit URL in a new active tab to start the session
  try { chrome.tabs.create({ url: spiritUrl, active: true }); } catch (e) { /* ignore */ }
      sendResponse && sendResponse({ success: true });
    } else if (message?.type === 'STOP_FOCUS') {
      // clear stored expiry
      await chrome.storage.sync.remove(['focusExpiresAt']);
  chrome.alarms.clear('endFocus');
  // clear any redirect rules applied
  await clearRedirectRules();
      sendResponse && sendResponse({ success: true });
    }
  })();
  // keep the message channel open for async response
  return true;
});

// Alarm handler to end focus session
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'endFocus') {
  await chrome.storage.sync.remove(['focusExpiresAt']);
  await clearRedirectRules();
  }
});

// Re-apply on storage changes (in case list or toggle changed elsewhere)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes[BLOCKING_ENABLED_KEY]) {
    const enabled = changes[BLOCKING_ENABLED_KEY].newValue === true;
    if (enabled) {
      chrome.storage.sync.get(BLOCKED_SITES_KEY).then(data => {
        const sites = data[BLOCKED_SITES_KEY] || defaultBlocked;
        applyBlockingRules(sites);
      });
    } else {
      clearBlockingRules();
    }
  }
  if (changes[BLOCKED_SITES_KEY]) {
    // if blocking is currently enabled, re-apply with new list
    chrome.storage.sync.get(BLOCKING_ENABLED_KEY).then(data => {
      const enabled = data[BLOCKING_ENABLED_KEY] === true;
      if (enabled) {
        const sites = changes[BLOCKED_SITES_KEY].newValue || defaultBlocked;
        applyBlockingRules(sites);
      }
    });
  }
});

// On installed / startup, initialize
chrome.runtime.onInstalled.addListener(() => {
  // ensure defaults are present
  chrome.storage.sync.get([BLOCKED_SITES_KEY], (data) => {
    if (!data[BLOCKED_SITES_KEY]) {
      chrome.storage.sync.set({ [BLOCKED_SITES_KEY]: defaultBlocked });
    }
  });
  initFromStorage();
});

// also run when worker starts (e.g., on browser restart)
initFromStorage();
