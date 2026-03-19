/**
 * popup.js — Elevra One-Click Apply
 *
 * Handles the "Open Dashboard" button in popup.html.
 * MV3 requires event handlers in a separate script file (no inline JS).
 */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });
});
