// KRC Gem Tracker service worker (v6.3)
// What it does: keeps a copy of the app files (including the big opencv.js) on the tablet so the
// app opens and counts gems with NO internet. Google Sheet requests are never cached (always live).
// When you upload new files, change CACHE_NAME (e.g. v6.3-2) so tablets pick up the new version.
const CACHE_NAME = 'krc-gem-v6.3-1';
const FILES = ['./', './index.html', './manifest.json', './opencv.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png'];

// Install: download and save every app file
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
// Activate: delete old versions' copies
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Fetch: app files come from the saved copy first (fast + offline); the page itself tries the
// network first so updates show up, and falls back to the saved copy when offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // Google Sheet calls go straight to the internet
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
