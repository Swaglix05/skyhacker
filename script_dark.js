const passwordInputLight = document.getElementById('password-input');
const passwordInputDark = document.getElementById('password-input-dark');
const toggleHackerBtn = document.getElementById('toggle-hacker');
// const darkSide = document.getElementById('darkSide');
const passwordHashEl = document.getElementById('password-hash-input');
const solveBtn = document.getElementById('solve-btn');
const stopBtn = document.getElementById('stop-btn');
const subtitle = document.getElementById('body-subtitle');

const attemptDisplay = document.getElementById('attempt-display');
const attemptHash = document.getElementById('attempt-hash');

// 0=lowercase, 1=uppercase, 2=digits, 3=special characters
// Default: all options enabled
let options = [true, true, true, true];

// Try to sync options from UI checkboxes if they exist (ids: opt-lower, opt-upper, opt-digits, opt-special)
function syncOptionsFromUI() {
  const els = [
    document.getElementById('opt-lower'),
    document.getElementById('opt-upper'),
    document.getElementById('opt-digits'),
    document.getElementById('opt-special')
  ];
  let found = false;
  window._optEls = els;
  els.forEach((el, i) => {
    if (el) {
      if (typeof el.checked === 'undefined') el.checked = true;
      options[i] = !!el.checked;
      found = true;
      el.addEventListener('change', () => {
        options[i] = !!el.checked;
        updateOptionCheckboxStates((passwordInputLight && passwordInputLight.value) ? passwordInputLight.value : lastValidValue);
      });
    }
  });
  return found;
}
syncOptionsFromUI();


function getAllowedChars() {
  const lower = 'abcdefghijklmnopqrstuvwxyzäöüß';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
  const digits = '0123456789';
  const special = '`?`~!@#$%^&*()-_=+[]{};:\"\',.<>/?\\| §%/\\';
  return (options[0] ? lower : "") + (options[1] ? upper : "") + (options[2] ? digits : "") + (options[3] ? special : "")
}

function getCharSets() {
  return [
    'abcdefghijklmnopqrstuvwxyzäöüß',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ',
    '0123456789',
    '`?`~!@€#$%^&*()-_=+[]{};:\"\',.<>/?\\| §%/'
  ];
}

function updateOptionCheckboxStates(raw) {
  raw = raw || '';
  const els = window._optEls || [];
  const sets = getCharSets();
  for (let i = 0; i < sets.length; i++) {
    const el = els[i];
    if (!el) continue;
    const set = new Set(sets[i].split(''));
    let found = false;
    for (let ch of raw) { if (set.has(ch)) { found = true; break; } }
    if (found) {
      el.checked = true;
      el.disabled = true;
      options[i] = true;
    } else {
      el.disabled = false;
      options[i] = !!el.checked;
    }
  }
}

let bruteCancel = false;
let attemptsCount = 0;
let bruteRunning = false;
const attemptsCountEl = document.getElementById('attempts-count');
const darkHashBox = document.querySelector('.dark-hash');
 toggleHackerBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  if (isDark) {
    const raw = (passwordInputLight.value) ? passwordInputLight.value : '';
    attemptsCount = 0;
    attemptsCountEl.textContent = 'Attempts: 0';
    attemptDisplay.value = '---';
    attemptHash.value = '---';
    const timeToSolveEl = document.getElementById('time-to-solve');
    timeToSolveEl.textContent = 'Time to solve: 0s';
    passwordInputDark.value = raw;
    lastValidValue = raw;
    computeHash(raw).then(h => { passwordHashEl.value = h; });
    updateOptionCheckboxStates(raw);
    setTimeout(positionHashBox, 50);
    toggleHackerBtn.textContent = 'Exit Hacker Mode';
    subtitle.textContent = "Dark Side of the Force";
  } else {
    toggleHackerBtn.textContent = 'Enter Hacker Mode';
    subtitle.textContent = "Light Side of the Force";
    bruteCancel = true;
    if (bruteTimer) { clearInterval(bruteTimer); bruteTimer = null; }
    bruteRunning = false;
    attemptsCount = 0;
    attemptsCountEl.textContent = 'Attempts: 0';
    attemptDisplay.value = '---';
    attemptHash.value = '---';
    const timeToSolveEl = document.getElementById('time-to-solve');
    timeToSolveEl.textContent = 'Time to solve: 0s';
    if (typeof handlePasswordInput === 'function') handlePasswordInput();
  }
});

if (passwordInputLight) passwordInputLight.addEventListener('input', () => {
  if (!document.body.classList.contains('dark-mode')) return;
  if (bruteRunning) {
    bruteCancel = true;
    if (bruteTimer) { clearInterval(bruteTimer); bruteTimer = null; }
    bruteRunning = false;
    attemptsCount = 0;
    if (attemptsCountEl) attemptsCountEl.textContent = 'Attempts: 0';
    if (attemptDisplay) attemptDisplay.value = 'Stopped';
    if (attemptHash) attemptHash.value = '---';
    const timeToSolveEl = document.getElementById('time-to-solve');
    if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: 0s';
  }
  const raw = passwordInputLight.value || '';
  computeHash(raw).then(h => { passwordHashEl.value = h; });
  updateOptionCheckboxStates(raw);
});

let lastValidValue = (passwordInputLight && passwordInputLight.value) ? passwordInputLight.value : '';
updateOptionCheckboxStates((passwordInputLight && passwordInputLight.value) ? passwordInputLight.value : lastValidValue);

passwordInputDark.addEventListener('input', (ev) => {
  const rawValue = (passwordInputDark.value || '');

  const allowed = getAllowedChars();
  const allowedSet = new Set(allowed.split(''));

  for (let ch of rawValue) {
    if (!allowedSet.has(ch)) {
      window.alert('Character "' + ch + '" is not allowed by the current options.');
      passwordInputDark.value = lastValidValue;
      passwordInputLight.value = lastValidValue;
      computeHash(lastValidValue).then(h => { if (passwordHashEl) passwordHashEl.value = h; });
      return;
    }
  }

  if (bruteRunning) {
    bruteCancel = true;
    if (bruteTimer) { clearInterval(bruteTimer); bruteTimer = null; }
    bruteRunning = false;
    attemptsCount = 0;
    if (attemptsCountEl) attemptsCountEl.textContent = 'Attempts: 0';
    if (attemptDisplay) attemptDisplay.value = 'Stopped';
    if (attemptHash) attemptHash.value = '---';
    const timeToSolveEl = document.getElementById('time-to-solve');
    if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: 0s';
  }

  lastValidValue = rawValue;
  passwordInputLight.value = rawValue;
  computeHash(rawValue).then(h => { if (passwordHashEl) passwordHashEl.value = h; });
  updateOptionCheckboxStates(rawValue);
});
passwordInputDark.addEventListener('keydown', (ev) => {
  if (ev.keyCode == 13) solveBtn.click();
});


function positionHashBox() {
  if (!darkHashBox || !passwordInputLight) return;
  const rect = passwordInputLight.getBoundingClientRect();
  const boxW = darkHashBox.offsetWidth || 320;
  const boxH = darkHashBox.offsetHeight || 48;

  let left = Math.round(rect.right + 12);
  if (left + boxW > window.innerWidth - 8) {
    left = Math.round(rect.left - boxW - 12);
    if (left < 8) left = 8;
  }

  let top = Math.round(rect.top + (rect.height / 2) - (boxH / 2));
  if (top < 8) top = 8;
  if (top + boxH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - boxH - 8);

  darkHashBox.style.left = left + 'px';
  darkHashBox.style.top = top + 'px';
}

window.addEventListener('resize', () => { if (document.body.classList.contains('dark-mode')) positionHashBox(); });
window.addEventListener('scroll', () => { if (document.body.classList.contains('dark-mode')) positionHashBox(); });

solveBtn.addEventListener('click', startBruteForce);
stopBtn.addEventListener('click', () => { bruteCancel = true; });

async function computeHash(text) {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
  } catch (e) {
    return 'err';
  }
}

let bruteStartTime = 0;
let bruteTimer = null;

async function startBruteForce() {
  if (bruteRunning) return;
  bruteCancel = false;
  bruteRunning = true;
  if (solveBtn) solveBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = '';
  if (attemptDisplay) attemptDisplay.value = '';
  if (attemptHash) attemptHash.value = '';

  attemptsCount = 0;
  if (attemptsCountEl) attemptsCountEl.textContent = 'Attempts: 0';

  const target = (passwordInputLight && passwordInputLight.value) ? passwordInputLight.value : '';
  const targetHash = await computeHash(target);

  bruteStartTime = Date.now();
  const timeToSolveEl = document.getElementById('time-to-solve');
  if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: 0s';
  if (bruteTimer) clearInterval(bruteTimer);
  bruteTimer = setInterval(() => {
    const secs = Math.floor((Date.now() - bruteStartTime) / 1000);
    if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: ' + secs + 's';
  }, 250);

  const maxLen = Math.min(4, Math.max(1, target.length || 3));

  let attempts = 0;
  let found = false;

  for (let len = 1; len <= maxLen && !bruteCancel && !found; len++) {
    const indices = new Array(len).fill(0);
    while (!bruteCancel) {
      const attempt = indices.map(i => getAllowedChars()[i]).join('');
      const pretty = attempt.split('').join('|');
      if (attemptDisplay) attemptDisplay.value = pretty;
      const h = await computeHash(attempt);
      const short = h;
      if (attemptHash) attemptHash.value = short;
      attempts++;
      attemptsCount++;
      attemptsCountEl.textContent = 'Attempts: ' + attemptsCount;
      if (h === targetHash) { found = true; break; }

      let pos = len - 1;
      while (pos >= 0) {
        indices[pos]++;
        if (indices[pos] >= getAllowedChars().length) { indices[pos] = 0; pos--; continue; }
        break;
      }
      if (pos < 0) break; // overflow

    }
  }

  if (bruteTimer) { clearInterval(bruteTimer); bruteTimer = null; }
  if (bruteStartTime) {
    const timeToSolveEl = document.getElementById('time-to-solve');
    if (timeToSolveEl) {
      const secs = Math.floor((Date.now() - bruteStartTime) / 1000);
      timeToSolveEl.textContent = 'Time to solve: ' + secs + 's';
    }
  }

  if (solveBtn) solveBtn.style.display = '';
  if (stopBtn) stopBtn.style.display = 'none';
  bruteRunning = false;
  bruteCancel = false;
}

if (toggleHackerBtn) toggleHackerBtn.click(); // Auto-enable dark mode for testing TODO remove
