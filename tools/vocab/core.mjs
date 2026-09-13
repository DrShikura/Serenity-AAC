import { board, w, p, f, a, gap } from '../dsl.mjs';

// The core rail. These twelve buttons appear on every single board, in exactly
// these positions, forever. High-frequency core words carry most of everyday
// communication, and never moving them is what lets motor memory develop.
export const core = board('core', 'Core', 'svg:core', 'core', 2, 6, [
  w('I', 'svg:person-me', { color: 'people', pos: 'pronoun' }),
  w('you', 'svg:person-you', { color: 'people', pos: 'pronoun' }),
  w('my', 'svg:mine', { color: 'people', pos: 'pronoun' }),
  w('it', 'svg:it', { color: 'people', pos: 'pronoun' }),
  w('want', 'svg:want', { color: 'verb', pos: 'verb', past: 'wanted', ing: 'wanting' }),
  w('need', 'svg:need', { color: 'verb', pos: 'verb', past: 'needed', ing: 'needing' }),
  w('like', 'svg:like', { color: 'verb', pos: 'verb', past: 'liked', ing: 'liking' }),
  w('have', 'svg:have', { color: 'verb', pos: 'verb', past: 'had', ing: 'having' }),
  w('go', 'svg:go', { color: 'verb', pos: 'verb', past: 'went', ing: 'going' }),
  w('stop', 'svg:stop', { color: 'verb', pos: 'verb', past: 'stopped', ing: 'stopping' }),
  w('more', 'svg:more', { color: 'describe' }),
  w("not", 'svg:not', { speak: "not", color: 'negation' }),
]);

// Home. Row 1 social, row 2 urgent needs, rows 3-4 category folders,
// row 5 comments and questions. Folders never move between releases.
export const home = board('home', 'Home', 'svg:home', 'noun', 8, 5, [
  w('yes', 'svg:yes', { color: 'social' }),
  w('no', 'svg:no', { color: 'negation' }),
  w('please', 'svg:please', { color: 'social' }),
  p('thank you', 'svg:thankyou', { color: 'social' }),
  w('hi', 'svg:hi', { color: 'social' }),
  w('bye', 'svg:bye', { color: 'social' }),
  p('all done', 'svg:alldone', { color: 'social' }),
  w('again', 'svg:again', { color: 'describe' }),

  p('bathroom', '🚽', { color: 'urgent' }),
  p('help me', 'svg:help', { color: 'urgent' }),
  p('it hurts', '🤕', { color: 'urgent' }),
  p('I need a break', 'svg:break', { color: 'urgent' }),
  w('hungry', '😋', { color: 'describe' }),
  w('thirsty', '🥤', { color: 'describe' }),
  w('tired', '😴', { color: 'describe' }),
  w('wait', 'svg:wait', { color: 'verb', past: 'waited', ing: 'waiting' }),

  f('Food', '🍎', 'food'),
  f('Play', '🧸', 'play'),
  f('Feelings', 'svg:feelings', 'feelings', { color: 'describe' }),
  f('Body', '🫀', 'body'),
  f('People', 'svg:people', 'people', { color: 'people' }),
  f('Places', '🏫', 'places'),
  f('Doing', 'svg:actions', 'actions', { color: 'verb' }),
  f('Describe', '🌈', 'describe', { color: 'describe' }),

  f('Things', '🛋️', 'household'),
  f('Clothes', '👕', 'clothes'),
  f('Animals', '🐶', 'animals'),
  f('School', '✏️', 'school'),
  f('Time', '⏰', 'time', { color: 'describe' }),
  f('Words', 'svg:questions', 'social', { color: 'social' }),
  f('Numbers', '🔢', 'numbers', { color: 'describe' }),
  // The "spell" key in the top corner already opens the keyboard from every
  // page, so a dedicated Letters folder here was the one clearly-redundant
  // shortcut — this is its slot now.
  f('My Buttons', '⭐', 'custom', { color: 'social' }),

  w('this', 'svg:this', { color: 'describe' }),
  w('that', 'svg:that', { color: 'describe' }),
  p("what's that?", 'svg:what', { color: 'question' }),
  p('where is it?', 'svg:where', { color: 'question' }),
  p("I don't know", 'svg:dontknow', { color: 'social' }),
  p('look at this', 'svg:look', { color: 'verb' }),
  p('my turn', 'svg:myturn', { color: 'social' }),
  p('I love you', '❤️', { color: 'social' }),
]);

// A permanent home for every button a parent creates from scratch — wherever
// it actually gets placed (via Edit mode), a copy of it always lands here
// too, so there's one obvious page to find every custom button again later.
// Ships empty; js/main.js appends a reference here each time a new button is
// saved anywhere.
export const custom = board('custom', 'My Buttons', '⭐', 'social', 8, 4, [
  gap, gap, gap, gap, gap, gap, gap, gap,
  gap, gap, gap, gap, gap, gap, gap, gap,
  gap, gap, gap, gap, gap, gap, gap, gap,
  gap, gap, gap, gap, gap, gap, gap, gap,
]);
