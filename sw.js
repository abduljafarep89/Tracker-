const C = 'fintrak-v21',
  F = [
    './',
    'index.html',
    'manifest.webmanifest',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'favicon.png'
  ];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C)
      .then(c => c.addAll(F))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => (k.startsWith('fintrak-') || k.startsWith('finplan-')) && k !== C)
          .map(k => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const c = r.clone();
        caches.open(C).then(x => x.put(e.request, c));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
