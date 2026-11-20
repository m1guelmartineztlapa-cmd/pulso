/* Pulso · funciona como app instalada. Red primero; si no hay conexión, usa la copia guardada. */
var VERSION = "pulso-20261120o";
var BASE = ["./", "index.html", "css/estilos.css?v=20261120o", "js/config.js?v=20261120o", "js/db.js?v=20261120o", "js/ui.js?v=20261120o",
  "js/entrenador.js?v=20261120o", "js/cliente.js?v=20261120o", "js/alimentacion.js?v=20261120o", "js/app.js?v=20261120o", "js/pulido.js?v=20261120o", "datos/ejercicios.json", "datos/plantillas-alimentacion.json", "datos/recetario.json", "manifest.webmanifest", "iconos/icono-192.png"];

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
