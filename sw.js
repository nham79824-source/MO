// ======================================
// Moamalaty PWA Service Worker v2.0
// ======================================

const CACHE_NAME = 'moamalaty-v2';
const STATIC_ASSETS = [
  'index.html',
  'dashboard.html',
  'login.html',
  'register.html',
  'doctors.html',
  'wallet.html',
  'emergency.html',
  'map.html',
  'my-bookings.html',
  'notifications.html',
  'profile.html',
  'patient-record.html',
  'taxi.html',
  'pharmacies.html',
  'css/style.css',
  'css/notifications.css',
  'js/config.js',
  'js/security.js',
  'js/auth.js',
  'js/firebase-config.js',
  'js/email-auth.js',
  'js/notifications.js',
  'js/smart-notifications.js',
  'js/dashboard.js',
  'js/ui-manager.js',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Firebase requests
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  // For HTML pages: network-first strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // For other assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      });
    })
  );
});

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'لديك إشعار جديد من معاملاتي',
    icon: 'assets/logo.png',
    badge: 'assets/logo.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'index.html' },
    actions: [
      { action: 'open', title: 'فتح' },
      { action: 'close', title: 'إغلاق' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'معاملاتي 🔔', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(wcs => {
      const wc = wcs.find(w => w.url === url);
      if (wc) return wc.focus();
      return clients.openWindow(url);
    })
  );
});
