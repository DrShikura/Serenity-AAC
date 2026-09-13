// DOM rendering. Everything here is replaceable when porting to Godot; the
// data and language logic it reads from are not.

const ICON_PATH = 'assets/icons/';

/**
 * Resolve a hand-drawn icon name to a src.
 *
 * The single-file standalone build (tools/build-standalone.mjs) has no
 * assets/ directory to point at — every SVG is inlined as a data: URI and
 * dropped onto `window.SERENITY_ICONS[name]` before this module runs. When
 * that map exists we use it; the ordinary served app never sets it, so this
 * is a no-op there and the plain path is used as always.
 */
function iconSrc(name) {
  const embedded = typeof window !== 'undefined' && window.SERENITY_ICONS;
  return embedded?.[name] ?? `${ICON_PATH}${name}.svg`;
}

/**
 * A stable "hand-drawn" lean for a key, derived from its own id.
 * Deterministic on purpose: the wobble is charm, but a button that shifted
 * between renders would undermine the motor memory the whole layout depends on.
 */
export function tiltFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const degrees = ((Math.abs(hash) % 61) - 30) / 20;   // -1.5deg .. +1.5deg
  return `${degrees.toFixed(2)}deg`;
}

function glyphNode(icon, photoUrl, label) {
  const span = document.createElement('span');
  span.className = 'key__glyph';
  if (photoUrl) {
    const img = document.createElement('img');
    img.className = 'photo';
    img.src = photoUrl;
    img.alt = '';
    span.append(img);
  } else if (icon?.kind === 'svg') {
    const img = document.createElement('img');
    img.src = iconSrc(icon.value);
    img.alt = '';
    img.draggable = false;
    span.append(img);
  } else if (icon?.kind === 'emoji') {
    span.textContent = icon.value;
  } else {
    span.textContent = (label || '?').slice(0, 1).toUpperCase();
  }
  return span;
}

/** Build one key element for a vocabulary button. */
export function renderKey(button, { photoUrl, hasRecording, popDelay = null } = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `key face-${button.color || 'noun'}`;
  if (button.type === 'folder') el.classList.add('key--folder');
  if (button.color === 'urgent') el.classList.add('key--urgent');
  el.style.setProperty('--tilt', tiltFor(button.id));
  if (popDelay !== null) {
    // A gentle cascade as a board first appears — capped so a big board
    // doesn't take noticeably longer to finish popping in than a small one.
    el.style.setProperty('--pop-delay', Math.min(popDelay, 220));
    el.classList.add('key--pop-in');
  }
  el.dataset.buttonId = button.id;
  el.dataset.type = button.type;

  el.append(glyphNode(button.icon, photoUrl, button.label));

  const label = document.createElement('span');
  label.className = 'key__label';
  label.textContent = button.label;
  el.append(label);

  el.setAttribute(
    'aria-label',
    button.type === 'folder' ? `${button.label}, more buttons inside` : button.speak || button.label
  );
  if (hasRecording) el.dataset.recorded = 'true';
  return el;
}

/** An empty grid slot: visible, inert, and holding its neighbours in place. */
export function renderEmptySlot() {
  const el = document.createElement('div');
  el.className = 'key key--empty';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

/** Draw a board into a container. */
export function renderBoard(container, board, media, { editing = false, pickedUpId = null, animate = false } = {}) {
  container.replaceChildren();
  // A fresh board always starts scrolled to the top-left — carrying over
  // wherever the previous board happened to be scrolled to would be
  // disorienting, not a convenience.
  container.scrollTop = 0;
  container.scrollLeft = 0;
  // Custom properties rather than inline grid templates, so the stylesheet's
  // narrow-screen rules can still take over.
  container.style.setProperty('--cols', board.cols);
  container.style.setProperty('--rows', board.rows);
  container.setAttribute('aria-label', `${board.title} board`);

  board.buttons.forEach((button, index) => {
    if (!button) {
      const slot = renderEmptySlot();
      slot.dataset.index = index;
      if (editing) {
        slot.classList.add('is-editing');
        slot.dataset.emptySlot = 'true';
      }
      container.append(slot);
      return;
    }
    const key = renderKey(button, {
      photoUrl: media?.photoUrls?.get(button.id),
      hasRecording: media?.recordings?.has(button.id),
      popDelay: animate ? index * 12 : null,
    });
    key.dataset.index = index;
    if (editing) key.classList.add('is-editing');
    // The button a parent just picked up to move — a distinct highlight,
    // not wiggling, so it visibly reads as "in your hand" against its still-
    // wiggling neighbours while she chooses where it goes.
    if (button.id === pickedUpId) { key.classList.remove('is-editing'); key.classList.add('is-picked-up'); }
    container.append(key);
  });
  // So a board with more rows/columns than fit shows "there's more" right
  // away, before she's touched it — not only once she starts scrolling.
  updateScrollEdges(container);
}

/** Draw the fixed core rail. Identical on every board, always. */
export function renderCore(container, coreBoard, media, { editing = false } = {}) {
  container.replaceChildren();
  container.style.setProperty('--core-rows', coreBoard.rows);
  coreBoard.buttons.forEach((button, index) => {
    if (!button) {
      const slot = renderEmptySlot();
      slot.dataset.index = index;
      container.append(slot);
      return;
    }
    const key = renderKey(button, {
      photoUrl: media?.photoUrls?.get(button.id),
      hasRecording: media?.recordings?.has(button.id),
    });
    key.dataset.index = index;
    if (editing) key.classList.add('is-editing');
    container.append(key);
  });
  updateScrollEdges(container);
}

/** Draw the sentence in the output bar as removable chips. */
export function renderOutput(container, utterance, speakingKey) {
  container.replaceChildren();
  if (utterance.tokens.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'output__empty';
    hint.textContent = 'Tap the pictures to talk';
    container.append(hint);
    updateScrollEdges(container);
    return;
  }
  for (const token of utterance.tokens) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip face-${token.color || 'noun'}`;
    if (token.key === speakingKey) chip.classList.add('is-speaking');
    chip.dataset.tokenKey = token.key;
    chip.setAttribute('aria-label', `${token.label}. Tap to say it again.`);

    if (token.icon?.kind === 'svg') {
      const img = document.createElement('img');
      img.src = iconSrc(token.icon.value);
      img.alt = '';
      chip.append(img);
    } else if (token.icon?.kind === 'emoji') {
      const glyph = document.createElement('span');
      glyph.textContent = token.icon.value;
      chip.append(glyph);
    }
    const text = document.createElement('span');
    text.textContent = token.label;
    chip.append(text);

    const x = document.createElement('span');
    x.className = 'chip__x';
    x.dataset.removeKey = token.key;
    x.textContent = '✕';
    chip.append(x);
    container.append(chip);
  }
  // Keep the newest word in view without yanking the whole page around.
  container.scrollLeft = container.scrollWidth;
  updateScrollEdges(container);
}

// A hair of slack so a container that's scrolled to (or within a sub-pixel
// of) an edge doesn't flicker the shadow on and off from rounding error.
const EDGE_SLACK = 2;

/**
 * Toggle .can-scroll-up/-down/-left/-right on a scrollable container to
 * match its actual scroll position, so the CSS edge-shadow only ever shows
 * on a side that genuinely has more content — never as a static decoration,
 * and never lingering once she's scrolled all the way to that edge.
 * Safe to call on any element, scrollable or not (all four just clear).
 */
export function updateScrollEdges(el) {
  if (!el) return;
  const canUp = el.scrollTop > EDGE_SLACK;
  const canDown = el.scrollTop < el.scrollHeight - el.clientHeight - EDGE_SLACK;
  const canLeft = el.scrollLeft > EDGE_SLACK;
  const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - EDGE_SLACK;
  el.classList.toggle('can-scroll-up', canUp);
  el.classList.toggle('can-scroll-down', canDown);
  el.classList.toggle('can-scroll-left', canLeft);
  el.classList.toggle('can-scroll-right', canRight);
}

/** A little burst of sparkles when something is spoken. */
export function sparkleAt(x, y, enabled = true) {
  if (!enabled) return;
  const marks = ['✨', '⭐', '🌟', '💫'];
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = marks[i % marks.length];
    s.style.left = `${x + (Math.random() * 54 - 27)}px`;
    s.style.top = `${y + (Math.random() * 24 - 12)}px`;
    s.style.animationDelay = `${i * 45}ms`;
    document.body.append(s);
    setTimeout(() => s.remove(), 800);
  }
}
