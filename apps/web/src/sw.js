/**
 * Service worker: sólo caché de la propia aplicación.
 *
 * No intercepta ni almacena datos del usuario —esos nunca salen de
 * `localStorage`— y no habla con ningún servidor. Su único trabajo es que la
 * app abra sin conexión, que es lo que se espera de una herramienta que se usa
 * para cerrar el mes desde cualquier parte.
 *
 * La versión del caché se reescribe en cada build (`scripts/build-web.mjs`),
 * de modo que publicar una versión nueva invalida la anterior en vez de dejar
 * a la gente con una app vieja pegada en el navegador.
 */
const CACHE = 'empresa-operativa-__BUILD_ID__';

const ASSETS = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Todo lo que no sea de este origen se deja pasar sin tocar: los enlaces a
  // portales oficiales no deben quedar cacheados ni mediados por la app.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) return hit;
      return fetch(request)
        .then(response => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
