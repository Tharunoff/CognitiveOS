const SW_VERSION = '3.0.0'; // increment every time sw.js is updated
const CACHE_NAME = 'cognitiveos-v3';
const OFFLINE_URLS = ['/', '/dump', '/ideas', '/learn', '/schedule'];

console.log('[SW] Service worker version:', SW_VERSION);

// ── Install: cache offline pages & activate immediately ──────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Installing version:', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    }).then(() => self.skipWaiting()) // Force immediate activation
  );
});

// ── Activate: purge old caches & take control of all pages immediately ────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating version:', SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim()) // Take control of all open pages
  );
});

// ── Fetch: network-first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
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

// ── Push: show notification, then tell open clients to play alarm sound ───────
self.addEventListener('push', function(event) {
  console.log('[SW] Push received');
  // Android requires at least one prior user interaction with notifications
  // Log to confirm push event is actually reaching the SW
  console.log('[SW] Push event fired, attempting to show notification');
  console.log('[SW] Registration scope:', self.registration.scope);

  let payload = {
    title: '⏰ CognitiveOS Reminder',
    body: 'Your block is starting soon',
    blockId: null,
    sound: '/alarm.mp3'
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
      console.log('[SW] Push payload:', JSON.stringify(payload));
    } catch (e) {
      payload.body = event.data.text();
      console.log('[SW] Push text fallback:', payload.body);
    }
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    requireInteraction: true,
    silent: false,
    tag: 'cogos-alarm',
    renotify: true,
    data: {
      blockId: payload.blockId,
      dateOfArrival: Date.now(),
      url: '/schedule'
    },
    actions: [
      { action: 'start', title: '▶ Start Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
        // Tell all open app windows to play the alarm sound
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PLAY_ALARM_SOUND',
            sound: payload.sound || '/alarm.mp3'
          });
        });
      })
      .catch((err) => {
        console.error('[SW] Failed to show notification:', err);
      })
  );
});

// ── Notification click: focus app or open /schedule ───────────────────────────
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked, action:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.navigate('/schedule');
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/schedule');
        }
      })
  );
});
