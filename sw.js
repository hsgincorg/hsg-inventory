/* HSG Inventory — keeps a copy of the app on the phone so it opens with no signal.
   Network first: when online you always get the latest version from GitHub;
   the saved copy is only used when the network can't be reached. */
const CACHE = 'hsg-inventory-app';
const SCANNER = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';
const LIBS = [SCANNER,
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(['./'].concat(LIBS).map((u) => new Request(u, { cache: 'reload' }))))
    .catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // monday.com calls go straight through
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !LIBS.includes(req.url)) return;
  if (url.pathname.endsWith('/photo')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then((hit) => hit || caches.match('./')))
  );
});