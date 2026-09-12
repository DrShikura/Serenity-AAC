// The spelling board. She is not reading yet, so this lives one tap off Home
// rather than on it — but it is here, complete, for when she gets there.

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/**
 * Render the keyboard into the board container.
 * `onWord` receives a finished word; `onLetter` fires for live speech feedback.
 */
export function renderKeyboard(container, words, { onWord, onLetter, onBackspace }) {
  let buffer = '';

  container.replaceChildren();
  container.style.setProperty('--cols', 1);
  container.style.setProperty('--rows', 1);

  const wrap = document.createElement('div');
  wrap.className = 'kb';
  const predict = document.createElement('div');
  predict.className = 'kb__predict';
  predict.setAttribute('aria-label', 'Word suggestions');
  const keys = document.createElement('div');
  keys.className = 'kb__keys';
  wrap.append(predict, keys);
  container.append(wrap);

  const commit = (word) => {
    if (!word) return;
    onWord(word);
    buffer = '';
    drawPredictions();
  };

  function drawPredictions() {
    predict.replaceChildren();
    if (buffer) {
      const typed = document.createElement('button');
      typed.type = 'button';
      typed.textContent = `“${buffer}”`;
      typed.style.background = 'var(--crayon-green)';
      typed.addEventListener('click', () => commit(buffer));
      predict.append(typed);
    }
    for (const word of suggest(words, buffer)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = word;
      b.addEventListener('click', () => commit(word));
      predict.append(b);
    }
  }

  for (const row of ROWS) {
    const rowEl = document.createElement('div');
    rowEl.className = 'kb__row';
    for (const letter of row) {
      const key = document.createElement('button');
      key.type = 'button';
      key.textContent = letter;
      key.addEventListener('click', () => {
        buffer += letter;
        onLetter?.(letter);
        drawPredictions();
      });
      rowEl.append(key);
    }
    keys.append(rowEl);
  }

  const bottom = document.createElement('div');
  bottom.className = 'kb__row';
  const make = (text, cls, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.addEventListener('click', fn);
    return b;
  };
  bottom.append(
    make('⌫', 'util', () => {
      if (buffer) { buffer = buffer.slice(0, -1); drawPredictions(); }
      else onBackspace?.();
    }),
    make('space', 'wide', () => commit(buffer)),
    make('✓ add', 'util', () => commit(buffer)),
  );
  keys.append(bottom);

  drawPredictions();
}

/** Prefix match first, then anything containing the fragment. */
export function suggest(words, fragment, limit = 9) {
  if (!fragment) return words.slice(0, 0);
  const f = fragment.toLowerCase();
  const starts = words.filter((w) => w.startsWith(f));
  const contains = words.filter((w) => !w.startsWith(f) && w.includes(f));
  return [...starts, ...contains].slice(0, limit);
}
