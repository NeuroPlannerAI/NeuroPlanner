const CACHE_NAME = 'neuroplanner-v1';
const ASSETS = ['./index.html', './manifest.json'];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for offline support
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Listen for notification schedule messages from the app
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    const notifications = e.data.notifications || [];
    notifications.forEach(n => {
      const delay = n.time - Date.now();
      if (delay > 0 && delay < 86400000) {
        setTimeout(() => {
          self.registration.showNotification(n.title, {
            body: n.body,
            icon: './icon.svg',
            badge: './icon.svg',
            tag: n.tag || 'neuroplanner',
            renotify: true,
            vibrate: [100, 50, 100],
            data: { url: './', action: n.action || null }
          });
        }, delay);
      }
    });
  }

  if (e.data && e.data.type === 'SET_BADGE') {
    if (navigator.setAppBadge) {
      if (e.data.count > 0) navigator.setAppBadge(e.data.count);
      else navigator.clearAppBadge();
    }
  }
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.length > 0) {
        cs[0].focus();
        if (e.notification.data?.action) {
          cs[0].postMessage({ type: 'NOTIFICATION_ACTION', action: e.notification.data.action });
        }
        return;
      }
      return clients.openWindow(e.notification.data?.url || './');
    })
  );
});
