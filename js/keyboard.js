// The spelling board.
//
// She reads and spells, so this is a real keyboard rather than a token
// gesture: capitals, apostrophes, punctuation and a number layer, with
// prediction drawn from the app's own vocabulary. It is one tap away from
// every screen via the "spell" key, so choosing to write instead of tapping
// pictures is always hers to make.

const LETTERS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['.', ',', '?', '!', "'", '"', '-', ':'],
  ['+', '=', '/', '(', ')', '&', '%', '$'],
];

/**
 * Render the keyboard into the board container.
 *  - `onWord`  a finished word or phrase, added to the sentence bar
 *  - `onLetter` each keystroke, for live audio feedback
 *  - `onBackspace` backspace pressed with nothing typed: remove the last word
 */
export function renderKeyboard(container, words, { onWord, onLetter, onBackspace }) {
  let buffer = '';
  let shift = false;
  let layer = 'letters';

  container.replaceChildren();
  container.style.setProperty('--cols', 1);
  container.style.setProperty('--rows', 1);

  const wrap = document.createElement('div');
  wrap.className = 'kb';
  const predict = document.createElement('div');
  predict.className = 'kb__predict';
  predict.setAttribute('aria-label', 'What you are typing, and word suggestions');
  const keys = document.createElement('div');
  keys.className = 'kb__keys';
  wrap.append(predict, keys);
  container.append(wrap);

  const commit = (text) => {
    const clean = String(text).trim();
    if (!clean) return;
    onWord(clean);
    buffer = '';
    shift = false;
    draw();
  };

  const type = (ch) => {
    buffer += shift ? ch.toUpperCase() : ch;
    shift = false;
    onLetter?.(ch);
    draw();
  };

  /* ── The typing line and suggestions ─────────────────────────────────── */

  function drawPredictions() {
    predict.replaceChildren();

    const typed = document.createElement('button');
    typed.type = 'button';
    typed.className = 'kb__typed';
    typed.textContent = buffer || 'type here';
    typed.disabled = !buffer;
    typed.setAttribute('aria-label', buffer ? `Add "${buffer}"` : 'Nothing typed yet');
    typed.addEventListener('click', () => commit(buffer));
    predict.append(typed);

    for (const word of suggest(words, buffer)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = shift ? capitalise(word) : word;
      b.addEventListener('click', () => commit(shift ? capitalise(word) : word));
      predict.append(b);
    }
  }

  /* ── The keys ────────────────────────────────────────────────────────── */

  function drawKeys() {
    keys.replaceChildren();
    const rows = layer === 'letters' ? LETTERS : SYMBOLS;

    for (const row of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb__row';
      for (const ch of row) {
        const key = document.createElement('button');
        key.type = 'button';
        key.textContent = shift && layer === 'letters' ? ch.toUpperCase() : ch;
        key.addEventListener('click', () => type(ch));
        rowEl.append(key);
      }
      keys.append(rowEl);
    }

    const bottom = document.createElement('div');
    bottom.className = 'kb__row';
    bottom.append(
      button(shift ? '⇧ CAPS' : '⇧ caps', shift ? 'util is-on' : 'util', () => { shift = !shift; draw(); }),
      button(layer === 'letters' ? '123' : 'abc', 'util',
             () => { layer = layer === 'letters' ? 'symbols' : 'letters'; draw(); }),
      button("'", '', () => type("'")),
      button('space', 'wide', () => commit(buffer)),
      button('⌫', 'util', () => {
        if (buffer) { buffer = buffer.slice(0, -1); draw(); }
        else onBackspace?.();
      }),
      button('✓ add', 'go', () => commit(buffer)),
    );
    keys.append(bottom);
  }

  function button(text, cls, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    if (cls) b.className = cls;
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  }

  function draw() {
    drawPredictions();
    drawKeys();
  }

  draw();
}

/** Prefix match first, then anything containing the fragment. */
export function suggest(words, fragment, limit = 8) {
  if (!fragment) return [];
  const f = fragment.toLowerCase();
  const starts = words.filter((w) => w.startsWith(f) && w !== f);
  const contains = words.filter((w) => !w.startsWith(f) && w.includes(f));
  return [...starts, ...contains].slice(0, limit);
}

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);
