/**
 * background.js — Elevra One-Click Apply (Service Worker)
 *
 * Uses chrome.storage to persist tab IDs so they survive service worker restarts.
 * content.js is injected ONLY into the tab explicitly opened by One-Click Apply,
 * never on pages the user visits normally.
 */

// Re-inject content.js on every navigation within the designated job tab,
// so multi-page application flows (e.g. "Next" buttons) are still filled.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  chrome.storage.local.get(['elevra_job_tab', 'elevra_pending'], (r) => {
    if (r.elevra_job_tab === tabId && r.elevra_pending) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      }).catch(() => {/* tab may have closed */});
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    // ── Step 1: Site sends apply payload ─────────────────────────────────────
    case 'ELEVRA_APPLY': {
      const siteTabId = sender.tab?.id ?? null;
      // Write storage first, THEN open the tab — guarantees content.js
      // always finds elevra_pending in storage when it runs.
      chrome.storage.local.set({
        elevra_site_tab: siteTabId,
        elevra_pending: {
          userData: message.payload.userData,
          jobUrl:   message.payload.jobUrl,
        },
      }, () => {
        chrome.tabs.create({ url: message.payload.jobUrl }, (tab) => {
          chrome.storage.local.set({ elevra_job_tab: tab.id });
        });
      });
      sendResponse({ ok: true });
      break;
    }

    // ── Content.js registers itself as the active job tab ────────────────────
    case 'ELEVRA_REGISTER_JOB_TAB': {
      chrome.storage.local.set({ elevra_job_tab: sender.tab?.id ?? null });
      sendResponse({ ok: true });
      break;
    }

    // ── Step 2: Content.js says form is filled ────────────────────────────────
    case 'ELEVRA_FORM_READY': {
      chrome.storage.local.get('elevra_site_tab', (r) => {
        if (r.elevra_site_tab) {
          chrome.tabs.sendMessage(r.elevra_site_tab, { type: 'ELEVRA_FORM_READY' });
        }
      });
      sendResponse({ ok: true });
      break;
    }

    // ── Step 3: Site user confirmed — submit the form ─────────────────────────
    case 'ELEVRA_SUBMIT': {
      chrome.storage.local.get('elevra_job_tab', (r) => {
        if (r.elevra_job_tab) {
          chrome.tabs.sendMessage(r.elevra_job_tab, { type: 'ELEVRA_DO_SUBMIT' });
        }
      });
      sendResponse({ ok: true });
      break;
    }

    // ── Step 4: Form was submitted ────────────────────────────────────────────
    case 'ELEVRA_APPLICATION_SUBMITTED': {
      chrome.storage.local.get('elevra_site_tab', (r) => {
        chrome.storage.local.remove(['elevra_pending', 'elevra_job_tab']);
        if (r.elevra_site_tab) {
          chrome.tabs.sendMessage(r.elevra_site_tab, { type: 'ELEVRA_APPLICATION_SUBMITTED' });
        }
      });
      sendResponse({ ok: true });
      break;
    }

    // ── Error relay ───────────────────────────────────────────────────────────
    case 'ELEVRA_ERROR': {
      chrome.storage.local.get('elevra_site_tab', (r) => {
        if (r.elevra_site_tab) {
          chrome.tabs.sendMessage(r.elevra_site_tab, { type: 'ELEVRA_ERROR', error: message.error });
        }
      });
      sendResponse({ ok: true });
      break;
    }
  }

  return true;
});
