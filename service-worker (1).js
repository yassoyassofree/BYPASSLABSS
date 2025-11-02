// service-worker.js

const CACHE_NAME = 'school-invincible-cache-v1';

const urlsToCache = [
  '/',
  '/new-index.html', // Your start_url
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/styles.css',
  '/script.js',
  '/chat.html',
  '/chat.js',
  '/blooket.html',
  '/quizizz.html',
  '/unblockers.html',
  '/secrect.html',
  '/welcome.html',
  // Sound effects
  '/Bruh sound effect.mp3',
  '/IXL  Correct!.mp3',
  '/Yamete Kudasai ahh - Sound Effect (Anime).mp3',
  '/iPhone Notification Sound Effect.mp3',
  '/yeah boy sound effect.mp3'
];

// Install event: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name.startsWith('school-invincible-cache-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event: cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Cache only successful responses
        if (!networkResponse || !networkResponse.ok) {
          return networkResponse;
        }
        // Clone response before caching
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Optionally, return a fallback page or image here
      });
    })
  );
});

// Optional: handle skip waiting from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});