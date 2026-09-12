// Authoring helpers for the Serenity AAC vocabulary.
//
// The vocabulary is authored here in a compact form and built into
// data/vocabulary.json, which is the file the app and any future Godot port
// actually read. Run `node tools/build-vocabulary.mjs` after editing.

/** Turn a human label into a stable, url-safe id fragment. */
export function slug(label) {
  return String(label)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** A word button: appends one word to the utterance. */
export function w(label, icon, opts = {}) {
  return { type: 'word', label, icon, ...opts };
}

/**
 * A phrase button: appends a whole phrase as a single chip.
 *
 * `speak` is always exactly `label` — set *after* spreading `opts`, so
 * nothing can override it by accident. What a button says out loud must
 * always be exactly what it shows; there is no way to author a mismatch.
 * (`type: 'phrase'` survives only as a hint for anyone reading the source —
 * no runtime code branches on it differently from `type: 'word'`.)
 */
export function p(label, icon, opts = {}) {
  return { type: 'phrase', label, icon, ...opts, speak: label };
}

/** A folder button: navigates to another board. */
export function f(label, icon, target, opts = {}) {
  return { type: 'folder', label, icon, target, ...opts };
}

/** An action button: drives the app rather than the utterance. */
export function a(label, icon, action, opts = {}) {
  return { type: 'action', label, icon, action, ...opts };
}

/** An intentionally empty grid slot. Keeps neighbouring buttons in place. */
export const gap = null;

/**
 * Declare a board.
 * `color` is the default swatch for buttons that don't name their own.
 */
export function board(id, title, icon, color, cols, rows, buttons) {
  return { id, title, icon, color, cols, rows, buttons };
}

/**
 * Normalise an authored board list into the shipped JSON shape:
 * assigns stable ids, inherits colors, fills `speak`, and pads the grid.
 */
export function compile(boards, { corePage } = {}) {
  const seen = new Set();
  const out = boards.map((b) => {
    const buttons = b.buttons.map((btn) => {
      if (!btn) return null;
      let id = btn.id ?? `${b.id}.${slug(btn.label)}`;
      let n = 2;
      while (seen.has(id)) id = `${b.id}.${slug(btn.label)}_${n++}`;
      seen.add(id);
      const icon =
        typeof btn.icon === 'string'
          ? btn.icon.startsWith('svg:')
            ? { kind: 'svg', value: btn.icon.slice(4) }
            : { kind: 'emoji', value: btn.icon }
          : btn.icon ?? null;
      const out = {
        id,
        label: btn.label,
        speak: btn.speak ?? btn.label,
        type: btn.type,
        icon,
        color: btn.color ?? b.color,
        target: btn.target ?? null,
        action: btn.action ?? null,
      };
      if (btn.grammar) out.grammar = btn.grammar;
      if (btn.plural || btn.past || btn.ing || btn.pos) {
        // Anything carrying a past or -ing form is a doing word, and the sticky
        // tense strip only ever touches words marked as such. Inferring it here
        // keeps the authoring files from repeating `pos: 'verb'` 200 times —
        // and keeps helper verbs like "am" and "was", which have no such forms,
        // safely out of reach of conjugation.
        const pos = btn.pos || (btn.past || btn.ing ? 'verb' : null);
        out.grammar = {
          ...(out.grammar || {}),
          ...(pos ? { pos } : {}),
          ...(btn.plural ? { plural: btn.plural } : {}),
          ...(btn.past ? { past: btn.past } : {}),
          ...(btn.ing ? { ing: btn.ing } : {}),
        };
      }
      if (btn.article) out.article = btn.article;
      return out;
    });
    const size = b.cols * b.rows;
    while (buttons.length < size) buttons.push(null);
    if (buttons.length > size) {
      throw new Error(
        `Board "${b.id}" holds ${buttons.length} buttons but the grid is ${b.cols}x${b.rows} (${size}).`
      );
    }
    return { ...b, buttons };
  });
  return { version: 1, home: 'home', core: corePage, boards: out };
}
