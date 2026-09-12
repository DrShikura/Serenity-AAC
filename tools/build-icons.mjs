#!/usr/bin/env node
// Hand-drawn crayon symbol set for the abstract core words that emoji cannot
// express. Each drawing is authored below as SVG markup on a 100x100 canvas and
// written to assets/icons/<name>.svg. Godot imports these files directly.
//
// House style: thick round-capped strokes in crayon "ink", deliberately
// imperfect curves, bright flat fills, nothing photorealistic.
// Run: node tools/build-icons.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets', 'icons');

const INK = '#33251a';
const RED = '#ff4d3d';
const YEL = '#ffd23f';
const GRN = '#3fce6a';
const BLU = '#3fa9ff';
const PUR = '#a96cff';
const PNK = '#ff7ec4';
const ORA = '#ff9b3f';
const SKIN = '#ffc79b';

/** A child figure: round head, wobbly body, stick limbs. */
const kid = (cx, cy, body, arms) => `
  <circle cx="${cx}" cy="${cy - 22}" r="13" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
  <path d="M${cx - 3} ${cy - 9} q3 22 1 30" stroke="${INK}" stroke-width="7" fill="none"/>
  <path d="M${cx - 12} ${cy + 21} q5 12 2 20 M${cx + 6} ${cy + 21} q4 12 8 19"
        stroke="${INK}" stroke-width="7" fill="none"/>
  ${body || ''}${arms || ''}`;

const icons = {
  // ── Pronouns ───────────────────────────────────────────────────────────
  'person-me': `${kid(52, 44, '', `
    <path d="M40 38 q-14 5 -18 16" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M46 38 q14 8 4 14 q-8 5 -14 -2" stroke="${INK}" stroke-width="7" fill="none"/>
    <circle cx="34" cy="52" r="6" fill="${YEL}" stroke="${INK}" stroke-width="4"/>`)}`,

  'person-you': `${kid(38, 46, '', `
    <path d="M28 40 q-12 6 -14 15" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M44 40 q20 -2 30 -3" stroke="${INK}" stroke-width="7" fill="none"/>`)}
    <path d="M74 30 l14 7 -14 8 z" fill="${RED}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,

  mine: `<path d="M22 62 q-4 -20 10 -20 q10 0 12 12" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M78 62 q4 -20 -10 -20 q-10 0 -12 12" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M50 30 q-14 -14 -22 -2 q-7 11 22 32 q29 -21 22 -32 q-8 -12 -22 2 z"
          fill="${RED}" stroke="${INK}" stroke-width="5"/>
    <path d="M20 60 q6 22 30 22 q24 0 30 -22" fill="none" stroke="${INK}" stroke-width="7"/>`,

  it: `<rect x="26" y="34" width="48" height="42" rx="8" fill="${ORA}" stroke="${INK}" stroke-width="6"/>
    <path d="M26 48 h48" stroke="${INK}" stroke-width="5"/>
    <path d="M50 18 l0 12" stroke="${INK}" stroke-width="6"/>
    <circle cx="50" cy="14" r="6" fill="${YEL}" stroke="${INK}" stroke-width="4"/>`,

  // ── Core verbs ─────────────────────────────────────────────────────────
  want: `<path d="M50 22 l8 17 19 3 -14 13 4 19 -17 -9 -17 9 4 -19 -14 -13 19 -3 z"
          fill="${YEL}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18 84 q6 -18 20 -16" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M82 84 q-6 -18 -20 -16" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M30 70 q-8 -6 -2 -12 q6 -5 12 4" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M70 70 q8 -6 2 -12 q-6 -5 -12 4" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>`,

  need: `<path d="M34 30 q-12 26 2 40 q16 15 32 -2 q12 -14 -2 -38" fill="${PUR}"
          stroke="${INK}" stroke-width="6"/>
    <path d="M50 40 l0 22" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
    <circle cx="50" cy="72" r="5" fill="#fff"/>`,

  like: `<path d="M30 84 l0 -30 12 0 0 30 z" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M42 56 q2 -12 8 -20 q4 -10 12 -6 q6 4 1 18 l16 0 q9 0 6 10 l-6 22 q-2 6 -10 6 l-27 0 z"
          fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M24 30 q6 -8 12 0" stroke="${GRN}" stroke-width="6" fill="none"/>`,

  have: `<path d="M20 56 q-6 -16 8 -18 q12 -2 16 10" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M80 56 q6 -16 -8 -18 q-12 -2 -16 10" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <rect x="32" y="34" width="36" height="30" rx="5" fill="${BLU}" stroke="${INK}" stroke-width="6"/>
    <path d="M50 34 v30 M32 48 h36" stroke="${INK}" stroke-width="4"/>
    <path d="M18 56 q8 24 32 24 q24 0 32 -24" fill="none" stroke="${INK}" stroke-width="7"/>`,

  go: `<path d="M14 50 h50" stroke="${GRN}" stroke-width="12" fill="none"/>
    <path d="M58 30 l28 20 -28 20 z" fill="${GRN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M14 50 h50" stroke="${INK}" stroke-width="5" fill="none" opacity=".35"/>
    <path d="M20 28 h20 M20 72 h20" stroke="${INK}" stroke-width="6" opacity=".45"/>`,

  stop: `<path d="M36 18 h28 l18 18 v28 l-18 18 h-28 l-18 -18 v-28 z"
          fill="${RED}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M40 44 q-6 -12 2 -14 q6 -2 8 8 l0 -12 q1 -8 7 -7 q6 1 6 9 q3 -6 8 -3 q5 3 2 12
             q-3 14 -12 18 q-12 5 -21 -11 z" fill="${SKIN}" stroke="${INK}" stroke-width="4"/>`,

  more: `<path d="M50 20 v60 M20 50 h60" stroke="${GRN}" stroke-width="16" stroke-linecap="round"/>
    <path d="M50 20 v60 M20 50 h60" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".4"/>`,

  not: `<circle cx="50" cy="50" r="30" fill="none" stroke="${RED}" stroke-width="12"/>
    <path d="M29 29 l42 42" stroke="${RED}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="${INK}" stroke-width="4" opacity=".35"/>`,

  // ── Social ─────────────────────────────────────────────────────────────
  yes: `<path d="M22 52 q10 2 18 16 q12 -32 38 -46" fill="none" stroke="${GRN}"
          stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M22 52 q10 2 18 16 q12 -32 38 -46" fill="none" stroke="${INK}"
          stroke-width="4" stroke-linecap="round" opacity=".35"/>`,

  no: `<path d="M26 26 l48 48 M74 26 l-48 48" stroke="${RED}" stroke-width="15" stroke-linecap="round"/>
    <path d="M26 26 l48 48 M74 26 l-48 48" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".3"/>`,

  please: `<path d="M38 82 q-10 -30 -2 -48 q4 -9 9 -6 q4 3 2 14" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M62 82 q10 -30 2 -48 q-4 -9 -9 -6 q-4 3 -2 14" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M50 24 q-4 8 0 16 q4 -8 0 -16" fill="${PNK}" stroke="${INK}" stroke-width="4"/>
    <path d="M32 84 h36" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,

  thankyou: `<path d="M50 30 q-16 -16 -26 -2 q-9 13 26 40 q35 -27 26 -40 q-10 -14 -26 2 z"
          fill="${PNK}" stroke="${INK}" stroke-width="5"/>
    <path d="M24 78 q26 12 52 0" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M34 20 q4 -8 8 0 M58 20 q4 -8 8 0" stroke="${YEL}" stroke-width="5" fill="none"/>`,

  hi: `<path d="M34 84 q-8 -26 -4 -40 q2 -8 8 -6 q5 2 4 12 l2 -22 q1 -8 7 -7 q6 1 5 9 l1 -8
           q1 -8 7 -7 q5 1 5 9 l1 6 q2 -7 7 -5 q5 2 3 11 l-4 26 q-4 22 -22 22 q-14 0 -20 0 z"
          fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18 26 q6 6 4 14 M26 16 q8 6 8 14" stroke="${YEL}" stroke-width="6" fill="none" stroke-linecap="round"/>`,

  bye: `<path d="M34 84 q-8 -26 -4 -40 q2 -8 8 -6 q5 2 4 12 l2 -22 q1 -8 7 -7 q6 1 5 9 l1 -8
            q1 -8 7 -7 q5 1 5 9 l1 6 q2 -7 7 -5 q5 2 3 11 l-4 26 q-4 22 -22 22 q-14 0 -20 0 z"
          fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M20 30 q-6 6 -4 14 M14 20 q-6 8 -6 16" stroke="${BLU}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M82 28 q8 6 6 16" stroke="${BLU}" stroke-width="6" fill="none" stroke-linecap="round"/>`,

  alldone: `<rect x="20" y="24" width="60" height="56" rx="9" fill="#fff8e6" stroke="${INK}" stroke-width="6"/>
    <path d="M32 54 q8 3 14 14 q10 -28 28 -40" fill="none" stroke="${GRN}"
          stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M76 16 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 z" fill="${YEL}" stroke="${INK}" stroke-width="3"/>`,

  again: `<path d="M76 44 a28 28 0 1 0 -6 22" fill="none" stroke="${BLU}" stroke-width="13" stroke-linecap="round"/>
    <path d="M60 20 l20 6 -8 19 z" fill="${BLU}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,

  wait: `<path d="M32 84 q-8 -28 -4 -42 q2 -8 8 -6 q5 2 4 12 l2 -20 q1 -8 7 -7 q6 1 5 9 l1 -6
            q1 -8 7 -7 q5 1 5 9 l1 4 q2 -7 7 -5 q5 2 3 11 l-4 26 q-4 22 -22 22 z"
          fill="${SKIN}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="74" cy="26" r="15" fill="#fff8e6" stroke="${INK}" stroke-width="5"/>
    <path d="M74 18 v9 l7 4" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,

  myturn: `${kid(46, 50, '', `
    <path d="M34 44 q-12 6 -14 15" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M52 44 q14 8 4 14 q-8 5 -14 -2" stroke="${INK}" stroke-width="7" fill="none"/>`)}
    <path d="M72 22 a20 20 0 1 1 -6 34" fill="none" stroke="${YEL}" stroke-width="9" stroke-linecap="round"/>
    <path d="M66 16 l14 4 -6 13 z" fill="${YEL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,

  dontknow: `${kid(50, 52, '', `
    <path d="M38 46 q-14 -2 -16 -12" stroke="${INK}" stroke-width="7" fill="none"/>
    <path d="M54 46 q14 -2 16 -12" stroke="${INK}" stroke-width="7" fill="none"/>`)}
    <path d="M16 22 q0 -8 7 -8 q7 0 6 7 q-1 5 -6 7 v3" fill="none" stroke="${PUR}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="23" cy="38" r="2.5" fill="${PUR}"/>
    <path d="M78 20 q0 -8 7 -8 q7 0 6 7 q-1 5 -6 7 v3" fill="none" stroke="${PUR}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="85" cy="36" r="2.5" fill="${PUR}"/>`,

  // ── Questions and pointing ─────────────────────────────────────────────
  what: `<path d="M32 36 q0 -18 18 -18 q18 0 17 16 q-1 13 -15 18 v8"
          fill="none" stroke="${PUR}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="51" cy="78" r="8" fill="${PUR}"/>`,

  where: `<path d="M50 14 q22 0 22 22 q0 20 -22 46 q-22 -26 -22 -46 q0 -22 22 -22 z"
          fill="${PUR}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M43 32 q0 -9 8 -9 q9 0 8 8 q-1 6 -7 8 v3" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <circle cx="51" cy="56" r="3.5" fill="#fff"/>`,

  this: `<circle cx="50" cy="76" r="13" fill="${YEL}" stroke="${INK}" stroke-width="5"/>
    <path d="M50 14 v40" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M38 46 l12 16 12 -16 z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,

  that: `<circle cx="82" cy="34" r="11" fill="${ORA}" stroke="${INK}" stroke-width="5"/>
    <path d="M14 62 q28 -8 50 -20" stroke="${INK}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M52 30 l18 8 -12 14 z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,

  look: `<path d="M10 50 q40 -34 80 0 q-40 34 -80 0 z" fill="#fff8e6" stroke="${INK}" stroke-width="6"/>
    <circle cx="50" cy="50" r="15" fill="${BLU}" stroke="${INK}" stroke-width="5"/>
    <circle cx="50" cy="50" r="6" fill="${INK}"/>
    <path d="M50 16 v-8 M20 24 l-5 -7 M80 24 l5 -7" stroke="${YEL}" stroke-width="6" stroke-linecap="round"/>`,

  // ── Help and regulation ────────────────────────────────────────────────
  help: `<circle cx="50" cy="50" r="30" fill="${RED}" stroke="${INK}" stroke-width="6"/>
    <circle cx="50" cy="50" r="13" fill="#fff8e6" stroke="${INK}" stroke-width="5"/>
    <path d="M50 20 v13 M50 67 v13 M20 50 h13 M67 50 h13" stroke="#fff8e6" stroke-width="7" stroke-linecap="round"/>
    <path d="M50 20 v13 M50 67 v13 M20 50 h13 M67 50 h13" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".4"/>`,

  break: `<path d="M22 60 q-12 0 -10 -12 q2 -10 12 -9 q2 -16 18 -16 q13 0 17 11 q16 -4 20 10
            q12 2 9 13 q-3 9 -14 8 z" fill="#dff0ff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="38" y="30" width="8" height="22" rx="3" fill="${BLU}" stroke="${INK}" stroke-width="4"/>
    <rect x="54" y="30" width="8" height="22" rx="3" fill="${BLU}" stroke="${INK}" stroke-width="4"/>
    <path d="M30 74 q6 8 0 14 M50 76 q6 8 0 14 M70 74 q6 8 0 14" stroke="${BLU}" stroke-width="5" fill="none" stroke-linecap="round"/>`,

  feelings: `<circle cx="50" cy="50" r="34" fill="${YEL}" stroke="${INK}" stroke-width="6"/>
    <path d="M50 16 v68" stroke="${INK}" stroke-width="4" opacity=".45"/>
    <circle cx="34" cy="42" r="5" fill="${INK}"/><circle cx="66" cy="42" r="5" fill="${INK}"/>
    <path d="M26 60 q10 12 22 8" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M74 66 q-10 -12 -22 -6" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,

  // ── Navigation and category covers ─────────────────────────────────────
  home: `<path d="M50 14 l38 32 -10 0 0 38 -56 0 0 -38 -10 0 z"
          fill="${RED}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="42" y="56" width="18" height="28" rx="3" fill="#fff8e6" stroke="${INK}" stroke-width="5"/>
    <rect x="26" y="52" width="12" height="12" rx="2" fill="${BLU}" stroke="${INK}" stroke-width="4"/>`,

  people: `<circle cx="26" cy="38" r="11" fill="${YEL}" stroke="${INK}" stroke-width="5"/>
    <path d="M10 78 q0 -22 16 -22 q16 0 16 22 z" fill="${YEL}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="74" cy="38" r="11" fill="${BLU}" stroke="${INK}" stroke-width="5"/>
    <path d="M58 78 q0 -22 16 -22 q16 0 16 22 z" fill="${BLU}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="50" cy="32" r="13" fill="${PNK}" stroke="${INK}" stroke-width="5"/>
    <path d="M30 84 q0 -26 20 -26 q20 0 20 26 z" fill="${PNK}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`,

  actions: `<circle cx="60" cy="22" r="11" fill="${SKIN}" stroke="${INK}" stroke-width="5"/>
    <path d="M58 34 q-10 12 -16 16" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M58 34 q10 10 6 22" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M64 56 q-12 8 -18 22" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M64 56 q14 6 16 20" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M42 50 q-14 0 -22 -6" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M10 30 h16 M8 44 h14" stroke="${GRN}" stroke-width="6" stroke-linecap="round"/>`,

  questions: `<path d="M14 26 q0 -12 12 -12 h48 q12 0 12 12 v26 q0 12 -12 12 h-26 l-16 16 v-16 h-6 q-12 0 -12 -12 z"
          fill="${PUR}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M40 32 q0 -10 10 -10 q11 0 10 10 q-1 8 -9 10 v4" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <circle cx="51" cy="56" r="4" fill="#fff"/>`,

  keyboard: `<rect x="12" y="30" width="76" height="44" rx="8" fill="#fff8e6" stroke="${INK}" stroke-width="6"/>
    <rect x="20" y="38" width="14" height="12" rx="3" fill="${RED}" stroke="${INK}" stroke-width="3.5"/>
    <rect x="43" y="38" width="14" height="12" rx="3" fill="${GRN}" stroke="${INK}" stroke-width="3.5"/>
    <rect x="66" y="38" width="14" height="12" rx="3" fill="${BLU}" stroke="${INK}" stroke-width="3.5"/>
    <rect x="20" y="56" width="60" height="10" rx="4" fill="${YEL}" stroke="${INK}" stroke-width="3.5"/>
    <text x="27" y="48" font-size="10" font-family="sans-serif" font-weight="700" fill="${INK}">A</text>
    <text x="50" y="48" font-size="10" font-family="sans-serif" font-weight="700" fill="${INK}">B</text>
    <text x="73" y="48" font-size="10" font-family="sans-serif" font-weight="700" fill="${INK}">C</text>`,

  core: `<circle cx="50" cy="50" r="34" fill="none" stroke="${INK}" stroke-width="5" opacity=".3"/>
    <path d="M50 32 q-12 -13 -20 -2 q-7 10 20 30 q27 -20 20 -30 q-8 -11 -20 2 z"
          fill="${RED}" stroke="${INK}" stroke-width="5"/>
    <circle cx="20" cy="24" r="5" fill="${YEL}"/><circle cx="82" cy="28" r="5" fill="${GRN}"/>
    <circle cx="22" cy="78" r="5" fill="${BLU}"/><circle cx="80" cy="76" r="5" fill="${PUR}"/>`,
};

mkdirSync(out, { recursive: true });
for (const [name, body] of Object.entries(icons)) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img">\n` +
    `  <g stroke-linecap="round" stroke-linejoin="round">${body}\n  </g>\n</svg>\n`;
  writeFileSync(join(out, `${name}.svg`), svg);
}
console.log(`Wrote ${Object.keys(icons).length} icons to assets/icons/`);
