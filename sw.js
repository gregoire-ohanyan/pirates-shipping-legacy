/* Service worker : permet de jouer hors ligne une fois le jeu ouvert une première fois.
   Changez VERSION à chaque mise en ligne pour forcer la mise à jour chez les joueurs. */
const VERSION = "psl-0.5.0";
const FICHIERS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./js/config.js", "./js/game.js",
  "./icones/icone-192.png", "./icones/icone-512.png", "./icones/icone-masquable-512.png",
  "./icones/apple-touch-icon.png", "./icones/favicon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Fichiers du jeu : réseau d'abord (pour avoir la dernière version), cache si hors ligne
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copie)); return r; })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  // Polices Google : cache d'abord
  if (url.host.includes("fonts.googleapis.com") || url.host.includes("fonts.gstatic.com")) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((rep) => { const copie = rep.clone(); caches.open(VERSION).then((c) => c.put(e.request, copie)); return rep; })));
  }
});
