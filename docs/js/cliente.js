/* Pulso · app del cliente */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var VIS = (window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} });
  var V = VIS.cliente;
  var TABS = [
    { id: "hoy", ruta: "", ico: "inicio", txt: "Hoy" },
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

  /* ───────── Hoy ───────── */
  V[""] = async function () {
    UI.tabbar(TABS, "hoy");
    app().innerHTML = UI.cargando();
    var d = await cargar();
    var hoy = deHoy(d.asig);
    var hoyISO = DB.hoyISO();
    var hechaHoy = hoy && d.ses.some(function (s) { return s.fecha === hoyISO && s.rutina_id === hoy.rutina_id; });
    var lunes = new Date(); lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
    var semana = d.ses.filter(function (s) { return s.fecha >= DB.hoyISO(lunes); }).length;
    var meta = Math.max(1, d.asig.reduce(function (t, a) { return t + (a.dias || []).length; }, 0) || d.asig.length);
    var principal = hoy || (d.asig.find(function (a) { return !(a.dias || []).length; }) || null);
    var html = A().bandaDemo() + '<section class="hero">' + cabecera() + '<div class="saldo">';
    if (principal) {
      html += '<div class="etq">' + (hoy ? "Hoy te toca" : "Tu rutina") + '</div><div class="cifra" style="font-size:44px;letter-spacing:-1.2px">' + esc(principal.rutina.nombre) +
        '</div><div class="sub">' + (hechaHoy ? ico("check") + "Completada hoy · ¡bien hecho!" : ico("rayo") + contar(principal.rutina) + " ejercicios · ~" + minutos(principal.rutina) + " min") + "</div>";
    } else if (d.asig.length) {
      html += '<div class="etq">Hoy</div><div class="cifra" style="font-size:48px">Descanso</div><div class="sub">' + ico("info") + "Recupera. Si quieres, elige una rutina abajo.</div>";
    } else {
      html += '<div class="etq">Bienvenido</div><div class="cifra" style="font-size:40px">' + esc(cli().nombre.split(" ")[0]) + '</div><div class="sub">' + ico("info") + "Tu entrenador aún no te asigna rutinas.</div>";
    }
    html += '</div><div class="centro"><button class="pastilla" id="semana">Mi semana</button></div><div class="acciones">' +
      (principal ? '<a class="accion" href="#/entrenar/' + principal.id + '"><span class="circ">' + ico("play") + "</span>" + (hechaHoy ? "Repetir" : "Empezar") + "</a>" :
        '<button class="accion" disabled style="opacity:.4"><span class="circ">' + ico("play") + "</span>Empezar</button>") +
      '<button class="accion" id="semana2"><span class="circ">' + ico("calendario") + "</span>Semana</button>" +
      '<a class="accion" href="#/progreso"><span class="circ">' + ico("grafica") + "</span>Progreso</a>" +
      '<a class="accion" href="#/perfil"><span class="circ">' + ico("puntos") + "</span>Más</a></div></section><div class=\"contenido\">";
    var c = 2 * Math.PI * 25, pct = Math.min(1, semana / meta);
    html += '<div class="tarjeta"><div class="promo"><div class="anillo"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>' +
      '<circle cx="29" cy="29" r="25" fill="none" stroke="var(--brand-2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(1) + '"/></svg>' +
      semana + "/" + meta + '</div><div><h3>' + (semana >= meta ? "¡Semana completa! 🔥" : "Tu meta de la semana") + "</h3><p>" +
      (semana >= meta ? "Cumpliste todas tus sesiones. Tu entrenador lo verá." : "Llevas " + semana + " de " + meta + " sesiones. ¡Sigue así!") + "</p></div></div>" +
      (principal && !hechaHoy ? '<a class="btn" style="margin-top:16px" href="#/entrenar/' + principal.id + '">Empezar entrenamiento</a>' : "") + "</div>";
    var dowHoy = new Date().getDay();
    if ((dowHoy === 0 || dowHoy === 6) && semana > 0) {
      var volS = d.ses.filter(function (s) { return s.fecha >= DB.hoyISO(lunes); }).reduce(function (t, s) { return t + (s.series || []).reduce(function (u, x) { return u + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0); }, 0);
      html += '<a class="tarjeta" href="#/progreso" style="display:block"><div class="promo"><span class="avatar" style="background:var(--brand)">' + ico("grafica") +
        '</span><div><h3>Tu semana en números 📊</h3><p>' + semana + (semana === 1 ? " entrenamiento" : " entrenamientos") + (volS ? " · " + Math.round(volS).toLocaleString("es-MX") + " kg levantados" : "") +
        ". Toca para ver tu resumen completo.</p></div></div></a>";
    }
    html += '<div id="alimHoy"></div>';
    html += '<div class="titulo-sec"><h2>Mis rutinas</h2></div><div class="tarjeta sin-relleno"><div class="lista">' + (d.asig.length ? d.asig.map(function (a) {
      return '<a class="item" href="#/entrenar/' + a.id + '"><span class="ico cuadro">' + ico("rutinas") + '</span><span class="txt"><div class="t1">' + esc(a.rutina.nombre) +
        '</div><div class="t2">' + esc(UI.diasTxt(a.dias)) + " · " + contar(a.rutina) + ' ejercicios</div></span><span class="chev">' + ico("der") + "</span></a>";
    }).join("") : '<div class="vacio">' + ico("rutinas") + "Cuando tu entrenador te asigne rutinas, aparecerán aquí.</div>") + "</div></div>";
    html += '<div class="titulo-sec"><h2>Últimas sesiones</h2><a href="#/progreso">Ver todo</a></div><div class="tarjeta sin-relleno"><div class="lista">' +
      (d.ses.length ? d.ses.slice(0, 5).map(filaSesion).join("") : '<div class="vacio">Aquí verás tus entrenamientos terminados.</div>') + "</div></div></div>";
    app().innerHTML = html;
    UI.cargarFotos(app());
    if (V.tarjetaAlimHoy) V.tarjetaAlimHoy(UI.$("#alimHoy"));
    enlazarSesiones(d.ses);
    ["#semana", "#semana2"].forEach(function (s) { UI.$(s).onclick = function () { hojaSemana(d.asig); }; });
  };
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
      app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:10px"><div class="barra-sup" style="justify-content:space-between"><a class="atras" href="#/">' + ico("izq", ' width="22" height="22"') + "Salir</a>" +
        '<div style="display:flex;align-items:center;gap:8px;font-weight:700;font-variant-numeric:tabular-nums">' + ico("reloj", ' width="18" height="18"') + '<span id="crono">0:00</span></div></div>' +
        '<h1 class="titulo-pag" style="margin-top:14px">' + esc(r.nombre) + '</h1><div style="margin-top:12px;height:8px;border-radius:8px;background:rgba(255,255,255,.12);overflow:hidden"><div id="barra" style="height:100%;width:0;background:#fff;border-radius:8px;transition:width .3s"></div></div>' +
        '<div style="color:rgba(255,255,255,.8);font-size:14px;margin-top:6px" id="cuenta"></div></section><div class="contenido">' +
        r.bloques.map(function (b, bi) {
          return b.items.length ? '<div class="titulo-sec"><h2>' + esc(b.nombre) + "</h2></div>" + b.items.map(function (it) { return tarjeta(it, bi); }).join("") : "";
        }).join("") + '<button class="btn" id="terminar">' + ico("check") + "Terminar entrenamiento</button></div>";
      progreso();
      enlazar();
    }
    function progreso() {
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
      var fin = Date.now() + seg * 1000;
      var el = document.createElement("div"); el.className = "descanso";
      el.innerHTML = '<div class="reloj" id="dr"></div><div class="txt">Descanso</div><button class="btn chico vidrio" id="d15">+15 s</button><button class="btn chico" id="dx">Saltar</button>';
      document.body.appendChild(el);
      function tick() {
        var q = Math.max(0, Math.round((fin - Date.now()) / 1000));
        el.querySelector("#dr").textContent = Math.floor(q / 60) + ":" + String(q % 60).padStart(2, "0");
        if (q <= 0) { clearInterval(tDesc); el.remove(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); UI.aviso("¡A la siguiente serie!"); }
      }
      el.querySelector("#d15").onclick = function () { fin += 15000; tick(); };
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
            localStorage.removeItem(LL); cerrar(); UI.aviso("Entrenamiento guardado ✓"); A().ir("");
          } catch (e) { UI.error(e); this.disabled = false; }
        };
      });
    }
    dibujar();
  };

  /* ───────── Progreso ───────── */
  V.progreso = async function () {
    UI.tabbar(TABS, "progreso");
    app().innerHTML = UI.cargando();
    var c = cli();
    var r = await Promise.all([DB.sel("sesiones", { cliente_id: c.id, terminada: true }, { orden: "fecha", desc: true }), DB.sel("medidas", { cliente_id: c.id }, { orden: "fecha" }),
      DB.sel("asignaciones", { cliente_id: c.id })]);
    var ses = r[0], med = r[1], asigC = r[2];
    var mes = DB.hoyISO().slice(0, 7);
    var delMes = ses.filter(function (s) { return s.fecha.slice(0, 7) === mes; }).length;
    var vol = ses.reduce(function (t, s) { return t + (s.series || []).reduce(function (u, x) { return u + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0); }, 0);
    var ejs = UI.ejerciciosRegistrados(ses);
    app().innerHTML = A().bandaDemo() + '<section class="hero">' + cabecera() + '<div class="saldo"><div class="etq">Peso total levantado</div><div class="cifra">' +
      Math.round(vol).toLocaleString("es-MX") + '<small> kg</small></div><div class="sub">' + ico("fuego") + ses.length + " entrenamientos · " + delMes + " este mes</div></div></section>" +
      '<div class="contenido"><div class="titulo-sec"><h2>Mi resumen</h2></div><div class="tarjeta" id="resumenYo"></div>' +
      '<div class="titulo-sec"><h2>Mi alimentación</h2><a href="#/comida">Ver hoy</a></div><div class="tarjeta" id="alimYo"></div>' +
      '<div class="titulo-sec"><h2>Fuerza</h2></div><div class="tarjeta">' +
      (ejs.length ? '<div class="chips scroll" id="chipsEj">' + ejs.map(function (e, i) { return '<button class="chip' + (i ? "" : " on") + '" data-ref="' + esc(e.ref) + '">' + esc(e.nombre) + "</button>"; }).join("") +
        '</div><div id="graf" style="margin-top:12px"></div>' : '<div class="vacio" style="padding:10px">Registra tus pesos al entrenar y aquí verás cómo subes.</div>') + "</div>" +
      '<div class="titulo-sec"><h2>Medidas y fotos</h2><button id="medir">+ Agregar</button></div><div class="tarjeta">' + VIS.entrenador.resumenMedidas(med) + "</div>" +
      '<div class="titulo-sec"><h2>Historial</h2></div><div class="tarjeta sin-relleno"><div class="lista">' +
      (ses.length ? ses.slice(0, 50).map(filaSesion).join("") : '<div class="vacio">Aún no hay entrenamientos.</div>') + "</div></div></div>";
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
    enlazarSesiones(ses);
  };

  /* ───────── Perfil ───────── */
  V.perfil = async function () {
    UI.tabbar(TABS, "perfil");
    var c = cli(), e = ent();
    app().innerHTML = A().bandaDemo() + '<section class="hero"><div class="saldo" style="margin-top:30px"><label class="foto-perfil" title="Cambiar foto">' + UI.avatarCli(c, "avatar grande") +
      '<span class="foto-cam">' + ico("camara") + '</span><input type="file" accept="image/*" id="fotoCli" class="oculto-vista"></label>' +
      '<div class="cifra" style="font-size:30px;letter-spacing:-.5px;margin-top:12px">' + esc(c.nombre) + '</div><div class="sub">' + esc((A().usuario && A().usuario.email) || "") + "</div></div></section>" +
      '<div class="contenido"><div class="tarjeta"><div class="promo"><div class="avatar grande" style="border-radius:22px">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.marca))) +
      '</div><div><h3>' + esc(e.marca || "Tu entrenador") + "</h3><p>Entrenador: " + esc(e.nombre || "") + (c.objetivo ? "<br>Tu objetivo: " + esc(c.objetivo) : "") + "</p></div></div></div>" +
      '<div class="titulo-sec"><h2>Instalar la app</h2></div><div class="tarjeta"><p><b style="color:#fff">iPhone:</b> en Safari, botón Compartir → «Agregar a pantalla de inicio».<br>' +
      '<b style="color:#fff">Android:</b> en Chrome, menú ⋮ → «Instalar app».</p></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="salir"><span class="ico">' + ico("salir") + '</span><span class="txt"><div class="t1">Cerrar sesión</div></span></div></div></div></div>';
    UI.$("#salir").onclick = function () { A().salir(); };
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
