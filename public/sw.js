const CACHE_NAME = 'suji-birthday-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/globals.css',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add key assets, failing gracefully if some aren't present
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip caching on localhost/127.0.0.1 to avoid caching conflicts and infinite reload loops during local development
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || self.location.hostname === '[::1]') {
    return;
  }
  
  const url = new URL(event.request.url);

  // Skip Next.js internal paths (HMR, static assets under development, etc.)
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/__next_') ||
    url.pathname.includes('webpack')
  ) {
    return;
  }

  // Skip cross-origin or external CDN URLs unless they are audio files/scripts
  if (url.origin !== self.location.origin && !url.pathname.endsWith('.mp3')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline fallback
      });
    })
  );
});
