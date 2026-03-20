/**
 * bridge.js — Elevra One-Click Apply
 *
 * Runs as a content script ONLY on the Elevra site (localhost:5173 / 5174).
 * Acts as the bridge between:
 *   - The React webapp (window.postMessage API)
 *   - The background service worker (chrome.runtime.sendMessage)
 *
 * Security: only forwards messages whose origin matches the current window,
 * and only the specific ELEVRA_* message types are forwarded.
 */

const ALLOWED_TYPES = new Set([
  'ELEVRA_APPLY',
  'ELEVRA_SUBMIT',
]);

// Returns true if the extension context is still valid (not invalidated by a reload).
function isContextValid() {
  try {
    // Accessing chrome.runtime.id throws if the context has been invalidated.
    return !!chrome.runtime?.id;
  } catch (_) {
    return false;
  }
}

// ── Signal presence via postMessage (works across isolated world boundary) ───
// Post immediately on load, and also respond to any ELEVRA_PING from React.
window.postMessage({ type: 'ELEVRA_PONG' }, '*');

// ── React app → background.js ────────────────────────────────────────────────
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data?.type) return;

  // Respond to ping so React can detect us even after mount
  if (event.data.type === 'ELEVRA_PING') {
    // If context is gone, stop responding — React will treat extension as absent
    if (!isContextValid()) return;
    window.postMessage({ type: 'ELEVRA_PONG' }, '*');
    return;
  }

  if (!ALLOWED_TYPES.has(event.data.type)) return;

  // Guard against "Extension context invalidated" (happens when extension reloads
  // while the content script is still running on the page).
  if (!isContextValid()) {
    window.postMessage(
      { type: 'ELEVRA_ERROR', error: 'Extension was reloaded. Please refresh this page.' },
      '*'
    );
    return;
  }

  try {
    chrome.runtime.sendMessage(
      { type: event.data.type, payload: event.data.payload },
      (_response) => {
        if (chrome.runtime.lastError) {
          window.postMessage(
            { type: 'ELEVRA_ERROR', error: 'Extension error: ' + chrome.runtime.lastError.message },
            '*'
          );
        }
      }
    );
  } catch (err) {
    window.postMessage(
      { type: 'ELEVRA_ERROR', error: 'Extension error: ' + String(err) },
      '*'
    );
  }
});

// ── background.js → React app ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  // Relay any extension message back to the page
  window.postMessage(message, '*');
});
