const STATIC_CACHE_NAME = 'alquds-static-v1';
const IMAGE_CACHE_NAME = 'alquds-images-v1';
const DATA_CACHE_NAME = 'alquds-data-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/cart.html',
  '/catalog.html',
  '/checkout.html',
  '/contact.html',
  '/faq.html',
  '/shipping.html',
  '/product.html',
  '/order-confirmation.html',
  '/contact-success.html',
  '/css/style.css',
  '/js/app-v3.js',
  '/js/checkout.js',
  '/favicon.ico',
  '/assets/logo.png',
  '/assets/placeholder.png',
  '/assets/visa.png'
];

// Install Event - Precache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== IMAGE_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Routing and Caching Strategies
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass caching for third-party scripts/APIs (like PayPal, Netlify CMS)
  if (
    requestUrl.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    requestUrl.pathname.includes('/admin/') ||
    requestUrl.pathname.includes('/.netlify/')
  ) {
    return; // Fallback to network directly
  }

  // 1. Cache-First Strategy for Images
  if (
    event.request.destination === 'image' ||
    requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // Return cached image
          }
          // Fetch from network, cache a copy, and return
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback for images
            return caches.match('/assets/placeholder.png');
          });
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate for JSON data (Pricing and Product files)
  if (
    requestUrl.pathname.includes('/data/') ||
    requestUrl.pathname.endsWith('.json')
  ) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return cached response if network fails (offline)
            return cachedResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate Strategy for HTML, CSS, JS
  event.respondWith(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      }).catch(() => {
        // Fallback for HTML pages when offline and not cached
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
