/* Service worker : rend l'application utilisable sans réseau (utile en magasin).
   À chaque mise à jour du site, incrémenter VERSION — sinon le navigateur
   continue de servir l'ancienne version depuis son cache. */
const VERSION = "courses-v2";
const SHELL = [
  "./",
  "./index.html",
  "./assets/styles.css",
  "./assets/app.js",
  "./data/recettes.json",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(noms.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord, cache en secours : on voit les mises à jour dès qu'il y a du réseau,
   et l'application continue de fonctionner quand il n'y en a pas. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copie = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copie)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
