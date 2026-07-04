// ANE Suite — Service Worker v1.1
// Estrategia: Cache-first para assets estáticos, Network-first para HTML
const CACHE_NAME = 'ane-suite-v2';
const CACHE_STATIC = 'ane-static-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './app-ats-ane.html',
  './app-simulador-entrevistas-ane.html',
  './app-4-laboratorio-ia-ane.html',
  './app-demo-brete-empresas-ane.html',
  './manual-ats-ane.html',
  './manual-simulador-entrevistas-ane.html',
  './manual-laboratorio-ia-ane.html',
  './manual-centro-ayuda-ane.html',
  './vendor/xlsx.min.js',
  './vendor/chart.min.js',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/mammoth.min.js',
  './vendor/fonts/fonts.css',
];

// Install: pre-cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(CORE_ASSETS).catch(err => {
        // Log but don't fail install if some assets are missing
        console.warn('[ANE SW] Some assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for navigation
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin, chrome-extension
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // No solo 'navigate': algunos motores no marcan así la carga de un
  // documento dentro de un <iframe> (así se cargan los módulos desde
  // index.html) — tratamos cualquier .html igual, para no depender de eso.
  const isNavigation = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isVendor = url.pathname.includes('/vendor/');
  const isFont = url.pathname.includes('/fonts/');

  if (isVendor || isFont) {
    // Cache-first: vendor libs never change
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Recurso no disponible offline', { status: 503 }));
      })
    );
  } else if (isNavigation) {
    // Network-first for HTML pages: fresh if online, fallback if offline.
    // cache:'no-store' es clave — sin esto, este fetch() hecho DENTRO del
    // Service Worker puede seguir sirviéndose desde la caché HTTP normal
    // del navegador (la que pone GitHub Pages), incluso cuando el usuario
    // hizo un hard-refresh: ese hard-refresh solo fuerza la petición
    // principal del documento, no las peticiones internas que hace el SW.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('./index.html')
        )
      )
    );
  } else {
    // Stale-while-revalidate for everything else
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => null);
        return cached || fetchPromise;
      })
    );
  }
});

// Message: force cache refresh
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_STATIC).then(cache => cache.addAll(urls));
  }
});
