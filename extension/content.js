/**
 * content.js — Elevra One-Click Apply
 *
 * Runs on company job-application pages (all URLs except the Elevra site).
 * On page load: checks chrome.storage.local for a pending application payload,
 * waits for the form to appear, fills every field, then signals FORM_READY.
 * On ELEVRA_DO_SUBMIT: clicks the submit button.
 */

// ── Listen for messages from background.js ────────────────────────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ELEVRA_DO_SUBMIT') submitForm();
});

// ── On page load, attempt form fill ──────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  try {
    // Retry fetching pending data up to 10 times (2s total) in case
    // background.js hasn't finished writing storage yet when this runs.
    let userData = null;
    for (let i = 0; i < 10; i++) {
      const data = await storageGet('elevra_pending');
      if (data.elevra_pending) { userData = data.elevra_pending.userData; break; }
      await new Promise(r => setTimeout(r, 200));
    }
    if (!userData) return;  // no pending apply — not our tab

    // Register this tab so background.js can send ELEVRA_DO_SUBMIT here
    chrome.runtime.sendMessage({ type: 'ELEVRA_REGISTER_JOB_TAB' });

    // Wait up to 8s for a form to appear on this page.
    const ready = await waitForFormElements(8000);
    if (!ready) return;  // no form here (listing/login page) — next navigation will retry

    const platform  = detectPlatform();
    const selectors = getPlatformSelectors(platform);

    await fillForm(userData, selectors);

    chrome.runtime.sendMessage({ type: 'ELEVRA_FORM_READY' });
  } catch (err) {
    chrome.runtime.sendMessage({ type: 'ELEVRA_ERROR', error: String(err) });
  }
}

// ── Platform detection ────────────────────────────────────────────────────────
function detectPlatform() {
  const url = window.location.href;
  if (url.includes('greenhouse.io'))        return 'greenhouse';
  if (url.includes('lever.co'))             return 'lever';
  if (url.includes('myworkdayjobs.com'))    return 'workday';
  if (url.includes('icims.com'))            return 'icims';
  if (url.includes('smartrecruiters.com'))  return 'smartrecruiters';
  if (url.includes('ziprecruiter.com'))     return 'ziprecruiter';
  if (url.includes('linkedin.com'))         return 'linkedin';
  return 'generic';
}

function getPlatformSelectors(platform) {
  switch (platform) {
    case 'greenhouse':
      return {
        firstName : '#first_name',
        lastName  : '#last_name',
        email     : '#email',
        phone     : '#phone',
        resume    : 'input[type="file"]',
        submit    : '#submit_app, input[type="submit"]',
      };
    case 'lever':
      return {
        firstName : 'input[name="name"]',
        lastName  : null,
        email     : 'input[name="email"]',
        phone     : 'input[name="phone"]',
        resume    : '.resume-upload input[type="file"], input[type="file"]',
        submit    : '.application-submit button, button[type="submit"]',
      };
    case 'smartrecruiters':
      return {
        firstName : 'input[name="firstName"]',
        lastName  : 'input[name="lastName"]',
        email     : 'input[name="email"]',
        phone     : 'input[name="phone"]',
        resume    : 'input[type="file"]',
        submit    : 'button[data-test="btn-apply-submit"], button[type="submit"]',
      };
    case 'ziprecruiter':
      return {
        firstName : 'input[name="first_name"], input[id*="first" i]',
        lastName  : 'input[name="last_name"],  input[id*="last" i]',
        email     : 'input[name="email"], input[type="email"]',
        phone     : 'input[name="phone"], input[type="tel"]',
        resume    : 'input[type="file"]',
        submit    : 'button[type="submit"], .apply_button',
      };
    case 'linkedin':
      return {
        firstName : 'input[id*="firstName" i]',
        lastName  : 'input[id*="lastName" i]',
        email     : 'input[type="email"]',
        phone     : 'input[id*="phone" i]',
        resume    : 'input[type="file"]',
        submit    : 'button[aria-label*="Submit"], button[type="submit"]',
      };
    default: // generic + icims + workday fallback
      return {
        firstName : 'input[id*="first" i], input[name*="first" i], input[placeholder*="first" i], input[autocomplete="given-name"]',
        lastName  : 'input[id*="last" i],  input[name*="last" i],  input[placeholder*="last" i],  input[autocomplete="family-name"]',
        email     : 'input[type="email"], input[id*="email" i], input[name*="email" i]',
        phone     : 'input[type="tel"], input[id*="phone" i], input[name*="phone" i], input[autocomplete="tel"]',
        resume    : 'input[type="file"]',
        submit    : 'button[type="submit"], input[type="submit"]',
      };
  }
}

// ── Form filling ──────────────────────────────────────────────────────────────
async function fillForm(userData, selectors) {
  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

  // If platform uses one name field (Lever), put full name there
  const firstName = selectors.lastName == null ? fullName : (userData.firstName || '');
  const lastName  = userData.lastName || '';

  await fillField(selectors.firstName, firstName);
  if (selectors.lastName) await fillField(selectors.lastName, lastName);
  await fillField(selectors.email,     userData.email    || '');
  await fillField(selectors.phone,     userData.phone    || '');

  if (userData.resumeBase64 && selectors.resume) {
    await uploadResumeFile(
      selectors.resume,
      userData.resumeBase64,
      userData.resumeFilename || 'resume.pdf'
    );
  }
}

async function fillField(selector, value) {
  if (!selector || !value) return;
  await delay(300);
  const el = document.querySelector(selector);
  if (!el) return;

  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  await delay(150);

  el.focus();
  // Native input value setter (React-compatible)
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function uploadResumeFile(selector, base64Data, filename) {
  await delay(400);
  const fileInput = document.querySelector(selector);
  if (!fileInput) return;

  try {
    // base64 → Uint8Array → Blob → File
    const byteChars = atob(base64Data);
    const bytes     = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const file = new File([blob], filename, { type: 'application/pdf' });

    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (e) {
    console.warn('[Elevra] Resume upload failed:', e);
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────
function submitForm() {
  const btn = document.querySelector(
    '#submit_app, .application-submit button, button[type="submit"], input[type="submit"]'
  );
  if (btn) {
    btn.scrollIntoView({ block: 'center' });
    btn.click();
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'ELEVRA_APPLICATION_SUBMITTED' });
    }, 1500);
  } else {
    chrome.runtime.sendMessage({ type: 'ELEVRA_ERROR', error: 'Submit button not found.' });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function storageGet(key) {
  return new Promise((resolve) => chrome.storage.local.get(key, resolve));
}

function isJobApplicationForm() {
  // Must have at least an email field AND a name/first-name field
  const hasEmail = !!document.querySelector(
    'input[type="email"], input[name="email"], input[id*="email" i]'
  );
  const hasName = !!document.querySelector(
    '#first_name, input[name="first_name"], input[name="firstName"], ' +
    'input[name="name"], input[id*="firstName" i], input[id*="first_name" i], ' +
    'input[placeholder*="first name" i], input[autocomplete="given-name"]'
  );
  // Reject login forms (password field present, but no name field)
  const hasPassword = !!document.querySelector('input[type="password"]');
  if (hasPassword && !hasName) return false;
  return hasEmail && hasName;
}

// Try to click an "Apply" button on listing pages to advance to the form
function tryClickApplyButton() {
  const APPLY_RE = /^(apply|apply now|apply here|apply for this job|apply to this job|quick apply|easy apply|1-click apply|one.click apply|fast apply|apply online|continue to apply|submit application|start application|apply with linkedin|apply with indeed)$/i;

  // Priority 1: buttons/links whose text exactly matches
  for (const el of document.querySelectorAll('button, a, [role="button"]')) {
    const text = (el.textContent || el.value || el.ariaLabel || '').trim();
    if (APPLY_RE.test(text)) {
      el.click();
      return true;
    }
  }

  // Priority 2: any element with an apply-related aria-label
  for (const el of document.querySelectorAll('[aria-label]')) {
    if (APPLY_RE.test((el.getAttribute('aria-label') || '').trim())) {
      el.click();
      return true;
    }
  }

  // Priority 3: links whose href contains /apply (but not login/signup/logout)
  for (const a of document.querySelectorAll('a[href*="/apply"]')) {
    const href = a.href || '';
    if (/login|signup|sign-up|logout|account/i.test(href)) continue;
    a.click();
    return true;
  }

  return false;
}

function waitForFormElements(maxWait = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    let clickedApply = false;
    const check = () => {
      if (isJobApplicationForm()) return resolve(true);
      // If no form found yet, try clicking Apply button once
      if (!clickedApply && Date.now() - start > 1500) {
        clickedApply = tryClickApplyButton();
      }
      if (Date.now() - start > maxWait) return resolve(false);
      setTimeout(check, 500);
    };
    check();
  });
}
