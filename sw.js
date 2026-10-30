const C = 'fintrak-v35';
const F = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
  'favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(cache => {
      return Promise.allSettled(
        F.map(url =>
          cache.add(url).catch(err => {
            console.warn('Fintrak SW: optional cache add skipped for', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
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

// Stale-While-Revalidate: instant offline load + background update
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // For navigation requests (opening the app)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(netRes => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(C).then(c => c.put(e.request, clone));
          }
          return netRes;
        }).catch(() => cached || caches.match('index.html'));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // For static assets: CSS, JS, Images, Icons
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(netRes => {
        if (netRes && netRes.status === 200) {
          const clone = netRes.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        return netRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
