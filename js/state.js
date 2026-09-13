// A very small observable store. No dependencies, no framework.

export function createStore(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    get: () => value,
    set(patch) {
      value = typeof patch === 'function' ? patch(value) : { ...value, ...patch };
      for (const fn of listeners) fn(value);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const DEFAULT_SETTINGS = {
  theme: 'crayon',
  font: 'comic-neue',   // 'system' | 'comic-neue' | 'fredoka' | 'patrick-hand' | 'opendyslexic'
  // Independent scale multipliers, replacing the old single 's'/'m'/'l'/'xl'
  // "button size" preset — a parent can make the main board huge without
  // also blowing up the hotbar or the category strip.
  boardScale: 1,
  hotbarScale: 1,
  navScale: 1,
  labels: 'on',
  voiceURI: null,
  rate: 0.9,
  pitch: 1.25,
  volume: 1,
  speakOnTap: true,
  speakOnSentence: true,
  autoHome: true,       // jump back to Home after a fringe word, keeping core in view
  collapseHidden: false,
  showGrammar: true,    // she is working on past/present/future, so this is on
  tenseMode: 'present', // sticky: every verb she taps arrives in this tense
  dwellMs: 0,           // hold-to-activate; 0 = ordinary tap
  debounceMs: 250,      // ignore an accidental second tap on the same key
  keepAwake: true,
  sparkles: true,
};

const KEY = 'serenity.settings.v1';

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* Private browsing or a full disk. The app still works this session. */
  }
}
