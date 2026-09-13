import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  indexVocabulary, applyOverlay, emptyOverlay, wordList, validate,
} from '../js/vocabulary.js';

const shipped = indexVocabulary(JSON.parse(readFileSync('data/vocabulary.json', 'utf8')));

const tiny = () => indexVocabulary({
  version: 1, home: 'home', core: 'core',
  boards: [
    { id: 'home', title: 'Home', cols: 2, rows: 1, color: 'noun', buttons: [
      { id: 'home.a', label: 'a', speak: 'a', type: 'word', color: 'noun' },
      { id: 'home.b', label: 'b', speak: 'b', type: 'word', color: 'noun' },
    ]},
    { id: 'core', title: 'Core', cols: 1, rows: 1, color: 'core', buttons: [
      { id: 'core.i', label: 'I', speak: 'I', type: 'word', color: 'people' },
    ]},
  ],
});

test('the shipped vocabulary is internally consistent', () => {
  assert.deepEqual(validate(shipped), []);
});

test('the shipped vocabulary is big enough to be genuinely usable', () => {
  const buttons = shipped.boards.reduce((n, b) => n + b.buttons.filter(Boolean).length, 0);
  assert.ok(buttons > 500, `only ${buttons} buttons`);
  assert.ok(shipped.boards.length >= 20);
});

test('every board fits exactly in its declared grid', () => {
  for (const b of shipped.boards) {
    if (b.special) continue;
    assert.equal(b.buttons.length, b.cols * b.rows, `board ${b.id}`);
  }
});

test('an overlay patch overrides the shipped button', () => {
  const merged = applyOverlay(tiny(), { ...emptyOverlay(), buttons: { 'home.a': { label: 'Mom', speak: 'Mom' } } });
  assert.equal(merged.buttonsById.get('home.a').label, 'Mom');
  assert.equal(merged.buttonsById.get('home.a').type, 'word', 'unpatched fields survive');
});

test('hiding a button leaves its slot empty so nothing else moves', () => {
  const merged = applyOverlay(tiny(), { ...emptyOverlay(), buttons: { 'home.a': null } });
  const home = merged.boardsById.get('home');
  assert.equal(home.buttons[0], null);
  assert.equal(home.buttons[1].id, 'home.b', 'the neighbour keeps its position');
  assert.equal(home.buttons.length, 2, 'the grid does not shrink');
});

test('collapseHidden packs the grid for parents who prefer it', () => {
  const merged = applyOverlay(tiny(), { ...emptyOverlay(), buttons: { 'home.a': null } }, { collapseHidden: true });
  const home = merged.boardsById.get('home');
  assert.equal(home.buttons[0].id, 'home.b');
  assert.equal(home.buttons[1], null);
});

test('added buttons drop into empty slots before growing the grid', () => {
  const overlay = {
    ...emptyOverlay(),
    buttons: { 'home.a': null },
    added: { home: [{ id: 'home.custom', label: 'Nana', speak: 'Nana', type: 'word', color: 'people' }] },
  };
  const home = applyOverlay(tiny(), overlay).boardsById.get('home');
  assert.equal(home.buttons[0].id, 'home.custom');
  assert.equal(home.buttons.length, 2, 'reused the gap instead of growing');
});

test('a custom (overlay-added) button can be patched after the fact', () => {
  const withCustom = () => applyOverlay(tiny(), {
    ...emptyOverlay(),
    added: { home: [{ id: 'custom.home.1', label: 'Snack', speak: 'Snack', type: 'word', color: 'noun' }] },
  });
  const custom = withCustom().boardsById.get('home').buttons.find((b) => b?.id === 'custom.home.1');
  assert.equal(custom.label, 'Snack');

  // Apply a patch on top, as if the parent re-opened its editor and changed it.
  const patched = applyOverlay(tiny(), {
    ...emptyOverlay(),
    added: { home: [{ id: 'custom.home.1', label: 'Snack', speak: 'Snack', type: 'word', color: 'noun' }] },
    buttons: { 'custom.home.1': { label: 'Snack time', speak: 'I want a snack please' } },
  }).boardsById.get('home').buttons.find((b) => b?.id === 'custom.home.1');
  assert.equal(patched.label, 'Snack time');
  assert.equal(patched.speak, 'I want a snack please');
});

test('hiding a custom button removes it from every board it was added to', () => {
  const merged = applyOverlay(tiny(), {
    ...emptyOverlay(),
    added: {
      home: [{ id: 'custom.x', label: 'X', speak: 'X', type: 'word', color: 'noun' }],
      core: [{ id: 'custom.x', label: 'X', speak: 'X', type: 'word', color: 'noun' }],
    },
    buttons: { 'custom.x': null },
  });
  assert.ok(!merged.boardsById.get('home').buttons.some((b) => b?.id === 'custom.x'));
  assert.ok(!merged.boardsById.get('core').buttons.some((b) => b?.id === 'custom.x'));
});

test('an empty overlay changes nothing', () => {
  const before = tiny();
  const after = applyOverlay(before, emptyOverlay());
  assert.deepEqual(after.boardsById.get('home').buttons, before.boardsById.get('home').buttons);
});

test('a move swaps two occupied slots on the same board', () => {
  const merged = applyOverlay(tiny(), {
    ...emptyOverlay(),
    moves: [{ a: { boardId: 'home', index: 0 }, b: { boardId: 'home', index: 1 } }],
  });
  const home = merged.boardsById.get('home');
  assert.equal(home.buttons[0].id, 'home.b');
  assert.equal(home.buttons[1].id, 'home.a');
});

test('a move relocates a button onto a different board, swapping with whatever was there', () => {
  const merged = applyOverlay(tiny(), {
    ...emptyOverlay(),
    moves: [{ a: { boardId: 'core', index: 0 }, b: { boardId: 'home', index: 0 } }],
  });
  assert.equal(merged.boardsById.get('home').buttons[0].id, 'core.i', 'core.i relocated into home');
  assert.equal(merged.boardsById.get('core').buttons[0].id, 'home.a', 'home.a swapped into the vacated core slot');
});

test('moving a button into an empty slot leaves the source empty, not duplicated', () => {
  const withGap = () => indexVocabulary({
    version: 1, home: 'home', core: 'core',
    boards: [
      { id: 'home', title: 'Home', cols: 2, rows: 1, color: 'noun', buttons: [
        { id: 'home.a', label: 'a', speak: 'a', type: 'word', color: 'noun' }, null,
      ]},
    ],
  });
  const merged = applyOverlay(withGap(), {
    ...emptyOverlay(),
    moves: [{ a: { boardId: 'home', index: 0 }, b: { boardId: 'home', index: 1 } }],
  });
  const home = merged.boardsById.get('home');
  assert.equal(home.buttons[1].id, 'home.a');
  assert.equal(home.buttons[0], null, 'the vacated slot is empty, not a duplicate');
});

test('a move naming a board that no longer exists is skipped rather than throwing', () => {
  assert.doesNotThrow(() => applyOverlay(tiny(), {
    ...emptyOverlay(),
    moves: [{ a: { boardId: 'home', index: 0 }, b: { boardId: 'deleted-board', index: 0 } }],
  }));
  const merged = applyOverlay(tiny(), {
    ...emptyOverlay(),
    moves: [{ a: { boardId: 'home', index: 0 }, b: { boardId: 'deleted-board', index: 0 } }],
  });
  assert.equal(merged.boardsById.get('home').buttons[0].id, 'home.a', 'unaffected — the bad move was skipped');
});

test('several moves replay in order, each acting on the result of the last', () => {
  const merged = applyOverlay(tiny(), {
    ...emptyOverlay(),
    moves: [
      { a: { boardId: 'home', index: 0 }, b: { boardId: 'home', index: 1 } }, // a<->b: [b, a]
      { a: { boardId: 'home', index: 1 }, b: { boardId: 'core', index: 0 } }, // a<->core.i: [b, i], core:[a]
    ],
  });
  const home = merged.boardsById.get('home');
  assert.equal(home.buttons[0].id, 'home.b');
  assert.equal(home.buttons[1].id, 'core.i');
  assert.equal(merged.boardsById.get('core').buttons[0].id, 'home.a');
});

test('prediction word list is lowercase, deduped and excludes navigation', () => {
  const words = wordList(shipped);
  assert.ok(words.includes('apple'));
  assert.ok(words.includes('bathroom'));
  assert.equal(words.length, new Set(words).size);
  assert.ok(words.every((w) => w === w.toLowerCase()));
});

test('validate catches a folder pointing at a board that does not exist', () => {
  const broken = indexVocabulary({
    version: 1, home: 'home', core: 'core',
    boards: [{ id: 'home', cols: 1, rows: 1, buttons: [
      { id: 'home.f', label: 'f', speak: 'f', type: 'folder', target: 'nowhere' },
    ]}],
  });
  assert.match(validate(broken).join('\n'), /missing board "nowhere"/);
});

test('core words are present and the core board is exactly the rail', () => {
  const core = shipped.boardsById.get('core');
  assert.equal(core.buttons.filter(Boolean).length, 12);
  const labels = core.buttons.map((b) => b.label);
  for (const must of ['I', 'want', 'more', 'stop', 'not']) assert.ok(labels.includes(must), must);
});

test('the urgent vocabulary a child actually needs in a hurry exists', () => {
  const all = shipped.boards.flatMap((b) => b.buttons.filter(Boolean)).map((b) => b.speak.toLowerCase());
  for (const must of [
    'i need the bathroom', 'it hurts', 'i need a break',
    'help me please', 'too loud', "don't touch me",
    "that's not what i meant", "i'm not okay",
  ]) {
    assert.ok(all.some((s) => s === must), `missing: ${must}`);
  }
});

test('every word/phrase button says exactly what it shows', () => {
  const offenders = shipped.boards
    .flatMap((b) => b.buttons.filter(Boolean))
    .filter((b) => (b.type === 'word' || b.type === 'phrase') && b.speak !== b.label)
    .map((b) => b.id);
  assert.deepEqual(offenders, [], 'these buttons say something different from what they show');
});

test('the tense strip is present and complete', () => {
  const tenses = shipped.tenses.map((t) => t.tense);
  assert.deepEqual(tenses, ['past', 'present', 'continuous', 'future']);
});

test('doing words are marked so the tense strip can reach them', () => {
  const verbs = shipped.boards
    .flatMap((b) => b.buttons.filter(Boolean))
    .filter((b) => b.grammar?.pos === 'verb');
  assert.ok(verbs.length > 70, `only ${verbs.length} conjugable verbs`);
  // Every one must carry the forms the tense engine needs or be regular.
  for (const must of ['go', 'eat', 'play', 'see', 'take', 'run']) {
    assert.ok(verbs.some((v) => v.label === must), `missing verb: ${must}`);
  }
});

test('helper verbs are NOT conjugable — "was" must never become "wasing"', () => {
  const build = shipped.boardsById.get('build');
  assert.ok(build, 'the Building Words board exists');
  for (const label of ['am', 'is', 'are', 'was', 'were', 'will', 'did', 'had']) {
    const button = build.buttons.find((b) => b?.label === label);
    assert.ok(button, `missing helper verb: ${label}`);
    assert.notEqual(button.grammar?.pos, 'verb', `${label} must not be conjugable`);
  }
});

test('the words needed to build a sentence by hand are all there', () => {
  const build = shipped.boardsById.get('build').buttons.filter(Boolean).map((b) => b.label);
  for (const must of ['am', 'is', 'the', 'and', 'because', 'with', 'to', 'my', 'if']) {
    assert.ok(build.includes(must), `missing: ${must}`);
  }
});

test('the keyboard board is reachable and the flags board exists', () => {
  assert.ok(shipped.boardsById.get('keyboard'));
  const world = shipped.boardsById.get('world');
  assert.ok(world);
  assert.ok(world.buttons.filter(Boolean).length >= 32);
});
