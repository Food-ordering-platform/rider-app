 

// Cache name
const CACHE_NAME = "choweazy-rider-v1";

// Install event - no need to cache anything initially for dev
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      }),
  );
});


/* eslint-disable no-restricted-globals */

// This logic runs in the background
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New Notification',
      icon: '/icons/icon-192x192.png', // Ensure these paths exist in public/
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || '/' // URL to open on click
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Rider App', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  let clients
  // Open the app when clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});