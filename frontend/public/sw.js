const CACHE_NAME = 'cognitiveos-v1';
const OFFLINE_URLS = ['/', '/dump', '/ideas', '/learn', '/schedule'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OFFLINE_URLS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network first, fallback to cache
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch(e) {
    data = { title: '⏰ Reminder', body: event.data.text(), sound: '/alarm.mp3' };
  }

  // Play alarm sound
  const audioPromise = self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'PLAY_ALARM', sound: data.sound });
    });
  });

  const notificationPromise = self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    silent: false,
    tag: 'cognitive-alarm-' + (data.blockId || Date.now()),
    renotify: true,
    actions: [
      { action: 'open', title: '▶ Start Block' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ],
    data: {
      blockId: data.blockId,
      url: '/schedule'
    }
  });

  event.waitUntil(Promise.all([audioPromise, notificationPromise]));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes('/schedule') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/schedule');
    })
  );
});
