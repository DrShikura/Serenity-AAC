// Boot and wiring. The app is a thin shell around the pure modules.

import { createStore, loadSettings, saveSettings, DEFAULT_SETTINGS } from './state.js';
import { loadVocabulary, applyOverlay, wordList } from './vocabulary.js';
import {
  createUtterance, tokenFromButton, tokenFromText, append, backspace, removeAt,
  clear, undo, canUndo, applyGrammarToLast, toSpeech, toText, isEmpty,
} from './output.js';
import { conjugate } from './grammar.js';
import { renderBoard, renderCore, renderOutput, sparkleAt, updateScrollEdges } from './render.js';
import { renderKeyboard } from './keyboard.js';
import { initSpeech, speak, speakButton, stopSpeaking, defaultVoice, playRecording } from './speech.js';
import * as store from './storage.js';
import { openSettings } from './settings.js';
import { openHistory } from './history.js';
import { openEditor } from './editor.js';
import { holdToOpen, askAdult } from './gatekeeper.js';

const el = (id) => document.getElementById(id);
const dom = {
  root: document.documentElement,
  output: el('output'), board: el('board'), core: el('core-rail'),
  navbar: el('navbar'), grammar: el('grammar-bar'),
  scrim: el('scrim'), sheet: el('sheet'),
};

const app = createStore({
  settings: loadSettings(),
  vocab: null,
  base: null,
  overlay: null,
  boardId: 'home',
  trail: [],
  utterance: createUtterance(),
  media: { photos: new Set(), recordings: new Set(), photoUrls: new Map() },
  words: [],
  editing: false,
  pinned: false,
  // { boardId, index, buttonId } while a teacher-mode move is waiting for its
  // destination tap — survives navigating to a different board, since a move
  // can relocate a button onto any page, not just reorder it in place.
  movePending: null,
});

/* ── Boot ──────────────────────────────────────────────────────────────── */

async function boot() {
  initSpeech();
  applyChrome(app.get().settings);

  let base;
  try {
    base = await loadVocabulary();
  } catch (err) {
    dom.board.innerHTML =
      `<p style="padding:24px;font-weight:700">Could not load the words.<br><br>
       <small style="font-weight:400">${err.message}<br>
       This app needs to be opened through a web address, not by double-clicking the file.</small></p>`;
    return;
  }

  const overlay = await store.loadOverlay();
  const settings = app.get().settings;
  if (!settings.voiceURI) settings.voiceURI = defaultVoice();

  // The hotbar used to just BE the shipped `core` board. Now it's a parent-
  // managed, unlimited-length list of button ids living in the overlay — on
  // a brand-new install (or one from before this existed) there is nothing
  // saved yet, so seed it from that same 12-word board once, so a fresh
  // install still looks exactly like it always did.
  if (!overlay.hotbar || overlay.hotbar.length === 0) {
    const coreBoard = base.boards.find((b) => b.id === base.core);
    overlay.hotbar = coreBoard.buttons.map((b) => b?.id ?? null);
    await store.saveOverlay(overlay);
  }

  app.set({
    base, overlay, settings,
    vocab: applyOverlay(base, overlay, { collapseHidden: settings.collapseHidden }),
  });
  app.set({ words: wordList(app.get().vocab) });

  await refreshMedia();
  drawEverything();
  registerServiceWorker();
  keepAwake();
}

/* ── Drawing ───────────────────────────────────────────────────────────── */

// A one-shot signal: true only for the render caused by actually navigating
// to a different page, so the bouncy pop-in plays when a board first
// appears — not on every incidental redraw a settings tweak or overlay
// commit also triggers while she's staying put.
let animateNextAppear = false;

function drawEverything() {
  const { vocab, boardId, media, editing, movePending } = app.get();
  const board = vocab.boardsById.get(boardId) || vocab.boardsById.get(vocab.home);
  const animate = animateNextAppear;
  animateNextAppear = false;

  if (board.special === 'keyboard') {
    renderKeyboard(dom.board, app.get().words, {
      onWord: (word) => { addToken(tokenFromText(word)); speakIfWanted(word); },
      onLetter: (letter) => speakIfWanted(letter),
      onBackspace: () => update(backspace(app.get().utterance)),
    });
  } else {
    const pickedUpId = movePending?.boardId === board.id ? movePending.buttonId : null;
    renderBoard(dom.board, board, media, { editing, pickedUpId, animate });
  }

  renderCore(dom.core, resolveHotbar(), media, { editing });
  drawOutput();
  drawNav(board);
  drawGrammar();
}

/**
 * The hotbar's buttons, resolved fresh from the overlay's ordered id list —
 * each id is a reference to a real button living on whatever board it was
 * added from (see the "add to hotbar" long-press below), not a copy, so
 * editing that button anywhere keeps the hotbar in sync automatically. A
 * removed entry is a `null` id, rendered as an empty gap — the hotbar never
 * reorganises itself, the same rule every board already follows. Shaped like
 * a board only so renderCore() (unchanged) can draw it the same way.
 */
function resolveHotbar() {
  const { overlay, vocab } = app.get();
  const ids = overlay.hotbar || [];
  const buttons = ids.map((id) => (id ? vocab.buttonsById.get(id) ?? null : null));
  return { rows: Math.max(1, Math.ceil(buttons.length / 2)), buttons };
}

function drawOutput() {
  renderOutput(dom.output, app.get().utterance);
  const empty = isEmpty(app.get().utterance);
  el('btn-speak').disabled = empty;
  el('btn-back').disabled = empty;
  el('btn-clear').disabled = empty;
  el('btn-undo').disabled = !canUndo(app.get().utterance);
}

/** Pinned shortcuts along the bottom. These never reorder.
 *  The keyboard is not here — it has its own key in the top controls, one tap
 *  from every screen. */
const PINNED = ['home', 'food', 'play', 'feelings', 'regulate', 'actions', 'social', 'build', 'school'];

function drawNav(board) {
  const { vocab, trail, pinned } = app.get();
  dom.navbar.replaceChildren();

  const scroller = document.createElement('div');
  scroller.className = 'navbar__scroll';

  scroller.append(navButton('🏠', 'Home', () => go(vocab.home, true), board.id === vocab.home));
  if (trail.length) scroller.append(navButton('←', 'Back', goBack));

  for (const id of PINNED) {
    const target = vocab.boardsById.get(id);
    if (!target || target.id === vocab.home) continue;
    scroller.append(navButton(iconMarkup(target.icon), target.title, () => go(id, true), board.id === id));
  }
  dom.navbar.append(scroller);

  const pin = navButton('📌', pinned ? 'Staying here' : 'Stay here', () => {
    app.set({ pinned: !app.get().pinned });
    drawNav(app.get().vocab.boardsById.get(app.get().boardId));
  });
  pin.classList.add('nav--pin');
  pin.classList.toggle('is-on', pinned);
  pin.title = 'Stay on this page instead of going back Home after each word';
  dom.navbar.append(pin);
  updateScrollEdges(scroller);
}

function navButton(icon, label, onClick, current = false) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'nav';
  if (current) b.classList.add('is-current');
  b.innerHTML = icon.startsWith('<') ? icon : `<span class="nav__glyph" aria-hidden="true">${icon}</span>`;
  b.append(document.createTextNode(label));
  b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}

const iconMarkup = (icon) =>
  typeof icon === 'string' && icon.startsWith('svg:')
    ? `<img src="assets/icons/${icon.slice(4)}.svg" alt="">`
    : `<span class="nav__glyph" aria-hidden="true">${icon || '📄'}</span>`;

function drawGrammar() {
  const { settings, vocab } = app.get();
  dom.grammar.hidden = !settings.showGrammar;
  if (!settings.showGrammar) return;
  drawTenses();
  drawEndings();
}

/**
 * The tense strip. Picking a tense is a *mode*, not an edit: from then on
 * every doing-word she taps arrives already conjugated. That is the whole
 * point — she decides "when" once and then just talks, instead of having to
 * remember an ending after every single verb.
 */
function drawTenses() {
  const { settings, vocab } = app.get();
  const strip = el('tense-strip');
  strip.replaceChildren();
  for (const item of vocab.tenses || []) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tense';
    b.setAttribute('role', 'radio');
    b.dataset.tense = item.tense;
    b.setAttribute('aria-checked', settings.tenseMode === item.tense ? 'true' : 'false');
    b.setAttribute('aria-label', `${item.label} — ${item.hint}`);
    b.innerHTML =
      `<span class="tense__glyph" aria-hidden="true">${item.glyph}</span>` +
      `${item.label}<small>${item.hint}</small>`;
    b.addEventListener('click', () => {
      const settings = { ...app.get().settings, tenseMode: item.tense };
      app.set({ settings });
      saveSettings(settings);
      drawTenses();
      // Say the mode out loud so the change is never silent.
      speak(item.hint, settings);
    });
    strip.append(b);
  }
  updateScrollEdges(strip);
}

function drawEndings() {
  const { vocab } = app.get();
  const strip = el('ending-strip');
  strip.replaceChildren();
  for (const item of vocab.grammarBar || []) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gram';
    b.innerHTML = `${item.label}<small>${item.hint}</small>`;
    b.setAttribute('aria-label', `${item.label} — ${item.hint}`);
    b.addEventListener('click', () => {
      const next = applyGrammarToLast(app.get().utterance, item.op);
      update(next);
      const last = next.tokens[next.tokens.length - 1];
      if (last) speakIfWanted(last.speak);
    });
    strip.append(b);
  }
  updateScrollEdges(strip);
}

/* ── Navigation ────────────────────────────────────────────────────────── */

function go(boardId, isJump = false) {
  const { boardId: from, trail } = app.get();
  app.set({ boardId, trail: isJump ? [] : [...trail, from] });
  animateNextAppear = true;
  drawEverything();
  animateBoardTransition(1);
}

function goBack() {
  const trail = [...app.get().trail];
  const previous = trail.pop() || app.get().vocab.home;
  app.set({ boardId: previous, trail });
  animateNextAppear = true;
  drawEverything();
  animateBoardTransition(-1);
}

/**
 * A quick slide-and-fade for the board itself as a whole, layered on top of
 * its buttons' own individual pop-in — direction 1 for going deeper
 * (folders, category jumps), -1 for coming back, so the motion has the same
 * "which way did I just go" sense a book page-turn does.
 */
function motionAllowed() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return !reduced && app.get().settings.theme !== 'calm';
}

/** A quick jelly wobble on tap — additive to the plain squish that's always there. */
function wobbleKey(keyEl) {
  if (!motionAllowed()) return;
  keyEl.classList.remove('key--tap-wobble');
  // Force a reflow so re-adding the class restarts the animation even if she
  // tapped the same key again before the last wobble finished.
  void keyEl.offsetWidth;
  keyEl.classList.add('key--tap-wobble');
  keyEl.addEventListener('animationend', () => keyEl.classList.remove('key--tap-wobble'), { once: true });
}

function animateBoardTransition(direction) {
  if (!motionAllowed()) return;
  dom.board.animate(
    [
      { transform: `translateX(${direction * 18}px)`, opacity: 0.4 },
      { transform: 'translateX(0)', opacity: 1 },
    ],
    { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' }
  );
}

/* ── Taps ──────────────────────────────────────────────────────────────── */

let lastTapAt = 0;
let lastTapId = null;

function onKeyActivate(keyEl, event) {
  const { vocab, settings, editing, movePending } = app.get();

  if (movePending) {
    completeOrCancelMove(keyEl);
    return;
  }

  const button = vocab.buttonsById.get(keyEl.dataset.buttonId);
  if (!button) return;

  if (editing) {
    openEditorFor(button);
    return;
  }

  // Ignore a repeated tap on the same key inside the debounce window. A
  // tremor or a bounced touch should not put "apple apple" in the bar.
  const now = Date.now();
  if (button.id === lastTapId && now - lastTapAt < settings.debounceMs) return;
  lastTapAt = now;
  lastTapId = button.id;

  if (settings.sparkles && event) {
    const box = keyEl.getBoundingClientRect();
    sparkleAt(box.left + box.width / 2, box.top + box.height / 2, true);
  }
  wobbleKey(keyEl);

  switch (button.type) {
    case 'folder':
      go(button.target);
      break;
    case 'action':
      runAction(button.action);
      break;
    default: {
      // Doing-words arrive in whatever tense she has selected. Everything else
      // passes through untouched — a tense must never mangle a noun.
      const token = settings.showGrammar
        ? conjugate(tokenFromButton(button), settings.tenseMode)
        : tokenFromButton(button);
      addToken(token);
      if (settings.speakOnTap) {
        if (token.speak === button.speak) speakButton(button, settings);
        else speak(token.speak, settings);   // conjugated: no recording matches it
      }
      // Fringe words live on category pages; bouncing back Home keeps the
      // hotbar words she needs for the *next* word permanently one tap away.
      const onHotbar = (app.get().overlay.hotbar || []).includes(button.id);
      if (settings.autoHome && !app.get().pinned && !onHotbar && app.get().boardId !== vocab.home) {
        go(vocab.home, true);
      }
    }
  }
}

/**
 * A tap while a teacher-mode move is pending: tapping the picked-up button
 * again cancels it; tapping anywhere else (an occupied key or an empty slot,
 * on this board or — after navigating via the nav bar — a different one)
 * completes it, swapping whatever is there into the vacated slot.
 */
function completeOrCancelMove(keyEl) {
  const { movePending, boardId } = app.get();
  if (keyEl.dataset.buttonId && keyEl.dataset.buttonId === movePending.buttonId) {
    app.set({ movePending: null });
    showEditBadge(true);
    drawEverything();
    return;
  }
  const overlay = structuredClone(app.get().overlay);
  overlay.moves = [
    ...(overlay.moves || []),
    { a: { boardId: movePending.boardId, index: movePending.index }, b: { boardId, index: Number(keyEl.dataset.index) } },
  ];
  app.set({ movePending: null });
  showEditBadge(true);
  commitOverlay(overlay);
}

function runAction(action) {
  const actions = {
    speak: speakSentence,
    backspace: () => update(backspace(app.get().utterance)),
    clear: () => update(clear(app.get().utterance)),
    undo: () => update(undo(app.get().utterance)),
    home: () => go(app.get().vocab.home, true),
    back: goBack,
  };
  actions[action]?.();
}

function addToken(token) {
  update(append(app.get().utterance, token));
}

function update(utterance) {
  app.set({ utterance });
  drawOutput();
}

function speakIfWanted(text) {
  if (app.get().settings.speakOnTap) speak(text, app.get().settings);
}

async function speakSentence(event) {
  const { utterance, settings } = app.get();
  if (isEmpty(utterance)) return;
  const speech = toSpeech(utterance);
  if (settings.sparkles && event) {
    sparkleAt(event.clientX || window.innerWidth / 2, event.clientY || 80, true);
  }
  await store.pushHistory({ text: toText(utterance), speech, tokens: utterance.tokens });
  if (settings.speakOnSentence) await speak(speech, settings);
}

/* ── Input plumbing ────────────────────────────────────────────────────── */

const HOTBAR_LONG_PRESS_MS = 600;

function wireKeys(container, { isHotbar = false } = {}) {
  let holdTimer = null;
  let holdKey = null;
  let longPressTimer = null;
  let longPressFired = false;

  const begin = (event) => {
    const key = event.target.closest?.('.key:not(.key--empty)');
    if (!key) {
      const slot = event.target.closest?.('[data-empty-slot]');
      if (slot && app.get().movePending) completeOrCancelMove(slot);
      else if (slot && app.get().editing && !isHotbar) openEditorFor(null);
      return;
    }

    // In edit mode every key gets a long-press gesture instead of the
    // dwell-to-activate one below (that one is only for her ordinary,
    // non-editing use) — on the main board it adds the button to the
    // hotbar; on the hotbar itself it opens that entry's quick actions.
    if (app.get().editing && !app.get().movePending) {
      longPressFired = false;
      longPressTimer = setTimeout(() => {
        longPressFired = true;
        if (navigator.vibrate) navigator.vibrate(24);
        if (isHotbar) openHotbarQuickActions(key);
        else addToHotbar(key.dataset.buttonId);
      }, HOTBAR_LONG_PRESS_MS);
      return;
    }

    const dwell = app.get().settings.dwellMs;
    if (!dwell) return;                   // plain taps handled on click
    holdKey = key;
    key.classList.add('is-pressed');
    holdTimer = setTimeout(() => {
      key.classList.remove('is-pressed');
      onKeyActivate(key, event);
      holdKey = null;
    }, dwell);
  };

  const cancel = () => {
    clearTimeout(holdTimer);
    holdKey?.classList.remove('is-pressed');
    holdKey = null;
    clearTimeout(longPressTimer);
  };

  container.addEventListener('pointerdown', begin);
  container.addEventListener('pointerup', cancel);
  container.addEventListener('pointercancel', cancel);
  container.addEventListener('pointerleave', cancel);

  container.addEventListener('click', (event) => {
    if (longPressFired) { longPressFired = false; return; }   // swallow the tap that follows a long-press
    // The dwell timer above only ever fires onKeyActivate outside edit mode
    // (editing has its own long-press gesture instead), so an ordinary click
    // must still go through normally while editing even with dwell turned on.
    if (app.get().settings.dwellMs && !app.get().editing) return;
    const key = event.target.closest('.key:not(.key--empty)');
    if (key) return onKeyActivate(key, event);
    const slot = event.target.closest('[data-empty-slot]');
    if (!slot) return;
    if (app.get().movePending) completeOrCancelMove(slot);
    else if (app.get().editing && !isHotbar) openEditorFor(null);
  });
}

/** Long-press a board key in edit mode: add it to the hotbar. */
async function addToHotbar(buttonId) {
  if (!buttonId) return;
  const { settings } = app.get();
  const overlay = structuredClone(app.get().overlay);
  const hotbar = overlay.hotbar || [];
  if (hotbar.includes(buttonId)) {
    speak('That is already on your hotbar', settings);
    return;
  }
  const gapIndex = hotbar.indexOf(null);
  if (gapIndex !== -1) hotbar[gapIndex] = buttonId;
  else hotbar.push(buttonId);
  overlay.hotbar = hotbar;
  await commitOverlay(overlay);
  speak('Added to your hotbar', settings);
}

/** Long-press a hotbar key in edit mode: change it, or remove it (leaving a gap). */
function openHotbarQuickActions(keyEl) {
  const index = Number(keyEl.dataset.index);
  const button = app.get().vocab.buttonsById.get(keyEl.dataset.buttonId);
  const label = escapeHtml(button?.label ?? 'This button');

  dom.sheet.innerHTML = `
    <h2>${label}</h2>
    <p class="hint">It's on your hotbar, on every page.</p>
    <div class="sheet__actions">
      <button class="btn btn--go" id="hotbar-change" type="button">Change this button</button>
      <button class="btn btn--warn" id="hotbar-remove" type="button">Remove from hotbar</button>
      <button class="btn btn--quiet" id="hotbar-cancel" type="button">Never mind</button>
    </div>`;
  dom.scrim.hidden = false;

  const close = () => { dom.scrim.hidden = true; dom.sheet.replaceChildren(); };
  dom.sheet.querySelector('#hotbar-change').addEventListener('click', () => { close(); openEditorFor(button); });
  dom.sheet.querySelector('#hotbar-remove').addEventListener('click', async () => {
    close();
    const overlay = structuredClone(app.get().overlay);
    overlay.hotbar = [...overlay.hotbar];
    overlay.hotbar[index] = null;
    await commitOverlay(overlay);
  });
  dom.sheet.querySelector('#hotbar-cancel').addEventListener('click', close);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function wireOutput() {
  dom.output.addEventListener('click', (event) => {
    const x = event.target.closest('[data-remove-key]');
    if (x) {
      update(removeAt(app.get().utterance, x.dataset.removeKey));
      return;
    }
    const chip = event.target.closest('[data-token-key]');
    if (chip) {
      // Tapping one word says just that word — how she checks she picked right.
      const token = app.get().utterance.tokens.find((t) => t.key === chip.dataset.tokenKey);
      if (token) {
        if (token.buttonId) playRecording(token.buttonId, app.get().settings)
          .then((played) => { if (!played) speak(token.speak, app.get().settings); });
        else speak(token.speak, app.get().settings);
      }
      return;
    }
    speakSentence(event);
  });
}

function wireControls() {
  el('btn-speak').addEventListener('click', speakSentence);
  el('btn-back').addEventListener('click', () => update(backspace(app.get().utterance)));
  el('btn-undo').addEventListener('click', () => update(undo(app.get().utterance)));
  el('btn-clear').addEventListener('click', () => {
    stopSpeaking();
    update(clear(app.get().utterance));
  });

  // Spelling is one tap from anywhere, never buried in a folder.
  el('btn-keyboard').addEventListener('click', () => {
    const vocab = app.get().vocab;
    if (app.get().boardId === 'keyboard') go(vocab.home, true);
    else go('keyboard', true);
  });

  el('btn-hush').addEventListener('click', stopSpeaking);

  el('btn-history').addEventListener('click', () => openHistory(dom.sheet, dom.scrim, {
    onSpeak: (entry) => speak(entry.speech, app.get().settings),
    onRestore: (entry) => update({ tokens: [...entry.tokens], undoStack: [app.get().utterance.tokens] }),
  }));

  // Settings is behind a hold so she cannot wander into it mid-conversation.
  holdToOpen(
    el('btn-settings'),
    async () => {
      if (await askAdult(dom.sheet, dom.scrim)) showSettings();
    },
    () => speak('Ask a grown-up', app.get().settings)
  );

  // Caregiver keyboard shortcuts on a laptop.
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, select')) return;
    if (event.key === 'Enter') { event.preventDefault(); speakSentence(); }
    if (event.key === 'Backspace') { event.preventDefault(); update(backspace(app.get().utterance)); }
    if (event.key === 'Escape') { stopSpeaking(); dom.scrim.hidden = true; }
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      update(undo(app.get().utterance));
    }
  });
}

/* ── Settings and editor ───────────────────────────────────────────────── */

function showSettings() {
  openSettings(dom.sheet, dom.scrim, {
    settings: app.get().settings,
    onChange: (settings) => {
      app.set({ settings });
      saveSettings(settings);
      applyChrome(settings);
      rebuildVocab();
      drawEverything();
    },
    onEdit: startEditing,
    onClose: () => {},
  });
}

function startEditing() {
  app.set({ editing: true });
  // The real, wiggling board shows right away — not a list in a sheet — so a
  // long-press (add to / manage the hotbar) is immediately available, not
  // just a tap (open that button's editor). Tapping any key, filled or
  // empty, still opens the usual browse list for whichever page she's on.
  showEditBadge(true, 'Edit mode — tap a button to change it, or hold one to add it to your hotbar');
  drawEverything();
}

function openEditorFor(button) {
  openEditor(dom.sheet, dom.scrim, {
    currentBoard: () => app.get().vocab.boardsById.get(app.get().boardId),
    settings: () => app.get().settings,
    media: () => app.get().media,
    focus: button,
    refreshMedia,
    playRecording: (id) => playRecording(id, app.get().settings),
    patchButton: async (id, patch) => {
      const overlay = structuredClone(app.get().overlay);
      overlay.buttons[id] = { ...(overlay.buttons[id] || {}), ...patch };
      await commitOverlay(overlay);
    },
    hideButton: async (id) => {
      const overlay = structuredClone(app.get().overlay);
      overlay.buttons[id] = null;
      await commitOverlay(overlay);
    },
    beginMove: (buttonId) => {
      const { boardId, vocab } = app.get();
      const index = vocab.boardsById.get(boardId).buttons.findIndex((b) => b?.id === buttonId);
      if (index === -1) return;   // shouldn't happen — the button we just edited must be on this board
      app.set({ movePending: { boardId, index, buttonId } });
      showEditBadge(true, "Choose a spot for it — on this page or any other. Tap it again to cancel.");
      drawEverything();
    },
    addButton: async (boardId, newButton) => {
      const overlay = structuredClone(app.get().overlay);
      overlay.added[boardId] = [...(overlay.added[boardId] || []), newButton];
      // A second copy — same id — always lands on "My Buttons" too, so
      // there's one obvious place to find any custom button again later even
      // after it's been moved. Both copies stay in sync afterwards: a patch
      // or hide is keyed by id, so it applies to every occurrence.
      if (boardId !== 'custom') {
        overlay.added.custom = [...(overlay.added.custom || []), newButton];
      }
      await commitOverlay(overlay);
    },
    addBoard: async ({ title, cols, rows }) => {
      const overlay = structuredClone(app.get().overlay);
      const id = `custom_${Date.now().toString(36)}`;
      overlay.boards[id] = {
        id, title, cols, rows, color: 'noun', icon: '⭐',
        buttons: Array(cols * rows).fill(null),
      };
      overlay.added[app.get().boardId] = [
        ...(overlay.added[app.get().boardId] || []),
        { id: `custom.link.${id}`, label: title, speak: title, type: 'folder',
          icon: { kind: 'emoji', value: '⭐' }, color: 'noun', target: id, action: null },
      ];
      await commitOverlay(overlay);
    },
    onClose: () => {
      app.set({ editing: false });
      showEditBadge(false);
      drawEverything();
    },
  });
}

async function commitOverlay(overlay) {
  await store.saveOverlay(overlay);
  app.set({ overlay });
  rebuildVocab();
  await refreshMedia();
  drawEverything();
}

function rebuildVocab() {
  const { base, overlay, settings } = app.get();
  if (!base) return;
  const vocab = applyOverlay(base, overlay, { collapseHidden: settings.collapseHidden });
  app.set({ vocab, words: wordList(vocab) });
}

async function refreshMedia() {
  const { photos, recordings } = await store.mediaIndex();
  const photoUrls = new Map();
  for (const id of photos) {
    const blob = await store.loadPhoto(id);
    if (blob) photoUrls.set(id, URL.createObjectURL(blob));
  }
  // Release the previous batch of object URLs so a long session does not leak.
  for (const url of app.get().media.photoUrls.values()) URL.revokeObjectURL(url);
  app.set({ media: { photos, recordings, photoUrls } });
}

function showEditBadge(on, text = 'Edit mode — tap a button to change it') {
  let badge = document.querySelector('.edit-badge');
  if (!on) { badge?.remove(); return; }
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'edit-badge';
    document.body.append(badge);
  }
  badge.textContent = text;
}

/* ── Chrome, wake lock, service worker ─────────────────────────────────── */

function applyChrome(settings) {
  dom.root.dataset.theme = settings.theme;
  dom.root.dataset.font = settings.font;
  dom.root.dataset.labels = settings.labels;
  dom.root.style.setProperty('--board-scale', settings.boardScale);
  dom.root.style.setProperty('--hotbar-scale', settings.hotbarScale);
  dom.root.style.setProperty('--nav-scale', settings.navScale);
}

async function keepAwake() {
  if (!app.get().settings.keepAwake || !navigator.wakeLock) return;
  const request = async () => {
    try { await navigator.wakeLock.request('screen'); } catch { /* denied or unsupported */ }
  };
  await request();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') request();
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is a bonus */ });
}

/* ── Scroll edges ──────────────────────────────────────────────────────── */

// One delegated listener covers every scrollable panel, present or future —
// including .navbar__scroll, which is a brand-new DOM node on every
// navigation (drawNav rebuilds it), so a listener bound directly to it would
// not survive. The scroll event itself doesn't bubble, but a capture-phase
// listener still sees it on the way down regardless, so this needs neither
// bubbling nor rebinding.
const SCROLLABLE = '.board, .core-rail, .output, .navbar__scroll, .tense-strip, .ending-strip';
document.addEventListener('scroll', (event) => {
  if (event.target instanceof Element && event.target.matches(SCROLLABLE)) {
    updateScrollEdges(event.target);
  }
}, true);

// Rotating the tablet or resizing the window can turn a board that fit into
// one that overflows, or the reverse — refresh every edge, not just whichever
// one happens to be re-rendered next.
window.addEventListener('resize', () => {
  for (const el of document.querySelectorAll(SCROLLABLE)) updateScrollEdges(el);
});

/* ── Go ────────────────────────────────────────────────────────────────── */

wireKeys(dom.board);
wireKeys(dom.core, { isHotbar: true });
wireOutput();
wireControls();
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('input, textarea')) e.preventDefault();
});
boot();
