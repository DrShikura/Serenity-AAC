// Voice output. Browser text-to-speech, with a parent's own recording taking
// precedence for any button that has one.
//
// The Web Speech API is quirky in ways that matter here: the voice list loads
// asynchronously (and is empty on first call in Chrome), long utterances get
// cut off in some engines, and a cancel() immediately followed by speak() can
// be swallowed. All of that is handled below so a tap always makes a sound.

import { loadRecording } from './storage.js';

let voices = [];
let ready = false;
const waiting = [];
const audioCache = new Map();

const synth = globalThis.speechSynthesis || null;

export function initSpeech() {
  if (!synth) {
    console.warn('This browser has no speech synthesis. Buttons will still work silently.');
    return;
  }
  const collect = () => {
    voices = synth.getVoices() || [];
    if (voices.length) {
      ready = true;
      while (waiting.length) waiting.shift()();
    }
  };
  collect();
  synth.addEventListener?.('voiceschanged', collect);
  // Safari sometimes never fires voiceschanged; poll briefly as a fallback.
  let tries = 0;
  const timer = setInterval(() => {
    collect();
    if (ready || ++tries > 20) clearInterval(timer);
  }, 150);
}

export function availableVoices() {
  return voices.filter((v) => /^en/i.test(v.lang));
}

export function allVoices() {
  return voices;
}

/**
 * Pick a starting voice. Prefer something that sounds like a child, then any
 * local English voice, then whatever exists. She can be changed in Settings.
 */
export function defaultVoice() {
  const en = availableVoices();
  const childish = en.find((v) => /child|kid|junior|karen|samantha|zira|tessa/i.test(v.name));
  return (childish || en.find((v) => v.localService) || en[0] || voices[0])?.voiceURI || null;
}

function voiceFor(uri) {
  return voices.find((v) => v.voiceURI === uri) || voices.find((v) => v.voiceURI === defaultVoice()) || null;
}

/** Stop anything currently being said. */
export function stopSpeaking() {
  try { synth?.cancel(); } catch { /* ignore */ }
  for (const audio of audioCache.values()) {
    audio.pause();
    audio.currentTime = 0;
  }
}

/**
 * Say some text. Resolves when the utterance finishes (or immediately if
 * speech is unavailable) — never rejects, because a failed voice must not
 * break the tap.
 */
export function speak(text, settings = {}) {
  if (!text || !synth) return Promise.resolve();
  return new Promise((resolve) => {
    const start = () => {
      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voiceFor(settings.voiceURI);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }
        utterance.rate = clamp(settings.rate ?? 0.9, 0.5, 2);
        utterance.pitch = clamp(settings.pitch ?? 1.25, 0, 2);
        utterance.volume = clamp(settings.volume ?? 1, 0, 1);
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        // A cancel() in the same tick can swallow the next speak() in Chrome.
        setTimeout(() => synth.speak(utterance), 0);
        // Belt and braces: never leave the promise hanging.
        setTimeout(resolve, Math.max(4000, text.length * 120));
      } catch (err) {
        console.warn('Speech failed', err);
        resolve();
      }
    };
    if (ready || !synth.getVoices) start();
    else waiting.push(start);
  });
}

/**
 * Say a button. A recording the family made in the child's own world beats
 * any synthetic voice, so it wins whenever one exists.
 */
export async function speakButton(button, settings = {}) {
  if (button?.id) {
    const played = await playRecording(button.id, settings);
    if (played) return;
  }
  await speak(button?.speak ?? '', settings);
}

/** Returns true if a recording existed and was played. */
export async function playRecording(buttonId, settings = {}) {
  try {
    let audio = audioCache.get(buttonId);
    if (!audio) {
      const blob = await loadRecording(buttonId);
      if (!blob) return false;
      audio = new Audio(URL.createObjectURL(blob));
      audioCache.set(buttonId, audio);
    }
    stopSpeaking();
    audio.volume = clamp(settings.volume ?? 1, 0, 1);
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/** Drop a cached recording after it is re-recorded or deleted. */
export function forgetRecording(buttonId) {
  const audio = audioCache.get(buttonId);
  if (audio) URL.revokeObjectURL(audio.src);
  audioCache.delete(buttonId);
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));
