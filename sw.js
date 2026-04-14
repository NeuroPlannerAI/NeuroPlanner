// Neuro — minimal service worker for offline + notifications
const CACHE = 'neuro-v3-flat';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './tokens.css',
  './base.css',
  './components.css',
  './screens.css',
  './mature.css',
  './storage.js',
  './ui.js',
  './taskbank.js',
  './neuro-char.js',
  './neuro-voice.js',
  './onboarding.js',
  './screens.js',
  './notify.js',
  './app.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try { c.put(req, copy); } catch(_){} });
      return res;
    }).catch(() => cached))
  );
});

// Trigger a notification when the main app posts one
self.addEventListener('message', (e) => {
  const data = e.data || {};
  if (data.type === 'notify') {
    self.registration.showNotification(data.title || 'Neuro', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'neuro',
      vibrate: [80, 40, 80],
      data: { url: './index.html' }
    });
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow('./index.html');
  }));
});
