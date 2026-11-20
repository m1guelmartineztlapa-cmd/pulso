/* Pulso · utilidades de interfaz */
(function () {
  "use strict";
  var UI = {};
  var IMG_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/";

  UI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  UI.$ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  UI.$$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  /* Iconos (trazo, estilo iOS) */
  var P = {
    inicio: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.1 4.3 1.8 5 4.4"/>',
    rutinas: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    biblio: '<path d="M4 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    grafica: '<path d="M6 20V11M12 20V5M18 20v-6"/>',
    compartir: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    editar: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    basura: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    der: '<path d="m9 5 7 7-7 7"/>',
    izq: '<path d="m15 5-7 7 7 7"/>',
    play: '<path d="M7 4.5v15l13-7.5z"/>',
    recargar: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20.5V16h-4.5"/>',
    plato: '<circle cx="13" cy="12" r="7"/><circle cx="13" cy="12" r="3.5"/><path d="M3 3.5v5.5a1.5 1.5 0 0 0 3 0V3.5M4.5 10.5V20.5"/>',
    reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    camara: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    estrella: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
    salir: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
    enlace: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    copiar: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    rayo: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/>',
    puntos: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor"/>',
    persona: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
    pesa: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    regla: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
    duplicar: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    arriba: '<path d="m6 15 6-6 6 6"/>',
    abajo: '<path d="m6 9 6 6 6-6"/>',
    liga: '<path d="M8 7h8M8 17h8M6 7v10M18 7v10"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3z"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8.6 19z"/><path d="M9 9.5c.3 2.3 2.2 4.2 4.5 4.5l1.2-1.2 1.8.8-.4 1.6c-3.5.4-7.3-3.4-6.9-6.9l1.6-.4.8 1.8z" fill="currentColor" stroke="none"/>',
    pulso: '<path d="M2.5 12.5h4l2.2-5 3.6 10 2.6-7 1.6 2h5"/>',
    chispa: '<path d="M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    fuego: '<path d="M12 21c4 0 7-2.7 7-6.6 0-3.8-2.9-5.8-4.2-9.4-.6 2.3-2 3.4-3.2 3.9.2-2-.5-4.4-2.6-5.9-.2 3.6-5 6.2-5 11.2C4 18.3 7.5 21 12 21z"/>'
  };
  UI.ico = function (n, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + '>' + (P[n] || "") + "</svg>";
  };

  /* Aviso flotante */
  var tAviso;
  UI.aviso = function (msg, error) {
    var a = UI.$("#aviso"); a.innerHTML = '<span class="aviso-ico">' + (error ? "!" : "✓") + "</span><span>" + UI.esc(String(msg).replace(/\s*✓\s*$/, "")) + "</span>"; a.className = "aviso ver" + (error ? " error" : "");
    clearTimeout(tAviso); tAviso = setTimeout(function () { a.className = "aviso" + (error ? " error" : ""); }, 2600);
  };
  UI.error = function (e) {
    console.error(e);
    var m = (e && e.message) || String(e);
    if (/Invalid login/i.test(m)) m = "Correo o contraseña incorrectos.";
    else if (/already registered/i.test(m)) m = "Ese correo ya tiene cuenta. Entra con él.";
    else if (/Password should be/i.test(m)) m = "La contraseña debe tener al menos 6 caracteres.";
    else if (/Failed to fetch|NetworkError/i.test(m)) m = "Sin conexión. Inténtalo de nuevo.";
    else if (/Email not confirmed/i.test(m)) m = "Confirma tu correo antes de entrar (revisa tu bandeja).";
    UI.aviso(m, true);
  };

  /* Hojas (modales desde abajo) */
  UI.hoja = function (titulo, html, alMontar) {
    var capa = UI.$("#capa");
    var f = document.createElement("div"); f.className = "fondo";
    f.innerHTML = '<div class="hoja" role="dialog" aria-modal="true"><div class="asa"></div><div class="cab"><h2>' + UI.esc(titulo) +
      '</h2><button class="cerrar" data-cerrar aria-label="Cerrar">' + UI.ico("x") + "</button></div>" + html + "</div>";
    capa.appendChild(f);
    var cerrar = function () { f.remove(); };
    f.addEventListener("click", function (e) { if (e.target === f || e.target.closest("[data-cerrar]")) cerrar(); });
    if (alMontar) alMontar(f.querySelector(".hoja"), cerrar);
    return cerrar;
  };
  UI.confirmar = function (titulo, texto, boton) {
    return new Promise(function (ok) {
      var hecho = false;
      UI.hoja(titulo, '<p style="color:var(--suave);margin:0 0 18px;line-height:1.4">' + UI.esc(texto) + '</p><div class="form"><button class="btn peligro" data-si>' +
        UI.esc(boton || "Eliminar") + '</button><button class="btn vidrio" data-cerrar>Cancelar</button></div>', function (h, cerrar) {
        h.querySelector("[data-si]").onclick = function () { hecho = true; cerrar(); ok(true); };
        var obs = new MutationObserver(function () { if (!document.body.contains(h)) { obs.disconnect(); if (!hecho) ok(false); } });
        obs.observe(UI.$("#capa"), { childList: true });
      });
    });
  };

  /* Formatos */
  var DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  var DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  UI.DIAS = DIAS; UI.DIAS_L = DIAS_L;
  UI.fecha = function (iso) {
    if (!iso) return "";
    var d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso);
    var hoy = new Date(); var ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return "Hoy";
    if (d.toDateString() === ayer.toDateString()) return "Ayer";
    return d.getDate() + " " + MESES[d.getMonth()] + (d.getFullYear() !== hoy.getFullYear() ? " " + d.getFullYear() : "");
  };
  UI.diasTxt = function (dias) {
    if (!dias || !dias.length) return "Sin días fijos";
    if (dias.length === 7) return "Todos los días";
    return dias.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (d) { return DIAS[d]; }).join(" · ");
  };
  UI.iniciales = function (n) {
    return String(n || "?").trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join("").toUpperCase();
  };
  /* Foto de perfil del alumno: el HTML lleva data-foto y luego UI.cargarFotos pone las imágenes */
  // Color propio para cada persona (sale de su nombre), como en las apps profesionales
  UI.tono = function (txt) { var h = 0, s = String(txt || "?"); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  UI.avatarCli = function (c, clase) {
    return '<span class="' + (clase || "ico") + ' av-color" style="--h:' + UI.tono(c && c.nombre) + '"' + (c && c.foto_path ? ' data-foto="' + UI.esc(c.foto_path) + '"' : "") + ">" + UI.esc(UI.iniciales(c && c.nombre)) + "</span>";
  };
  var cacheFotos = {};
  UI.cargarFotos = async function (raiz) {
    var els = UI.$$("[data-foto]", raiz || document), faltan = [];
    els.forEach(function (el) { var p = el.dataset.foto; if (!cacheFotos[p] && faltan.indexOf(p) < 0) faltan.push(p); });
    if (faltan.length) { try { Object.assign(cacheFotos, await window.DB.urlsFirmadas("fotos", faltan)); } catch (e) {} }
    els.forEach(function (el) { var u = cacheFotos[el.dataset.foto]; if (u) el.innerHTML = '<img src="' + UI.esc(u) + '" alt="">'; });
  };
  /* Optimiza un video en el propio celular: lo baja a 720p, ~1.2 Mbps y sin audio.
     Se reproduce una vez (tarda lo que dura el video) y se graba de nuevo, en MP4 si el navegador puede. */
  UI.comprimirVideo = function (archivo, alProgreso) {
    return new Promise(function (ok, mal) {
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return mal(new Error("Este navegador no puede optimizar videos"));
      var tipos = ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      var tipo = tipos.filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0];
      if (!tipo) return mal(new Error("Este navegador no puede optimizar videos"));
      var url = URL.createObjectURL(archivo), v = document.createElement("video"), terminado = false;
      v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto"; v.src = url;
      function limpiar() { terminado = true; try { v.pause(); } catch (e) {} URL.revokeObjectURL(url); }
      v.onerror = function () { limpiar(); mal(new Error("No se pudo leer el video")); };
      v.onloadedmetadata = function () {
        var dur = v.duration;
        if (isFinite(dur) && dur > 120) { limpiar(); return mal(new Error("El video dura más de 2 minutos. Recórtalo a menos de 2 minutos.")); }
        var e = Math.min(1, 720 / Math.max(v.videoWidth || 720, v.videoHeight || 720));
        var w = Math.max(2, Math.round((v.videoWidth || 720) * e / 2) * 2), h = Math.max(2, Math.round((v.videoHeight || 720) * e / 2) * 2);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        var ctx = c.getContext("2d"), trozos = [];
        var rec = new MediaRecorder(c.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 1200000 });
        rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) trozos.push(ev.data); };
        rec.onstop = function () { limpiar(); ok(new Blob(trozos, { type: tipo.split(";")[0] })); };
        rec.onerror = function () { limpiar(); mal(new Error("No se pudo optimizar el video")); };
        function dibujar() {
          if (terminado) return;
          ctx.drawImage(v, 0, 0, w, h);
          if (alProgreso && isFinite(dur) && dur > 0) alProgreso(Math.min(99, Math.round(v.currentTime / dur * 100)));
          if (!v.ended) { if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(dibujar); else requestAnimationFrame(dibujar); }
        }
        v.onended = function () { ctx.drawImage(v, 0, 0, w, h); setTimeout(function () { if (rec.state !== "inactive") rec.stop(); }, 150); };
        // si el usuario cambia de app y vuelve, el video sigue donde se quedó
        function alVolver() { if (!document.hidden && !terminado && v.paused && !v.ended) v.play().then(dibujar).catch(function () {}); }
        document.addEventListener("visibilitychange", alVolver);
        var limpiarBase = limpiar;
        limpiar = function () { document.removeEventListener("visibilitychange", alVolver); limpiarBase(); };
        rec.start(1000);
        v.play().then(dibujar).catch(function () { limpiar(); mal(new Error("No se pudo reproducir el video para optimizarlo")); });
      };
    });
  };
  UI.esVideoArchivo = function (url) { return !!url && !UI.youtube(url) && /^https?:|^blob:|^data:video/.test(url); };
  /* Selector de archivo claro: vista previa + botón "Elegir"/"Cambiar" + "Quitar" */
  UI.selector = function (id, o) {
    o = o || {};
    var esVideo = o.tipo === "video";
    var prev = o.actual ? (esVideo ? '<video src="' + UI.esc(o.actual) + '" muted playsinline preload="metadata"></video>' : '<img src="' + UI.esc(o.actual) + '" alt="">')
      : UI.ico(esVideo ? "video" : "camara");
    return '<div class="selector" id="' + id + '-caja"><div class="sel-prev">' + prev + '</div><div class="sel-txt"><div class="t1" id="' + id + '-nom">' +
      (o.actual ? (esVideo ? "Video actual" : "Foto actual") : (esVideo ? "Ningún video elegido" : "Ninguna foto elegida")) + '</div><div class="t2">' + UI.esc(o.ayuda || "") + "</div>" +
      '<div class="sel-btns"><label class="btn chico">' + UI.ico(esVideo ? "video" : "camara") + '<span id="' + id + '-et">' + (o.actual ? "Cambiar" : (esVideo ? "Elegir video" : "Elegir foto")) + "</span>" +
      '<input type="file" class="oculto-vista" id="' + id + '" accept="' + (esVideo ? "video/mp4,video/quicktime,video/webm,video/*" : "image/*") + '"></label>' +
      '<button type="button" class="btn chico vidrio" id="' + id + '-quitar"' + (o.actual ? "" : " hidden") + ">Quitar</button></div></div></div>";
  };
  UI.enlazarSelector = function (raiz, id) {
    var inp = raiz.querySelector("#" + id), quitado = false, url = null;
    var caja = raiz.querySelector("#" + id + "-caja"), prev = caja.querySelector(".sel-prev"), nom = raiz.querySelector("#" + id + "-nom");
    var et = raiz.querySelector("#" + id + "-et"), q = raiz.querySelector("#" + id + "-quitar");
    var esVideo = /video/.test(inp.accept);
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      quitado = false; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f);
      prev.innerHTML = esVideo ? '<video src="' + url + '" muted playsinline preload="metadata"></video>' : '<img src="' + url + '" alt="">';
      nom.textContent = f.name.length > 28 ? f.name.slice(0, 25) + "…" : f.name;
      nom.textContent += " · " + (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB");
      et.textContent = "Cambiar"; q.hidden = false; caja.classList.add("listo");
    };
    q.onclick = function () {
      inp.value = ""; quitado = true; if (url) URL.revokeObjectURL(url); url = null;
      prev.innerHTML = UI.ico(esVideo ? "video" : "camara"); nom.textContent = esVideo ? "Sin video" : "Sin foto";
      et.textContent = esVideo ? "Elegir video" : "Elegir foto"; q.hidden = true; caja.classList.remove("listo");
    };
    return { archivo: function () { return inp.files[0] || null; }, quitado: function () { return quitado; } };
  };
  /* ───────── Resumen de progreso del alumno (semana / mes / 3 meses / año) ─────────
     datos = { ses: sesiones terminadas, med: medidas, asig: asignaciones (con dias) } */
  var MES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DIA_L = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  function f0(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function lunes(d) { var x = f0(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function fechaDe(s) { return new Date(s.fecha + "T12:00:00"); }
  function volumen(s) { return (s.series || []).reduce(function (t, x) { return t + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0); }
  function kg(n) { n = Math.round(n); return n >= 10000 ? (n / 1000).toFixed(1).replace(".0", "") + " t" : n.toLocaleString("es-MX") + " kg"; }
  function delta(a, b) {
    if (!b) return a ? '<span class="res-delta sube">nuevo</span>' : "";
    var p = Math.round((a - b) / b * 100);
    if (!p) return '<span class="res-delta">= igual</span>';
    return '<span class="res-delta ' + (p > 0 ? "sube" : "baja") + '">' + (p > 0 ? "▲ " : "▼ ") + Math.abs(p) + "%</span>";
  }
  function ventana(periodo) {
    var hoy = f0(new Date()), ini, fin, cubetas = [];
    if (periodo === "semana") {
      ini = lunes(hoy); fin = new Date(ini); fin.setDate(ini.getDate() + 7);
      for (var i = 0; i < 7; i++) { var d = new Date(ini); d.setDate(ini.getDate() + i); var e = new Date(d); e.setDate(d.getDate() + 1); cubetas.push({ ini: d, fin: e, l: DIA_L[d.getDay()], hoy: iso(d) === iso(hoy) }); }
    } else if (periodo === "anio") {
      ini = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1); fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      for (var m = 0; m < 12; m++) { var a = new Date(ini.getFullYear(), ini.getMonth() + m, 1), b = new Date(ini.getFullYear(), ini.getMonth() + m + 1, 1); cubetas.push({ ini: a, fin: b, l: MES_C[a.getMonth()], hoy: m === 11 }); }
    } else {
      var semanas = periodo === "mes" ? 5 : 13;
      fin = new Date(lunes(hoy)); fin.setDate(fin.getDate() + 7);
      ini = new Date(fin); ini.setDate(fin.getDate() - 7 * semanas);
      for (var w = 0; w < semanas; w++) { var c = new Date(ini); c.setDate(ini.getDate() + 7 * w); var z = new Date(c); z.setDate(c.getDate() + 7); cubetas.push({ ini: c, fin: z, l: c.getDate() + " " + MES_C[c.getMonth()], hoy: w === semanas - 1 }); }
    }
    var largo = fin - ini, pIni = new Date(ini.getTime() - largo);
    return { ini: ini, fin: fin, pIni: pIni, cubetas: cubetas };
  }
  function planeados(asig, ini, fin) {
    var lista = (asig || []).filter(function (a) { return a.activa !== false && (a.dias || []).length; });
    if (!lista.length) return null;
    var n = 0, hoy = f0(new Date()), tope = fin < hoy ? fin : new Date(hoy.getTime() + 864e5);
    lista.forEach(function (a) {
      var desde = a.creado ? f0(a.creado) : ini; if (desde < ini) desde = ini; // solo desde que se asignó la rutina
      for (var d = new Date(desde); d < tope; d.setDate(d.getDate() + 1)) if (a.dias.indexOf(d.getDay()) >= 0) n++;
    });
    return n;
  }
  function racha(ses) {
    var semanas = {}; ses.forEach(function (s) { semanas[iso(lunes(fechaDe(s)))] = 1; });
    var n = 0, w = lunes(new Date());
    if (!semanas[iso(w)]) w.setDate(w.getDate() - 7); // la semana actual aún puede completarse
    while (semanas[iso(w)]) { n++; w.setDate(w.getDate() - 7); }
    return n;
  }
  UI.resumenProgreso = function (datos, periodo) {
    var ses = datos.ses || [], med = (datos.med || []).slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    var v = ventana(periodo);
    var en = ses.filter(function (s) { var f = fechaDe(s); return f >= v.ini && f < v.fin; });
    var antes = ses.filter(function (s) { var f = fechaDe(s); return f >= v.pIni && f < v.ini; });
    var plan = planeados(datos.asig, v.ini, v.fin);
    var vol = en.reduce(function (t, s) { return t + volumen(s); }, 0), volAntes = antes.reduce(function (t, s) { return t + volumen(s); }, 0);
    var series = en.reduce(function (t, s) { return t + (s.series || []).length; }, 0);
    var mins = en.reduce(function (t, s) { return t + (Number(s.duracion_min) || 0); }, 0);
    var cal = en.filter(function (s) { return s.calificacion; }), estrellas = cal.length ? cal.reduce(function (t, s) { return t + s.calificacion; }, 0) / cal.length : 0;
    // Récords: el mejor peso del periodo supera todo lo anterior
    var mejorAntes = {}, mejorEn = {}, nombres = {};
    ses.forEach(function (s) {
      var f = fechaDe(s), dentro = f >= v.ini && f < v.fin, previo = f < v.ini;
      (s.series || []).forEach(function (x) {
        var p = Number(x.peso) || 0; if (!p) return; nombres[x.ref] = x.nombre;
        if (previo) mejorAntes[x.ref] = Math.max(mejorAntes[x.ref] || 0, p);
        if (dentro) mejorEn[x.ref] = Math.max(mejorEn[x.ref] || 0, p);
      });
    });
    var records = Object.keys(mejorEn).filter(function (r) { return mejorAntes[r] && mejorEn[r] > mejorAntes[r]; })
      .map(function (r) { return { n: nombres[r], de: mejorAntes[r], a: mejorEn[r], pct: Math.round((mejorEn[r] - mejorAntes[r]) / mejorAntes[r] * 100) }; })
      .sort(function (a, b) { return b.pct - a.pct; });
    // Peso corporal: última medida del periodo contra la última anterior a él
    var pesos = med.filter(function (m) { return Number(m.peso) > 0; });
    var pFin = pesos.filter(function (m) { return new Date(m.fecha + "T12:00:00") < v.fin; }).pop();
    var pIni = pesos.filter(function (m) { return new Date(m.fecha + "T12:00:00") < v.ini; }).pop() || pesos.filter(function (m) { return new Date(m.fecha + "T12:00:00") >= v.ini; })[0];
    var difPeso = pFin && pIni && pFin !== pIni ? Number(pFin.peso) - Number(pIni.peso) : null;
    // Gráfica: volumen por día / semana / mes, marcando cuántos entrenos hubo
    var barras = v.cubetas.map(function (c) {
      var ss = en.filter(function (s) { var f = fechaDe(s); return f >= c.ini && f < c.fin; });
      return { l: c.l, hoy: c.hoy, vol: ss.reduce(function (t, s) { return t + volumen(s); }, 0), n: ss.length };
    });
    var max = Math.max.apply(null, [1].concat(barras.map(function (b) { return b.vol; })));
    var W = 340, H = 150, base = 112, alto = 86, paso = (W - 16) / barras.length, ancho = Math.min(26, paso * .62), svg = "";
    barras.forEach(function (b, i) {
      var cx = 8 + paso * i + paso / 2, h = b.vol / max * alto;
      if (b.n && !b.vol) h = 6; // entrenó sin registrar pesos
      svg += '<rect x="' + (cx - ancho / 2).toFixed(1) + '" y="' + (base - Math.max(h, 2)).toFixed(1) + '" width="' + ancho.toFixed(1) + '" height="' + Math.max(h, 2).toFixed(1) + '" rx="5" fill="' +
        (b.n ? "var(--brand-2)" : "var(--linea)") + '"' + (b.hoy ? ' stroke="#fff" stroke-width="1.5"' : "") + "/>";
      if (b.n && barras.length <= 7) svg += '<text x="' + cx.toFixed(1) + '" y="' + (base - Math.max(h, 2) - 6).toFixed(1) + '" text-anchor="middle" font-size="10" fill="var(--suave)">' + (b.vol ? kg(b.vol).replace(" kg", "") : "✓") + "</text>";
      if (barras.length <= 7 || i % Math.ceil(barras.length / 6) === 0 || b.hoy)
        svg += '<text x="' + cx.toFixed(1) + '" y="' + (base + 17) + '" text-anchor="middle" font-size="10.5" fill="var(--suave)"' + (b.hoy ? ' font-weight="700"' : "") + ">" + UI.esc(b.l) + "</text>";
    });
    svg += '<line x1="4" x2="' + (W - 4) + '" y1="' + base + '" y2="' + base + '" stroke="var(--linea)"/>';
    var nombreP = { semana: "esta semana", mes: "las últimas 5 semanas", "3m": "los últimos 3 meses", anio: "el último año" }[periodo];
    var vsP = { semana: "vs. semana pasada", mes: "vs. las 5 anteriores", "3m": "vs. 3 meses antes", anio: "vs. año anterior" }[periodo];
    var cumpl = plan ? Math.min(100, Math.round(en.length / plan * 100)) : null;
    var r = racha(ses);
    var html = '<div class="res-kpis">' +
      '<div class="dato"><div class="v">' + en.length + (plan ? '<small> / ' + plan + "</small>" : "") + '</div><div class="l">Entrenamientos' + (cumpl !== null ? " · " + cumpl + "% cumplido" : "") + "</div>" +
      (cumpl !== null ? '<div class="adm-barra"><i style="width:' + cumpl + '%;background:' + (cumpl >= 80 ? "var(--ok)" : cumpl >= 50 ? "var(--ambar)" : "var(--malo)") + '"></i></div>' : "") + "</div>" +
      '<div class="dato"><div class="v">' + kg(vol) + '</div><div class="l">Peso total levantado ' + delta(vol, volAntes) + "</div></div>" +
      '<div class="dato"><div class="v">' + records.length + '</div><div class="l">Récords personales</div></div>' +
      '<div class="dato"><div class="v">' + (r ? "🔥 " + r : "0") + '</div><div class="l">' + (r === 1 ? "Semana seguida" : "Semanas seguidas") + " entrenando</div></div>" +
      '<div class="dato"><div class="v">' + (mins ? (mins >= 60 ? Math.floor(mins / 60) + " h " + (mins % 60) + " min" : mins + " min") : series) + '</div><div class="l">' + (mins ? "Tiempo entrenando · " + series + " series" : "Series hechas") + "</div></div>" +
      '<div class="dato"><div class="v">' + (difPeso !== null ? (difPeso > 0 ? "+" : "") + UI.num(difPeso) + " kg" : (estrellas ? "★ " + UI.num(estrellas) : "–")) + '</div><div class="l">' +
      (difPeso !== null ? "Peso corporal (ahora " + UI.num(pFin.peso) + " kg)" : estrellas ? "Cómo se sintió (promedio)" : "Sin medidas en el periodo") + "</div></div></div>" +
      '<div class="lbl" style="margin:16px 0 2px">Peso levantado por ' + (periodo === "semana" ? "día" : periodo === "anio" ? "mes" : "semana") + " · " + vsP + " " + delta(vol, volAntes) + "</div>" +
      '<svg class="grafica" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Peso levantado en ' + nombreP + '">' + svg + "</svg>";
    if (records.length) {
      html += '<div class="lbl" style="margin:12px 0 6px">🏆 Récords de ' + nombreP + "</div>" + records.slice(0, 4).map(function (x) {
        return '<div class="res-rec"><span>' + UI.esc(x.n) + "</span><b>" + UI.num(x.de) + " → " + UI.num(x.a) + ' kg</b><span class="res-delta sube">+' + x.pct + "%</span></div>";
      }).join("");
    }
    if (!en.length) html += '<p class="nota-demo" style="text-align:left;margin-top:8px">Sin entrenamientos registrados en ' + nombreP + ".</p>";
    return html;
  };
  UI.montarResumen = function (cont, datos) {
    var periodo = "semana";
    try { periodo = localStorage.getItem("pulso_periodo") || "semana"; } catch (e) {}
    cont.innerHTML = '<div class="segmento res-periodo"><button data-p="semana">Semana</button><button data-p="mes">Mes</button><button data-p="3m">3 meses</button><button data-p="anio">Año</button></div><div class="res-cuerpo"></div>';
    function pintar() {
      UI.$$(".res-periodo button", cont).forEach(function (b) { b.classList.toggle("on", b.dataset.p === periodo); });
      UI.$(".res-cuerpo", cont).innerHTML = UI.resumenProgreso(datos, periodo);
    }
    UI.$$(".res-periodo button", cont).forEach(function (b) {
      b.onclick = function () { periodo = b.dataset.p; try { localStorage.setItem("pulso_periodo", periodo); } catch (e) {} pintar(); };
    });
    pintar();
  };
  UI.num = function (n) { var x = Number(n); return isFinite(x) ? (Math.round(x * 10) / 10).toString() : "–"; };
  UI.hace = function (iso) {
    if (!iso) return "Sin entrenar";
    var dias = Math.floor((Date.now() - new Date(iso.length <= 10 ? iso + "T12:00:00" : iso).getTime()) / 864e5);
    if (dias <= 0) return "Entrenó hoy";
    if (dias === 1) return "Entrenó ayer";
    return "Hace " + dias + " días";
  };

  /* Imágenes de ejercicios */
  UI.imgEj = function (img) {
    if (!img) return "";
    if (/^(https?:|data:)/.test(img)) return img;
    return IMG_BASE + img;
  };
  UI.miniEj = function (item) {
    var src = UI.imgEj(item.img);
    return src ? '<img src="' + UI.esc(src) + '" alt="" loading="lazy">' : UI.ico("pesa");
  };
  UI.youtube = function (url) {
    if (!url) return null;
    var m = String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? "https://www.youtube-nocookie.com/embed/" + m[1] : null;
  };

  /* Biblioteca */
  var bib = null;
  UI.biblioteca = function () {
    if (bib) return bib;
    bib = fetch("datos/ejercicios.json").then(function (r) { return r.json(); }).catch(function () { bib = null; return []; });
    return bib;
  };
  UI.normal = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  /* Comprimir foto antes de subir */
  UI.comprimir = function (archivo, max) {
    max = max || 1280;
    return new Promise(function (ok) {
      var img = new Image(); var url = URL.createObjectURL(archivo);
      img.onload = function () {
        var e = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); ok(b || archivo); }, "image/jpeg", 0.85);
      };
      img.onerror = function () { ok(archivo); };
      img.src = url;
    });
  };

  /* Gráfica de línea simple */
  UI.grafica = function (puntos, unidad) {
    if (!puntos.length) return '<div class="vacio">Aún no hay registros.</div>';
    var W = 320, H = 170, pad = 22;
    var vs = puntos.map(function (p) { return p.v; });
    var min = Math.min.apply(null, vs), max = Math.max.apply(null, vs);
    if (min === max) { min -= 1; max += 1; }
    var x = function (i) { return puntos.length === 1 ? W / 2 : pad + i * (W - pad * 2) / (puntos.length - 1); };
    var y = function (v) { return H - pad - (v - min) / (max - min) * (H - pad * 2); };
    var d = puntos.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1); }).join(" ");
    var area = d + " L" + x(puntos.length - 1).toFixed(1) + " " + (H - pad) + " L" + x(0).toFixed(1) + " " + (H - pad) + " Z";
    var ult = puntos[puntos.length - 1];
    return '<svg class="grafica" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Progreso">' +
      '<defs><linearGradient id="gA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--brand-2)" stop-opacity=".45"/><stop offset="1" stop-color="var(--brand-2)" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#gA)"/><path d="' + d + '" fill="none" stroke="var(--brand-2)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      puntos.map(function (p, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.v).toFixed(1) + '" r="' + (i === puntos.length - 1 ? 5 : 3) + '" fill="#fff"/>'; }).join("") +
      '<text x="' + Math.min(W - 6, x(puntos.length - 1)).toFixed(1) + '" y="' + Math.max(14, y(ult.v) - 12).toFixed(1) + '" fill="#fff" font-size="13" font-weight="700" text-anchor="end">' + UI.num(ult.v) + " " + (unidad || "") + "</text>" +
      '<text x="' + pad + '" y="' + (H - 4) + '" fill="rgba(235,238,255,.5)" font-size="11">' + UI.esc(UI.fecha(puntos[0].f)) + "</text>" +
      '<text x="' + (W - pad) + '" y="' + (H - 4) + '" fill="rgba(235,238,255,.5)" font-size="11" text-anchor="end">' + UI.esc(UI.fecha(ult.f)) + "</text></svg>";
  };

  /* Progreso de fuerza: mejor peso por sesión de un ejercicio */
  UI.serieFuerza = function (sesiones, ref) {
    return sesiones.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).map(function (s) {
      var pesos = (s.series || []).filter(function (x) { return x.ref === ref && Number(x.peso) > 0; }).map(function (x) { return Number(x.peso); });
      return pesos.length ? { f: s.fecha, v: Math.max.apply(null, pesos) } : null;
    }).filter(Boolean);
  };
  UI.ejerciciosRegistrados = function (sesiones) {
    var m = {};
    sesiones.forEach(function (s) { (s.series || []).forEach(function (x) { if (Number(x.peso) > 0) m[x.ref] = x.nombre; }); });
    return Object.keys(m).map(function (k) { return { ref: k, nombre: m[k] }; });
  };

  /* Marca del entrenador */
  UI.aplicarMarca = function (color) {
    var def = (window.PULSO_CONFIG || {}).COLOR || "#3B7BFF";
    var c = (!color || String(color).toUpperCase() === "#2F6BFF") ? def : color;
    document.documentElement.style.setProperty("--brand", c);
    document.documentElement.style.setProperty("--brand-2", "color-mix(in srgb," + c + " 70%, white 30%)");
  };

  /* Pestañas inferiores */
  UI.tabbar = function (tabs, activa) {
    var t = UI.$("#tabbar");
    if (!tabs) { t.hidden = true; return; }
    t.hidden = false;
    document.body.setAttribute("data-sec", activa || "");
    t.innerHTML = tabs.map(function (x) {
      return '<a class="tab' + (x.id === activa ? " on" : "") + '" href="#/' + x.ruta + '">' + UI.ico(x.ico) + "<span>" + x.txt + "</span></a>";
    }).join("");
  };

  // Carga con "esqueleto" (bloques que brillan) en vez de un círculo girando
  UI.cargando = function () { return '<div class="cargando"><div class="esq esq-cab"></div><div class="esq esq-t"></div><div class="esq esq-t"></div><div class="esq esq-t corta"></div></div>'; };

  UI.copiar = function (txt) {
    if (navigator.clipboard) return navigator.clipboard.writeText(txt).then(function () { UI.aviso("Copiado ✓"); });
    var t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); UI.aviso("Copiado ✓"); } catch (e) {} t.remove();
    return Promise.resolve();
  };

  window.UI = UI;
})();
