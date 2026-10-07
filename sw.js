// 離線快取：更新 App 時把版本號 +1，手機就會抓新版
const CACHE = 'invest-app-v2.1.0';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './vendor/chart.umd.min.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

    // 頁面：先抓網路（拿到最新版），離線時用快取
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req)
                .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }
    // 其他檔案：先用快取
    e.respondWith(
        caches.match(req).then(hit => hit || fetch(req).then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
            return res;
        }))
    );
});
