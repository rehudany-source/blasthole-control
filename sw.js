/* BlastHole Control · iPhone: guarda la app y sus librerías para abrir sin señal en mina. */
const CACHE = 'bhc-ios-v1';
const BASE = ['./', 'index.html', 'app.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const LIBS = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'https://unpkg.com/@zxing/browser@0.2.1'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(BASE);
    for (const u of LIBS) { try { const r = await fetch(u, { mode: 'cors' }); if (r.ok) await c.put(u, r); } catch (_) {} }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Datos de Supabase: siempre a la red (la app maneja el modo sin señal).
  if (url.hostname.endsWith('supabase.co')) return;
  const propio = url.origin === self.location.origin;
  const lib = /cdn\.jsdelivr\.net|unpkg\.com/.test(url.hostname);
  if (!propio && !lib) return;
  if (lib) {
    // Librerías: primero lo guardado (no cambian), si no, la red.
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
    return;
  }
  // Archivos de la app: primero la red (para ver lo nuevo subido a GitHub), si no hay señal, lo guardado.
  e.respondWith(fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
