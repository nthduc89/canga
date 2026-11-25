// Service worker: chạy offline. Đổi số phiên bản CACHE mỗi khi bạn cập nhật file trên GitHub.
const CACHE = 'canga-v8';
const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const PRECACHE = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', XLSX_URL];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && url.hostname !== 'cdn.jsdelivr.net') return;

  // Trả bản đã lưu ngay, đồng thời tải bản mới để lần mở sau dùng
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(cached => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || (req.mode === 'navigate'
        ? caches.match('index.html').then(r => r || caches.match(self.registration.scope))
        : undefined));
      return cached || net;
    })
  );
});
