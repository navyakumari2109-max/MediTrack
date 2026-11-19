/**
 * MediTrack - Progressive Web App Service Worker
 * Single User Medicine Reminder System
 * Offline Caching & App Installation Engine
 */

const CACHE_NAME = 'meditrack-cache-v1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './add-medicine.html',
    './medicines.html',
    './reminders.html',
    './history.html',
    './settings.html',
    './manifest.json',
    './css/style.css',
    './js/storage.js',
    './js/app.js',
    './js/dashboard.js',
    './js/medicines.js',
    './js/reminders.js',
    './js/history.js',
    './js/settings.js',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/pill-icon.png',
    './assets/icons/pill-icon.svg'
];

// Install Event: Pre-cache local static application shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Clear outdated caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache-First with Network Fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Handle chrome-extension or other non-http schemas
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version, and update in background if online
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                        });
                    }
                }).catch(() => {
                    // Ignore background network fetch failure when offline
                });
                return cachedResponse;
            }

            // Not in cache: fetch from network and cache
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Cache a clone of the response
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // If offline and requesting an HTML page, fallback to index.html
                if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
