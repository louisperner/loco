// Cache name
const CACHE_NAME = 'loco-cache-v2';

// Assets to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/loco-logo.png',
  '/favicon.svg',
  '/cover_loco2.png'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.error(`Failed to cache ${url}:`, error);
            })
          )
        );
      })
  );
});

// Listen for requests
self.addEventListener('fetch', (event) => {
  // Skip caching for Vite HMR requests
  if (event.request.url.includes('localhost:5173') && 
      (event.request.url.includes('?v=') || event.request.url.includes('&v='))) {
    return fetch(event.request);
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit - return the response
        if (response) {
          // Always try to update the cache in the background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          });
          return response;
        }
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, show a generic fallback
        return caches.match('/');
      }),
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
