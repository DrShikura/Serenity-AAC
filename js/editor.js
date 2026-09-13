// Edit mode for grown-ups: change any button, add new ones, put a real photo
// of her actual cup on the "cup" button, record a familiar voice.
//
// Everything written here goes into the overlay (see storage.js), never into
// data/vocabulary.json, so a future app update cannot wipe the family's work.

import { savePhoto, deletePhoto, saveRecording, deleteRecording, loadPhoto } from './storage.js';
import { startRecording, isSupported as canRecord } from './recorder.js';
import { forgetRecording, speak } from './speech.js';

const COLORS = [
  ['people', 'People'], ['verb', 'Doing'], ['describe', 'Describing'],
  ['noun', 'Things'], ['social', 'Social'], ['question', 'Questions'],
  ['negation', 'No'], ['urgent', 'Urgent'], ['core', 'Core'],
];

const EMOJI = [
  '🍎','🍌','🍓','🍕','🥪','🍪','🥛','🧃','💧','🍽️','🧸','⚽','🚗','📚','🎨','🎵',
  '🛏️','🛁','🚽','👕','👟','🧥','🐶','🐱','🐰','🌳','🌸','☀️','🌧️','🏠','🏫','🏪',
  '👩','👨','👵','👴','👧','👦','👶','❤️','⭐','✨','😀','😢','😠','😨','😴','🤕',
  '👍','👎','✅','❌','❓','⏸️','🔁','➕','➖','🆘','🎧','📱','📺','💡','🚪','🎒',
];

export function openEditor(sheet, scrim, ctx) {
  let screen = { name: 'browse' };

  const close = () => { scrim.hidden = true; sheet.replaceChildren(); ctx.onClose(); };
  const back = () => { screen = { name: 'browse' }; draw(); };

  function draw() {
    if (screen.name === 'browse') return drawBrowse();
    if (screen.name === 'button') return drawButton(screen.button, screen.boardId);
    if (screen.name === 'newBoard') return drawNewBoard();
  }

  /* ── Pick a button to change ─────────────────────────────────────────── */

  function drawBrowse() {
    const board = ctx.currentBoard();
    const buttons = board.buttons;

    sheet.innerHTML = `
      <h2>Change the buttons</h2>
      <p class="hint">You are looking at <strong>${escapeHtml(board.title)}</strong>.
        Close this panel and tap a folder to edit a different page.</p>
      <div class="editor-grid" id="list">
        ${buttons.map((b, i) => b
          ? `<button class="pick face-${b.color}" data-i="${i}">
               <span class="swatch face-${b.color}">${swatch(b)}</span>
               <span>${escapeHtml(b.label)}
                 <small>${b.type === 'folder' ? 'opens a page' : `says “${escapeHtml(b.speak)}”`}</small></span>
             </button>`
          : `<button class="pick" data-new="${i}">
               <span class="swatch" style="--face:var(--paper-deep)">＋</span>
               <span>Empty space<small>tap to put a button here</small></span>
             </button>`).join('')}
      </div>
      <div class="sheet__actions">
        <button class="btn" id="add-board" type="button">＋ New page</button>
        <button class="btn btn--go" id="done" type="button">Done</button>
      </div>`;

    sheet.querySelector('#list').addEventListener('click', (e) => {
      const pick = e.target.closest('[data-i]');
      if (pick) {
        screen = { name: 'button', button: buttons[Number(pick.dataset.i)], boardId: board.id };
        return draw();
      }
      const empty = e.target.closest('[data-new]');
      if (empty) {
        screen = {
          name: 'button',
          boardId: board.id,
          button: {
            id: `custom.${board.id}.${Date.now().toString(36)}`,
            label: 'New button', speak: 'new button', type: 'word',
            icon: { kind: 'emoji', value: '⭐' }, color: board.color || 'noun',
            target: null, action: null, isNew: true,
          },
        };
        draw();
      }
    });

    sheet.querySelector('#add-board').addEventListener('click', () => { screen = { name: 'newBoard' }; draw(); });
    sheet.querySelector('#done').addEventListener('click', close);
  }

  /* ── Edit one button ─────────────────────────────────────────────────── */

  async function drawButton(button, boardId) {
    const isFolder = button.type === 'folder';
    const photo = await loadPhoto(button.id);
    const photoUrl = photo ? URL.createObjectURL(photo) : null;
    const hasRecording = ctx.media().recordings.has(button.id);

    sheet.innerHTML = `
      <h2>${button.isNew ? 'New button' : escapeHtml(button.label)}</h2>
      <p class="hint">The word she sees can be short while what it says out loud is a whole sentence.</p>

      <div class="row"><label for="f-label">Word on the button</label>
        <input type="text" id="f-label" value="${escapeHtml(button.label)}" maxlength="40"></div>
      <div class="row"><label for="f-speak">What it says out loud</label>
        <input type="text" id="f-speak" value="${escapeHtml(button.speak)}" maxlength="200" ${isFolder ? 'disabled' : ''}></div>
      <div class="sheet__actions"><button class="btn" id="try-say" type="button">🔊 Hear it</button></div>

      <h3>Colour</h3>
      <div class="seg" id="seg-color">${COLORS.map(([v, n]) =>
        `<button data-v="${v}" class="${button.color === v ? 'is-on' : ''}">${n}</button>`).join('')}</div>

      <h3>Picture</h3>
      <div class="row">
        <span class="swatch face-${button.color}" style="width:64px;height:64px;font-size:34px;display:grid;place-items:center;border:2.5px solid var(--outline);border-radius:12px">
          ${photoUrl ? `<img src="${photoUrl}" style="width:56px;height:56px;object-fit:cover;border-radius:9px">` : swatch(button)}
        </span>
        <span class="seg">
          <button id="use-photo" type="button">📷 Use a photo</button>
          ${photoUrl ? '<button id="drop-photo" type="button">Remove photo</button>' : ''}
        </span>
      </div>
      <p class="hint">A real photo of her own cup, her own bed, or Grandma works better than any drawing.</p>
      <div class="seg" id="emoji" style="max-height:150px;overflow-y:auto">
        ${EMOJI.map((e) => `<button data-e="${e}" style="font-size:24px">${e}</button>`).join('')}
      </div>

      <h3>Your voice</h3>
      ${canRecord()
        ? `<p class="hint">${hasRecording
             ? 'This button plays your recording instead of the computer voice.'
             : 'Record yourself saying it. Your voice will play instead of the computer voice.'}</p>
           <div class="sheet__actions">
             <button class="btn" id="rec" type="button">⏺ Record</button>
             ${hasRecording ? '<button class="btn" id="play-rec" type="button">▶ Play it</button>' : ''}
             ${hasRecording ? '<button class="btn btn--warn" id="drop-rec" type="button">Delete recording</button>' : ''}
           </div>
           <p class="hint" id="rec-msg"></p>`
        : '<p class="hint">This browser cannot record audio.</p>'}

      <div class="sheet__actions">
        <button class="btn btn--go" id="save" type="button">Save</button>
        <button class="btn btn--quiet" id="cancel" type="button">Back</button>
        ${button.isNew ? '' : `<button class="btn" id="move" type="button">✥ Move this button</button>`}
        ${button.isNew ? '' : `<button class="btn btn--warn" id="hide" type="button">Hide this button</button>`}
      </div>
      ${button.isNew ? '' : `<p class="hint">Moving lets you tap a new spot for it — on this page or any other.
        Hiding leaves the space empty so every other button stays exactly where she knows it.</p>`}`;

    const draft = { ...button };

    sheet.querySelector('#f-label').addEventListener('input', (e) => { draft.label = e.target.value; });
    sheet.querySelector('#f-speak').addEventListener('input', (e) => { draft.speak = e.target.value; });
    sheet.querySelector('#try-say').addEventListener('click', () => speak(draft.speak, ctx.settings()));

    sheet.querySelector('#seg-color').addEventListener('click', (e) => {
      const v = e.target.dataset?.v;
      if (!v) return;
      draft.color = v;
      sheet.querySelectorAll('#seg-color button').forEach((b) => b.classList.toggle('is-on', b.dataset.v === v));
    });

    sheet.querySelector('#emoji').addEventListener('click', (e) => {
      const emoji = e.target.dataset?.e;
      if (!emoji) return;
      draft.icon = { kind: 'emoji', value: emoji };
      drawButton({ ...draft }, boardId);
    });

    sheet.querySelector('#use-photo').addEventListener('click', () => pickPhoto(draft, boardId));
    sheet.querySelector('#drop-photo')?.addEventListener('click', async () => {
      await deletePhoto(button.id);
      await ctx.refreshMedia();
      drawButton({ ...draft }, boardId);
    });

    sheet.querySelector('#rec')?.addEventListener('click', (e) => recordFlow(e.target, draft, boardId));
    sheet.querySelector('#play-rec')?.addEventListener('click', () => ctx.playRecording(button.id));
    sheet.querySelector('#drop-rec')?.addEventListener('click', async () => {
      await deleteRecording(button.id);
      forgetRecording(button.id);
      await ctx.refreshMedia();
      drawButton({ ...draft }, boardId);
    });

    sheet.querySelector('#save').addEventListener('click', async () => {
      const patch = { label: draft.label.trim() || 'button', speak: (draft.speak || draft.label).trim(),
                      color: draft.color, icon: draft.icon };
      if (draft.isNew) {
        await ctx.addButton(boardId, { ...draft, ...patch, isNew: undefined });
      } else {
        await ctx.patchButton(button.id, patch);
      }
      back();
    });
    sheet.querySelector('#cancel').addEventListener('click', back);
    sheet.querySelector('#hide')?.addEventListener('click', async () => {
      await ctx.hideButton(button.id);
      back();
    });
    sheet.querySelector('#move')?.addEventListener('click', () => {
      // Close the panel WITHOUT ctx.onClose() — a move stays inside edit
      // mode; only the sheet needs to get out of the way so the real board
      // is visible again for choosing a destination.
      scrim.hidden = true;
      sheet.replaceChildren();
      ctx.beginMove(button.id);
    });
  }

  /* ── Photo capture, downscaled so a tablet does not fill up ──────────── */

  function pickPhoto(draft, boardId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const blob = await downscale(file, 320);
      await savePhoto(draft.id, blob);
      await ctx.refreshMedia();
      drawButton({ ...draft }, boardId);
    });
    input.click();
  }

  /* ── Recording ───────────────────────────────────────────────────────── */

  async function recordFlow(btn, draft, boardId) {
    const msg = sheet.querySelector('#rec-msg');
    try {
      const handle = await startRecording();
      btn.textContent = '⏹ Stop';
      msg.textContent = 'Recording… say it now.';
      const stop = async () => {
        btn.removeEventListener('click', stop);
        const blob = await handle.stop();
        await saveRecording(draft.id, blob);
        forgetRecording(draft.id);
        await ctx.refreshMedia();
        drawButton({ ...draft }, boardId);
      };
      btn.addEventListener('click', stop, { once: true });
    } catch (err) {
      msg.textContent = `Could not record: ${err.message}`;
    }
  }

  /* ── New page ────────────────────────────────────────────────────────── */

  function drawNewBoard() {
    sheet.innerHTML = `
      <h2>New page</h2>
      <p class="hint">A page of her own — a favourite show, a holiday, a person, a routine.
        A folder button linking to it is added to the page you were on.</p>
      <div class="row"><label for="b-title">Page name</label>
        <input type="text" id="b-title" value="My page" maxlength="30"></div>
      <div class="row"><label for="b-cols">Buttons across</label>
        <input type="number" id="b-cols" value="6" min="2" max="10"></div>
      <div class="row"><label for="b-rows">Buttons down</label>
        <input type="number" id="b-rows" value="3" min="1" max="6"></div>
      <div class="sheet__actions">
        <button class="btn btn--go" id="make" type="button">Make the page</button>
        <button class="btn btn--quiet" id="cancel" type="button">Back</button>
      </div>`;
    sheet.querySelector('#make').addEventListener('click', async () => {
      await ctx.addBoard({
        title: sheet.querySelector('#b-title').value.trim() || 'My page',
        cols: Number(sheet.querySelector('#b-cols').value) || 6,
        rows: Number(sheet.querySelector('#b-rows').value) || 3,
      });
      back();
    });
    sheet.querySelector('#cancel').addEventListener('click', back);
  }

  scrim.hidden = false;
  draw();
}

function swatch(button) {
  if (button.icon?.kind === 'svg') return `<img src="assets/icons/${button.icon.value}.svg" alt="">`;
  if (button.icon?.kind === 'emoji') return button.icon.value;
  return escapeHtml((button.label || '?').slice(0, 1));
}

/** Shrink a captured photo to a button-sized JPEG. */
function downscale(file, max) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
