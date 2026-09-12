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
const SIZES = [['s', 'Small'], ['m', 'Medium'], ['l', 'Large'], ['xl', 'Huge']];

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
      <div class="row"><label>Button size</label>
        <div class="seg" id="seg-size">${SIZES.map(([v, n]) =>
          `<button data-v="${v}" class="${s.size === v ? 'is-on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="row"><label>Show the words under the pictures</label>
        ${toggle('labels', s.labels === 'on')}</div>
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
      <div class="row"><label>Show word endings (-s, -ing, -ed)
        <small class="hint">Turn on when she starts building longer sentences.</small></label>
        ${toggle('showGrammar', s.showGrammar)}</div>
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
    sheet.querySelector('#seg-size').addEventListener('click', (e) => {
      const v = e.target.dataset?.v; if (v) set({ size: v });
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
