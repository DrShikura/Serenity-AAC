import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pluralize, toIng, toPast, toPossessive, article, applyGrammar,
} from '../js/grammar.js';

test('regular plurals', () => {
  assert.equal(pluralize('apple'), 'apples');
  assert.equal(pluralize('box'), 'boxes');
  assert.equal(pluralize('dish'), 'dishes');
  assert.equal(pluralize('berry'), 'berries');
  assert.equal(pluralize('day'), 'days');
  assert.equal(pluralize('knife'), 'knives');
});

test('irregular plurals, keeping capitalisation', () => {
  assert.equal(pluralize('foot'), 'feet');
  assert.equal(pluralize('child'), 'children');
  assert.equal(pluralize('sheep'), 'sheep');
  assert.equal(pluralize('Mouse'), 'Mice');
});

test('present participle', () => {
  assert.equal(toIng('play'), 'playing');
  assert.equal(toIng('make'), 'making');
  assert.equal(toIng('sit'), 'sitting');
  assert.equal(toIng('see'), 'seeing');
  assert.equal(toIng('fix'), 'fixing');   // x never doubles
});

test('simple past', () => {
  assert.equal(toPast('play'), 'played');
  assert.equal(toPast('like'), 'liked');
  assert.equal(toPast('try'), 'tried');
  assert.equal(toPast('stop'), 'stopped');
  assert.equal(toPast('go'), 'went');
  assert.equal(toPast('put'), 'put');
});

test('possessive and article', () => {
  assert.equal(toPossessive('Mom'), "Mom's");
  assert.equal(toPossessive('dogs'), "dogs'");
  assert.equal(article('apple'), 'an');
  assert.equal(article('dog'), 'a');
});

test('irregular forms in the data beat the rules', () => {
  const token = { label: 'foot', speak: 'foot', grammar: { plural: 'feet' } };
  assert.equal(applyGrammar(token, 'plural').speak, 'feet');

  const go = { label: 'go', speak: 'go', grammar: { past: 'went', ing: 'going' } };
  assert.equal(applyGrammar(go, 'past').speak, 'went');
  assert.equal(applyGrammar(go, 'ing').speak, 'going');
});

test('grammar ops never mutate the token passed in', () => {
  const token = { label: 'cat', speak: 'cat', grammar: null };
  const plural = applyGrammar(token, 'plural');
  assert.equal(token.speak, 'cat');
  assert.equal(plural.speak, 'cats');
});

test('negation and articles read naturally', () => {
  const want = { label: 'want', speak: 'want' };
  assert.equal(applyGrammar(want, 'negate').speak, 'do not want');
  assert.equal(applyGrammar(want, 'negate').label, "don't want");

  const apple = { label: 'apple', speak: 'apple' };
  assert.equal(applyGrammar(apple, 'article_a').speak, 'an apple');
});

test('endings replace each other instead of stacking', () => {
  const want = { label: 'want', speak: 'want', grammar: { ing: 'wanting' } };
  const ing = applyGrammar(want, 'ing');
  assert.equal(ing.speak, 'wanting');

  // The child taps "-ing" and then changes her mind and taps "don't".
  const negated = applyGrammar(ing, 'negate');
  assert.equal(negated.speak, 'do not want', 'rebuilds from the original word');
  assert.equal(negated.label, "don't want");
});

test('the same ending twice is idempotent', () => {
  const apple = { label: 'apple', speak: 'apple' };
  const once = applyGrammar(apple, 'plural');
  const twice = applyGrammar(once, 'plural');
  assert.equal(twice.speak, 'apples', 'not "applesses"');
});

test('switching between endings goes through the base word', () => {
  const play = { label: 'play', speak: 'play' };
  assert.equal(applyGrammar(applyGrammar(play, 'past'), 'ing').speak, 'playing');
  assert.equal(applyGrammar(applyGrammar(play, 'ing'), 'past').speak, 'played');
  assert.equal(applyGrammar(applyGrammar(play, 'will'), 'plural').speak, 'plays');
});

import { conjugate, helperFor } from '../js/grammar.js';

const verb = (label, forms = {}) =>
  ({ label, speak: label, grammar: { pos: 'verb', ...forms } });

test('sticky tense conjugates a verb as it is tapped', () => {
  const play = verb('play');
  assert.equal(conjugate(play, 'present').speak, 'play');
  assert.equal(conjugate(play, 'past').speak, 'played');
  assert.equal(conjugate(play, 'continuous').speak, 'playing');
  assert.equal(conjugate(play, 'future').speak, 'will play');
});

test('tense respects irregular forms from the vocabulary data', () => {
  const go = verb('go', { past: 'went', ing: 'going' });
  assert.equal(conjugate(go, 'past').speak, 'went');
  assert.equal(conjugate(go, 'continuous').speak, 'going');

  const eat = verb('eat', { past: 'ate', ing: 'eating' });
  assert.equal(conjugate(eat, 'past').speak, 'ate');
});

test('tense never touches a word that is not a verb', () => {
  const apple = { label: 'apple', speak: 'apple', grammar: { pos: 'noun' } };
  assert.equal(conjugate(apple, 'past').speak, 'apple');
  assert.equal(conjugate(apple, 'continuous').speak, 'apple');

  const bare = { label: 'apple', speak: 'apple' };   // no grammar block at all
  assert.equal(conjugate(bare, 'past').speak, 'apple');
});

test('tense is still undoable through the ordinary base mechanism', () => {
  const play = verb('play');
  const past = conjugate(play, 'past');
  assert.equal(applyGrammar(past, 'ing').speak, 'playing', 'rebuilds from "play"');
});

test('helper verbs agree with the subject', () => {
  assert.equal(helperFor('continuous', 'I'), 'am');
  assert.equal(helperFor('continuous', 'you'), 'are');
  assert.equal(helperFor('continuous', 'she'), 'is');
  assert.equal(helperFor('past', 'I'), 'was');
  assert.equal(helperFor('past', 'they'), 'were');
  assert.equal(helperFor('future', 'I'), 'will');
  assert.equal(helperFor('present', 'I'), null);
});
