/* ==========================================================
   Service Worker : Pétanque 13
   - Précharge le jeu à la première visite → fonctionne sans connexion.
   - Lance le jeu instantanément depuis le cache, puis se met à jour en arrière-plan.
   - Ne touche jamais aux publicités (AdSense / AdMob) : elles passent par le réseau.

   POUR PUBLIER UNE NOUVELLE VERSION : changez CACHE_VERSION ci-dessous.
   ========================================================== */
const CACHE_VERSION = 'v1';
const CORE_CACHE  = 'petanque13-core-' + CACHE_VERSION;
const FONTS_CACHE = 'petanque13-fonts-' + CACHE_VERSION;

// Chemins relatifs : fonctionne à la racine d'un domaine comme dans un sous-dossier GitHub Pages.
const CORE_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];

// Domaines publicitaires : on ne les intercepte pas.
const AD_HOSTS = [
  'pagead2.googlesyndication.com', 'googleads.g.doubleclick.net', 'tpc.googlesyndication.com',
  'adservice.google.com', 'www.googletagservices.com', 'ep1.adtrafficquality.google'
];
const isAdRequest = (url) =>
  AD_HOSTS.includes(url.hostname) ||
  url.hostname.endsWith('.doubleclick.net') ||
  (url.hostname === 'pagead2.googleapis.com');

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/* ---------- Installation : on précharge le cœur du jeu ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ---------- Activation : on supprime les anciens caches ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('petanque13-') && k !== CORE_CACHE && k !== FONTS_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- Stratégie « stale-while-revalidate » ----------
   Répond tout de suite avec le cache, et rafraîchit le cache en arrière-plan. */
async function staleWhileRevalidate(request, cacheName, matchOptions) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, matchOptions);
  const network = fetch(request)
    .then((response) => {
      // 200 = OK ; type "opaque" (status 0) = ressource externe comme les polices Google.
      if (response && (response.status === 200 || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

/* ---------- Interception des requêtes ---------- */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isAdRequest(url)) return;                       // pubs : réseau uniquement

  // 1) Ouverture de la page (lancement de l'appli) : cache d'abord, jamais d'écran blanc hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CORE_CACHE);
        const cached = await cache.match('index.html');
        const refresh = fetch('index.html', { cache: 'no-cache' })
          .then((r) => { if (r && r.ok) cache.put('index.html', r.clone()); return r; })
          .catch(() => null);
        if (cached) { event.waitUntil(refresh); return cached; }
        return (await refresh) || Response.error();
      })()
    );
    return;
  }

  // 2) Polices Google : mises en cache après la première visite.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    return;
  }

  // 3) Fichiers du jeu (même domaine) : cache d'abord, mise à jour en arrière-plan.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, CORE_CACHE, { ignoreSearch: true }));
  }
  // 4) Tout le reste (images de panneaux publicitaires externes, etc.) : réseau normal.
});

/* ---------- Message optionnel : forcer la mise à jour ---------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
