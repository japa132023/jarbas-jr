const CACHE = 'minha-vida-v2';
const BASE = '/jarbas-jr';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json'
];

// Só faz cache de requisições HTTP/HTTPS GET — ignora chrome-extension://, etc.
function isCacheable(request) {
  const url = request.url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (request.method !== 'GET') return false;
  return true;
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Se não é cacheável, não intercepta — deixa o browser resolver normalmente
  if (!isCacheable(e.request)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => {
          try { c.put(e.request, clone); } catch (err) {}
        });
        return res;
      }).catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
