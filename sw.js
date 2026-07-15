const CACHE_NAME = 'transaksiku-cache-v70';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './css/style.css',
  './css/landing.css',
  './js/app.js',
  './manifest.json',
  './logo.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Tahap instalasi & penyimpanan
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Pembersihan sistem lama secara paksa
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

// Menggunakan strategi Stale-While-Revalidate agar pembaruan file langsung ter-fetch di background
self.addEventListener('fetch', (event) => {
  // Hanya jalankan caching untuk request GET dan dari HTTP/HTTPS schema
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika offline dan gagal fetch, tidak masalah
      });

      return cachedResponse || fetchPromise;
    })
  );
});