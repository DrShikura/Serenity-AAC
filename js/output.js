// The utterance model: the sentence being built in the output bar.
// Pure functions over an immutable-ish state object, no DOM. Ports to Godot.
//
// Design rule that drives everything here: a half-built sentence is slow,
// effortful work for the child, so nothing ever destroys one irrecoverably.
// Clear stashes; backspace stashes; undo brings it back.

import { applyGrammar } from './grammar.js';

let nextSeq = 1;

export function createUtterance() {
  return { tokens: [], undoStack: [] };
}

/** Turn a vocabulary button into a token for the output bar. */
export function tokenFromButton(button) {
  return {
    key: `t${nextSeq++}`,
    buttonId: button.id,
    label: button.label,
    speak: button.speak ?? button.label,
    icon: button.icon ?? null,
    color: button.color ?? 'noun',
    grammar: button.grammar ?? null,
  };
}

/** A token for freely typed text from the keyboard board. */
export function tokenFromText(text) {
  return {
    key: `t${nextSeq++}`,
    buttonId: null,
    label: text,
    speak: text,
    icon: null,
    color: 'social',
    grammar: null,
  };
}

const snapshot = (u) => ({ ...u, undoStack: [...u.undoStack, [...u.tokens]] });

export function append(u, token) {
  const next = snapshot(u);
  next.tokens = [...u.tokens, token];
  return next;
}

export function backspace(u) {
  if (u.tokens.length === 0) return u;
  const next = snapshot(u);
  next.tokens = u.tokens.slice(0, -1);
  return next;
}

export function removeAt(u, key) {
  const idx = u.tokens.findIndex((t) => t.key === key);
  if (idx === -1) return u;
  const next = snapshot(u);
  next.tokens = u.tokens.filter((t) => t.key !== key);
  return next;
}

export function clear(u) {
  if (u.tokens.length === 0) return u;
  const next = snapshot(u);
  next.tokens = [];
  return next;
}

/** Restore the previous state. Works for clear, backspace, append and grammar. */
export function undo(u) {
  if (u.undoStack.length === 0) return u;
  const previous = u.undoStack[u.undoStack.length - 1];
  return { tokens: [...previous], undoStack: u.undoStack.slice(0, -1) };
}

export function canUndo(u) {
  return u.undoStack.length > 0;
}

/** Apply a grammar operation to the last token, e.g. make it plural. */
export function applyGrammarToLast(u, op) {
  if (u.tokens.length === 0) return u;
  const next = snapshot(u);
  const tokens = [...u.tokens];
  tokens[tokens.length - 1] = applyGrammar(tokens[tokens.length - 1], op);
  next.tokens = tokens;
  return next;
}

/** The string handed to the speech engine. */
export function toSpeech(u) {
  return u.tokens.map((t) => t.speak).join(' ').replace(/\s+/g, ' ').trim();
}

/** The string shown to a reading adult and stored in history. */
export function toText(u) {
  return u.tokens.map((t) => t.label).join(' ').replace(/\s+/g, ' ').trim();
}

export function isEmpty(u) {
  return u.tokens.length === 0;
}
