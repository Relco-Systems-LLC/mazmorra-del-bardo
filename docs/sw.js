// Service worker network-first para el HTML del juego, cache-first para assets.
// Con internet siempre cargás la última versión; sin internet, andás offline igual.
// 20260610194226 lo reemplaza build.sh con el timestamp, para invalidar cache al republicar.
const CACHE = 'mazmorra-20260610194226';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

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

// ¿Es el documento del juego? (navegación o el index.html). Esos van network-first
// para que una versión nueva publicada se vea sin tener que "buscar actualización".
function esDocumento(req) {
  if (req.mode === 'navigate') return true;
  const u = new URL(req.url);
  return u.origin === location.origin && (u.pathname.endsWith('/') || u.pathname.endsWith('/index.html'));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (esDocumento(req)) {
    // network-first: lo último de la red; si no hay internet, lo cacheado
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => { c.put('./index.html', copy); c.put('./', copy.clone()); });
        }
        return res;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }).then(h => h || caches.match('./')))
    );
    return;
  }

  // resto (íconos, manifest): cache-first
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit =>
      hit || fetch(req).then(res => {
        if (res.ok && new URL(req.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
