// Service worker: app shell cache-first, juegos.json network-first.
const CACHE = 'ludoteca-v1';
const SHELL = [
  '.', 'index.html', 'estilos.css', 'app.js', 'config.js',
  'manifest.webmanifest', 'icono.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // el json de datos: red primero (fresco), cache si estamos offline
  if (url.pathname.endsWith('juegos.json')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // el resto (shell, imagenes locales, thumbs de Drive): cache primero
  e.respondWith(
    caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
    )
  );
});
