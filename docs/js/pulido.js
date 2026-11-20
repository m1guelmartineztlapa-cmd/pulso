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

  alCambiar();
  interruptores();
  new MutationObserver(function () { interruptores(capa); }).observe(capa || document.body, { childList: true, subtree: true });
})();
