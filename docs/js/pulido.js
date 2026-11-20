/* Pulso · acabados estilo iPhone: título que se encoge, transiciones, gestos y animaciones */
(function () {
  "use strict";
  var app = document.getElementById("app"), capa = document.getElementById("capa");
  if (!app) return;
  var reducir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function tabbarVisible() { var t = document.getElementById("tabbar"); return t && !t.hidden; }
  function hayHoja() { return !!(capa && capa.querySelector(".fondo")); }

  /* ── 1. Barra superior con título chico que aparece al bajar (como Ajustes del iPhone) ── */
  var nav = document.createElement("div");
  nav.id = "navMini";
  nav.innerHTML = '<button class="nm-atras" aria-label="Atrás"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><span class="nm-txt"></span>';
  document.body.appendChild(nav);
  var navTxt = nav.querySelector(".nm-txt"), navAtras = nav.querySelector(".nm-atras"), tituloEl = null;
  function buscarTitulo() {
    tituloEl = app.querySelector(".cab-txt h1, .subnav a.on, .perfil-cab h1, .hero .titulo-pag, .hero h1");
    var t = "";
    if (tituloEl) t = tituloEl.tagName === "INPUT" ? (tituloEl.value || tituloEl.placeholder) : tituloEl.textContent;
    navTxt.textContent = (t || "").trim();
    navAtras.hidden = !app.querySelector(".hero .atras");
    // Si hay barra fija arriba (modo demo o "dentro de la cuenta de…"), el título chico va debajo de ella
    var banda = app.querySelector(".banda-demo"), bs = document.body.style;
    if (banda) { bs.setProperty("--navTop", banda.offsetHeight + "px"); bs.setProperty("--navPad", "0px"); }
    else { bs.removeProperty("--navTop"); bs.removeProperty("--navPad"); }
    revisarScroll();
  }
  function revisarScroll() {
    var ver = false;
    if (tituloEl && !tituloEl.isConnected) return buscarTitulo();
    if (tituloEl) ver = tituloEl.getBoundingClientRect().bottom < 54;
    nav.classList.toggle("ver", ver);
  }
  navAtras.onclick = function () { var a = app.querySelector(".hero .atras"); if (a) a.click(); };
  window.addEventListener("scroll", revisarScroll, { passive: true });

  /* ── 2. Selector de pestañas con píldora que se desliza ── */
  function pildoras() {
    app.querySelectorAll(".segmento").forEach(function (s) {
      var on = s.querySelector("button.on, a.on"), p = s.querySelector(".seg-pill");
      if (!p) { p = document.createElement("i"); p.className = "seg-pill"; s.insertBefore(p, s.firstChild); s.classList.add("con-pill"); }
      if (!on) { p.style.opacity = "0"; return; }
      p.style.opacity = "1";
      p.style.width = on.offsetWidth + "px";
      p.style.transform = "translateX(" + on.offsetLeft + "px)";
      if (!p.dataset.listo) requestAnimationFrame(function () { p.dataset.listo = "1"; p.classList.add("anima"); });
    });
  }

  /* ── 3. Números que cuentan y anillos/barras que se llenan ── */
  var SEL_NUM = ".dato .v, .kpi4 b, .salud b, .sc-anillo b, .macro-cajas b, .anillo-num";
  function contar(el) {
    if (el.dataset.contado || el.children.length) return;
    el.dataset.contado = "1";
    var m = el.textContent.match(/^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\D*)$/);
    if (!m || m[3]) return;
    var fin = parseInt(m[2].replace(/,/g, ""), 10), coma = m[2].indexOf(",") >= 0;
    if (!fin || fin > 999999) return;
    var t0 = performance.now(), dur = Math.min(900, 450 + fin * 6);
    function paso(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(fin * e);
      el.textContent = m[1] + (coma ? v.toLocaleString("es-MX") : v) + m[4];
      if (k < 1) requestAnimationFrame(paso);
    }
    el.textContent = m[1] + "0" + m[4];
    requestAnimationFrame(paso);
  }
  function anillos() {
    app.querySelectorAll("circle[stroke-dashoffset]").forEach(function (c) {
      if (c.dataset.anim) return; c.dataset.anim = "1";
      var fin = c.getAttribute("stroke-dashoffset"), lleno = parseFloat(c.getAttribute("stroke-dasharray"));
      if (!lleno) return;
      c.style.strokeDashoffset = lleno;
      c.getBoundingClientRect();
      requestAnimationFrame(function () { c.style.transition = "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)"; c.style.strokeDashoffset = fin; });
    });
  }
  function animarNuevos() {
    if (reducir) return;
    app.querySelectorAll(SEL_NUM).forEach(contar);
    anillos();
  }

  /* ── 4. Checkbox de "cliente activo" como interruptor del iPhone ── */
  function interruptores(raiz) {
    (raiz || document).querySelectorAll("#cActivo").forEach(function (i) { i.classList.add("switch"); i.removeAttribute("style"); });
  }

  /* Observa los cambios de pantalla */
  var pend = false;
  function alCambiar() {
    if (pend) return; pend = true;
    setTimeout(function () { pend = false; buscarTitulo(); pildoras(); animarNuevos(); }, 16);
  }
  new MutationObserver(function (lista) {
    var cambio = false;
    lista.forEach(function (m) {
      if (m.type === "childList") cambio = true;
      else if (m.type === "attributes" && m.target.parentNode && m.target.parentNode.classList && m.target.parentNode.classList.contains("segmento")) cambio = true;
    });
    if (cambio) alCambiar();
  }).observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", pildoras);
  document.addEventListener("input", function (e) { if (e.target === tituloEl) buscarTitulo(); });

  /* ── 5. Transiciones entre pantallas (entrar desde la derecha, regresar desde la izquierda) ── */
  var DETALLE = /^#\/(cliente|rutina|dieta|entrenar|admin)\//;
  var rutaAnt = location.hash;
  window.addEventListener("hashchange", function () {
    if (reducir) { rutaAnt = location.hash; return; }
    var antes = DETALLE.test(rutaAnt), ahora = DETALLE.test(location.hash);
    var tipo = ahora && !antes ? "push" : antes && !ahora ? "pop" : ahora && antes ? "push" : "tab";
    rutaAnt = location.hash;
    if (gestoAtras) { gestoAtras = false; tipo = "pop-gesto"; }
    app.classList.remove("anim-push", "anim-pop", "anim-tab", "anim-pop-gesto");
    void app.offsetWidth;
    app.classList.add("anim-" + tipo);
  });
  app.addEventListener("animationend", function (e) { if (e.target === app) app.classList.remove("anim-push", "anim-pop", "anim-tab", "anim-pop-gesto"); });

  /* ── 6. Deslizar desde el borde izquierdo para regresar ── */
  var gestoAtras = false, bx = null, bdx = 0;
  document.addEventListener("touchstart", function (e) {
    bx = null;
    if (hayHoja() || e.touches.length !== 1) return;
    var t = e.touches[0];
    if (t.clientX > 24 || !app.querySelector(".hero .atras")) return;
    bx = t.clientX; bdx = 0; app.style.transition = "none";
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (bx == null) return;
    bdx = Math.max(0, e.touches[0].clientX - bx);
    app.style.transform = "translateX(" + bdx * 0.9 + "px)";
    app.style.opacity = String(1 - Math.min(.35, bdx / 900));
  }, { passive: true });
  document.addEventListener("touchend", function () {
    if (bx == null) return; bx = null;
    app.style.transition = "transform .22s cubic-bezier(.2,.8,.2,1), opacity .22s";
    if (bdx > 90) {
      app.style.transform = "translateX(100%)"; app.style.opacity = "0";
      setTimeout(function () {
        app.style.transition = "none"; app.style.transform = ""; app.style.opacity = "";
        gestoAtras = true;
        var a = app.querySelector(".hero .atras"); if (a) a.click(); else history.back();
      }, 200);
    } else { app.style.transform = ""; app.style.opacity = ""; }
  });

  /* ── 7. Al abrir una ventana, la pantalla de atrás se hace chiquita (como las tarjetas del iPhone) ── */
  if (capa) new MutationObserver(function () {
    var abierta = hayHoja();
    if (abierta && !document.body.classList.contains("con-hoja")) app.style.transformOrigin = "50% " + Math.round(window.scrollY + window.innerHeight * 0.45) + "px";
    document.body.classList.toggle("con-hoja", abierta);
  }).observe(capa, { childList: true });

  /* ── 8. Jalar hacia abajo para actualizar, como Safari: la pantalla baja con resistencia
         y aparece la ruedita gris del iPhone, que se va armando y luego gira ── */
  var ptr = document.createElement("div");
  ptr.id = "ptr";
  var rayas = "";
  for (var i = 0; i < 8; i++) rayas += '<i style="transform:rotate(' + i * 45 + 'deg) translateY(-7px);--o:' + (1 - i * 0.1).toFixed(2) + '"></i>';
  ptr.innerHTML = '<div class="ptr-rueda">' + rayas + "</div>";
  document.body.appendChild(ptr);
  var rueda = ptr.querySelector(".ptr-rueda"), rayasEl = rueda.querySelectorAll("i");
  var py = null, pdy = 0, cargandoPtr = false, UMBRAL = 78;
  function resistencia(d) { return d <= 0 ? 0 : 110 * (1 - Math.exp(-d / 160)); }
  function pintarPtr(dist) {
    var k = Math.min(1, dist / UMBRAL);
    rayasEl.forEach(function (r, i) { r.style.opacity = k * 8 > i ? "" : "0"; });
    ptr.style.opacity = dist > 6 ? "1" : "0";
    ptr.style.transform = "translate(-50%," + Math.max(0, dist / 2 - 14) + "px)";
  }
  document.addEventListener("touchstart", function (e) {
    py = null;
    if (cargandoPtr || hayHoja() || !tabbarVisible() || window.scrollY > 0 || e.touches.length !== 1) return;
    if (e.target.closest("input,textarea,select,.chips,.checkins,.semana-tira,.sc-barras")) return;
    if (e.touches[0].clientX <= 24) return;
    py = e.touches[0].clientY; pdy = 0;
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (py == null) return;
    pdy = e.touches[0].clientY - py;
    if (pdy <= 0 || window.scrollY > 0) { app.style.transition = ""; app.style.transform = ""; pintarPtr(0); return; }
    var dist = resistencia(pdy);
    app.style.transition = "none";
    app.style.transform = "translateY(" + dist + "px)";
    pintarPtr(dist);
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", function () {
    if (py == null) return; py = null;
    var dist = resistencia(pdy);
    app.style.transition = "transform .35s cubic-bezier(.2,.9,.3,1)";
    ptr.style.transition = "transform .35s cubic-bezier(.2,.9,.3,1), opacity .2s";
    if (dist >= UMBRAL && window.APP && window.APP.recargar) {
      cargandoPtr = true;
      app.style.transform = "translateY(58px)";
      pintarPtr(UMBRAL); ptr.style.transform = "translate(-50%,16px)";
      rueda.classList.add("gira");
      var t0 = Date.now();
      Promise.resolve(window.APP.recargar()).then(function () {
        setTimeout(function () {
          rueda.classList.remove("gira");
          app.style.transform = ""; ptr.style.opacity = "0"; ptr.style.transform = "translate(-50%,0)";
          setTimeout(function () { app.style.transition = ""; ptr.style.transition = ""; cargandoPtr = false; }, 360);
        }, Math.max(0, 700 - (Date.now() - t0)));
      });
    } else {
      app.style.transform = ""; pintarPtr(0);
      setTimeout(function () { app.style.transition = ""; ptr.style.transition = ""; }, 360);
    }
  });

  /* ── 9. Editores: aviso de "cambios sin guardar" en la barra de abajo ── */
  function barraGuardar() { return app.querySelector('.fila-btns[style*="sticky"]'); }
  function ensuciar(e) {
    if (!e.target.closest || !e.target.closest(".editor-cab, .bloque, .ej, #bloques, .contenido")) return;
    var b = barraGuardar(); if (b && app.querySelector(".editor-cab")) b.classList.add("sucio");
  }
  app.addEventListener("input", ensuciar); app.addEventListener("change", ensuciar);
  app.addEventListener("click", function (e) { if (e.target.closest("[data-acc],[data-bacc],[data-dacc],[data-cacc],#nuevoBloque,#nuevoDia,#inds .chip")) setTimeout(function () { var b = barraGuardar(); if (b && app.querySelector(".editor-cab")) b.classList.add("sucio"); }, 30); });
  if (window.UI && UI.aviso) {
    var avisoOrig = UI.aviso;
    UI.aviso = function (msg, error) { if (!error && /guardad|copiad/i.test(String(msg))) { var b = barraGuardar(); if (b) b.classList.remove("sucio"); } return avisoOrig.apply(this, arguments); };
  }

  /* ── 10. Deslizar una fila de cliente a la izquierda para ver acciones (como Mail del iPhone) ── */
  var sw = null, swAbierta = null, ANCHO = 150;
  function cerrarSwipe(f) { if (!f) return; f.querySelector(".cli-fila").style.transform = ""; f.classList.remove("abierta"); if (swAbierta === f) swAbierta = null; }
  document.addEventListener("touchstart", function (e) {
    var f = e.target.closest && e.target.closest(".swipe-fila");
    if (swAbierta && swAbierta !== f) cerrarSwipe(swAbierta);
    if (!f || e.target.closest(".swipe-acc")) { sw = null; return; }
    sw = { f: f, row: f.querySelector(".cli-fila"), x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, base: f.classList.contains("abierta") ? -ANCHO : 0, horiz: null };
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (!sw) return;
    var dx = e.touches[0].clientX - sw.x, dy = e.touches[0].clientY - sw.y;
    if (sw.horiz == null) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; sw.horiz = Math.abs(dx) > Math.abs(dy); }
    if (!sw.horiz) { sw = null; return; }
    sw.dx = dx; var x = Math.max(-ANCHO - 30, Math.min(0, sw.base + dx));
    sw.row.style.transition = "none"; sw.row.style.transform = "translateX(" + x + "px)";
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", function () {
    if (!sw) return; var s = sw; sw = null;
    if (!s.horiz) return;
    s.row.style.transition = "transform .3s cubic-bezier(.2,.9,.3,1)";
    var fin = s.base + s.dx;
    if (fin < -ANCHO / 2) { s.row.style.transform = "translateX(" + -ANCHO + "px)"; s.f.classList.add("abierta"); swAbierta = s.f; }
    else cerrarSwipe(s.f);
    s.row.dataset.recienDeslizada = "1"; setTimeout(function () { delete s.row.dataset.recienDeslizada; }, 350);
  });
  document.addEventListener("click", function (e) {
    var row = e.target.closest && e.target.closest(".cli-fila");
    if (row && (row.dataset.recienDeslizada || row.parentNode.classList.contains("abierta"))) { e.preventDefault(); e.stopPropagation(); if (!row.dataset.recienDeslizada) cerrarSwipe(row.parentNode); }
  }, true);

  /* ── 11. Dejar presionado un alumno: menú rápido (como en el iPhone) ── */
  var lp = null, suprimirClick = false;
  function menuContexto(row) {
    var f = row.closest(".swipe-fila"), id = (row.getAttribute("href") || "").split("/").pop();
    var wa = f && f.querySelector("a.sw-wa"), nombre = (row.querySelector(".t1") || {}).textContent || "";
    if (navigator.vibrate) navigator.vibrate(12);
    var o = document.createElement("div"); o.className = "ctx";
    var prev = row.cloneNode(true); prev.removeAttribute("href"); prev.style.transform = "";
    var ICO = { ficha: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>', sem: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 10h18M8 2v4M16 2v4"/>', ent: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>', com: '<circle cx="13" cy="12" r="7"/><path d="M3 4v5a1.5 1.5 0 0 0 3 0V4M4.5 11v9"/>', wa: '<path d="M21 12a9 9 0 0 1-13.4 7.9L3 21l1.2-4.4A9 9 0 1 1 21 12z"/>' };
    function acc(k, txt, extra) { return '<button data-ctx="' + k + '"' + (extra || "") + '><span>' + txt + '</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICO[k] + "</svg></button>"; }
    o.innerHTML = '<div class="ctx-caja"><div class="ctx-prev tarjeta sin-relleno"><div class="lista"></div></div><div class="ctx-menu">' +
      acc("ficha", "Ver ficha") + acc("sem", "Ver su semana") + acc("ent", "Ver su entrenamiento") + acc("com", "Ver su comida") + (wa ? acc("wa", "Mandar WhatsApp") : "") + "</div></div>";
    o.querySelector(".ctx-prev .lista").appendChild(prev);
    document.body.appendChild(o); document.body.classList.add("con-ctx");
    function cerrar() { o.classList.add("sale"); document.body.classList.remove("con-ctx"); setTimeout(function () { o.remove(); }, 180); }
    o.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ctx]");
      if (!b) { if (!e.target.closest(".ctx-prev")) cerrar(); return; }
      var k = b.dataset.ctx; cerrar();
      if (k === "wa") { window.open(wa.href, "_blank"); return; }
      try { sessionStorage.setItem("pulso_ficha_panel", { ficha: "resumen", sem: "semana", ent: "entreno", com: "comida" }[k]); } catch (er) {}
      location.hash = "#/cliente/" + id;
    });
  }
  document.addEventListener("touchstart", function (e) {
    var row = e.target.closest && e.target.closest(".cli-fila");
    if (!row || e.touches.length !== 1) return;
    var t = e.touches[0];
    lp = { row: row, x: t.clientX, y: t.clientY, tm: setTimeout(function () { if (!lp) return; suprimirClick = true; row.classList.remove("presionando"); menuContexto(row); lp = null; }, 480) };
    row.classList.add("presionando");
  }, { passive: true });
  function cancelarLp() { if (lp) { clearTimeout(lp.tm); lp.row.classList.remove("presionando"); lp = null; } }
  document.addEventListener("touchmove", function (e) { if (lp && (Math.abs(e.touches[0].clientX - lp.x) > 8 || Math.abs(e.touches[0].clientY - lp.y) > 8)) cancelarLp(); }, { passive: true });
  document.addEventListener("touchend", cancelarLp); document.addEventListener("touchcancel", cancelarLp);
  document.addEventListener("click", function (e) { if (suprimirClick && e.target.closest && e.target.closest(".cli-fila")) { e.preventDefault(); e.stopPropagation(); } suprimirClick = false; }, true);
  document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(".cli-fila")) e.preventDefault(); });

  alCambiar();
  interruptores();
  new MutationObserver(function () { interruptores(capa); }).observe(capa || document.body, { childList: true, subtree: true });
})();
