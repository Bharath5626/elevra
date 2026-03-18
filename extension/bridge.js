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

// ── Signal presence via postMessage (works across isolated world boundary) ───
// Post immediately on load, and also respond to any ELEVRA_PING from React.
window.postMessage({ type: 'ELEVRA_PONG' }, '*');

// ── React app → background.js ────────────────────────────────────────────────
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data?.type) return;

  // Respond to ping so React can detect us even after mount
  if (event.data.type === 'ELEVRA_PING') {
    window.postMessage({ type: 'ELEVRA_PONG' }, '*');
    return;
  }

  if (!ALLOWED_TYPES.has(event.data.type)) return;

  chrome.runtime.sendMessage(
    { type: event.data.type, payload: event.data.payload },
    (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage(
          { type: 'ELEVRA_ERROR', error: 'Extension error: ' + chrome.runtime.lastError.message },
          '*'
        );
      }
    }
  );
});

// ── background.js → React app ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  // Relay any extension message back to the page
  window.postMessage(message, '*');
});
