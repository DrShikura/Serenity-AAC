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
 *   { buttons: { [id]: patch|null }, boards: { [id]: patch }, added: { [boardId]: [button] },
 *     moves: [{ a: {boardId, index}, b: {boardId, index} }] }
 * A null button patch means "hidden". `moves` records teacher-mode
 * repositioning — see applyMoves() below for why a swap, not a full layout.
 */
export function emptyOverlay() {
  return { buttons: {}, boards: {}, added: {}, moves: [] };
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

  // Applies a parent's patch/hide edit to one button, by id — used for both
  // buttons shipped in the base vocabulary AND ones a parent added earlier
  // (e.g. a custom button), so editing or hiding one works the same way no
  // matter which board it's being viewed from — a custom button referenced
  // from more than one board (its own page, and always from "My Buttons")
  // stays in sync between them, since every occurrence resolves the same
  // patch by the same id.
  const withPatch = (button) => {
    if (!button) return null;
    if (button.id in ov.buttons) {
      const patch = ov.buttons[button.id];
      if (patch === null || patch.hidden) return null;
      return { ...button, ...patch };
    }
    return button.hidden ? null : button;
  };

  const boards = vocab.boards.map((board) => {
    const boardPatch = ov.boards[board.id] || {};
    let buttons = board.buttons.map(withPatch);
    const extras = (ov.added[board.id] || []).map(withPatch).filter(Boolean);
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
  applyMoves(boards, ov.moves);
  return indexVocabulary({ ...vocab, boards });
}

/**
 * Replay a parent's teacher-mode repositioning: each recorded move swaps
 * whatever currently occupies two grid cells, which may be on the same
 * board (a reorder) or different ones (a relocation) and either of which may
 * be empty. A swap is always well-defined — the button that was displaced
 * always lands exactly at the other slot, so nothing can ever be silently
 * lost the way a general "here is board X's whole new layout" replacement
 * could if two edits disagreed about where something ended up. Moves are
 * replayed in the order they happened, on top of every other overlay step,
 * so a button being moved is patched/relabelled first and then relocated.
 */
function applyMoves(boards, moves) {
  if (!moves || !moves.length) return boards;
  const byId = new Map(boards.map((b) => [b.id, b]));
  for (const { a, b } of moves) {
    const boardA = byId.get(a?.boardId);
    const boardB = byId.get(b?.boardId);
    if (!boardA || !boardB) continue;                    // a board since removed
    if (a.index < 0 || a.index >= boardA.buttons.length) continue;
    if (b.index < 0 || b.index >= boardB.buttons.length) continue;
    const tmp = boardA.buttons[a.index];
    boardA.buttons[a.index] = boardB.buttons[b.index];
    boardB.buttons[b.index] = tmp;
  }
  return boards;
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
