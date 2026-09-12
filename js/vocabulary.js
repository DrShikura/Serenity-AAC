// Vocabulary loading and the user-overlay merge. No DOM — ports to Godot.
//
// data/vocabulary.json is shipped read-only. Everything a parent changes in Edit
// mode lives in a separate overlay keyed by button id, applied on top at load
// time. That way shipping new vocabulary in an update never wipes their work.

/**
 * Fetch and index the shipped vocabulary.
 *
 * The single-file standalone build (tools/build-standalone.mjs) embeds this
 * same JSON as `<script type="application/json" id="vocab-data">`, since a
 * file:// page cannot fetch() its own directory. When that element exists we
 * read it directly instead — the ordinary served app never has it, so this
 * fetch path is unchanged for everyone else.
 */
export async function loadVocabulary(url = 'data/vocabulary.json') {
  const embedded = typeof document !== 'undefined' && document.getElementById('vocab-data');
  if (embedded) return indexVocabulary(JSON.parse(embedded.textContent));

  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load vocabulary (${res.status})`);
  return indexVocabulary(await res.json());
}

/** Build id lookups over a raw vocabulary document. */
export function indexVocabulary(raw) {
  const boardsById = new Map();
  const buttonsById = new Map();
  for (const board of raw.boards) {
    boardsById.set(board.id, board);
    for (const button of board.buttons) {
      if (button) buttonsById.set(button.id, button);
    }
  }
  return { ...raw, boardsById, buttonsById };
}

/**
 * Overlay shape:
 *   { buttons: { [id]: patch|null }, boards: { [id]: patch }, added: { [boardId]: [button] } }
 * A null button patch means "hidden".
 */
export function emptyOverlay() {
  return { buttons: {}, boards: {}, added: {} };
}

/**
 * Merge an overlay into a vocabulary document and re-index.
 *
 * Hidden buttons become `null` slots rather than being spliced out, so every
 * surviving button keeps the exact grid position it had before. That
 * positional stability is what lets motor memory work, and it is worth the
 * empty squares. A parent who prefers a packed grid can turn on
 * `collapseHidden`.
 */
export function applyOverlay(vocab, overlay, { collapseHidden = false } = {}) {
  const ov = { ...emptyOverlay(), ...(overlay || {}) };
  const boards = vocab.boards.map((board) => {
    const boardPatch = ov.boards[board.id] || {};
    let buttons = board.buttons.map((button) => {
      if (!button) return null;
      if (!(button.id in ov.buttons)) return button;
      const patch = ov.buttons[button.id];
      if (patch === null || patch.hidden) return null;
      return { ...button, ...patch };
    });
    const extras = (ov.added[board.id] || []).filter((b) => b && !b.hidden);
    if (extras.length) buttons = fillGaps(buttons, extras);
    if (collapseHidden) {
      const kept = buttons.filter(Boolean);
      buttons = kept.concat(Array(buttons.length - kept.length).fill(null));
    }
    return { ...board, ...boardPatch, buttons };
  });

  // Whole boards added by a parent.
  for (const [id, patch] of Object.entries(ov.boards)) {
    if (!vocab.boardsById.has(id) && patch && patch.buttons) {
      boards.push({ cols: 8, rows: 4, color: 'noun', ...patch, id });
    }
  }
  return indexVocabulary({ ...vocab, boards });
}

/** Drop new buttons into empty slots first, then grow the grid if needed. */
function fillGaps(buttons, extras) {
  const out = [...buttons];
  const queue = [...extras];
  for (let i = 0; i < out.length && queue.length; i++) {
    if (out[i] === null) out[i] = queue.shift();
  }
  return out.concat(queue);
}

/** Every distinct word in the vocabulary, for keyboard prediction. */
export function wordList(vocab) {
  const words = new Set();
  for (const board of vocab.boards) {
    for (const button of board.buttons) {
      if (!button || button.type === 'folder' || button.type === 'action') continue;
      for (const word of String(button.speak).split(/\s+/)) {
        const clean = word.replace(/[^A-Za-z'-]/g, '');
        if (clean.length > 1) words.add(clean.toLowerCase());
      }
    }
  }
  return [...words].sort();
}

/** Validate the document: unique ids, resolvable folder targets, reachability. */
export function validate(vocab) {
  const problems = [];
  const seen = new Set();
  const targets = new Set();
  for (const board of vocab.boards) {
    for (const button of board.buttons) {
      if (!button) continue;
      if (seen.has(button.id)) problems.push(`Duplicate button id: ${button.id}`);
      seen.add(button.id);
      if (button.type === 'folder') {
        targets.add(button.target);
        if (!vocab.boardsById.has(button.target)) {
          problems.push(`Button ${button.id} points at missing board "${button.target}"`);
        }
      }
    }
  }
  for (const board of vocab.boards) {
    const reachable = board.id === vocab.home || board.id === vocab.core || targets.has(board.id);
    if (!reachable) problems.push(`Board "${board.id}" is not reachable from any folder button`);
  }
  return problems;
}
