// Word morphology. Pure functions, no DOM — this module ports to Godot as-is.
//
// Irregular forms live in the vocabulary data (a button's `grammar` block), so
// these rules only need to handle the regular cases and a small safety net of
// very common irregulars that may appear in typed text.

const IRREGULAR_PLURALS = {
  child: 'children', person: 'people', foot: 'feet', tooth: 'teeth',
  mouse: 'mice', man: 'men', woman: 'women', goose: 'geese', fish: 'fish',
  sheep: 'sheep', deer: 'deer', knife: 'knives', leaf: 'leaves', life: 'lives',
};

const IRREGULAR_PAST = {
  go: 'went', eat: 'ate', drink: 'drank', see: 'saw', get: 'got', give: 'gave',
  take: 'took', make: 'made', do: 'did', have: 'had', say: 'said', run: 'ran',
  come: 'came', sit: 'sat', stand: 'stood', sleep: 'slept', find: 'found',
  hold: 'held', feel: 'felt', think: 'thought', hear: 'heard', win: 'won',
  lose: 'lost', read: 'read', put: 'put', cut: 'cut', hurt: 'hurt',
  leave: 'left', swing: 'swung', hide: 'hid', catch: 'caught', throw: 'threw',
  build: 'built', draw: 'drew', sing: 'sang', break: 'broke', fall: 'fell',
};

const VOWELS = 'aeiou';
const isVowel = (ch) => VOWELS.includes(ch);

/** Regular English plural, with the usual spelling exceptions. */
export function pluralize(word) {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (IRREGULAR_PLURALS[lower]) return matchCase(word, IRREGULAR_PLURALS[lower]);
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  if (/[^f]fe$/i.test(word)) return word.slice(0, -2) + 'ves';
  return word + 's';
}

/** Present participle: play -> playing, make -> making, sit -> sitting. */
export function toIng(word) {
  if (!word) return word;
  if (/e$/i.test(word) && !/ee$/i.test(word)) return word.slice(0, -1) + 'ing';
  if (needsDoubling(word)) return word + word.slice(-1) + 'ing';
  return word + 'ing';
}

/** Simple past: play -> played, go -> went, stop -> stopped. */
export function toPast(word) {
  if (!word) return word;
  const lower = word.toLowerCase();
  if (IRREGULAR_PAST[lower]) return matchCase(word, IRREGULAR_PAST[lower]);
  if (/e$/i.test(word)) return word + 'd';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ied';
  if (needsDoubling(word)) return word + word.slice(-1) + 'ed';
  return word + 'ed';
}

/** Possessive: Mom -> Mom's, dogs -> dogs'. */
export function toPossessive(word) {
  if (!word) return word;
  return /s$/i.test(word) ? word + "'" : word + "'s";
}

/** Choose "a" or "an" for a following word. */
export function article(word) {
  if (!word) return 'a';
  return isVowel(word[0].toLowerCase()) ? 'an' : 'a';
}

/** Short single-syllable consonant-vowel-consonant words double their last letter. */
function needsDoubling(word) {
  if (word.length < 3) return false;
  const [a, b, c] = word.slice(-3).toLowerCase();
  return !isVowel(a) && isVowel(b) && !isVowel(c) && !'wxy'.includes(c);
}

/** Keep the original word's capitalisation when substituting an irregular form. */
function matchCase(original, replacement) {
  if (original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Apply a grammar-bar operation to a token.
 *
 * Every operation is computed from the token's ORIGINAL word, not from
 * whatever ending was applied last. Endings therefore replace each other
 * instead of stacking: tapping "-ing" and then "don't" on `want` gives
 * "don't want", not "don't wanting", and tapping "-s" twice cannot produce
 * "applesses". A child exploring the bar should never be able to build
 * nonsense out of it.
 *
 * Returns a new token; never mutates the one passed in.
 */
export function applyGrammar(token, op) {
  if (!token) return token;
  const base = token.base || { label: token.label, speak: token.speak };
  const forms = token.grammar || {};
  const derive = (fromForms, rule) => ({
    ...token,
    base,
    speak: fromForms || rule(base.speak),
    label: fromForms || rule(base.label),
  });

  switch (op) {
    case 'plural':     return derive(forms.plural, pluralize);
    case 'ing':        return derive(forms.ing, toIng);
    case 'past':       return derive(forms.past, toPast);
    case 'possessive': return derive(null, toPossessive);
    case 'will':
      return { ...token, base, speak: `will ${base.speak}`, label: `will ${base.label}` };
    case 'negate':
      return { ...token, base, speak: `do not ${base.speak}`, label: `don't ${base.label}` };
    case 'article_a':
      return {
        ...token, base,
        speak: `${article(base.speak)} ${base.speak}`,
        label: `${article(base.label)} ${base.label}`,
      };
    case 'article_the':
      return { ...token, base, speak: `the ${base.speak}`, label: `the ${base.label}` };
    default:
      return token;
  }
}

/**
 * Put a token into a tense.
 *
 * This is the sticky-tense path: she chooses "before / now / happening /
 * later" once, and every doing-word she taps arrives already conjugated,
 * instead of her having to remember an ending after each verb. Only words
 * marked `pos: 'verb'` are touched — a tense must never mangle a noun.
 *
 * Irregular forms in the vocabulary data win over the regular rules, so
 * "go" in the past tense is "went", not "goed".
 */
export function conjugate(token, tense) {
  if (!token || tense === 'present') return token;
  if ((token.grammar?.pos ?? null) !== 'verb') return token;
  switch (tense) {
    case 'past':       return applyGrammar(token, 'past');
    case 'continuous': return applyGrammar(token, 'ing');
    case 'future':     return applyGrammar(token, 'will');
    default:           return token;
  }
}

/**
 * The helper verb a tense wants in front of it, for the sentence starter
 * shown alongside the tense strip. `I` + continuous needs "am playing", not
 * "playing"; "he" needs "is".
 */
export function helperFor(tense, subject = 'I') {
  const s = String(subject).toLowerCase();
  if (tense === 'continuous') {
    if (s === 'i') return 'am';
    if (['you', 'we', 'they'].includes(s)) return 'are';
    return 'is';
  }
  if (tense === 'past') return ['i', 'he', 'she', 'it'].includes(s) ? 'was' : 'were';
  if (tense === 'future') return 'will';
  return null;
}
