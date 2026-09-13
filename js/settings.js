// The grown-up settings panel.

import { DEFAULT_SETTINGS } from './state.js';
import { availableVoices, defaultVoice, speak } from './speech.js';
import { exportAll, importAll, resetEverything } from './storage.js';

const THEMES = [
  ['crayon', 'Crayon'],
  ['contrast', 'High contrast'],
  ['calm', 'Calm'],
  ['dark', 'Dark'],
];
// Each option is rendered in its own actual typeface, so the picker previews
// itself rather than just naming the choice.
const FONTS = [
  ['comic-neue', 'Comic Neue', '"Comic Neue", cursive'],
  ['system', 'Plain', 'ui-rounded, system-ui, sans-serif'],
  ['fredoka', 'Fredoka', '"Fredoka", cursive'],
  ['patrick-hand', 'Patrick Hand', '"Patrick Hand", cursive'],
  ['opendyslexic', 'OpenDyslexic', '"OpenDyslexic", sans-serif'],
];
// Board/hotbar/nav scale together used to be one "button size" preset
// (s/m/l/xl); each is now its own slider so a parent can make the main board
// huge without also blowing up the category strip, say.
const SCALES = [
  ['boardScale', '--board-scale', 'Main buttons'],
  ['hotbarScale', '--hotbar-scale', 'Hotbar buttons'],
  ['navScale', '--nav-scale', 'Category buttons'],
];

export function openSettings(sheet, scrim, { settings, onChange, onEdit, onClose }) {
  const s = { ...settings };
  const set = (patch) => { Object.assign(s, patch); onChange({ ...s }); draw(); };

  function draw() {
    const voices = availableVoices();
    const currentVoice = s.voiceURI || defaultVoice();

    sheet.innerHTML = `
      <h2>Setup</h2>
      <p class="hint">Changes save as you make them. Serenity can keep using the app the whole time.</p>

      <h3>How it looks</h3>
      <div class="row"><label>Colours</label>
        <div class="seg" id="seg-theme">${THEMES.map(([v, n]) =>
          `<button data-v="${v}" class="${s.theme === v ? 'is-on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="row"><label>Lettering</label>
        <div class="seg" id="seg-font">${FONTS.map(([v, n, css]) =>
          `<button data-v="${v}" class="${s.font === v ? 'is-on' : ''}" style="font-family:${css};font-size:15px">${n}</button>`).join('')}</div></div>
      <div class="row"><label>Show the words under the pictures</label>
        ${toggle('labels', s.labels === 'on')}</div>
      ${SCALES.map(([key, cssVar, label]) => `
      <div class="row"><label>${label} size <span class="hint">${s[key].toFixed(2)}×</span></label>
        <input type="range" id="${key}" data-css-var="${cssVar}" min="0.7" max="1.8" step="0.05" value="${s[key]}"></div>`).join('')}
      <div class="row"><label>Sparkles when she talks</label>${toggle('sparkles', s.sparkles)}</div>

      <h3>Voice</h3>
      <div class="row"><label>Which voice</label>
        <select id="voice">${voices.length
          ? voices.map((v) => `<option value="${v.voiceURI}" ${v.voiceURI === currentVoice ? 'selected' : ''}>${v.name}</option>`).join('')
          : '<option>No voices found on this device</option>'}</select></div>
      <div class="row"><label>Speed <span class="hint">${s.rate.toFixed(2)}×</span></label>
        <input type="range" id="rate" min="0.5" max="1.6" step="0.05" value="${s.rate}"></div>
      <div class="row"><label>Pitch <span class="hint">${s.pitch.toFixed(2)}</span></label>
        <input type="range" id="pitch" min="0.6" max="2" step="0.05" value="${s.pitch}"></div>
      <div class="row"><label>Volume</label>
        <input type="range" id="volume" min="0" max="1" step="0.05" value="${s.volume}"></div>
      <div class="row"><label>Say each word as she taps it</label>${toggle('speakOnTap', s.speakOnTap)}</div>
      <div class="row"><label>Say the whole sentence when she taps the bar</label>${toggle('speakOnSentence', s.speakOnSentence)}</div>
      <div class="sheet__actions"><button class="btn" id="test-voice" type="button">🔊 Try the voice</button></div>

      <h3>How it behaves</h3>
      <div class="row"><label>Go back to Home after picking a word
        <small class="hint">Keeps her core words in view. Turn off to stay on one page.</small></label>
        ${toggle('autoHome', s.autoHome)}</div>
      <div class="row"><label>Show the tense strip and word endings
        <small class="hint">The tense she picks stays picked, and every doing-word she taps
          arrives already in it — "play" becomes "played", "go" becomes "went". Turn this off
          to go back to plain words.</small></label>
        ${toggle('showGrammar', s.showGrammar)}</div>
      <div class="row"><label>Tense to start in</label>
        <div class="seg" id="seg-tense">${[
          ['past', 'did (before)'], ['present', 'now'],
          ['continuous', '-ing (happening)'], ['future', 'will (later)'],
        ].map(([v, n]) => `<button data-v="${v}" class="${s.tenseMode === v ? 'is-on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="row"><label>Close up gaps from hidden buttons
        <small class="hint">Off is usually better — buttons stay exactly where she learned them.</small></label>
        ${toggle('collapseHidden', s.collapseHidden)}</div>
      <div class="row"><label>Hold-to-press <span class="hint">${s.dwellMs}ms</span>
        <small class="hint">Makes her hold a button before it counts. Helps with accidental taps.</small></label>
        <input type="range" id="dwell" min="0" max="900" step="50" value="${s.dwellMs}"></div>
      <div class="row"><label>Ignore repeat taps for <span class="hint">${s.debounceMs}ms</span></label>
        <input type="range" id="debounce" min="0" max="900" step="50" value="${s.debounceMs}"></div>
      <div class="row"><label>Keep the screen awake</label>${toggle('keepAwake', s.keepAwake)}</div>

      <h3>Her buttons</h3>
      <p class="hint">Add family photos, change what a button says, record your own voice, or hide buttons she does not use yet.</p>
      <div class="sheet__actions"><button class="btn btn--go" id="open-editor" type="button">✏️ Change the buttons</button></div>

      <h3>Backup</h3>
      <p class="hint">Save everything you have customised — photos, recordings and edits — to a file you can put back on another tablet.</p>
      <div class="sheet__actions">
        <button class="btn" id="export" type="button">⬇️ Save a backup</button>
        <button class="btn" id="import" type="button">⬆️ Load a backup</button>
        <button class="btn btn--warn" id="reset" type="button">Reset everything</button>
      </div>
      <p class="hint" id="backup-msg"></p>

      <div class="sheet__actions">
        <button class="btn btn--go" id="close" type="button">Done</button>
      </div>`;

    wire();
  }

  function toggle(name, on) {
    return `<button class="switch" role="switch" data-toggle="${name}" aria-checked="${on ? 'true' : 'false'}"></button>`;
  }

  function wire() {
    sheet.querySelectorAll('[data-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.dataset.toggle;
        if (name === 'labels') set({ labels: s.labels === 'on' ? 'off' : 'on' });
        else set({ [name]: !s[name] });
      });
    });
    sheet.querySelector('#seg-theme').addEventListener('click', (e) => {
      const v = e.target.dataset?.v; if (v) set({ theme: v });
    });
    sheet.querySelector('#seg-font').addEventListener('click', (e) => {
      const v = e.target.dataset?.v; if (v) set({ font: v });
    });
    for (const [key, cssVar] of SCALES) {
      const el = sheet.querySelector(`#${key}`);
      // Live preview while dragging: push the value straight onto :root so
      // the real board/hotbar/nav resize as she moves the slider, without
      // re-rendering this settings sheet mid-drag (that would drop the
      // pointer's grip on the slider). The actual setting is only saved —
      // and the sheet only redrawn — once the slider is released.
      el.addEventListener('input', () => {
        document.documentElement.style.setProperty(cssVar, el.value);
      });
      el.addEventListener('change', () => set({ [key]: Number(el.value) }));
    }
    sheet.querySelector('#seg-tense')?.addEventListener('click', (e) => {
      const v = e.target.dataset?.v; if (v) set({ tenseMode: v });
    });

    const voice = sheet.querySelector('#voice');
    voice.addEventListener('change', () => set({ voiceURI: voice.value }));

    for (const [id, key] of [['rate', 'rate'], ['pitch', 'pitch'], ['volume', 'volume']]) {
      const el = sheet.querySelector(`#${id}`);
      el.addEventListener('input', () => Object.assign(s, { [key]: Number(el.value) }));
      el.addEventListener('change', () => set({ [key]: Number(el.value) }));
    }
    for (const [id, key] of [['dwell', 'dwellMs'], ['debounce', 'debounceMs']]) {
      const el = sheet.querySelector(`#${id}`);
      el.addEventListener('change', () => set({ [key]: Number(el.value) }));
    }

    sheet.querySelector('#test-voice').addEventListener('click', () =>
      speak('Hi, my name is Serenity. I want to tell you something.', s));

    sheet.querySelector('#open-editor').addEventListener('click', () => { close(); onEdit(); });
    sheet.querySelector('#close').addEventListener('click', close);

    sheet.querySelector('#export').addEventListener('click', async () => {
      const bundle = await exportAll(s);
      const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `serenity-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      msg('Backup saved to your downloads.');
    });

    sheet.querySelector('#import').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.addEventListener('change', async () => {
        try {
          const restored = await importAll(JSON.parse(await input.files[0].text()));
          if (restored) onChange({ ...DEFAULT_SETTINGS, ...restored });
          msg('Backup loaded. Reloading…');
          setTimeout(() => location.reload(), 900);
        } catch (err) {
          msg(`Could not load that file: ${err.message}`);
        }
      });
      input.click();
    });

    sheet.querySelector('#reset').addEventListener('click', async () => {
      if (!confirm('This erases every change you have made — photos, recordings and edits. Are you sure?')) return;
      await resetEverything();
      localStorage.removeItem('serenity.settings.v1');
      location.reload();
    });
  }

  const msg = (text) => { sheet.querySelector('#backup-msg').textContent = text; };
  function close() { scrim.hidden = true; sheet.replaceChildren(); onClose?.(); }

  scrim.hidden = false;
  draw();
}
