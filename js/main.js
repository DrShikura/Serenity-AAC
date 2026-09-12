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

function drawEverything() {
  const { vocab, boardId, media, editing } = app.get();
  const board = vocab.boardsById.get(boardId) || vocab.boardsById.get(vocab.home);

  if (board.special === 'keyboard') {
    renderKeyboard(dom.board, app.get().words, {
      onWord: (word) => { addToken(tokenFromText(word)); speakIfWanted(word); },
      onLetter: (letter) => speakIfWanted(letter),
      onBackspace: () => update(backspace(app.get().utterance)),
    });
  } else {
    renderBoard(dom.board, board, media, { editing });
  }

  renderCore(dom.core, vocab.boardsById.get(vocab.core), media);
  drawOutput();
  drawNav(board);
  drawGrammar();
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
  drawEverything();
}

function goBack() {
  const trail = [...app.get().trail];
  const previous = trail.pop() || app.get().vocab.home;
  app.set({ boardId: previous, trail });
  drawEverything();
}

/* ── Taps ──────────────────────────────────────────────────────────────── */

let lastTapAt = 0;
let lastTapId = null;

function onKeyActivate(keyEl, event) {
  const { vocab, settings, editing } = app.get();
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
      // core words she needs for the *next* word permanently one tap away.
      const onCore = app.get().vocab.boardsById.get(vocab.core).buttons.some((b) => b?.id === button.id);
      if (settings.autoHome && !app.get().pinned && !onCore && app.get().boardId !== vocab.home) {
        go(vocab.home, true);
      }
    }
  }
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

function wireKeys(container) {
  let holdTimer = null;
  let holdKey = null;

  const begin = (event) => {
    const key = event.target.closest?.('.key:not(.key--empty)');
    if (!key) {
      const slot = event.target.closest?.('[data-empty-slot]');
      if (slot && app.get().editing) openEditorFor(null);
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
  };

  container.addEventListener('pointerdown', begin);
  container.addEventListener('pointerup', cancel);
  container.addEventListener('pointercancel', cancel);
  container.addEventListener('pointerleave', cancel);

  container.addEventListener('click', (event) => {
    if (app.get().settings.dwellMs) return;   // the hold already handled it
    const key = event.target.closest('.key:not(.key--empty)');
    if (key) return onKeyActivate(key, event);
    const slot = event.target.closest('[data-empty-slot]');
    if (slot && app.get().editing) openEditorFor(null);
  });
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
  showEditBadge(true);
  drawEverything();
  openEditorFor(null);
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
    addButton: async (boardId, newButton) => {
      const overlay = structuredClone(app.get().overlay);
      overlay.added[boardId] = [...(overlay.added[boardId] || []), newButton];
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

function showEditBadge(on) {
  document.querySelector('.edit-badge')?.remove();
  if (!on) return;
  const badge = document.createElement('div');
  badge.className = 'edit-badge';
  badge.textContent = 'Edit mode — tap a button to change it';
  document.body.append(badge);
}

/* ── Chrome, wake lock, service worker ─────────────────────────────────── */

function applyChrome(settings) {
  dom.root.dataset.theme = settings.theme;
  dom.root.dataset.size = settings.size;
  dom.root.dataset.labels = settings.labels;
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
wireKeys(dom.core);
wireOutput();
wireControls();
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('input, textarea')) e.preventDefault();
});
boot();
