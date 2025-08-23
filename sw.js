const CACHE_NAME = 'billiard-timer-v2'; // La version a été incrémentée
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'style.css',      // Important
  'script.js',      // Important
  'icon-192.png',
  'icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Poppins:wght@600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des ressources pour la v2');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
