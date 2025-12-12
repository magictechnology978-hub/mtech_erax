const CACHE_NAME = 'mtech-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'logo-192x192.png',
    'logo-512x512.png',
    'apple-touch-icon.png' 
];

self.addEventListener('install', event => {
    // هذا السطر الجديد يسرع عملية التفعيل
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});