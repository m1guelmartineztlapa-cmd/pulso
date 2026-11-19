/* Pulso · funciona como app instalada. Red primero; si no hay conexión, usa la copia guardada. */
var VERSION = "pulso-20261119d";
var BASE = ["./", "index.html", "css/estilos.css?v=20261119d", "js/config.js?v=20261119d", "js/db.js?v=20261119d", "js/ui.js?v=20261119d",
  "js/entrenador.js?v=20261119d", "js/cliente.js?v=20261119d", "js/app.js?v=20261119d", "datos/ejercicios.json", "manifest.webmanifest", "iconos/icono-192.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Supabase y CDNs van directo
  e.respondWith(fetch(e.request).then(function (r) {
    var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copia); }); return r;
  }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match("index.html"); }); }));
});
