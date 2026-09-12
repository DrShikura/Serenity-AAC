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
export function renderKey(button, { photoUrl, hasRecording } = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `key face-${button.color || 'noun'}`;
  if (button.type === 'folder') el.classList.add('key--folder');
  if (button.color === 'urgent') el.classList.add('key--urgent');
  el.style.setProperty('--tilt', tiltFor(button.id));
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
export function renderBoard(container, board, media, { editing = false } = {}) {
  container.replaceChildren();
  // Custom properties rather than inline grid templates, so the stylesheet's
  // narrow-screen rules can still take over.
  container.style.setProperty('--cols', board.cols);
  container.style.setProperty('--rows', board.rows);
  container.setAttribute('aria-label', `${board.title} board`);

  for (const button of board.buttons) {
    if (!button) {
      const slot = renderEmptySlot();
      if (editing) {
        slot.classList.add('is-editing');
        slot.dataset.emptySlot = 'true';
      }
      container.append(slot);
      continue;
    }
    const key = renderKey(button, {
      photoUrl: media?.photoUrls?.get(button.id),
      hasRecording: media?.recordings?.has(button.id),
    });
    if (editing) key.classList.add('is-editing');
    container.append(key);
  }
}

/** Draw the fixed core rail. Identical on every board, always. */
export function renderCore(container, coreBoard, media) {
  container.replaceChildren();
  container.style.setProperty('--core-rows', coreBoard.rows);
  for (const button of coreBoard.buttons) {
    if (!button) { container.append(renderEmptySlot()); continue; }
    container.append(renderKey(button, {
      photoUrl: media?.photoUrls?.get(button.id),
      hasRecording: media?.recordings?.has(button.id),
    }));
  }
}

/** Draw the sentence in the output bar as removable chips. */
export function renderOutput(container, utterance, speakingKey) {
  container.replaceChildren();
  if (utterance.tokens.length === 0) {
    const hint = document.createElement('span');
    hint.className = 'output__empty';
    hint.textContent = 'Tap the pictures to talk';
    container.append(hint);
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
