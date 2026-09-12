// Durable storage: IndexedDB for anything big (photos, voice recordings) and the
// parent's vocabulary overlay. localStorage handles settings (see state.js).
//
// Every call degrades to a no-op rather than throwing, because a storage
// failure must never stop her from being able to talk.

const DB_NAME = 'serenity-aac';
const DB_VERSION = 1;
const STORES = ['overlay', 'photos', 'recordings', 'history'];

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const name of STORES) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    console.warn('Storage unavailable; changes will not be saved.', err);
    return null;
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.onerror = () => reject(t.error);
    if (req) req.onsuccess = () => resolve(req.result);
    else t.oncomplete = () => resolve(null);
  }).catch((err) => {
    console.warn(`Storage write failed (${store})`, err);
    return null;
  });
}

export const get = (store, key) => tx(store, 'readonly', (s) => s.get(key));
export const put = (store, key, value) => tx(store, 'readwrite', (s) => s.put(value, key));
export const del = (store, key) => tx(store, 'readwrite', (s) => s.delete(key));
export const keys = (store) => tx(store, 'readonly', (s) => s.getAllKeys());

/* ── The parent's vocabulary overlay ──────────────────────────────────── */

export async function loadOverlay() {
  return (await get('overlay', 'current')) || { buttons: {}, boards: {}, added: {} };
}

export async function saveOverlay(overlay) {
  await put('overlay', 'current', overlay);
}

/* ── Photos and voice recordings, keyed by button id ──────────────────── */

export const loadPhoto = (buttonId) => get('photos', buttonId);
export const savePhoto = (buttonId, blob) => put('photos', buttonId, blob);
export const deletePhoto = (buttonId) => del('photos', buttonId);

export const loadRecording = (buttonId) => get('recordings', buttonId);
export const saveRecording = (buttonId, blob) => put('recordings', buttonId, blob);
export const deleteRecording = (buttonId) => del('recordings', buttonId);

/** Which buttons have media, so the renderer can show it without a lookup each time. */
export async function mediaIndex() {
  const [photos, recordings] = await Promise.all([keys('photos'), keys('recordings')]);
  return { photos: new Set(photos || []), recordings: new Set(recordings || []) };
}

/* ── Utterance history ────────────────────────────────────────────────── */

const HISTORY_LIMIT = 30;

export async function loadHistory() {
  return (await get('history', 'recent')) || [];
}

export async function pushHistory(entry) {
  const list = await loadHistory();
  const deduped = list.filter((e) => e.speech !== entry.speech);
  const next = [{ ...entry, at: Date.now() }, ...deduped].slice(0, HISTORY_LIMIT);
  await put('history', 'recent', next);
  return next;
}

export async function clearHistory() {
  await put('history', 'recent', []);
  return [];
}

/* ── Backup and restore ───────────────────────────────────────────────── */

const blobToDataUrl = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.readAsDataURL(blob);
});

const dataUrlToBlob = (url) => fetch(url).then((r) => r.blob());

/** Everything the family has customised, as one portable JSON file. */
export async function exportAll(settings) {
  const bundle = { format: 'serenity-aac-backup', version: 1, at: Date.now(), settings };
  bundle.overlay = await loadOverlay();
  bundle.history = await loadHistory();
  bundle.photos = {};
  bundle.recordings = {};
  for (const key of (await keys('photos')) || []) {
    const blob = await get('photos', key);
    if (blob) bundle.photos[key] = await blobToDataUrl(blob);
  }
  for (const key of (await keys('recordings')) || []) {
    const blob = await get('recordings', key);
    if (blob) bundle.recordings[key] = await blobToDataUrl(blob);
  }
  return bundle;
}

export async function importAll(bundle) {
  if (!bundle || bundle.format !== 'serenity-aac-backup') {
    throw new Error('That file is not a Serenity AAC backup.');
  }
  if (bundle.overlay) await saveOverlay(bundle.overlay);
  if (bundle.history) await put('history', 'recent', bundle.history);
  for (const [key, url] of Object.entries(bundle.photos || {})) {
    await savePhoto(key, await dataUrlToBlob(url));
  }
  for (const [key, url] of Object.entries(bundle.recordings || {})) {
    await saveRecording(key, await dataUrlToBlob(url));
  }
  return bundle.settings || null;
}

export async function resetEverything() {
  for (const store of STORES) await tx(store, 'readwrite', (s) => s.clear());
}
