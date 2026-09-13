// Offline support. The whole app — shell, symbols and vocabulary — is cached on
// install, so it works in the car, at the store, and anywhere with no signal.
// Her ability to talk must never depend on a network.

const VERSION = 'serenity-v2';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/theme.css',
  'css/layout.css',
  'css/components.css',
  'js/main.js',
  'js/state.js',
  'js/vocabulary.js',
  'js/output.js',
  'js/grammar.js',
  'js/render.js',
  'js/speech.js',
  'js/storage.js',
  'js/settings.js',
  'js/editor.js',
  'js/recorder.js',
  'js/gatekeeper.js',
  'js/history.js',
  'js/keyboard.js',
  'data/vocabulary.json',
  'assets/fonts/comic-neue-400.woff2',
  'assets/fonts/comic-neue-700.woff2',
  'assets/fonts/fredoka-400.woff2',
  'assets/fonts/fredoka-600.woff2',
  'assets/fonts/patrick-hand-400.woff2',
  'assets/fonts/opendyslexic-400.woff2',
  'assets/fonts/opendyslexic-700.woff2',
  'assets/app-icon-192.png',
  'assets/app-icon-512.png',
];

const ICONS = [
  'actions', 'again', 'alldone', 'break', 'bye', 'core', 'dontknow', 'feelings',
  'go', 'have', 'help', 'hi', 'home', 'it', 'keyboard', 'like', 'look', 'mine',
  'more', 'myturn', 'need', 'no', 'not', 'people', 'person-me', 'person-you',
  'please', 'questions', 'stop', 'thankyou', 'that', 'this', 'wait', 'want',
  'what', 'where', 'yes',
].map((name) => `assets/icons/${name}.svg`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll is all-or-nothing; cache individually so one missing optional
      // file (an app icon, say) cannot leave her with no offline app at all.
      .then((cache) => Promise.all(
        [...SHELL, ...ICONS].map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  // Cache first: offline is the normal case, not the exception.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        // Refresh in the background so an update lands on the next launch.
        event.waitUntil(
          fetch(request)
            .then((res) => res.ok && caches.open(VERSION).then((c) => c.put(request, res.clone())))
            .catch(() => null)
        );
        return hit;
      }
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(VERSION).then((c) => c.put(request, copy)));
          }
          return res;
        })
        .catch(() => caches.match('index.html'));
    })
  );
});
