/* Pulso · app del cliente */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var VIS = (window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} });
  var V = VIS.cliente;
  var TABS = [
    { id: "hoy", ruta: "", ico: "inicio", txt: "Hoy" },
    { id: "entrenos", ruta: "entrenos", ico: "pesa", txt: "Entrenar" },
    { id: "comida", ruta: "comida", ico: "plato", txt: "Comida" },
    { id: "progreso", ruta: "progreso", ico: "grafica", txt: "Progreso" },
    { id: "perfil", ruta: "perfil", ico: "persona", txt: "Perfil" }
  ];
  V.__TABS = TABS;
  function A() { return window.APP; }
  function app() { return UI.$("#app"); }
  function cli() { return A().cli; }
  function ent() { return A().ent || {}; }

  async function cargar() {
    var c = cli();
    var asig = (await DB.sel("asignaciones", { cliente_id: c.id })).filter(function (a) { return a.activa; });
    var ids = asig.map(function (a) { return a.rutina_id; });
    var rutinas = ids.length ? await DB.sel("rutinas", { id: ids }) : [];
    var ses = await DB.sel("sesiones", { cliente_id: c.id, terminada: true }, { orden: "fecha", desc: true, limite: 200 });
    var porId = {}; rutinas.forEach(function (r) { porId[r.id] = r; });
    asig = asig.filter(function (a) { return porId[a.rutina_id]; }).map(function (a) { a.rutina = porId[a.rutina_id]; return a; });
    return { asig: asig, ses: ses };
  }
  function contar(r) { return (r.bloques || []).reduce(function (t, b) { return t + b.items.length; }, 0); }
  function minutos(r) {
    var s = 0;
    (r.bloques || []).forEach(function (b) { b.items.forEach(function (it) { var n = Number(it.series) || 1; s += n * (40 + (Number(it.descanso) || 60)); }); });
    return Math.max(10, Math.round(s / 60 / 5) * 5);
  }
  function deHoy(asig) {
    var dow = new Date().getDay();
    return asig.find(function (a) { return (a.dias || []).indexOf(dow) >= 0; }) || null;
  }
  function cabecera() {
    var e = ent();
    return '<div class="barra-sup"><a href="#/perfil" aria-label="Perfil" style="display:contents">' + UI.avatarCli(cli(), "avatar") + '</a>' +
      '<div class="buscador" style="justify-content:center;gap:10px">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="" style="width:24px;height:24px;border-radius:7px;object-fit:cover">' : ico("pulso", ' width="20" height="20"')) +
      '<span style="color:#fff;font-weight:600">' + esc(e.marca || "Pulso") + "</span></div>" +
      '<a class="btn-redondo" href="#/progreso" aria-label="Progreso">' + ico("grafica") + '</a><a class="btn-redondo" href="#/perfil" aria-label="Perfil">' + ico("puntos") + "</a></div>";
  }

  /* Cabecera compacta: saludo, fecha y logo del entrenador */
  var DIAS_L = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function fechaLarga() { var d = new Date(); return DIAS_L[d.getDay()] + " " + d.getDate() + " " + MESES[d.getMonth()]; }
  function cabPag(titulo, sub, derecha) {
    var e = ent();
    return '<section class="hero compacto"><div class="cab-pag"><a href="#/perfil" aria-label="Perfil" style="display:contents">' + UI.avatarCli(cli(), "avatar") + "</a>" +
      '<div class="cab-txt"><small>' + esc(sub) + "</small><h1>" + esc(titulo) + "</h1></div>" + (derecha || ('<span class="marca-mini">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : ico("pulso", ' width="18" height="18"')) + "</span>")) + "</div>";
  }

  /* ───────── Hoy ───────── */
  V[""] = async function () {
    UI.tabbar(TABS, "hoy");
    app().innerHTML = UI.cargando();
    var r = await Promise.all([cargar(), V.estadoAlimHoy ? V.estadoAlimHoy() : null]);
    var d = r[0], al = r[1];
    var hoy = deHoy(d.asig), hoyISO = DB.hoyISO();
    var hechaHoy = d.ses.some(function (s) { return s.fecha === hoyISO; });
    var lunes = new Date(); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    var semana = d.ses.filter(function (s) { return s.fecha >= DB.hoyISO(lunes); }).length;
    var meta = Math.max(1, d.asig.reduce(function (t, a) { return t + (a.dias || []).length; }, 0) || d.asig.length);
    var principal = hoy || (d.asig.find(function (a) { return !(a.dias || []).length; }) || null);
    var html = A().bandaDemo() + cabPag("Hola, " + cli().nombre.split(" ")[0], fechaLarga()) + "</section><div class=\"contenido\">";

    // Entrenamiento de hoy
    if (principal) {
      html += '<div class="tarjeta entreno-hoy"><div class="lbl">' + (hoy ? "Entrenamiento de hoy" : "Tu rutina") + "</div><h2>" + esc(principal.rutina.nombre) + "</h2><p>" +
        (hechaHoy ? "✓ Ya entrenaste hoy. ¡Bien hecho!" : contar(principal.rutina) + " ejercicios · ~" + minutos(principal.rutina) + " min") + "</p>" +
        (function () {
          var its = []; (principal.rutina.bloques || []).forEach(function (b) { (b.items || []).forEach(function (it) { its.push(it); }); });
          if (!its.length) return "";
          return '<div class="ej-mini-tira">' + its.slice(0, 5).map(function (it) { return '<span title="' + esc(it.nombre) + '">' + UI.miniEj(it) + "</span>"; }).join("") + (its.length > 5 ? "<span class=\"mas\">+" + (its.length - 5) + "</span>" : "") + "</div>";
        })() +
        '<a class="btn' + (hechaHoy ? " vidrio" : "") + '" href="#/entrenar/' + principal.id + '">' + ico("play") + (hechaHoy ? "Repetir" : "Empezar") + "</a></div>";
    } else if (d.asig.length) {
      html += '<div class="tarjeta entreno-hoy"><div class="lbl">Hoy</div><h2>Día de descanso 😌</h2><p>Recupera para volver con todo. Si quieres, puedes hacer otra rutina.</p><a class="btn vidrio" href="#/entrenos">Ver mis rutinas</a></div>';
    } else {
      html += '<div class="tarjeta entreno-hoy"><div class="lbl">Bienvenido</div><h2>Todo listo</h2><p>Tu entrenador aún no te asigna rutinas. En cuanto lo haga, aparecerán aquí.</p></div>';
    }

    // Tu día: lista de pendientes
    function tarea(ok, icono, t1, t2, href, cls) {
      return '<a class="item tarea ' + (cls || "") + (ok ? " ok" : "") + '" href="' + href + '"><span class="ico">' + (ok ? ico("check") : icono) + '</span><span class="txt"><div class="t1">' + t1 + '</div><div class="t2">' + t2 + '</div></span><span class="chev">' + ico("der") + "</span></a>";
    }
    var okEnt = hechaHoy || (!hoy && d.asig.length > 0);
    UI.badge("entrenos", hoy && !hechaHoy ? 1 : 0);
    UI.badge("comida", (al && al.total ? Math.max(0, al.total - al.hechas) : 0) + (al && !al.sentir ? 1 : 0));
    var aros = [{ x: "var(--c-entreno)", t: "Entreno", v: okEnt ? 1 : 0, txt: hechaHoy ? "Hecho" : hoy ? "Pendiente" : "Descanso" }];
    if (al && al.total) aros.push({ x: "var(--c-comida)", t: "Comidas", v: al.hechas / al.total, txt: al.hechas + "/" + al.total });
    aros.push({ x: "var(--c-bienestar)", t: "Bienestar", v: al && al.sentir ? 1 : 0, txt: al && al.sentir ? "Listo" : "Pendiente" });
    var svg = '<svg viewBox="0 0 120 120">' + aros.map(function (a, i) {
      var rr = 52 - i * 14, cc = 2 * Math.PI * rr;
      return '<circle cx="60" cy="60" r="' + rr + '" fill="none" stroke="' + a.x + '" stroke-opacity=".18" stroke-width="11"/>' +
        '<circle cx="60" cy="60" r="' + rr + '" fill="none" stroke="' + a.x + '" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + cc.toFixed(1) + '" stroke-dashoffset="' + (cc * (1 - Math.min(1, a.v))).toFixed(1) + '"' + (a.v > 0 ? "" : ' opacity="0"') + "/>";
    }).join("") + "</svg>";
    html += '<div class="titulo-sec"><h2>Tu día</h2></div><div class="tarjeta sin-relleno"><div class="anillos">' + svg + "<ul>" +
      aros.map(function (a) { return '<li style="--x:' + a.x + '"><i></i><span>' + a.t + "</span><b>" + a.txt + "</b></li>"; }).join("") + '</ul></div><div class="lista">';
    html += tarea(okEnt, ico("pesa"), "Entrenamiento", hechaHoy ? "Hecho" : hoy ? esc(hoy.rutina.nombre) : "Hoy toca descanso", principal ? "#/entrenar/" + principal.id : "#/entrenos", "t-entreno");
    if (al && al.total) html += tarea(al.hechas >= al.total, '<span style="font-size:19px">🥗</span>', "Comidas", al.hechas + " de " + al.total + " registradas", "#/comida", "t-comida");
    html += tarea(al && al.sentir, '<span style="font-size:19px">🙂</span>', "¿Cómo te sientes?", al && al.sentir ? "Ya lo registraste" : "Toma 1 minuto", "#/comida", "t-bien");
    html += "</div></div>";

    // Tu semana
    var c = 2 * Math.PI * 25, pct = Math.min(1, semana / meta);
    html += '<div class="titulo-sec"><h2>Tu semana</h2><a href="#/entrenos">Ver plan</a></div><div class="tarjeta"><div class="promo"><div class="anillo"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>' +
      '<circle cx="29" cy="29" r="25" fill="none" stroke="var(--brand-2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(1) + '"/></svg>' +
      semana + "/" + meta + '</div><div><h3>' + (semana >= meta ? "¡Semana completa! 🔥" : "Meta: " + meta + (meta === 1 ? " entrenamiento" : " entrenamientos")) + "</h3><p>" +
      (semana >= meta ? "Cumpliste todas tus sesiones. Tu entrenador lo verá." : "Llevas " + semana + ". ¡Sigue así!") + "</p></div></div>" + tiraSemana(d, lunes) + "</div>";

    var dowHoy = new Date().getDay();
    if ((dowHoy === 0 || dowHoy === 6) && semana > 0) {
      var volS = d.ses.filter(function (s) { return s.fecha >= DB.hoyISO(lunes); }).reduce(function (t, s) { return t + (s.series || []).reduce(function (u, x) { return u + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0); }, 0);
      html += '<a class="tarjeta" href="#/progreso" style="display:block"><div class="promo"><span class="avatar" style="background:var(--brand)">' + ico("grafica") +
        '</span><div><h3>Tu semana en números 📊</h3><p>' + semana + (semana === 1 ? " entrenamiento" : " entrenamientos") + (volS ? " · " + Math.round(volS).toLocaleString("es-MX") + " kg levantados" : "") +
        ". Toca para ver tu resumen completo.</p></div></div></a>";
    }
    html += "</div>";
    app().innerHTML = html;
    UI.cargarFotos(app());
  };

  /* ───────── Entrenar: plan de la semana, rutinas e historial ───────── */
  V.entrenos = async function () {
    UI.tabbar(TABS, "entrenos");
    app().innerHTML = UI.cargando();
    var d = await cargar(), hoyDow = new Date().getDay();
    var html = A().bandaDemo() + cabPag("Entrenar", d.ses.length + (d.ses.length === 1 ? " entrenamiento hecho" : " entrenamientos hechos")) + "</section><div class=\"contenido\">";
    html += '<div class="titulo-sec"><h2>Mi semana</h2></div><div class="tarjeta sin-relleno"><div class="lista">' + [1, 2, 3, 4, 5, 6, 0].map(function (dd) {
      var rs = d.asig.filter(function (a) { return (a.dias || []).indexOf(dd) >= 0; });
      return '<div class="item"><span class="ico" style="' + (dd === hoyDow ? "background:var(--brand);color:#fff" : "") + '">' + UI.DIAS[dd] + '</span><span class="txt"><div class="t1">' +
        (rs.length ? esc(rs.map(function (a) { return a.rutina.nombre; }).join(" + ")) : '<span style="color:var(--suave)">Descanso</span>') +
        '</div><div class="t2">' + UI.DIAS_L[dd] + (dd === hoyDow ? " · hoy" : "") + "</div></span>" +
        (rs.length ? '<a class="btn chico' + (dd === hoyDow ? "" : " vidrio") + '" href="#/entrenar/' + rs[0].id + '">' + (dd === hoyDow ? "Empezar" : "Abrir") + "</a>" : "") + "</div>";
    }).join("") + "</div></div>";
    html += '<div class="titulo-sec"><h2>Mis rutinas</h2></div><div class="tarjeta sin-relleno"><div class="lista">' + (d.asig.length ? d.asig.map(function (a) {
      return '<a class="item" href="#/entrenar/' + a.id + '"><span class="ico cuadro">' + ico("rutinas") + '</span><span class="txt"><div class="t1">' + esc(a.rutina.nombre) +
        '</div><div class="t2">' + esc(UI.diasTxt(a.dias)) + " · " + contar(a.rutina) + " ejercicios · ~" + minutos(a.rutina) + ' min</div></span><span class="chev">' + ico("der") + "</span></a>";
    }).join("") : '<div class="vacio">' + ico("rutinas") + "Cuando tu entrenador te asigne rutinas, aparecerán aquí.</div>") + "</div></div>";
    html += '<div class="titulo-sec"><h2>Historial</h2></div><div class="tarjeta sin-relleno"><div class="lista">' +
      (d.ses.length ? d.ses.slice(0, 30).map(filaSesion).join("") : '<div class="vacio">Aquí verás tus entrenamientos terminados.</div>') + "</div></div></div>";
    app().innerHTML = html;
    UI.cargarFotos(app());
    enlazarSesiones(d.ses);
  };

  // Lunes a domingo: qué días toca entrenar y cuáles ya entrenó
  function tiraSemana(d, lunes) {
    var L = ["L", "M", "M", "J", "V", "S", "D"], hoyISO = DB.hoyISO(), html = '<div class="semana-tira">';
    for (var i = 0; i < 7; i++) {
      var f = new Date(lunes); f.setDate(f.getDate() + i); var iso = DB.hoyISO(f), dow = f.getDay();
      var hecho = d.ses.some(function (s) { return s.fecha === iso; });
      var toca = d.asig.some(function (a) { return (a.dias || []).indexOf(dow) >= 0; });
      html += '<div class="' + [hecho ? "hecho" : "", toca ? "toca" : "", iso === hoyISO ? "hoy" : ""].join(" ") + '"><span>' + (hecho ? "✓" : f.getDate()) + "</span>" + L[i] + "</div>";
    }
    return html + "</div>";
  }
  function filaSesion(s) {
    var vol = (s.series || []).reduce(function (t, x) { return t + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0);
    return '<div class="item" data-ses="' + s.id + '"><span class="ico">' + ico("check") + '</span><span class="txt"><div class="t1">' + esc(s.rutina_nombre || "Rutina") +
      '</div><div class="t2">' + esc(UI.fecha(s.fecha)) + " · " + (s.series || []).length + ' series</div></span><span class="der">' +
      (vol ? Math.round(vol).toLocaleString("es-MX") + " kg" : "") + (s.calificacion ? "<small>★ " + s.calificacion + "</small>" : "") + "</span></div>";
  }
  function enlazarSesiones(ses) {
    UI.$$("[data-ses]").forEach(function (el) { el.onclick = function () { VIS.entrenador.hojaSesion(ses.find(function (s) { return s.id === el.dataset.ses; })); }; });
  }
  function hojaSemana(asig) {
    var hoy = new Date().getDay();
    UI.hoja("Mi semana", '<div class="lista" style="margin:0 -18px">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) {
      var rs = asig.filter(function (a) { return (a.dias || []).indexOf(d) >= 0; });
      return '<div class="item"><span class="ico" style="' + (d === hoy ? "background:var(--brand)" : "") + '">' + UI.DIAS[d] + '</span><span class="txt"><div class="t1">' +
        (rs.length ? esc(rs.map(function (a) { return a.rutina.nombre; }).join(" + ")) : '<span style="color:var(--suave)">Descanso</span>') +
        '</div><div class="t2">' + UI.DIAS_L[d] + (d === hoy ? " · hoy" : "") + "</div></span>" +
        (rs.length ? '<a class="btn chico vidrio" href="#/entrenar/' + rs[0].id + '">Abrir</a>' : "") + "</div>";
    }).join("") + "</div>", function (h, cerrar) { UI.$$("a", h).forEach(function (a) { a.addEventListener("click", cerrar); }); });
  }

  /* ───────── Entrenar ───────── */
  V.entrenar = async function (asigId) {
    UI.tabbar(null);
    app().innerHTML = UI.cargando();
    var a = await DB.uno("asignaciones", { id: asigId });
    if (!a) return A().ir("");
    var r = await DB.uno("rutinas", { id: a.rutina_id });
    if (!r) return A().ir("");
    var ses = await DB.sel("sesiones", { cliente_id: cli().id, terminada: true }, { orden: "fecha", desc: true, limite: 60 });
    var LL = "pulso_en_curso_" + asigId;
    var est;
    try { est = JSON.parse(localStorage.getItem(LL)); } catch (e) { est = null; }
    if (!est || est.rutina_id !== r.id) est = { rutina_id: r.id, inicio: Date.now(), v: {} };
    function guardarLocal() { try { localStorage.setItem(LL, JSON.stringify(est)); } catch (e) {} }

    function anterior(ref) {
      for (var i = 0; i < ses.length; i++) {
        var xs = (ses[i].series || []).filter(function (x) { return x.ref === ref; });
        if (xs.length) return { fecha: ses[i].fecha, series: xs };
      }
      return null;
    }
    var todos = [];
    r.bloques.forEach(function (b) { b.items.forEach(function (it) { todos.push(it); }); });
    var total = todos.reduce(function (t, it) { return t + (Number(it.series) || 1); }, 0);
    function hechas() { var n = 0; Object.keys(est.v).forEach(function (k) { est.v[k].forEach(function (s) { if (s && s.ok) n++; }); }); return n; }

    function tarjeta(it, bi) {
      var prev = anterior(it.ref);
      var vals = est.v[it.id] || (est.v[it.id] = []);
      var n = Number(it.series) || 1;
      var yt = UI.youtube(it.video) || UI.esVideoArchivo(it.video);
      var html = '<div class="tarjeta" data-it="' + it.id + '"><div class="ej-cab"><span class="ico" style="width:52px;height:52px">' + UI.miniEj(it) + '</span><div class="nom" style="font-size:17px">' +
        esc(it.nombre) + "<small>" + esc([n + " series", it.reps && it.reps + " reps", it.tiempo, it.intTipo && it.int && it.intTipo + " " + it.int, it.descanso && it.descanso + " s descanso"].filter(Boolean).join(" · ")) +
        '</small></div><button class="mini" data-ver aria-label="Ver cómo se hace">' + ico(yt ? "video" : "info") + "</button></div>" +
        (it.grupo ? '<div class="liga-super">' + ico("liga", ' width="15" height="15"') + "Superserie " + esc(it.grupo) + " · alterna con el ejercicio unido</div>" : "") +
        (it.nota ? '<div class="antes" style="color:#fff">📝 ' + esc(it.nota) + "</div>" : "") +
        (prev ? '<div class="antes">La vez pasada (' + esc(UI.fecha(prev.fecha)) + "): " + esc(prev.series.map(function (x) { return (x.peso ? UI.num(x.peso) + "×" : "") + (x.reps || "–"); }).join(", ")) + "</div>" : "") +
        '<div class="serie-cab"><span>#</span><span>kg</span><span>Reps</span><span>' + (it.intTipo === "RPE" ? "RPE" : "RIR") + "</span><span></span></div>";
      for (var i = 0; i < n; i++) {
        var v = vals[i] || {}, p = prev && prev.series[i];
        html += '<div class="serie' + (v.ok ? " ok" : "") + '" data-s="' + i + '"><span class="n">' + (i + 1) + "</span>" +
          '<input class="entrada" data-c="peso" inputmode="decimal" value="' + esc(v.peso == null ? "" : v.peso) + '" placeholder="' + esc(p && p.peso ? UI.num(p.peso) : (it.peso || "–")) + '">' +
          '<input class="entrada" data-c="reps" inputmode="numeric" value="' + esc(v.reps == null ? "" : v.reps) + '" placeholder="' + esc((p && p.reps) || String(it.reps || "").split("-")[0] || "–") + '">' +
          '<input class="entrada" data-c="rir" inputmode="decimal" value="' + esc(v.rir == null ? "" : v.rir) + '" placeholder="' + esc(it.int || "–") + '">' +
          '<button class="hecho" data-ok aria-label="Serie hecha">' + ico("check", ' stroke-width="3"') + "</button></div>";
      }
      return html + "</div>";
    }
    var t0;
    function dibujar() {
      app().innerHTML = A().bandaDemo() + '<section class="hero compacto entreno-cab"><div class="barra-sup" style="justify-content:space-between"><a class="atras" href="#/">' + ico("izq", ' width="22" height="22"') + "Salir</a>" +
        '<div class="crono-pill">' + ico("reloj", ' width="16" height="16"') + '<span id="crono">0:00</span></div></div>' +
        '<h1 class="titulo-pag" style="margin-top:14px">' + esc(r.nombre) + '</h1><div class="ent-barra"><div id="barra"></div></div>' +
        '<div class="ent-cuenta" id="cuenta"></div></section><div class="contenido">' +
        r.bloques.map(function (b, bi) {
          return b.items.length ? '<div class="titulo-sec"><h2>' + esc(b.nombre) + "</h2></div>" + b.items.map(function (it) { return tarjeta(it, bi); }).join("") : "";
        }).join("") + '<button class="btn" id="terminar">' + ico("check") + "Terminar entrenamiento</button></div>";
      progreso();
      enlazar();
    }
    function marcarCompletas() {
      UI.$$("[data-it]").forEach(function (card) {
        var it = todos.find(function (x) { return x.id === card.dataset.it; }), n = Number(it.series) || 1, v = est.v[it.id] || [];
        var listas = 0; for (var i = 0; i < n; i++) if (v[i] && v[i].ok) listas++;
        card.classList.toggle("completo", listas >= n);
      });
    }
    function progreso() {
      marcarCompletas();
      var h = hechas();
      UI.$("#barra").style.width = Math.round(h / total * 100) + "%";
      UI.$("#cuenta").textContent = h + " de " + total + " series";
    }
    function crono() {
      var s = Math.floor((Date.now() - est.inicio) / 1000);
      var el = UI.$("#crono"); if (el) el.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }
    t0 = setInterval(crono, 1000); crono();
    var tDesc = null;
    A().alSalirVista = function () { clearInterval(t0); clearInterval(tDesc); var d = UI.$(".descanso"); if (d) d.remove(); };
    function descanso(seg) {
      clearInterval(tDesc);
      var vieja = UI.$(".descanso"); if (vieja) vieja.remove();
      if (!seg) return;
      var fin = Date.now() + seg * 1000, totalD = seg * 1000, CIR = 2 * Math.PI * 21;
      var el = document.createElement("div"); el.className = "descanso";
      el.innerHTML = '<div class="d-anillo"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/><circle id="dc" cx="25" cy="25" r="21" fill="none" stroke="var(--sec)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + CIR.toFixed(1) + '"/></svg>' + ico("reloj", ' width="16" height="16"') + '</div>' +
        '<div class="txt"><small>Descanso</small><div class="reloj" id="dr"></div></div><button class="btn chico vidrio" id="d15">+15 s</button><button class="btn chico" id="dx">Saltar</button>';
      document.body.appendChild(el);
      function tick() {
        var resta = Math.max(0, fin - Date.now()), q = Math.round(resta / 1000);
        el.querySelector("#dr").textContent = Math.floor(q / 60) + ":" + String(q % 60).padStart(2, "0");
        el.querySelector("#dc").style.strokeDashoffset = (CIR * (1 - resta / totalD)).toFixed(1);
        if (q <= 0) { clearInterval(tDesc); el.remove(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); UI.aviso("¡A la siguiente serie!"); }
      }
      el.querySelector("#d15").onclick = function () { fin += 15000; totalD += 15000; tick(); };
      el.querySelector("#dx").onclick = function () { clearInterval(tDesc); el.remove(); };
      tick(); tDesc = setInterval(tick, 250);
    }
    function enlazar() {
      UI.$$("[data-it]").forEach(function (card) {
        var it = todos.find(function (x) { return x.id === card.dataset.it; });
        var vals = est.v[it.id];
        UI.$$(".serie", card).forEach(function (fila) {
          var i = Number(fila.dataset.s);
          UI.$$("input", fila).forEach(function (inp) {
            inp.oninput = function () { vals[i] = vals[i] || {}; vals[i][inp.dataset.c] = inp.value.replace(",", "."); guardarLocal(); };
          });
          fila.querySelector("[data-ok]").onclick = function () {
            vals[i] = vals[i] || {};
            UI.$$("input", fila).forEach(function (inp) { if (inp.value === "" && inp.placeholder && inp.placeholder !== "–") { inp.value = inp.placeholder; vals[i][inp.dataset.c] = inp.placeholder; } });
            vals[i].ok = !vals[i].ok; fila.classList.toggle("ok", vals[i].ok); guardarLocal(); progreso();
            if (vals[i].ok) {
              var sigEnSuper = it.grupo && (function () { var bl = r.bloques.find(function (b) { return b.items.indexOf(it) >= 0; }); var j = bl.items.indexOf(it); return bl.items[j + 1] && bl.items[j + 1].grupo === it.grupo; })();
              descanso(sigEnSuper ? 0 : Number(it.descanso) || 0);
            }
          };
        });
        card.querySelector("[data-ver]").onclick = function () {
          var yt = UI.youtube(it.video);
          UI.hoja(it.nombre, (yt ? '<iframe class="video-ej" src="' + esc(yt) + '" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>' :
              UI.esVideoArchivo(it.video) ? '<video class="video-ej" src="' + esc(it.video) + '" controls playsinline autoplay muted loop preload="metadata"></video>' : "") +
            (it.img ? '<img class="foto-ej" src="' + esc(UI.imgEj(it.img)) + '" alt="">' + (/^[\w-]+\/0\.jpg$/.test(it.img) ? '<img class="foto-ej" src="' + esc(UI.imgEj(it.img.replace("/0.jpg", "/1.jpg"))) + '" alt="">' : "") : "") +
            (it.nota ? '<div class="tarjeta" style="margin-top:12px"><p style="color:#fff">' + esc(it.nota) + "</p></div>" : "") +
            (!yt && !UI.esVideoArchivo(it.video) && !it.img ? '<div class="vacio">Tu entrenador no agregó video para este ejercicio.</div>' : ""));
        };
      });
      UI.$("#terminar").onclick = terminar;
    }
    function terminar() {
      var series = [];
      todos.forEach(function (it) {
        (est.v[it.id] || []).forEach(function (s, i) {
          if (!s || (!s.ok && !s.peso && !s.reps)) return;
          series.push({ ref: it.ref, nombre: it.nombre, serie: i + 1, peso: s.peso === "" || s.peso == null ? null : Number(s.peso), reps: s.reps === "" || s.reps == null ? null : Number(s.reps), rir: s.rir == null ? "" : s.rir });
        });
      });
      var calif = 0;
      UI.hoja("¡Buen trabajo! 💪", '<p style="color:var(--suave);margin:-6px 0 6px">' + series.length + " series registradas · " + Math.round((Date.now() - est.inicio) / 60000) + " min</p>" +
        '<div class="lbl" style="text-align:center;margin-top:10px">¿Cómo te sentiste?</div><div class="estrellas">' + [1, 2, 3, 4, 5].map(function (n) { return '<button data-n="' + n + '" aria-label="' + n + ' estrellas">' + ico("estrella") + "</button>"; }).join("") +
        '</div><div class="form"><textarea class="entrada" id="coment" placeholder="Comentario para tu entrenador (opcional)"></textarea><button class="btn" id="enviar">Guardar entrenamiento</button>' +
        '<button class="btn vidrio" data-cerrar>Seguir entrenando</button></div>', function (h, cerrar) {
        UI.$$(".estrellas button", h).forEach(function (b) {
          b.onclick = function () { calif = Number(b.dataset.n); UI.$$(".estrellas button", h).forEach(function (x) { x.classList.toggle("on", Number(x.dataset.n) <= calif); }); };
        });
        h.querySelector("#enviar").onclick = async function () {
          this.disabled = true;
          try {
            var fila = { entrenador_id: cli().entrenador_id, cliente_id: cli().id, rutina_id: r.id, rutina_nombre: r.nombre, fecha: DB.hoyISO(), terminada: true,
              comentario: h.querySelector("#coment").value.trim() || null, calificacion: calif || null, series: series,
              duracion_min: Math.max(1, Math.min(300, Math.round((Date.now() - est.inicio) / 60000))) };
            try { await DB.ins("sesiones", fila); }
            catch (e1) { if (!/duracion_min/.test(e1.message || "")) throw e1; delete fila.duracion_min; await DB.ins("sesiones", fila); }
            localStorage.removeItem(LL); cerrar(); if (UI.confeti) UI.confeti(); UI.aviso("Entrenamiento guardado ✓"); A().ir("");
          } catch (e) { UI.error(e); this.disabled = false; }
        };
      });
    }
    dibujar();
  };

  /* ───────── Progreso (Resumen · Fuerza · Cuerpo · Comida) ───────── */
  V.progreso = async function (panel) {
    UI.tabbar(TABS, "progreso");
    app().innerHTML = UI.cargando();
    var c = cli();
    var r = await Promise.all([DB.sel("sesiones", { cliente_id: c.id, terminada: true }, { orden: "fecha", desc: true }), DB.sel("medidas", { cliente_id: c.id }, { orden: "fecha" }),
      DB.sel("asignaciones", { cliente_id: c.id })]);
    var ses = r[0], med = r[1], asigC = r[2];
    var mes = DB.hoyISO().slice(0, 7);
    var delMes = ses.filter(function (s) { return s.fecha.slice(0, 7) === mes; }).length;
    var vol = ses.reduce(function (t, s) { return t + (s.series || []).reduce(function (u, x) { return u + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0); }, 0);
    var ult = med.length ? med[med.length - 1] : null;
    var ejs = UI.ejerciciosRegistrados(ses);
    var P = [{ id: "resumen", t: "Resumen" }, { id: "fuerza", t: "Fuerza" }, { id: "cuerpo", t: "Cuerpo" }, { id: "comida", t: "Comida" }];
    app().innerHTML = A().bandaDemo() + cabPag("Progreso", ses.length + (ses.length === 1 ? " entrenamiento" : " entrenamientos") + " · " + delMes + " este mes") + "</section>" +
      '<div class="contenido"><div class="datos"><div class="dato"><div class="v">' + ses.length + '</div><div class="l">Entrenos</div></div><div class="dato"><div class="v">' +
      (vol >= 10000 ? UI.num(vol / 1000) + "t" : Math.round(vol).toLocaleString("es-MX")) + '</div><div class="l">kg levantados</div></div><div class="dato"><div class="v">' + (ult && ult.peso ? UI.num(ult.peso) : "–") +
      '</div><div class="l">Peso (kg)</div></div></div>' +
      '<div class="segmento pegado" id="segP">' + P.map(function (p) { return '<button data-p="' + p.id + '">' + p.t + "</button>"; }).join("") + "</div>" +
      '<div data-pan="resumen"><div class="tarjeta" id="resumenYo"></div></div>' +
      '<div data-pan="fuerza"><div class="tarjeta">' +
      (ejs.length ? '<div class="lbl" style="margin-bottom:8px">Elige un ejercicio</div><div class="chips scroll" id="chipsEj">' + ejs.map(function (e, i) { return '<button class="chip' + (i ? "" : " on") + '" data-ref="' + esc(e.ref) + '">' + esc(e.nombre) + "</button>"; }).join("") +
        '</div><div id="graf" style="margin-top:12px"></div>' : '<div class="vacio" style="padding:10px">Registra tus pesos al entrenar y aquí verás cómo subes.</div>') + "</div></div>" +
      '<div data-pan="cuerpo"><div class="titulo-sec"><h2>Medidas y fotos</h2><button id="medir">+ Agregar</button></div><div class="tarjeta">' + VIS.entrenador.resumenMedidas(med) + "</div></div>" +
      '<div data-pan="comida"><div class="titulo-sec"><h2>Mi alimentación</h2><a href="#/comida">Ver hoy</a></div><div class="tarjeta" id="alimYo"></div></div></div>';
    VIS.entrenador.pintarFotos(med);
    UI.cargarFotos(app());
    UI.montarResumen(UI.$("#resumenYo"), { ses: ses, med: med, asig: asigC });
    if (V.cargarResumenAlim) V.cargarResumenAlim(UI.$("#alimYo"), c.id);
    function graf(ref) { UI.$("#graf").innerHTML = UI.grafica(UI.serieFuerza(ses, ref), "kg"); }
    if (ejs.length) {
      graf(ejs[0].ref);
      UI.$$("#chipsEj .chip").forEach(function (b) { b.onclick = function () { UI.$$("#chipsEj .chip").forEach(function (x) { x.classList.toggle("on", x === b); }); graf(b.dataset.ref); }; });
    }
    UI.$("#medir").onclick = function () { VIS.entrenador.hojaMedida(c); };
    function ver(pn) {
      UI.$$("#segP button").forEach(function (b) { b.classList.toggle("on", b.dataset.p === pn); });
      UI.$$("[data-pan]").forEach(function (el) { el.hidden = el.dataset.pan !== pn; });
      try { history.replaceState(null, "", "#/progreso" + (pn === "resumen" ? "" : "/" + pn)); } catch (e) {}
    }
    ver(P.some(function (p) { return p.id === panel; }) ? panel : "resumen");
    UI.$$("#segP button").forEach(function (b) { b.onclick = function () { ver(b.dataset.p); }; });
  };

  /* ───────── Perfil (agrupado como Ajustes de iPhone) ───────── */
  V.perfil = async function () {
    UI.tabbar(TABS, "perfil");
    var c = cli(), e = ent();
    function fila(id, icono, t1, t2, extra) {
      return '<' + (extra && extra.href ? 'a href="' + extra.href + '"' + (extra.fuera ? ' target="_blank" rel="noopener"' : "") : 'div') + ' class="item"' + (id ? ' id="' + id + '"' : "") + '><span class="ico">' + icono + '</span><span class="txt"><div class="t1">' + t1 + "</div>" +
        (t2 ? '<div class="t2">' + t2 + "</div>" : "") + "</span>" + (extra && extra.sinFlecha ? "" : '<span class="chev">' + ico("der") + "</span>") + "</" + (extra && extra.href ? "a" : "div") + ">";
    }
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="perfil-cab"><label class="foto-perfil" title="Cambiar foto">' + UI.avatarCli(c, "avatar grande") +
      '<span class="foto-cam">' + ico("camara") + '</span><input type="file" accept="image/*" id="fotoCli" class="oculto-vista"></label>' +
      "<div><h1>" + esc(c.nombre) + "</h1><small>" + esc(c.email || A().correo() || "Sin correo registrado") + "</small></div></div></section>" +
      '<div class="contenido">' +
      '<div class="lbl grupo">Mi entrenador</div><div class="tarjeta sin-relleno"><div class="lista">' +
      '<div class="item"><span class="ico cuadro" style="overflow:hidden">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.marca || "P"))) + '</span><span class="txt"><div class="t1">' + esc(e.marca || "Tu entrenador") +
      '</div><div class="t2">' + esc(e.nombre || "") + "</div></span></div>" +
      fila("objetivo", ico("estrella"), "Mi objetivo", c.objetivo ? esc(c.objetivo) : "Aún sin definir") + "</div></div>" +
      '<div class="lbl grupo">Mi actividad</div><div class="tarjeta sin-relleno"><div class="lista">' +
      fila("", ico("pesa"), "Entrenamientos e historial", "", { href: "#/entrenos" }) +
      fila("", '<span style="font-size:18px">🥗</span>', "Alimentación", "", { href: "#/comida" }) +
      fila("", ico("regla"), "Medidas y fotos", "", { href: "#/progreso/cuerpo" }) + "</div></div>" +
      '<div class="lbl grupo">App</div><div class="tarjeta sin-relleno"><div class="lista">' +
      fila("instalar", ico("compartir"), "Instalar en mi celular", "Para abrirla como app, sin navegador") + "</div></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + fila("salir", ico("salir"), '<span style="color:var(--malo)">Cerrar sesión</span>', "", { sinFlecha: true }) + "</div></div></div>";
    UI.$("#salir").onclick = function () { A().salir(); };
    UI.$("#objetivo").onclick = function () {
      var puede = A().esAdmin; // el admin (mantenimiento) lo puede corregir; el alumno lo ve completo
      UI.hoja("Mi objetivo", '<div class="objetivo-hoja"><span class="rut-ico">' + ico("estrella") + "</span>" +
        (puede ? '<textarea class="entrada" id="objTxt" rows="4" placeholder="Ej. Bajar 5 kg y correr 5 km">' + esc(c.objetivo || "") + "</textarea>" :
          '<p class="obj-txt">' + (c.objetivo ? esc(c.objetivo) : "Tu entrenador todavía no define tu objetivo.") + "</p>") + "</div>" +
        (puede ? '<button class="btn" id="objGuardar" style="margin-top:14px">' + ico("check") + "Guardar objetivo</button>" :
          '<p class="ayuda" style="margin-top:14px">Tu entrenador define tu objetivo para armar tus rutinas y tu plan. Si quieres cambiarlo, platícalo con ' + esc((e.nombre || "tu entrenador").split(" ")[0]) + ".</p>"), function (h, cerrar) {
        var g = h.querySelector("#objGuardar");
        if (g) g.onclick = async function () {
          this.disabled = true;
          try { var v = h.querySelector("#objTxt").value.trim(); await DB.upd("clientes", c.id, { objetivo: v || null }); A().cli.objetivo = v; cerrar(); UI.aviso("Objetivo guardado"); V.perfil(); }
          catch (er) { UI.error(er); this.disabled = false; }
        };
      });
    };
    UI.$("#instalar").onclick = function () {
      UI.hoja("Instalar la app", '<div class="lista" style="margin:0 -18px"><div class="item"><span class="ico">' + ico("compartir") + '</span><span class="txt"><div class="t1">iPhone</div><div class="t2" style="white-space:normal">En Safari, toca Compartir y luego «Agregar a pantalla de inicio».</div></span></div>' +
        '<div class="item"><span class="ico">' + ico("puntos") + '</span><span class="txt"><div class="t1">Android</div><div class="t2" style="white-space:normal">En Chrome, abre el menú ⋮ y toca «Instalar app».</div></span></div></div>');
    };
    UI.cargarFotos(app());
    UI.$("#fotoCli").onchange = async function () {
      var f = this.files[0]; if (!f) return;
      try {
        var ruta = c.entrenador_id + "/" + c.id + "/perfil-" + DB.uuid() + ".jpg";
        await DB.subir("fotos", ruta, await UI.comprimir(f, 600));
        await DB.cambiarMiFoto(ruta);
        A().cli.foto_path = ruta; UI.aviso("Foto actualizada ✓"); A().recargar();
      } catch (er) { UI.error(er); }
    };
  };
})();

