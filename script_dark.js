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
const options = new Array(4);


function getAllowedChars() {
  const lower = 'abcdefghijklmnopqrstuvwxyzäöüß';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
  const digits = '0123456789';
  const special = '`?`~!@#$%^&*()-_=+[]{};:\"\',.<>/?\\| §%/\\';
  return (options[0] ? lower : "") + (options[1] ? upper : "") + (options[2] ? digits : "") + (options[3] ? special : "")
}

let bruteCancel = false;
let attemptsCount = 0;
const attemptsCountEl = document.getElementById('attempts-count');
const darkHashBox = document.querySelector('.dark-hash');
 toggleHackerBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  if (isDark) {
    const raw = (passwordInputLight.value) ? passwordInputLight.value : '';
    passwordInputDark.value = raw;
    computeHash(raw).then(h => { passwordHashEl.value = h; });
    setTimeout(positionHashBox, 50);
    toggleHackerBtn.textContent = 'Exit Hacker Mode';
    subtitle.textContent = "Dark Side of the Force";
  } else {
    toggleHackerBtn.textContent = 'Enter Hacker Mode';
    subtitle.textContent = "Light Side of the Force";
    bruteCancel = true;
    handlePasswordInput();
  }
});

// Update hash display while in dark-mode
if (passwordInputLight) passwordInputLight.addEventListener('input', () => {
  if (!document.body.classList.contains('dark-mode')) return;
  computeHash(passwordInputLight.value || '').then(h => { passwordHashEl.value = h; });
});

passwordInputDark.addEventListener('input', (ev) => {
  const raw = (passwordInputDark.value || '').replace(/[\s|]/g, ''); //TODO this line for options
  passwordInputLight.value = raw;
  computeHash(raw).then(h => { passwordHashEl.value = h; });
});
passwordInputDark.addEventListener('keydown', (ev) => {
  if (ev.keyCode == 13) solveBtn.click();
});


// Reposition the hash box next to the password input (vertically centered)
function positionHashBox() {
  if (!darkHashBox || !passwordInputLight) return;
  const rect = passwordInputLight.getBoundingClientRect();
  // ensure the dark-hash box size is known
  const boxW = darkHashBox.offsetWidth || 320;
  const boxH = darkHashBox.offsetHeight || 48;

  // prefer to the right of the input
  let left = Math.round(rect.right + 12);
  // if it would overflow viewport, place to the left
  if (left + boxW > window.innerWidth - 8) {
    left = Math.round(rect.left - boxW - 12);
    if (left < 8) left = 8;
  }

  // vertically center relative to the input
  let top = Math.round(rect.top + (rect.height / 2) - (boxH / 2));
  // keep on-screen
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
  bruteCancel = false;
  if (solveBtn) solveBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = '';
  if (attemptDisplay) attemptDisplay.value = '';
  if (attemptHash) attemptHash.value = '';

  // reset attempts counter
  attemptsCount = 0;
  if (attemptsCountEl) attemptsCountEl.textContent = 'Attempts: 0';

  const target = (passwordInputLight && passwordInputLight.value) ? passwordInputLight.value : '';
  const targetHash = await computeHash(target);

  // start elapsed-time timer
  bruteStartTime = Date.now();
  const timeToSolveEl = document.getElementById('time-to-solve');
  if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: 0s';
  if (bruteTimer) clearInterval(bruteTimer);
  bruteTimer = setInterval(() => {
    const secs = Math.floor((Date.now() - bruteStartTime) / 1000);
    if (timeToSolveEl) timeToSolveEl.textContent = 'Time to solve: ' + secs + 's';
  }, 250);

  // visual-only demo: limit length to keep it fast
  const maxLen = Math.min(4, Math.max(1, target.length || 3));
  const maxAttempts = 150000; // safety cap
  const delayMs = 6; // small delay so UI updates

  let attempts = 0;
  let found = false;

  for (let len = 1; len <= maxLen && !bruteCancel && !found; len++) {
    const indices = new Array(len).fill(0);
    while (!bruteCancel) {
      const attempt = indices.map(i => getAllowedChars()[i]).join('');
      // show as separated by pipes like: a|s|s|q|
      const pretty = attempt.split('').join('|');
      if (attemptDisplay) attemptDisplay.value = pretty;
      const h = await computeHash(attempt);
      const short = h;
      if (attemptHash) attemptHash.value = short;
      attempts++;
      attemptsCount++;
      if (attemptsCountEl) attemptsCountEl.textContent = 'Attempts: ' + attemptsCount;
      if (h === targetHash) { found = true; break; }
      if (attempts >= maxAttempts) break;

      // increment odometer
      let pos = len - 1;
      while (pos >= 0) {
        indices[pos]++;
        if (indices[pos] >= getAllowedChars().length) { indices[pos] = 0; pos--; continue; }
        break;
      }
      if (pos < 0) break; // overflow

      // throttle
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // if (found) {
  //   if (attemptDisplay) attemptDisplay.value = attemptDisplay.value;
  // } else if (bruteCancel) {
  //   if (attemptDisplay) attemptDisplay.value = 'Stopped';
  // } else {
  //   if (attemptDisplay) attemptDisplay.value = 'Not found';
  // }

  // stop timer
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
  bruteCancel = false;
}

if (toggleHackerBtn) toggleHackerBtn.click(); // Auto-enable dark mode for testing TODO remove
