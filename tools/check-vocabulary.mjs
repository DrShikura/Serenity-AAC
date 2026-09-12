#!/usr/bin/env node
// Integrity check over the built vocabulary and the icon set.
// Run: node tools/check-vocabulary.mjs

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { indexVocabulary, validate } from '../js/vocabulary.js';

const vocab = indexVocabulary(JSON.parse(readFileSync('data/vocabulary.json', 'utf8')));
const problems = validate(vocab);

// Every hand-drawn symbol a button asks for must actually exist on disk,
// otherwise the child gets a blank button with no warning.
const wanted = new Set();
for (const board of vocab.boards) {
  if (typeof board.icon === 'string' && board.icon.startsWith('svg:')) wanted.add(board.icon.slice(4));
  for (const button of board.buttons) {
    if (button?.icon?.kind === 'svg') wanted.add(button.icon.value);
  }
}
for (const name of wanted) {
  if (!existsSync(join('assets', 'icons', `${name}.svg`))) {
    problems.push(`Missing icon file: assets/icons/${name}.svg`);
  }
}

// Every button must be able to say something or go somewhere.
for (const board of vocab.boards) {
  for (const button of board.buttons) {
    if (!button) continue;
    if (!button.icon) problems.push(`Button ${button.id} has no symbol`);
    if (button.type === 'word' || button.type === 'phrase') {
      if (!button.speak?.trim()) problems.push(`Button ${button.id} would say nothing`);
    }
    if (button.type === 'folder' && !button.target) problems.push(`Folder ${button.id} goes nowhere`);
    if (button.type === 'action' && !button.action) problems.push(`Action ${button.id} does nothing`);
  }
}

const counted = vocab.boards.reduce((n, b) => n + b.buttons.filter(Boolean).length, 0);
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ ${vocab.boards.length} boards, ${counted} buttons, ${wanted.size} hand-drawn symbols — all good.`);
