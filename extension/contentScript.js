// contentScript.js
// Injects a centered bold overlay when a focus session is active.

function ensureOverlay() {
  if (document.getElementById('spirit-focus-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'spirit-focus-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.zIndex = '2147483647';
  overlay.style.background = 'rgba(255,255,255,0.95)';
  overlay.style.padding = '28px 32px';
  overlay.style.borderRadius = '8px';
  overlay.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
  overlay.style.fontSize = '24px';
  overlay.style.fontWeight = '700';
  overlay.style.color = '#111';
  overlay.style.textAlign = 'center';
  overlay.textContent = 'Stay Focused';
  overlay.style.fontFamily = 'Montserrat, Arial, sans-serif';
  overlay.style.letterSpacing = '1px';
  overlay.style.maxWidth = '90vw';
  overlay.style.minWidth = '220px';
  overlay.style.pointerEvents = 'none';
  document.documentElement.appendChild(overlay);
  setTimeout(removeOverlay, 5000); // Remove after 5 seconds
}

function removeOverlay() {
  const el = document.getElementById('spirit-focus-overlay');
  if (el) el.remove();
}

// Helper to check if current site is a Spirit site
function isSpiritSite() {
  const spiritDomains = [
    'spirit.com', 'spirit.in', 'localhost', '127.0.0.1',
    'spiritradio.html', 'FocusArena.html', 'mindmap.html', 'chat.html', 'quiz.html', 'home.html', 'index.html', 'contact.html', 'role-selection.html', 'teacher-dashboard.html'
  ];
  const url = window.location.href;
  return spiritDomains.some(domain => url.includes(domain));
}

// Respond to storage changes from the service worker
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.focusExpiresAt) {
    const expiresAt = changes.focusExpiresAt.newValue;
    if (expiresAt && expiresAt > Date.now() && !isSpiritSite()) {
      ensureOverlay();
    } else {
      removeOverlay();
    }
  }
});

// On load, check current storage
chrome.storage.sync.get(['focusExpiresAt']).then(data => {
  const expiresAt = data.focusExpiresAt;
  if (expiresAt && expiresAt > Date.now() && !isSpiritSite()) {
    ensureOverlay();
  } else {
    removeOverlay();
  }
}).catch(()=>{});
