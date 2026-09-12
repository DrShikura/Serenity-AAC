import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createUtterance, tokenFromButton, tokenFromText, append, backspace,
  removeAt, clear, undo, canUndo, applyGrammarToLast, toSpeech, toText, isEmpty,
} from '../js/output.js';

const btn = (label, extra = {}) => ({ id: `x.${label}`, label, speak: label, ...extra });

function build(...labels) {
  return labels.reduce((u, l) => append(u, tokenFromButton(btn(l))), createUtterance());
}

test('appending builds a spoken sentence', () => {
  const u = build('I', 'want', 'apple');
  assert.equal(toSpeech(u), 'I want apple');
  assert.equal(toText(u), 'I want apple');
  assert.equal(u.tokens.length, 3);
});

test('a phrase button contributes its full spoken text', () => {
  let u = append(createUtterance(), tokenFromButton(btn('bathroom', { speak: 'I need the bathroom' })));
  assert.equal(toSpeech(u), 'I need the bathroom');
  assert.equal(toText(u), 'bathroom');   // the chip stays short on screen
});

test('backspace removes only the last token', () => {
  const u = backspace(build('I', 'want', 'apple'));
  assert.equal(toSpeech(u), 'I want');
});

test('a token can be removed from the middle', () => {
  const u = build('I', 'want', 'apple');
  const middle = u.tokens[1].key;
  assert.equal(toSpeech(removeAt(u, middle)), 'I apple');
});

test('clear is undoable — a built sentence is never lost', () => {
  const u = build('I', 'want', 'the', 'red', 'ball');
  const cleared = clear(u);
  assert.ok(isEmpty(cleared));
  assert.ok(canUndo(cleared));
  assert.equal(toSpeech(undo(cleared)), 'I want the red ball');
});

test('undo steps back through every kind of edit', () => {
  let u = build('I', 'want');
  u = backspace(u);
  assert.equal(toSpeech(u), 'I');
  u = undo(u);
  assert.equal(toSpeech(u), 'I want');
  u = undo(u);
  assert.equal(toSpeech(u), 'I');
});

test('undo on an untouched utterance is a no-op, not a crash', () => {
  const u = createUtterance();
  assert.equal(canUndo(u), false);
  assert.equal(toSpeech(undo(u)), '');
});

test('backspace and clear on an empty utterance do nothing', () => {
  const u = createUtterance();
  assert.equal(backspace(u), u);
  assert.equal(clear(u), u);
});

test('grammar applies to the last token and is undoable', () => {
  let u = build('I', 'want', 'cookie');
  u = applyGrammarToLast(u, 'plural');
  assert.equal(toSpeech(u), 'I want cookies');
  assert.equal(toSpeech(undo(u)), 'I want cookie');
});

test('typed keyboard text becomes an ordinary token', () => {
  const u = append(build('I', 'want'), tokenFromText('Serenity'));
  assert.equal(toSpeech(u), 'I want Serenity');
});

test('tokens get unique keys so identical words stay distinguishable', () => {
  const u = build('more', 'more');
  assert.notEqual(u.tokens[0].key, u.tokens[1].key);
});
