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
    var a = UI.$("#aviso"); a.textContent = msg; a.className = "aviso ver" + (error ? " error" : "");
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
    var c = color || (window.PULSO_CONFIG || {}).COLOR || "#2F6BFF";
    document.documentElement.style.setProperty("--brand", c);
    document.documentElement.style.setProperty("--brand-2", "color-mix(in srgb," + c + " 70%, white 30%)");
  };

  /* Pestañas inferiores */
  UI.tabbar = function (tabs, activa) {
    var t = UI.$("#tabbar");
    if (!tabs) { t.hidden = true; return; }
    t.hidden = false;
    t.innerHTML = tabs.map(function (x) {
      return '<a class="tab' + (x.id === activa ? " on" : "") + '" href="#/' + x.ruta + '">' + UI.ico(x.ico) + "<span>" + x.txt + "</span></a>";
    }).join("");
  };

  UI.cargando = function () { return '<div class="cargando"><div class="girar"></div></div>'; };

  UI.copiar = function (txt) {
    if (navigator.clipboard) return navigator.clipboard.writeText(txt).then(function () { UI.aviso("Copiado ✓"); });
    var t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); UI.aviso("Copiado ✓"); } catch (e) {} t.remove();
    return Promise.resolve();
  };

  window.UI = UI;
})();
