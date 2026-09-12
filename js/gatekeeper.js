// The adult gate.
//
// Settings and Edit mode have to be reachable by a parent in a hurry and not
// by a curious eight-year-old. A password would get forgotten; a hidden
// gesture would get discovered. A press-and-hold followed by a multiplication
// question is enough of a speed bump, and costs a parent about two seconds.

const HOLD_MS = 1200;

/**
 * Wire press-and-hold on a control. `onHold` fires when the hold completes,
 * `onTap` (optional) when it was only a quick tap.
 */
export function holdToOpen(el, onHold, onTap) {
  let timer = null;
  let held = false;

  const start = (event) => {
    if (event.button > 0) return;
    held = false;
    el.classList.add('is-pressed');
    timer = setTimeout(() => {
      held = true;
      el.classList.remove('is-pressed');
      if (navigator.vibrate) navigator.vibrate(24);
      onHold();
    }, HOLD_MS);
  };

  const end = () => {
    clearTimeout(timer);
    el.classList.remove('is-pressed');
    if (!held && onTap) onTap();
    held = false;
  };

  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', () => { clearTimeout(timer); el.classList.remove('is-pressed'); });
  // Keyboard users get in without the hold; they are not the risk here.
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHold(); }
  });
}

/**
 * Ask the arithmetic question. Resolves true if answered correctly.
 * Renders into the shared sheet element.
 */
export function askAdult(sheet, scrim) {
  return new Promise((resolve) => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 4 + Math.floor(Math.random() * 6);

    sheet.replaceChildren();
    sheet.innerHTML = `
      <h2>Grown-up check</h2>
      <p class="hint">Just making sure this is a grown-up. What is <strong>${a} × ${b}</strong>?</p>
      <div class="row">
        <input type="number" id="gate-answer" inputmode="numeric" autocomplete="off"
               style="font-size:28px;width:150px;text-align:center" aria-label="Your answer">
        <span id="gate-msg" style="color:var(--ink-soft);font-size:14px"></span>
      </div>
      <div class="sheet__actions">
        <button class="btn btn--go" id="gate-ok" type="button">Let me in</button>
        <button class="btn btn--quiet" id="gate-cancel" type="button">Never mind</button>
      </div>`;

    const input = sheet.querySelector('#gate-answer');
    const msg = sheet.querySelector('#gate-msg');
    scrim.hidden = false;
    setTimeout(() => input.focus(), 50);

    const finish = (ok) => { scrim.hidden = true; sheet.replaceChildren(); resolve(ok); };
    const check = () => {
      if (Number(input.value) === a * b) return finish(true);
      msg.textContent = 'Not quite — try again.';
      input.value = '';
      input.focus();
    };

    sheet.querySelector('#gate-ok').addEventListener('click', check);
    sheet.querySelector('#gate-cancel').addEventListener('click', () => finish(false));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  });
}
