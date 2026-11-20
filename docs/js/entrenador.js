/* Pulso · panel del entrenador */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var V = (window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} }).entrenador;
  var TABS = [
    { id: "inicio", ruta: "", ico: "inicio", txt: "Inicio" },
    { id: "clientes", ruta: "clientes", ico: "clientes", txt: "Clientes" },
    { id: "entreno", ruta: "rutinas", ico: "pesa", txt: "Entreno" },
    { id: "dietas", ruta: "dietas", ico: "plato", txt: "Nutrición" },
    { id: "ajustes", ruta: "ajustes", ico: "ajustes", txt: "Ajustes" }
  ];
  V.__TABS = function () { return TABS; };
  function A() { return window.APP; }
  function iaActiva() { return DB.modo === "supabase" && !!(window.PULSO_CONFIG || {}).IA_ACTIVA; }
  function app() { return UI.$("#app"); }
  function eid() { return A().ent.id; }

  function avatarEnt() {
    var e = A().ent;
    return '<a class="avatar" href="#/ajustes" aria-label="Ajustes">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.nombre || e.marca))) + "</a>";
  }
  function cabecera(buscar, extra) {
    return '<div class="barra-sup">' + avatarEnt() +
      '<label class="buscador">' + ico("buscar", ' width="20" height="20"') + '<input id="buscar" placeholder="' + esc(buscar || "Buscar") + '" autocomplete="off"></label>' +
      (extra || '<a class="btn-redondo" href="#/clientes" aria-label="Clientes">' + ico("grafica") + '</a><a class="btn-redondo" href="#/rutinas" aria-label="Rutinas">' + ico("rutinas") + "</a>") + "</div>";
  }
  function atras(dest, txt) { return '<a class="atras" href="#/' + dest + '">' + ico("izq", ' width="22" height="22"') + esc(txt || "Atrás") + "</a>"; }

  /* ───────── Datos comunes ───────── */
  async function cargarTodo() {
    var r = await Promise.all([
      DB.sel("clientes", { entrenador_id: eid() }, { orden: "nombre" }),
      DB.sel("rutinas", { entrenador_id: eid() }, { orden: "actualizado", desc: true }),
      DB.sel("asignaciones", { entrenador_id: eid() }),
      DB.sel("sesiones", { entrenador_id: eid(), terminada: true }, { orden: "fecha", desc: true, limite: 300 })
    ]);
    return { clientes: r[0], rutinas: r[1], asig: r[2], ses: r[3] };
  }
  function ultimaSesion(ses, cid) { var s = ses.find(function (x) { return x.cliente_id === cid; }); return s ? s.fecha : null; }
  function inicioSemana() { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return DB.hoyISO(d); }

  /* ───────── Inicio del entrenador (tablero tipo apps de coaching) ───────── */
  V[""] = async function () {
    UI.tabbar(TABS, "inicio");
    app().innerHTML = UI.cargando();
    var hoyISO = DB.hoyISO();
    var r = await Promise.all([cargarTodo(), DB.sel("registro_alim", { entrenador_id: eid(), fecha: hoyISO }).catch(function () { return []; })]);
    var d = r[0], checkins = r[1].filter(function (x) { return x.sentir && Object.keys(x.sentir).length; });
    var activos = d.clientes.filter(function (c) { return c.activo; });
    var porIdCli = {}; d.clientes.forEach(function (c) { porIdCli[c.id] = c; });
    var lun = inicioSemana(), semana = d.ses.filter(function (s) { return s.fecha >= lun; });
    var metaSem = d.asig.filter(function (a) { var c = porIdCli[a.cliente_id]; return a.activa && c && c.activo; }).reduce(function (t, a) { return t + (a.dias || []).length; }, 0);
    var cumple = metaSem ? Math.min(100, Math.round(semana.length / metaSem * 100)) : null;
    var pendientes = activos.filter(function (c) { return !c.user_id; });
    var DL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], MS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], hoyD = new Date();
    var nombre = ((A().ent.nombre || A().ent.marca || "Profe") + "").split(" ")[0];

    var html = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag">' + avatarEnt() + '<div class="cab-txt"><small>' + DL[hoyD.getDay()] + " " + hoyD.getDate() + " " + MS[hoyD.getMonth()] +
      "</small><h1>Hola, " + esc(nombre) + '</h1></div><button class="btn-redondo" id="crear" aria-label="Crear">' + ico("mas") + "</button></div></section><div class=\"contenido\">";

    // Tarjeta principal: la semana del negocio
    var porDia = [0, 0, 0, 0, 0, 0, 0]; semana.forEach(function (s) { porDia[(new Date(s.fecha + "T12:00:00").getDay() + 6) % 7]++; });
    var maxD = Math.max.apply(null, [1].concat(porDia)), hoyIdx = (hoyD.getDay() + 6) % 7, Lt = ["L", "M", "M", "J", "V", "S", "D"];
    var cc = 2 * Math.PI * 34, pct = cumple || 0;
    html += '<div class="tarjeta semana-card"><div class="sc-top"><div class="sc-anillo"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>' +
      '<circle cx="40" cy="40" r="34" fill="none" stroke="var(--sec)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + cc.toFixed(1) + '" stroke-dashoffset="' + (cc * (1 - pct / 100)).toFixed(1) + '"/></svg><b>' + (cumple == null ? "–" : cumple + "%") + "</b></div>" +
      '<div style="flex:1;min-width:0"><div class="lbl">Cumplimiento de la semana</div><h2>' + semana.length + (metaSem ? " de " + metaSem : "") + " entrenos</h2><p>" + activos.length + (activos.length === 1 ? " cliente activo" : " clientes activos") + "</p></div></div>" +
      '<div class="sc-barras">' + porDia.map(function (n, i) {
        return '<div class="' + (i === hoyIdx ? "hoy" : i > hoyIdx ? "fut" : "") + '"><span><i style="height:' + (n ? Math.max(10, Math.round(n / maxD * 100)) : 0) + '%"></i></span><small>' + Lt[i] + "</small>" + (n ? "<em>" + n + "</em>" : "") + "</div>";
      }).join("") + "</div></div>";

    // Necesitan atención (con el motivo)
    var hoyMs = new Date(hoyISO + "T12:00:00").getTime();
    var atn = activos.filter(function (c) { return c.user_id; }).map(function (c) {
      var u = ultimaSesion(d.ses, c.id), tiene = d.asig.some(function (a) { return a.cliente_id === c.id && a.activa; });
      if (!tiene) return { c: c, t: "Sin rutina asignada", g: 1 };
      if (!u) return { c: c, t: "Todavía no entrena", g: 2 };
      var dias = Math.round((hoyMs - new Date(u + "T12:00:00").getTime()) / 864e5);
      return dias > 7 ? { c: c, t: dias + " días sin entrenar", g: dias > 14 ? 3 : 2 } : null;
    }).filter(Boolean).sort(function (a, b) { return b.g - a.g; });
    if (atn.length) html += '<div class="titulo-sec"><h2>Necesitan atención</h2><a href="#/clientes">Ver todos</a></div><div class="tarjeta sin-relleno"><div class="lista">' +
      atn.slice(0, 5).map(function (x) {
        return '<a class="item" href="#/cliente/' + x.c.id + '"><span style="position:relative;flex:none">' + UI.avatarCli(x.c) + '<i class="alerta g' + x.g + '"></i></span><span class="txt"><div class="t1">' + esc(x.c.nombre) +
          '</div><div class="t2">' + esc(x.t) + '</div></span><span class="chev">' + ico("der") + "</span></a>";
      }).join("") + "</div></div>";

    if (pendientes.length) html += '<a class="tarjeta aviso-card" href="#/cliente/' + pendientes[0].id + '" style="display:block"><div class="promo"><span class="rut-ico c-racha-bg">' + ico("enlace") + '</span><div style="flex:1"><h3>' +
      pendientes.length + (pendientes.length === 1 ? " cliente no ha entrado" : " clientes no han entrado") + "</h3><p>Mándales su enlace por WhatsApp para que vean su programa.</p></div>" + '<span class="chev">' + ico("der") + "</span></div></a>";

    // Hoy entrenan
    var dowH = hoyD.getDay();
    var hoyE = activos.map(function (c) {
      var a = d.asig.find(function (x) { return x.cliente_id === c.id && x.activa && (x.dias || []).indexOf(dowH) >= 0; });
      if (!a) return null;
      var rt = d.rutinas.find(function (x) { return x.id === a.rutina_id; });
      return { c: c, rt: rt, hecho: d.ses.some(function (s) { return s.cliente_id === c.id && s.fecha === hoyISO; }) };
    }).filter(Boolean);
    if (hoyE.length) {
      var hechosH = hoyE.filter(function (x) { return x.hecho; }).length;
      html += '<div class="titulo-sec"><h2>Hoy entrenan</h2><span class="adm-de">' + hechosH + " de " + hoyE.length + ' listos</span></div><div class="tarjeta sin-relleno"><div class="lista">' +
        hoyE.map(function (x) {
          return '<a class="item" href="#/cliente/' + x.c.id + '">' + UI.avatarCli(x.c) + '<span class="txt"><div class="t1">' + esc(x.c.nombre) + '</div><div class="t2">' + esc(x.rt ? x.rt.nombre : "Rutina") + "</div></span>" +
            (x.hecho ? '<span class="estado e-ok">✓ Hecho</span>' : '<span class="estado e-pend">Pendiente</span>') + "</a>";
        }).join("") + "</div></div>";
    }

    // Check-ins de hoy (¿cómo se sienten?)
    var CAR = ["😣", "🙁", "😐", "🙂", "😄"];
    if (checkins.length) html += '<div class="titulo-sec"><h2>Cómo se sienten hoy</h2><span class="adm-de">' + checkins.length + (checkins.length === 1 ? " registro" : " registros") + '</span></div><div class="checkins">' +
      checkins.map(function (k) {
        var c = porIdCli[k.cliente_id]; if (!c) return "";
        var vs = Object.keys(k.sentir).map(function (n) { return k.sentir[n]; }), prom = vs.reduce(function (t, v) { return t + v; }, 0) / vs.length;
        var bajo = Object.keys(k.sentir).filter(function (n) { return k.sentir[n] <= 2; });
        return '<a class="checkin" href="#/cliente/' + c.id + '">' + UI.avatarCli(c, "avatar chico") + '<span class="cara">' + CAR[Math.max(0, Math.min(4, Math.round(prom) - 1))] + "</span><b>" + esc(c.nombre.split(" ")[0]) + "</b><small>" +
          (bajo.length ? "↓ " + esc(bajo.slice(0, 2).join(", ")) : "Todo bien") + "</small></a>";
      }).join("") + "</div>";

    // Logros y actividad
    var feed = d.ses.slice(0, 6);
    html += '<div class="titulo-sec"><h2>Actividad de tus alumnos</h2></div>';
    if (!feed.length) html += '<div class="tarjeta"><div class="vacio" style="padding:8px">' + ico("fuego") + "Cuando tus alumnos terminen un entrenamiento, aparecerá aquí.</div></div>";
    feed.forEach(function (s) {
      var c = porIdCli[s.cliente_id] || { nombre: "Alumno" };
      var vol = (s.series || []).reduce(function (t, x) { return t + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0);
      var previos = d.ses.filter(function (x) { return x.cliente_id === s.cliente_id && x.rutina_id === s.rutina_id && x.fecha < s.fecha; });
      var maxPrev = Math.max.apply(null, [0].concat(previos.map(function (x) { return (x.series || []).reduce(function (t, y) { return t + (Number(y.peso) || 0) * (Number(y.reps) || 0); }, 0); })));
      var record = vol > 0 && previos.length && vol > maxPrev;
      html += '<a class="tarjeta feed" href="#/cliente/' + s.cliente_id + '"><div class="promo">' + UI.avatarCli(c, "avatar") + '<div style="flex:1;min-width:0"><p class="f1"><b>' + esc(c.nombre.split(" ")[0]) + "</b> terminó <b>" + esc(s.rutina_nombre || "su rutina") +
        '</b></p><p class="f2">' + esc(UI.fecha(s.fecha)) + (vol ? " · " + Math.round(vol).toLocaleString("es-MX") + " kg" : "") + (s.calificacion ? " · ★ " + s.calificacion : "") + "</p></div></div>" +
        (record ? '<div class="logro">🏆 Nuevo récord de volumen en esta rutina</div>' : "") + (s.comentario ? '<div class="burbuja">“' + esc(s.comentario) + "”</div>" : "") + "</a>";
    });
    html += "</div>";
    app().innerHTML = html;
    UI.cargarFotos(app());
    UI.$("#crear").onclick = function () {
      UI.hoja("Crear", '<div class="lista" style="margin:0 -18px">' +
        '<button class="item fila-btn" data-c="cliente"><span class="ico c-racha-bg">' + ico("persona") + '</span><span class="txt"><div class="t1">Nuevo cliente</div><div class="t2">Dalo de alta y mándale su enlace</div></span></button>' +
        '<a class="item" href="#/rutina/nueva"><span class="ico c-entreno-bg">' + ico("pesa") + '</span><span class="txt"><div class="t1">Nueva rutina</div><div class="t2">Arma bloques con la biblioteca</div></span></a>' +
        '<a class="item" href="#/dieta/nueva"><span class="ico c-comida-bg">' + ico("plato") + '</span><span class="txt"><div class="t1">Nuevo plan de comida</div><div class="t2">De lunes a domingo, con el recetario</div></span></a>' +
        '<button class="item fila-btn" data-c="asignar"><span class="ico c-bien-bg">' + ico("calendario") + '</span><span class="txt"><div class="t1">Asignar rutina</div><div class="t2">A uno de tus clientes</div></span></button></div>', function (h, cerrar) {
        UI.$$("a", h).forEach(function (a) { a.addEventListener("click", cerrar); });
        h.querySelector('[data-c="cliente"]').onclick = function () { cerrar(); hojaCliente(); };
        h.querySelector('[data-c="asignar"]').onclick = function () { cerrar(); hojaAsignar({ clientes: d.clientes, rutinas: d.rutinas }); };
      });
    };
  };
  function anillo(txt, pct) {
    var c = 2 * Math.PI * 25;
    return '<div class="anillo"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>' +
      '<circle cx="29" cy="29" r="25" fill="none" stroke="var(--brand-2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' +
      (c * (1 - pct)).toFixed(1) + '"/></svg>' + esc(txt) + "</div>";
  }

  /* ───────── Clientes (vistas por estado, como los paneles de coaching) ───────── */
  function cumpleClase(p) { return p >= 80 ? "alto" : p >= 50 ? "medio" : "bajo"; }
  function minutosRutina(r) {
    var s = 0;
    (r.bloques || []).forEach(function (b) { b.items.forEach(function (it) { var n = Number(it.series) || 1; s += n * (40 + (Number(it.descanso) || 60)); }); });
    return Math.max(10, Math.round(s / 60 / 5) * 5);
  }
  V.clientes = async function (q) {
    UI.tabbar(TABS, "clientes");
    app().innerHTML = UI.cargando();
    var r = await Promise.all([cargarTodo(), DB.sel("asig_alim", { entrenador_id: eid() }).catch(function () { return []; })]);
    var d = r[0], dietas = r[1].filter(function (a) { return a.activa !== false; });
    var lun = inicioSemana(), h7 = new Date(); h7.setDate(h7.getDate() - 7); h7 = DB.hoyISO(h7);
    var ORDEN = { atencion: 0, aldia: 1, sinentrar: 2, pausado: 3 };
    var filas = d.clientes.map(function (c) {
      var asA = d.asig.filter(function (a) { return a.cliente_id === c.id && a.activa; });
      var meta = asA.reduce(function (t, a) { return t + (a.dias || []).length; }, 0);
      var hechas = d.ses.filter(function (s) { return s.cliente_id === c.id && s.fecha >= lun; }).length;
      var u = ultimaSesion(d.ses, c.id);
      var est = !c.activo ? "pausado" : !c.user_id ? "sinentrar" : (!u || u < h7) ? "atencion" : "aldia";
      return { c: c, asA: asA, meta: meta, hechas: hechas, pct: meta ? Math.min(100, Math.round(hechas / meta * 100)) : null, u: u, est: est,
        dieta: dietas.some(function (a) { return a.cliente_id === c.id; }) };
    }).sort(function (a, b) { return (ORDEN[a.est] - ORDEN[b.est]) || a.c.nombre.localeCompare(b.c.nombre); });
    var F = [{ id: "todos", t: "Todos" }, { id: "atencion", t: "⚠️ Atención" }, { id: "aldia", t: "Al día" }, { id: "sinentrar", t: "Sin entrar" }, { id: "pausado", t: "Pausados" }];
    var activos = d.clientes.filter(function (c) { return c.activo; }).length;
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag">' + avatarEnt() + '<div class="cab-txt"><small>' + activos + (activos === 1 ? " cliente activo" : " clientes activos") +
      '</small><h1>Clientes</h1></div><button class="btn-redondo" id="nuevo" aria-label="Nuevo cliente">' + ico("mas") + "</button></div></section>" +
      '<div class="contenido"><label class="buscador buscador-c">' + ico("buscar", ' width="19" height="19"') + '<input id="buscar" placeholder="Buscar cliente" autocomplete="off"></label>' +
      '<div class="chips scroll" id="filtros">' + F.map(function (f) {
        var n = f.id === "todos" ? filas.length : filas.filter(function (x) { return x.est === f.id; }).length;
        return n || f.id === "todos" ? '<button class="chip' + (f.id === "todos" ? " on" : "") + '" data-f="' + f.id + '">' + f.t + ' <span class="cuenta">' + n + "</span></button>" : "";
      }).join("") + "</div>" +
      '<div class="tarjeta sin-relleno"><div class="lista" id="lista"></div></div></div>';
    var filtro = "todos", busq = q || "";
    UI.$("#buscar").value = busq;
    var TXT = { atencion: "Más de 7 días sin entrenar", aldia: "", sinentrar: "Aún no entra a la app", pausado: "Pausado" };
    function lista() {
      var n = UI.normal(busq);
      var fs = filas.filter(function (x) { return (filtro === "todos" || x.est === filtro) && (!n || UI.normal(x.c.nombre + " " + (x.c.email || "")).indexOf(n) >= 0); });
      UI.$("#lista").innerHTML = fs.length ? fs.map(function (x) {
        var c = x.c, t2 = x.est === "aldia" ? UI.hace(x.u) : TXT[x.est];
        var der = x.est === "pausado" ? '<span class="etiqueta gris">Pausado</span>' : x.est === "sinentrar" ? '<span class="etiqueta ambar">Invitar</span>' :
          x.pct == null ? '<span class="etiqueta gris">Sin rutina</span>' : '<span class="cumple ' + cumpleClase(x.pct) + '">' + x.pct + "%</span><small>esta semana</small>";
        return '<a class="item cli-fila est-' + x.est + '" href="#/cliente/' + c.id + '"><span style="position:relative;flex:none">' + UI.avatarCli(c) + (x.est === "atencion" ? '<i class="alerta"></i>' : "") + "</span>" +
          '<span class="txt"><div class="t1">' + esc(c.nombre) + '</div><div class="t2">' + esc(t2) + '</div><div class="cli-tags">' +
          (x.asA.length ? '<span class="tag t-entreno">' + ico("pesa") + x.hechas + "/" + (x.meta || x.asA.length) + "</span>" : "") + (x.dieta ? '<span class="tag t-comida">🥗 Dieta</span>' : "") +
          '</div></span><span class="der">' + der + "</span></a>";
      }).join("") : '<div class="vacio">' + ico("clientes") + (d.clientes.length ? "Nadie coincide." : "Aún no tienes clientes. Pulsa + para dar de alta al primero.") + "</div>";
      UI.cargarFotos(UI.$("#lista"));
    }
    lista();
    UI.$("#buscar").oninput = function () { busq = this.value; lista(); };
    UI.$$("#filtros .chip").forEach(function (b) { b.onclick = function () { filtro = b.dataset.f; UI.$$("#filtros .chip").forEach(function (x) { x.classList.toggle("on", x === b); }); lista(); }; });
    UI.$("#nuevo").onclick = function () { hojaCliente(); };
  };

  function hojaCliente(c) {
    c = c || {};
    UI.hoja(c.id ? "Editar cliente" : "Nuevo cliente", '<div class="form">' +
      '<div class="campo"><label>Nombre</label><input class="entrada" id="cNombre" value="' + esc(c.nombre || "") + '" placeholder="Nombre y apellido"></div>' +
      '<div class="campo"><label>Teléfono (para WhatsApp)</label><input class="entrada" id="cTel" type="tel" value="' + esc(c.telefono || "") + '" placeholder="81 1234 5678"></div>' +
      '<div class="campo"><label>Correo (opcional)</label><input class="entrada" id="cEmail" type="email" value="' + esc(c.email || "") + '"></div>' +
      '<div class="campo"><label>Objetivo</label><input class="entrada" id="cObj" value="' + esc(c.objetivo || "") + '" placeholder="Ganar fuerza, bajar de peso…"></div>' +
      '<div class="campo"><label>Notas privadas</label><textarea class="entrada" id="cNotas" placeholder="Lesiones, horarios, lo que necesites recordar">' + esc(c.notas || "") + "</textarea></div>" +
      (c.id ? '<label class="item" style="padding:6px 4px"><span class="txt"><div class="t1">Cliente activo</div><div class="t2">Si lo pausas, deja de contar como activo</div></span><input type="checkbox" id="cActivo" ' + (c.activo ? "checked" : "") + ' style="width:22px;height:22px"></label>' : "") +
      '<button class="btn" id="cGuardar">' + (c.id ? "Guardar cambios" : "Crear cliente") + "</button>" +
      (c.id ? '<button class="btn peligro" id="cBorrar">' + ico("basura") + "Eliminar cliente</button>" : "") + "</div>", function (h, cerrar) {
      h.querySelector("#cGuardar").onclick = async function () {
        var datos = { nombre: h.querySelector("#cNombre").value.trim(), telefono: h.querySelector("#cTel").value.trim(), email: h.querySelector("#cEmail").value.trim(),
          objetivo: h.querySelector("#cObj").value.trim(), notas: h.querySelector("#cNotas").value.trim() };
        if (!datos.nombre) return UI.aviso("Escribe el nombre", true);
        if (c.id) datos.activo = h.querySelector("#cActivo").checked;
        try {
          var g = c.id ? await DB.upd("clientes", c.id, datos) : await DB.ins("clientes", Object.assign({ entrenador_id: eid() }, datos));
          cerrar(); UI.aviso(c.id ? "Guardado ✓" : "Cliente creado ✓");
          A().ir("cliente/" + g.id);
        } catch (e) { UI.error(e); }
      };
      var b = h.querySelector("#cBorrar");
      if (b) b.onclick = async function () {
        if (!(await UI.confirmar("¿Eliminar a " + c.nombre + "?", "Se borran también su historial, medidas y rutinas asignadas. No se puede deshacer."))) return;
        try { await DB.del("clientes", c.id); cerrar(); UI.aviso("Cliente eliminado"); A().ir("clientes"); } catch (e) { UI.error(e); }
      };
    });
  }

  function hojaInvitar(c) {
    var url = A().enlaceInvitacion(c.codigo);
    var marca = A().ent.marca || "Pulso";
    var msg = "Hola " + c.nombre.split(" ")[0] + ", ya tienes tus rutinas en " + marca + ". Entra aquí, crea tu cuenta y guárdala en tu pantalla de inicio: " + url;
    var tel = String(c.telefono || "").replace(/\D/g, "");
    if (tel.length === 10) tel = "52" + tel;
    UI.hoja("Invitar a " + c.nombre.split(" ")[0], '<p style="color:var(--suave);margin:0 0 14px;line-height:1.4">' +
      (c.user_id ? "Este cliente ya entró a la app. Puedes volver a mandarle el enlace si lo necesita." : "Mándale su enlace personal. Con él crea su cuenta y ve sus rutinas.") +
      '</p><div class="tarjeta" style="word-break:break-all;font-size:14px;color:var(--suave)">' + esc(url) + '</div><div class="form" style="margin-top:14px">' +
      '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + tel + "?text=" + encodeURIComponent(msg) + '">' + ico("whatsapp") + "Mandar por WhatsApp</a>" +
      '<button class="btn vidrio" id="copiar">' + ico("copiar") + "Copiar enlace</button>" +
      (navigator.share ? '<button class="btn vidrio" id="compartir">' + ico("compartir") + "Compartir…</button>" : "") + "</div>", function (h) {
      h.querySelector("#copiar").onclick = function () { UI.copiar(url); };
      var s = h.querySelector("#compartir"); if (s) s.onclick = function () { navigator.share({ title: marca, text: msg }).catch(function () {}); };
    });
  }

  function hojaAsignar(o) {
    var a = o.asig || {};
    var dias = (a.dias || []).slice();
    var cli = o.clienteId || a.cliente_id || "", rut = o.rutinaId || a.rutina_id || "";
    UI.hoja(a.id ? "Editar asignación" : "Asignar rutina", '<div class="form">' +
      (o.clienteId || a.id ? "" : '<div class="campo"><label>Cliente</label><select class="entrada" id="aCli"><option value="">Elige un cliente</option>' +
        (o.clientes || []).filter(function (c) { return c.activo; }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === cli ? " selected" : "") + ">" + esc(c.nombre) + "</option>"; }).join("") + "</select></div>") +
      (o.rutinaId || a.id ? "" : '<div class="campo"><label>Rutina</label><select class="entrada" id="aRut"><option value="">Elige una rutina</option>' +
        (o.rutinas || []).map(function (r) { return '<option value="' + r.id + '"' + (r.id === rut ? " selected" : "") + ">" + esc(r.nombre) + "</option>"; }).join("") + "</select></div>") +
      '<div class="campo"><label>¿Qué días le toca?</label><div class="dias" id="aDias">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) {
        return '<button data-d="' + d + '" class="' + (dias.indexOf(d) >= 0 ? "on" : "") + '">' + UI.DIAS[d][0] + "</button>"; }).join("") + "</div>" +
      '<p class="nota-demo" style="text-align:left;padding-left:4px">Sin días marcados, la rutina queda disponible para cuando quiera.</p></div>' +
      '<button class="btn" id="aGuardar">' + (a.id ? "Guardar" : "Asignar") + "</button>" +
      (a.id ? '<button class="btn peligro" id="aQuitar">Quitar rutina al cliente</button>' : "") + "</div>", function (h, cerrar) {
      UI.$$("#aDias button", h).forEach(function (b) {
        b.onclick = function () { var d = Number(b.dataset.d), i = dias.indexOf(d); if (i >= 0) dias.splice(i, 1); else dias.push(d); b.classList.toggle("on"); };
      });
      h.querySelector("#aGuardar").onclick = async function () {
        var c = o.clienteId || a.cliente_id || h.querySelector("#aCli").value;
        var r = o.rutinaId || a.rutina_id || h.querySelector("#aRut").value;
        if (!c || !r) return UI.aviso("Elige cliente y rutina", true);
        try {
          if (a.id) await DB.upd("asignaciones", a.id, { dias: dias });
          else await DB.ins("asignaciones", { entrenador_id: eid(), cliente_id: c, rutina_id: r, dias: dias, activa: true });
          cerrar(); UI.aviso("Rutina asignada ✓"); A().recargar();
        } catch (e) { UI.error(e); }
      };
      var q = h.querySelector("#aQuitar");
      if (q) q.onclick = async function () { try { await DB.del("asignaciones", a.id); cerrar(); UI.aviso("Rutina quitada"); A().recargar(); } catch (e) { UI.error(e); } };
    });
  }

  /* ───────── Ficha del cliente ───────── */
  V.cliente = async function (id) {
    UI.tabbar(TABS, "clientes");
    app().innerHTML = UI.cargando();
    var r = await Promise.all([
      DB.uno("clientes", { id: id }),
      DB.sel("asignaciones", { cliente_id: id }),
      DB.sel("rutinas", { entrenador_id: eid() }, { orden: "nombre" }),
      DB.sel("sesiones", { cliente_id: id, terminada: true }, { orden: "fecha", desc: true }),
      DB.sel("medidas", { cliente_id: id }, { orden: "fecha" })
    ]);
    var c = r[0], asig = r[1], rutinas = r[2], ses = r[3], med = r[4];
    if (!c) return A().ir("clientes");
    var rutPorId = {}; rutinas.forEach(function (x) { rutPorId[x.id] = x; });
    var lunI = inicioSemana(), semana = ses.filter(function (s) { return s.fecha >= lunI; }).length;
    var asA = asig.filter(function (a) { return a.activa; });
    var metaF = asA.reduce(function (t, a) { return t + (a.dias || []).length; }, 0);
    var pctF = metaF ? Math.min(100, Math.round(semana / metaF * 100)) : null;
    var h7 = new Date(); h7.setDate(h7.getDate() - 7); h7 = DB.hoyISO(h7);
    var est = !c.activo ? ["gris", "Pausado"] : !c.user_id ? ["ambar", "Sin entrar"] : (!ses[0] || ses[0].fecha < h7) ? ["coral", "Necesita atención"] : ["verde", "Al día"];
    // racha: semanas seguidas con al menos un entrenamiento
    var semanas = {}; ses.forEach(function (s) { var d = new Date(s.fecha + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); semanas[DB.hoyISO(d)] = 1; });
    var racha = 0, cur = new Date(lunI + "T12:00:00"); if (!semanas[lunI]) cur.setDate(cur.getDate() - 7);
    while (semanas[DB.hoyISO(cur)]) { racha++; cur.setDate(cur.getDate() - 7); }
    var pesoU = med.filter(function (m) { return m.peso; }).slice(-1)[0];
    var ejs = UI.ejerciciosRegistrados(ses);
    var tel = c.telefono ? (function (t) { t = t.replace(/\D/g, ""); return t.length === 10 ? "52" + t : t; })(c.telefono) : "";

    var html = A().bandaDemo() + '<section class="hero compacto"><div class="barra-sup" style="justify-content:space-between">' + atras("clientes", "Clientes") +
      '<button class="btn-redondo" id="editar" aria-label="Editar">' + ico("editar") + "</button></div>" +
      '<div class="perfil-cab"><label class="foto-perfil" title="Cambiar foto">' + UI.avatarCli(c, "avatar grande") +
      '<span class="foto-cam">' + ico("camara") + '</span><input type="file" accept="image/*" id="fotoCli" class="oculto-vista"></label>' +
      '<div style="min-width:0;flex:1"><h1>' + esc(c.nombre) + "</h1><small>" + esc(c.objetivo || "Sin objetivo definido") + '</small><div class="cli-tags" style="margin-top:8px"><span class="tag est-' + est[0] + '">' + est[1] + "</span>" +
      (c.email ? '<span class="tag">' + esc(c.email) + "</span>" : "") + "</div></div></div>" +
      '<div class="acciones">' +
      '<button class="accion" id="asignar"><span class="circ c-entreno">' + ico("pesa") + "</span>Rutina</button>" +
      '<button class="accion" id="dietaCli"><span class="circ c-comida">' + ico("plato") + "</span>Dieta</button>" +
      (c.user_id ? '<button class="accion" id="medir"><span class="circ c-bien">' + ico("regla") + "</span>Medidas</button>" : '<button class="accion" id="invitar"><span class="circ c-racha">' + ico("enlace") + "</span>Invitar</button>") +
      '<a class="accion" ' + (tel ? 'target="_blank" rel="noopener" href="https://wa.me/' + tel + '"' : 'href="javascript:void 0" id="sinTel"') + '><span class="circ c-ok">' + ico("whatsapp") + "</span>Mensaje</a></div></section>" +
      '<div class="contenido"><div class="kpi4">' +
      '<div><b class="' + (pctF == null ? "" : "c-" + cumpleClase(pctF)) + '">' + (metaF ? semana + "/" + metaF : semana) + "</b><small>Esta semana</small></div>" +
      "<div><b>" + (racha ? "🔥 " + racha : "0") + "</b><small>" + (racha === 1 ? "Semana seguida" : "Semanas seguidas") + "</small></div>" +
      "<div><b>" + ses.length + "</b><small>Entrenos</small></div>" +
      "<div><b>" + (pesoU ? UI.num(pesoU.peso) : "–") + "</b><small>Peso (kg)</small></div></div>" +
      '<div class="segmento pegado seg5" id="segF"><button data-p="resumen">Resumen</button><button data-p="semana">Semana</button><button data-p="entreno">Entreno</button><button data-p="comida">Comida</button><button data-p="medidas">Cuerpo</button></div>';

    // ── Resumen ──
    html += '<div data-pan="resumen">';
    if (!c.user_id) html += '<div class="tarjeta aviso-card"><h3>Aún no entra a la app</h3><p>Mándale su enlace para que cree su cuenta y vea su programa.</p><button class="btn" style="margin-top:14px" id="invitar2">' + ico("whatsapp") + "Mandar invitación</button></div>";
    html += '<div class="titulo-sec"><h2>Programa actual</h2></div><div class="tarjeta sin-relleno"><div class="lista">' +
      (asig.length ? asig.map(function (a) {
        var rt = rutPorId[a.rutina_id] || { nombre: "Rutina eliminada" };
        var n = (rt.bloques || []).reduce(function (t, b) { return t + b.items.length; }, 0);
        return '<div class="item" data-asig="' + a.id + '"><span class="ico cuadro c-entreno-bg">' + ico("pesa") + '</span><span class="txt"><div class="t1">' + esc(rt.nombre) +
          '</div><div class="t2">' + esc(UI.diasTxt(a.dias)) + " · " + n + " ejercicios" + (a.activa ? "" : " · pausada") + '</div></span><span class="chev">' + ico("der") + "</span></div>";
      }).join("") : '<div class="item" id="asignar3"><span class="ico cuadro c-entreno-bg">' + ico("mas") + '</span><span class="txt"><div class="t1">Asignar una rutina</div><div class="t2">Aún no tiene entrenamiento</div></span><span class="chev">' + ico("der") + "</span></div>") +
      '<div class="item" id="progAlim"><span class="ico cuadro c-comida-bg"><span style="font-size:19px">🥗</span></span><span class="txt"><div class="t1">Plan de comida</div><div class="t2" id="progAlimTxt">Cargando…</div></span><span class="chev">' + ico("der") + "</span></div></div></div>";
    if (ses[0]) {
      var s0 = ses[0], vol0 = (s0.series || []).reduce(function (t, x) { return t + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0);
      html += '<div class="titulo-sec"><h2>Último entrenamiento</h2></div><div class="tarjeta ult-ses" data-ses="' + s0.id + '"><div class="promo"><span class="rut-ico">' + ico("check") + '</span><div style="flex:1;min-width:0"><h3>' + esc(s0.rutina_nombre || "Rutina") +
        "</h3><p>" + esc(UI.fecha(s0.fecha)) + " · " + (s0.series || []).length + " series" + (vol0 ? " · " + Math.round(vol0).toLocaleString("es-MX") + " kg" : "") + "</p></div>" +
        (s0.calificacion ? '<span class="cumple alto">★ ' + s0.calificacion + "</span>" : "") + "</div>" + (s0.comentario ? '<div class="burbuja">“' + esc(s0.comentario) + "”</div>" : "") + "</div>";
    }
    html += '<div class="titulo-sec"><h2>Notas privadas</h2><button id="editarNotas">Editar</button></div><div class="tarjeta"><p style="white-space:pre-wrap">' + (c.notas ? esc(c.notas) : '<span style="color:var(--tenue)">Lesiones, preferencias, horarios… Solo tú las ves.</span>') + "</p></div>";
    html += "</div>";

    // ── Entreno ──
    html += '<div data-pan="entreno"><div class="titulo-sec"><h2>Resumen de progreso</h2></div><div class="tarjeta" id="resumenCli"></div>' +
      '<div class="titulo-sec"><h2>Progreso de fuerza</h2></div><div class="tarjeta">' +
      (ejs.length ? '<div class="chips scroll" id="chipsEj">' + ejs.map(function (e, i) { return '<button class="chip' + (i ? "" : " on") + '" data-ref="' + esc(e.ref) + '">' + esc(e.nombre) + "</button>"; }).join("") +
        '</div><div id="graf" style="margin-top:12px"></div>' : '<div class="vacio" style="padding:10px">Cuando registre pesos, aquí verás su progreso.</div>') + "</div>" +
      '<div class="titulo-sec"><h2>Historial</h2></div><div class="tarjeta sin-relleno"><div class="lista">' +
      (ses.length ? ses.slice(0, 30).map(function (s) {
        return '<div class="item" data-ses="' + s.id + '"><span class="ico">' + ico("check") + '</span><span class="txt"><div class="t1">' + esc(s.rutina_nombre || "Rutina") +
          '</div><div class="t2">' + esc(UI.fecha(s.fecha)) + (s.comentario ? " · “" + esc(s.comentario) + "”" : "") + '</div></span><span class="der">' + (s.calificacion ? "★ " + s.calificacion : "") + "</span></div>";
      }).join("") : '<div class="vacio">Aún no ha entrenado.</div>') + "</div></div></div>";
    // ── Comida y Cuerpo ──
    html += '<div data-pan="comida"><div class="tarjeta" id="alimCli">' + UI.cargando().replace("cargando", "cargando chico") + "</div></div>";
    html += '<div data-pan="medidas"><div class="titulo-sec"><h2>Medidas y fotos</h2><button id="medir2">+ Agregar</button></div><div class="tarjeta" id="medidas">' + resumenMedidas(med) + "</div></div>";
    html += '<div data-pan="semana" hidden><div id="semanaCli">' + UI.cargando().replace("cargando", "cargando chico") + "</div></div></div>";
    app().innerHTML = html;
    pintarFotos(med);

    function verPanel(pn) {
      UI.$$("#segF button").forEach(function (b) { b.classList.toggle("on", b.dataset.p === pn); });
      UI.$$("[data-pan]").forEach(function (el) { el.hidden = el.dataset.pan !== pn; });
      try { sessionStorage.setItem("pulso_ficha_panel", pn); } catch (e) {}
    }
    var panel = "resumen"; try { panel = sessionStorage.getItem("pulso_ficha_panel") || "resumen"; } catch (e) {}
    verPanel(panel);
    UI.$$("#segF button").forEach(function (b) { b.onclick = function () { verPanel(b.dataset.p); }; });

    function graf(ref) { UI.$("#graf").innerHTML = UI.grafica(UI.serieFuerza(ses, ref), "kg"); }
    if (ejs.length) {
      graf(ejs[0].ref);
      UI.$$("#chipsEj .chip").forEach(function (b) { b.onclick = function () { UI.$$("#chipsEj .chip").forEach(function (x) { x.classList.toggle("on", x === b); }); graf(b.dataset.ref); }; });
    }
    UI.cargarFotos(app());
    UI.montarResumen(UI.$("#resumenCli"), { ses: ses, med: med, asig: asig });
    if (V.fichaAlim) V.fichaAlim(UI.$("#alimCli"), c);
    (V.planDeCliente ? V.planDeCliente(c.id) : Promise.resolve(null)).then(function (pd) {
      var t = UI.$("#progAlimTxt"); if (t) t.textContent = pd ? pd.plan.nombre + " · desde " + UI.fecha(pd.asig.inicio) : "Sin plan · toca para asignar";
    }).catch(function () {});
    UI.$("#progAlim").onclick = function () { if (V.hojaAsignarDieta) V.hojaAsignarDieta({ clienteId: c.id }); };
    UI.$("#fotoCli").onchange = async function () {
      var f = this.files[0]; if (!f) return;
      try {
        var ruta = c.entrenador_id + "/" + c.id + "/perfil-" + DB.uuid() + ".jpg";
        await DB.subir("fotos", ruta, await UI.comprimir(f, 600));
        await DB.upd("clientes", c.id, { foto_path: ruta });
        UI.aviso("Foto actualizada ✓"); A().recargar();
      } catch (er) { UI.error(er); }
    };
    UI.$("#editar").onclick = function () { hojaCliente(c); };
    UI.$("#editarNotas").onclick = function () { hojaCliente(c); };
    ["#invitar", "#invitar2"].forEach(function (s) { var b = UI.$(s); if (b) b.onclick = function () { hojaInvitar(c); }; });
    ["#asignar", "#asignar3"].forEach(function (s) { var b = UI.$(s); if (b) b.onclick = function () { hojaAsignar({ clienteId: c.id, rutinas: rutinas }); }; });
    ["#medir", "#medir2"].forEach(function (s) { var b = UI.$(s); if (b) b.onclick = function () { V.hojaMedida(c); }; });
    UI.$("#dietaCli").onclick = function () { if (V.hojaAsignarDieta) V.hojaAsignarDieta({ clienteId: c.id }); };
    var st = UI.$("#sinTel"); if (st) st.onclick = function () { UI.aviso("Agrega su teléfono con el botón de editar", true); };
    UI.$$("[data-asig]").forEach(function (el) {
      el.onclick = function () { hojaAsignar({ asig: asig.find(function (a) { return a.id === el.dataset.asig; }) }); };
    });
    UI.$$("[data-ses]").forEach(function (el) {
      el.onclick = function () { V.hojaSesion(ses.find(function (s) { return s.id === el.dataset.ses; })); };
    });
    pintarSemanaCli(c, asig, rutPorId, ses);
  };

  /* Semana del alumno tipo calendario: rutina y comida de cada día, y si cumplió */
  async function pintarSemanaCli(c, asig, rutPorId, ses) {
    var cont = UI.$("#semanaCli"); if (!cont) return;
    var pd = null; try { pd = V.planDeCliente ? await V.planDeCliente(c.id) : null; } catch (e) {}
    var DL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], hoyI = DB.hoyISO();
    var lun = new Date(inicioSemana() + "T12:00:00"), asA = asig.filter(function (a) { return a.activa; });
    var meta = 0, hechos = 0, filas = "";
    for (var i = 0; i < 7; i++) {
      var f = new Date(lun); f.setDate(f.getDate() + i); var iso = DB.hoyISO(f), dow = f.getDay();
      var rs = asA.filter(function (a) { return (a.dias || []).indexOf(dow) >= 0; }).map(function (a) { return rutPorId[a.rutina_id]; }).filter(Boolean);
      var hecho = ses.some(function (s) { return s.fecha === iso; });
      if (rs.length) { meta++; if (hecho) hechos++; }
      var est = hecho ? '<span class="estado e-ok">✓ Entrenó</span>' : !rs.length ? '<span class="estado e-off">Descanso</span>' : iso < hoyI ? '<span class="estado e-mal">No entrenó</span>' :
        iso === hoyI ? '<span class="estado e-pend">Hoy</span>' : '<span class="estado e-off">Pendiente</span>';
      var com = "";
      if (pd && V.indiceDia) { var dd = pd.plan.dias[V.indiceDia(pd.asig, pd.plan, iso)]; if (dd) { var tema = dd.nombre.replace(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s*·?\s*/, ""), nc = (dd.comidas || []).length; com = "🥗 " + [tema, nc ? nc + (nc === 1 ? " comida" : " comidas") : "Sin comidas en el plan"].filter(Boolean).join(" · "); } }
      filas += '<div class="item sem-dia' + (iso === hoyI ? " hoy" : "") + '"><span class="ico sem-num"><small>' + DL[i].slice(0, 3) + "</small>" + f.getDate() + '</span><span class="txt"><div class="t1">' +
        (rs.length ? esc(rs.map(function (r) { return r.nombre; }).join(" + ")) : '<span style="color:var(--suave)">Sin entrenamiento</span>') + '</div><div class="t2">' + esc(com || (pd ? "" : "Sin plan de alimentación")) + "</div></span>" + est + "</div>";
    }
    var pct = meta ? Math.round(hechos / meta * 100) : null;
    cont.innerHTML = '<div class="tarjeta"><div class="promo"><div style="flex:1"><h3>' + (meta ? hechos + " de " + meta + " entrenamientos" : "Sin rutinas con días asignados") + "</h3><p>Semana del " +
      lun.getDate() + " al " + (function () { var x = new Date(lun); x.setDate(x.getDate() + 6); return x.getDate(); })() + "</p></div>" + (pct != null ? '<span class="cumple grande ' + cumpleClase(pct) + '">' + pct + "%</span>" : "") + "</div>" +
      (meta ? '<div class="barrita ancha"><i class="b-' + cumpleClase(pct) + '" style="width:' + pct + '%"></i></div>' : "") + "</div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + filas + "</div></div>";
  }

  /* Compartido con la app del cliente */
  function resumenMedidas(med) {
    if (!med.length) return '<div class="vacio" style="padding:10px">Sin medidas todavía.</div>';
    var pri = med[0], ult = med[med.length - 1];
    var campos = [["peso", "Peso", "kg"], ["cintura", "Cintura", "cm"], ["cadera", "Cadera", "cm"], ["pecho", "Pecho", "cm"], ["brazo", "Brazo", "cm"], ["pierna", "Pierna", "cm"], ["grasa", "Grasa", "%"]];
    var celdas = campos.filter(function (k) { return ult[k[0]] != null && ult[k[0]] !== ""; }).map(function (k) {
      var dif = pri !== ult && pri[k[0]] != null ? Number(ult[k[0]]) - Number(pri[k[0]]) : null;
      return '<div class="dato"><div class="v">' + UI.num(ult[k[0]]) + '<small style="font-size:13px;color:var(--suave)"> ' + k[2] + '</small></div><div class="l">' + k[1] +
        (dif ? ' · <span style="color:' + (dif < 0 ? "var(--ok)" : "var(--ambar)") + '">' + (dif > 0 ? "+" : "") + UI.num(dif) + "</span>" : "") + "</div></div>";
    }).join("");
    var pesos = med.filter(function (m) { return Number(m.peso) > 0; }).map(function (m) { return { f: m.fecha, v: Number(m.peso) }; });
    return '<div class="lbl" style="margin-bottom:8px">Última: ' + esc(UI.fecha(ult.fecha)) + '</div><div class="datos">' + celdas + "</div>" +
      (pesos.length > 1 ? '<div class="lbl" style="margin:14px 0 4px">Peso corporal</div>' + UI.grafica(pesos, "kg") : "") +
      '<div class="fotos" id="fotosMed" style="margin-top:12px"></div>';
  }
  async function pintarFotos(med) {
    var cont = UI.$("#fotosMed"); if (!cont) return;
    var con = med.filter(function (m) { return m.foto_path; }).slice(-6);
    var urls = await Promise.all(con.map(function (m) { return DB.urlFirmada("fotos", m.foto_path).catch(function () { return ""; }); }));
    cont.innerHTML = urls.map(function (u, i) { return u ? '<img src="' + esc(u) + '" alt="Foto del ' + esc(UI.fecha(con[i].fecha)) + '">' : ""; }).join("");
  }
  V.resumenMedidas = resumenMedidas; V.pintarFotos = pintarFotos;

  V.hojaMedida = function (c) {
    var campos = [["peso", "Peso (kg)"], ["cintura", "Cintura (cm)"], ["cadera", "Cadera (cm)"], ["pecho", "Pecho (cm)"], ["brazo", "Brazo (cm)"], ["pierna", "Pierna (cm)"], ["grasa", "Grasa (%)"]];
    UI.hoja("Nueva medida", '<div class="form"><div class="rejilla">' + campos.map(function (k) {
      return '<div class="campo"><label>' + k[1] + '</label><input class="entrada" inputmode="decimal" data-k="' + k[0] + '"></div>'; }).join("") +
      '</div><div class="campo"><label>Foto de progreso <span class="opc">opcional</span></label>' + UI.selector("mFoto", { tipo: "foto", ayuda: "Solo la ven el alumno y su entrenador." }) + "</div>" +
      '<button class="btn" id="mGuardar">Guardar</button></div>', function (h, cerrar) {
      var selM = UI.enlazarSelector(h, "mFoto");
      h.querySelector("#mGuardar").onclick = async function () {
        var fila = { entrenador_id: c.entrenador_id, cliente_id: c.id, fecha: DB.hoyISO() }, alguno = false;
        UI.$$("[data-k]", h).forEach(function (i) { var v = i.value.replace(",", ".").trim(); if (v) { fila[i.dataset.k] = Number(v); alguno = true; } });
        var f = selM.archivo();
        if (!alguno && !f) return UI.aviso("Escribe al menos una medida o sube una foto", true);
        this.disabled = true;
        try {
          if (f) {
            var blob = await UI.comprimir(f, 1280);
            fila.foto_path = c.entrenador_id + "/" + c.id + "/" + DB.uuid() + ".jpg";
            await DB.subir("fotos", fila.foto_path, blob);
          }
          await DB.ins("medidas", fila); cerrar(); UI.aviso("Medida guardada ✓"); A().recargar();
        } catch (e) { UI.error(e); this.disabled = false; }
      };
    });
  };

  V.hojaSesion = function (s) {
    var grupos = {};
    (s.series || []).forEach(function (x) { (grupos[x.ref] = grupos[x.ref] || { nombre: x.nombre, series: [] }).series.push(x); });
    UI.hoja(s.rutina_nombre || "Sesión", '<p style="color:var(--suave);margin:-6px 0 14px">' + esc(UI.fecha(s.fecha)) + (s.calificacion ? " · ★ " + s.calificacion : "") + "</p>" +
      (s.comentario ? '<div class="tarjeta" style="margin-bottom:12px"><p style="color:#fff">“' + esc(s.comentario) + "”</p></div>" : "") +
      Object.keys(grupos).map(function (k) {
        var g = grupos[k];
        return '<div class="tarjeta" style="margin-bottom:10px;padding:14px"><h3 style="font-size:16px">' + esc(g.nombre) + "</h3>" + g.series.map(function (x) {
          return '<div style="display:flex;justify-content:space-between;color:var(--suave);font-size:14px;margin-top:6px"><span>Serie ' + x.serie + "</span><span>" +
            (x.peso ? UI.num(x.peso) + " kg × " : "") + (x.reps || "–") + (x.rir !== "" && x.rir != null ? " · RIR " + esc(x.rir) : "") + "</span></div>";
        }).join("") + "</div>";
      }).join("") + (Object.keys(grupos).length ? "" : '<div class="vacio">No registró series.</div>'));
  };

  /* ───────── Rutinas ───────── */
  V.rutinas = async function () {
    UI.tabbar(TABS, "entreno");
    app().innerHTML = UI.cargando();
    var d = await cargarTodo();
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag">' + avatarEnt() + '<div class="cab-txt"><small>Entreno</small><div class="subnav"><a class="on" href="#/rutinas">Rutinas</a><a href="#/biblioteca">Ejercicios</a></div></div>' +
      '<a class="btn-redondo" href="#/rutina/nueva" aria-label="Nueva rutina">' + ico("mas") + "</a></div></section>" +
      '<div class="contenido"><label class="buscador buscador-c">' + ico("buscar", ' width="19" height="19"') + '<input id="buscar" placeholder="Buscar rutina" autocomplete="off"></label><div id="lista" class="rut-lista"></div>' +
      '<div class="fila-btns"><a class="btn azul" href="#/rutina/nueva">' + ico("mas") + "Nueva rutina</a>" +
      (iaActiva() ? '<button class="btn" id="conIA">' + ico("chispa") + "Crear con IA</button>" : "") + "</div></div>";
    if (iaActiva()) UI.$("#conIA").onclick = function () {
      hojaIA("Crear rutina con IA", "Ej. Pierna y glúteo para principiante, 45 min, en gimnasio", [
        "Cuerpo completo para principiante, 3 días, con mancuernas",
        "Torso hipertrofia, intermedio, 60 min",
        "Pierna y glúteo, 45 min, cuida rodillas",
        "Circuito en casa sin equipo, 30 min"
      ], async function (pedido) {
        var cat = await catalogoIA();
        var res = await DB.ia({ accion: "rutina", pedido: pedido, ejercicios: cat.lista });
        var r = rutinaDesdeIA(res.rutina, cat.porRef);
        if (!r.bloques.length) throw new Error("La IA no encontró ejercicios para ese pedido. Prueba con otras palabras.");
        sessionStorage.setItem("pulso_rutina_ia", JSON.stringify(r));
        A().ir("rutina/nueva");
      });
    };
    function lista(q) {
      var n = UI.normal(q);
      var fs = d.rutinas.filter(function (r) { return !n || UI.normal(r.nombre).indexOf(n) >= 0; });
      UI.$("#lista").innerHTML = fs.length ? fs.map(function (r) {
        var ne = (r.bloques || []).reduce(function (t, b) { return t + b.items.length; }, 0);
        var nc = d.asig.filter(function (a) { return a.rutina_id === r.id; }).length;
        var musc = Array.from(new Set((r.bloques || []).reduce(function (t, b) { return t.concat(b.items.map(function (it) { return it.musculo || it.m || ""; })); }, []).filter(Boolean))).slice(0, 3);
        return '<a class="tarjeta rut-card" href="#/rutina/' + r.id + '"><div class="rut-top"><span class="rut-ico">' + ico("pesa") + '</span><div style="flex:1;min-width:0"><h3>' + esc(r.nombre) + "</h3>" +
          (r.descripcion ? "<p>" + esc(r.descripcion) + "</p>" : "") + '</div><span class="chev">' + ico("der") + '</span></div><div class="cli-tags" style="margin-top:12px">' +
          '<span class="tag">' + ne + " ejercicios</span>" + '<span class="tag">~' + minutosRutina(r) + " min</span>" + '<span class="tag t-entreno">' + ico("clientes") + nc + (nc === 1 ? " cliente" : " clientes") + "</span>" +
          musc.map(function (m) { return '<span class="tag">' + esc(m) + "</span>"; }).join("") + "</div></a>";
      }).join("") : '<div class="tarjeta"><div class="vacio">' + ico("rutinas") + (d.rutinas.length ? "Nada coincide." : "Aún no tienes rutinas. Crea la primera con el botón +.") + "</div></div>";
    }
    lista("");
    UI.$("#buscar").oninput = function () { lista(this.value); };
  };

  /* Editor */
  V.rutina = async function (id) {
    UI.tabbar(null);
    document.body.classList.add("ancho");
    app().innerHTML = UI.cargando();
    var r = id === "nueva" ? { nombre: "", descripcion: "", bloques: [{ id: DB.uuid(), nombre: "Calentamiento", items: [] }, { id: DB.uuid(), nombre: "Bloque principal", items: [] }] }
      : await DB.uno("rutinas", { id: id });
    if (!r) return A().ir("rutinas");
    var cambios = false;
    function marcar() { cambios = true; }
    var deIA = id === "nueva" && sessionStorage.getItem("pulso_rutina_ia");
    if (deIA) {
      sessionStorage.removeItem("pulso_rutina_ia");
      try { r = JSON.parse(deIA); cambios = true; setTimeout(function () { UI.aviso("✨ Rutina lista: revísala y pulsa Guardar"); }, 300); } catch (e) {}
    }
    function item(b, it, i) {
      var sigUnido = b.items[i + 1] && it.grupo && b.items[i + 1].grupo === it.grupo;
      return '<div class="ej' + (it.grupo ? " super" : "") + '" data-i="' + i + '"><div class="ej-cab"><span class="ico">' + UI.miniEj(it) + '<b class="ej-num">' + (i + 1) + '</b></span><div class="nom">' + esc(it.nombre) +
        "<small>" + esc([it.series && it.series + " series", it.reps && it.reps + " reps", it.tiempo, it.intTipo && it.int && it.intTipo + " " + it.int].filter(Boolean).join(" · ")) + "</small></div>" +
        '<button class="mini" data-acc="sube" aria-label="Subir">' + ico("arriba") + '</button><button class="mini" data-acc="quita" aria-label="Quitar">' + ico("x") + "</button></div>" +
        '<div class="ej-campos">' +
        campo("Series", "series", it.series, "numeric") + campo("Reps", "reps", it.reps, "text", "8-10") + campo("Peso kg", "peso", it.peso, "decimal") + campo("Desc. (s)", "descanso", it.descanso, "numeric") +
        '<div class="campo ancho2"><label>Intensidad</label><div style="display:flex;gap:6px"><select class="entrada" data-k="intTipo" style="flex:1">' +
        ["", "RIR", "RPE", "%"].map(function (o) { return '<option value="' + o + '"' + (it.intTipo === o ? " selected" : "") + ">" + (o || "—") + "</option>"; }).join("") +
        '</select><input class="entrada" data-k="int" value="' + esc(it.int || "") + '" style="flex:1" inputmode="decimal"></div></div>' +
        campo("Tiempo", "tiempo", it.tiempo, "text", "30 s", "ancho2") +
        '<div class="campo ancho4"><label>Nota para el cliente</label><input class="entrada izq" data-k="nota" value="' + esc(it.nota || "") + '" placeholder="Técnica, tempo, etc."></div></div>' +
        (b.items[i + 1] ? '<button class="liga-super" data-acc="une" style="background:none;border:0;cursor:pointer">' + ico("liga", ' width="15" height="15"') +
          (sigUnido ? "En superserie con el siguiente · separar" : "Unir con el siguiente (superserie / circuito)") + "</button>" : "") + "</div>";
    }
    function campo(lbl, k, v, modo, ph, cls) {
      return '<div class="campo ' + (cls || "") + '"><label>' + lbl + '</label><input class="entrada" data-k="' + k + '" value="' + esc(v == null ? "" : v) + '" inputmode="' + modo + '"' + (ph ? ' placeholder="' + ph + '"' : "") + "></div>";
    }
    function dibujar() {
      var nEj = r.bloques.reduce(function (t, b) { return t + b.items.length; }, 0), nSer = r.bloques.reduce(function (t, b) { return t + b.items.reduce(function (u, it) { return u + (Number(it.series) || 0); }, 0); }, 0);
      app().innerHTML = A().bandaDemo() + '<section class="hero compacto editor-cab"><div class="barra-sup" style="justify-content:space-between">' + atras("rutinas", "Rutinas") +
        '<div style="display:flex;gap:8px">' + (iaActiva() ? '<button class="btn-redondo" id="ajustarIA" aria-label="Ajustar con IA" title="Ajustar con IA">' + ico("chispa") + "</button>" : "") + (r.id ? '<button class="btn-redondo" id="duplicar" aria-label="Duplicar">' + ico("duplicar") + '</button><button class="btn-redondo" id="borrar" aria-label="Eliminar">' + ico("basura") + "</button>" : "") +
        '</div></div><input class="titulo-pag" id="rNombre" value="' + esc(r.nombre) + '" placeholder="Nombre de la rutina" style="background:none;border:0;outline:0;width:100%;color:#fff">' +
        '<input id="rDesc" value="' + esc(r.descripcion || "") + '" placeholder="Descripción (opcional)" style="background:none;border:0;outline:0;width:100%;color:var(--suave);font-size:16px;margin-top:4px">' +
        '<div class="cli-tags" style="margin-top:12px"><span class="tag t-entreno">' + ico("pesa") + nEj + (nEj === 1 ? " ejercicio" : " ejercicios") + '</span><span class="tag">' + nSer + ' series</span><span class="tag">~' + minutosRutina(r) + ' min</span><span class="tag">' + r.bloques.length + (r.bloques.length === 1 ? " bloque" : " bloques") + "</span></div></section>" +
        '<div class="contenido" id="bloques">' + r.bloques.map(function (b, bi) {
          return '<div class="bloque" data-b="' + bi + '"><div class="bloque-cab"><span class="bloque-num">' + (bi + 1) + '</span><input data-bn value="' + esc(b.nombre) + '" placeholder="Nombre del bloque">' +
            (bi > 0 ? '<button class="mini" data-bacc="sube" aria-label="Subir bloque">' + ico("arriba") + "</button>" : "") + '<button class="mini" data-bacc="quita" aria-label="Quitar bloque">' + ico("basura") + "</button></div>" +
            b.items.map(function (it, i) { return item(b, it, i); }).join("") +
            '<button class="btn vidrio chico" data-bacc="agrega" style="margin-top:10px;width:100%">' + ico("mas") + "Agregar ejercicio</button></div>";
        }).join("") + '<button class="btn vidrio" id="nuevoBloque">' + ico("mas") + "Agregar bloque</button>" +
        '<div class="fila-btns" style="position:sticky;bottom:calc(12px + var(--abajo));z-index:5"><button class="btn" id="guardar">' + ico("check") + "Guardar rutina</button>" +
        (r.id ? '<button class="btn azul" id="asignarR" style="flex:.6">Asignar</button>' : "") + "</div></div>";
      enlazar();
    }
    function enlazar() {
      var salir = UI.$(".hero .atras");
      if (salir) salir.onclick = async function (e) {
        if (!cambios) return;
        e.preventDefault();
        if (await UI.confirmar("¿Salir sin guardar?", "Tienes cambios en esta rutina que todavía no guardaste. Si sales, se pierden.", "Salir sin guardar")) {
          cambios = false; A().ir("rutinas");
        }
      };
      UI.$("#rNombre").oninput = function () { r.nombre = this.value; marcar(); };
      UI.$("#rDesc").oninput = function () { r.descripcion = this.value; marcar(); };
      UI.$$(".bloque").forEach(function (el) {
        var b = r.bloques[Number(el.dataset.b)];
        el.querySelector("[data-bn]").oninput = function () { b.nombre = this.value; marcar(); };
        UI.$$(".ej", el).forEach(function (ejEl) {
          var it = b.items[Number(ejEl.dataset.i)];
          UI.$$("[data-k]", ejEl).forEach(function (inp) {
            inp.oninput = inp.onchange = function () {
              var k = inp.dataset.k, v = inp.value;
              it[k] = (k === "series" || k === "descanso") ? (v === "" ? "" : Number(v)) : v; marcar();
              var sm = ejEl.querySelector(".nom small");
              sm.textContent = [it.series && it.series + " series", it.reps && it.reps + " reps", it.tiempo, it.intTipo && it.int && it.intTipo + " " + it.int].filter(Boolean).join(" · ");
            };
          });
          UI.$$("[data-acc]", ejEl).forEach(function (btn) {
            btn.onclick = function () {
              var i = Number(ejEl.dataset.i), acc = btn.dataset.acc;
              if (acc === "quita") b.items.splice(i, 1);
              if (acc === "sube" && i > 0) { var t = b.items[i - 1]; b.items[i - 1] = b.items[i]; b.items[i] = t; }
              if (acc === "une") {
                var sig = b.items[i + 1];
                if (it.grupo && sig.grupo === it.grupo) sig.grupo = "";
                else { var g = it.grupo || String.fromCharCode(65 + Math.floor(Math.random() * 26)); it.grupo = g; sig.grupo = g; }
              }
              b.items.forEach(function (x, j) { // limpia grupos sueltos
                if (x.grupo && !(b.items[j - 1] && b.items[j - 1].grupo === x.grupo) && !(b.items[j + 1] && b.items[j + 1].grupo === x.grupo)) x.grupo = "";
              });
              marcar(); dibujar();
            };
          });
        });
        UI.$$("[data-bacc]", el).forEach(function (btn) {
          btn.onclick = async function () {
            var bi = Number(el.dataset.b), acc = btn.dataset.bacc;
            if (acc === "agrega") return elegirEjercicio(function (ej) {
              b.items.push({ id: DB.uuid(), ref: ej.ref, nombre: ej.nombre, img: ej.img || "", video: ej.video || "", series: 3, reps: "10", tiempo: "", descanso: 60, peso: "", intTipo: "", int: "", nota: "", grupo: "" });
              marcar(); dibujar();
              setTimeout(function () { var bl = UI.$$(".bloque")[bi]; var ult = bl && UI.$$(".ej", bl).pop(); if (ult) ult.scrollIntoView({ block: "center", behavior: "smooth" }); }, 50);
            });
            if (acc === "quita") {
              if (b.items.length && !(await UI.confirmar("¿Quitar el bloque “" + b.nombre + "”?", "Se quitan sus " + b.items.length + " ejercicios.", "Quitar"))) return;
              r.bloques.splice(bi, 1);
            }
            if (acc === "sube" && bi > 0) { var t = r.bloques[bi - 1]; r.bloques[bi - 1] = b; r.bloques[bi] = t; }
            marcar(); dibujar();
          };
        });
      });
      UI.$("#nuevoBloque").onclick = function () { r.bloques.push({ id: DB.uuid(), nombre: "Nuevo bloque", items: [] }); marcar(); dibujar(); };
      UI.$("#guardar").onclick = guardar;
      var ar = UI.$("#asignarR");
      if (ar) ar.onclick = async function () {
        if (cambios) await guardar(true);
        var cl = await DB.sel("clientes", { entrenador_id: eid() }, { orden: "nombre" });
        hojaAsignar({ rutinaId: r.id, clientes: cl });
      };
      if (UI.$("#ajustarIA")) UI.$("#ajustarIA").onclick = function () {
        var vacia = !r.bloques.some(function (b) { return b.items.length; });
        hojaIA(vacia ? "Armar con IA" : "Ajustar con IA", vacia ? "Ej. Espalda y bíceps, intermedio, 50 min" : "Ej. Hazla más ligera, cambia la barra por mancuernas", vacia ? [
          "Cuerpo completo para principiante", "Pierna con énfasis en glúteo", "Empuje (pecho, hombro, tríceps)"
        ] : ["Hazla más ligera para esta semana", "Cámbiala para entrenar en casa con mancuernas", "Agrega un bloque de abdomen", "Súbele la intensidad"], async function (pedido) {
          var cat = await catalogoIA();
          var actual = { nombre: r.nombre, bloques: r.bloques.map(function (b) {
            return { nombre: b.nombre, items: b.items.map(function (it) { return { ref: it.ref, nombre: it.nombre, series: it.series, reps: it.reps, tiempo: it.tiempo, descanso: it.descanso, intTipo: it.intTipo, int: it.int, nota: it.nota, superserie: !!it.grupo }; }) };
          }) };
          // los ejercicios que ya están en la rutina también cuentan como disponibles
          r.bloques.forEach(function (b) { b.items.forEach(function (it) {
            if (!cat.porRef[it.ref]) { cat.porRef[it.ref] = { nombre: it.nombre, img: it.img, video: it.video }; cat.lista.push({ ref: it.ref, nombre: it.nombre }); }
          }); });
          var res = await DB.ia(vacia ? { accion: "rutina", pedido: pedido, ejercicios: cat.lista } : { accion: "variar", pedido: pedido, rutina: actual, ejercicios: cat.lista });
          var nueva = rutinaDesdeIA(res.rutina, cat.porRef);
          if (!nueva.bloques.length) throw new Error("La IA no devolvió ejercicios. Prueba con otras palabras.");
          if (!r.nombre.trim()) r.nombre = nueva.nombre;
          if (!(r.descripcion || "").trim()) r.descripcion = nueva.descripcion;
          r.bloques = nueva.bloques; marcar(); dibujar();
          UI.aviso("✨ Listo: revisa y pulsa Guardar");
        });
      };
      var du = UI.$("#duplicar");
      if (du) du.onclick = async function () {
        try {
          var copia = await DB.ins("rutinas", { entrenador_id: eid(), nombre: r.nombre + " (copia)", descripcion: r.descripcion, bloques: r.bloques });
          UI.aviso("Rutina duplicada ✓"); A().ir("rutina/" + copia.id);
        } catch (e) { UI.error(e); }
      };
      var bo = UI.$("#borrar");
      if (bo) bo.onclick = async function () {
        if (!(await UI.confirmar("¿Eliminar “" + r.nombre + "”?", "Se quita también a los clientes que la tienen asignada. Su historial se conserva."))) return;
        try { await DB.del("rutinas", r.id); cambios = false; UI.aviso("Rutina eliminada"); A().ir("rutinas"); } catch (e) { UI.error(e); }
      };
    }
    async function guardar(silencio) {
      if (!r.nombre.trim()) { UI.aviso("Ponle nombre a la rutina", true); UI.$("#rNombre").focus(); return; }
      try {
        var datos = { nombre: r.nombre.trim(), descripcion: (r.descripcion || "").trim(), bloques: r.bloques, actualizado: new Date().toISOString() };
        if (r.id) await DB.upd("rutinas", r.id, datos);
        else { var n = await DB.ins("rutinas", Object.assign({ entrenador_id: eid() }, datos)); r.id = n.id; cambios = false; if (silencio !== true) UI.aviso("Rutina guardada ✓"); return A().ir("rutina/" + r.id); }
        cambios = false; if (silencio !== true) UI.aviso("Rutina guardada ✓");
      } catch (e) { UI.error(e); }
    }
    window.onbeforeunload = function () { return cambios ? "Hay cambios sin guardar" : undefined; };
    dibujar();
  };

  /* ───────── IA ───────── */
  async function catalogoIA() {
    var r = await Promise.all([UI.biblioteca(), DB.sel("ejercicios", { entrenador_id: eid() }, { orden: "nombre" })]);
    var lista = [], porRef = {};
    r[1].forEach(function (e) {
      var ref = "own:" + e.id;
      lista.push({ ref: ref, nombre: e.nombre, m: e.musculo || "", e: e.equipo || "" });
      porRef[ref] = { nombre: e.nombre, img: e.imagen_url || "", video: e.video_url || "" };
    });
    r[0].filter(function (e) { return e.es; }).forEach(function (e) {
      var ref = "lib:" + e.id;
      lista.push({ ref: ref, nombre: e.n, m: e.m, e: e.e });
      porRef[ref] = { nombre: e.n, img: e.img[0] || "", video: "" };
    });
    return { lista: lista, porRef: porRef };
  }
  function rutinaDesdeIA(ia, porRef) {
    var letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", g = 0;
    var bloques = (ia.bloques || []).map(function (b) {
      var items = (b.items || []).filter(function (it) { return porRef[it.ref]; }).map(function (it) {
        var ej = porRef[it.ref];
        return { id: DB.uuid(), ref: it.ref, nombre: ej.nombre, img: ej.img, video: ej.video, series: Number(it.series) || 3, reps: String(it.reps || ""), tiempo: String(it.tiempo || ""),
          descanso: Number(it.descanso) || 60, peso: "", intTipo: it.intTipo || "", int: String(it.int || ""), nota: String(it.nota || ""), grupo: "", _sup: !!it.superserie_con_siguiente };
      });
      items.forEach(function (it, i) {
        if (it._sup && items[i + 1]) { var letra = it.grupo || letras[g++ % 26]; it.grupo = letra; items[i + 1].grupo = letra; }
      });
      items.forEach(function (it) { delete it._sup; });
      return { id: DB.uuid(), nombre: b.nombre || "Bloque", items: items };
    }).filter(function (b) { return b.items.length; });
    return { nombre: ia.nombre || "", descripcion: ia.descripcion || "", bloques: bloques };
  }
  function hojaIA(titulo, ejemplo, sugerencias, alEnviar) {
    UI.hoja(titulo, '<div class="form"><p style="color:var(--suave);margin:-6px 0 0;line-height:1.4">Escribe lo que necesitas: objetivo, nivel, tiempo, equipo, lesiones… La IA usa los ejercicios de tu biblioteca.</p>' +
      '<textarea class="entrada" id="iaPedido" maxlength="600" placeholder="' + esc(ejemplo) + '"></textarea><div class="chips">' +
      sugerencias.map(function (s) { return '<button class="chip" data-s="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") +
      '</div><button class="btn" id="iaIr">' + ico("chispa") + 'Generar</button><p class="nota-demo">Tarda unos segundos. Revisa siempre lo que propone antes de asignarlo.</p></div>', function (h, cerrar) {
      UI.$$("[data-s]", h).forEach(function (b) { b.onclick = function () { h.querySelector("#iaPedido").value = b.dataset.s; }; });
      var ir = h.querySelector("#iaIr");
      ir.onclick = async function () {
        var pedido = h.querySelector("#iaPedido").value.trim();
        if (!pedido) return UI.aviso("Escribe qué necesitas", true);
        ir.disabled = true; ir.innerHTML = '<span class="girar" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span>Pensando…';
        try { await alEnviar(pedido); cerrar(); }
        catch (e) { UI.error(e); ir.disabled = false; ir.innerHTML = ico("chispa") + "Generar"; }
      };
    });
  }

  /* Selector de ejercicios (biblioteca + propios) */
  async function elegirEjercicio(alElegir) {
    var r = await Promise.all([UI.biblioteca(), DB.sel("ejercicios", { entrenador_id: eid() }, { orden: "nombre" })]);
    var todos = r[1].map(function (e) { return { ref: "own:" + e.id, nombre: e.nombre, m: e.musculo || "Propio", e: e.equipo || "", img: e.imagen_url || "", video: e.video_url || "", propio: true }; })
      .concat(r[0].map(function (e) { return { ref: "lib:" + e.id, nombre: e.n, en: e.en, m: e.m, e: e.e, img: e.img[0] || "" }; }));
    var musculos = ["Todos", "Propios"].concat(Array.from(new Set(r[0].map(function (e) { return e.m; }))).sort());
    var filtro = "Todos", q = "";
    UI.hoja("Agregar ejercicio", '<label class="buscador" style="background:rgba(255,255,255,.08)">' + ico("buscar", ' width="20" height="20"') +
      '<input id="eq" placeholder="Buscar: sentadilla, press, curl…"></label><div class="chips scroll" id="em" style="margin-top:12px">' +
      musculos.map(function (m, i) { return '<button class="chip' + (i ? "" : " on") + '" data-m="' + esc(m) + '">' + esc(m) + "</button>"; }).join("") +
      '</div><div class="lista" id="el" style="margin:8px -18px 0"></div>', function (h, cerrar) {
      function lista() {
        var n = UI.normal(q);
        var fs = todos.filter(function (e) {
          if (filtro === "Propios" && !e.propio) return false;
          if (filtro !== "Todos" && filtro !== "Propios" && e.m !== filtro) return false;
          return !n || UI.normal(e.nombre + " " + (e.en || "")).indexOf(n) >= 0;
        }).slice(0, 80);
        h.querySelector("#el").innerHTML = fs.length ? fs.map(function (e, i) {
          return '<div class="item" data-i="' + todos.indexOf(e) + '"><span class="ico cuadro">' + UI.miniEj(e) + '</span><span class="txt"><div class="t1">' + esc(e.nombre) +
            '</div><div class="t2">' + esc([e.m, e.e].filter(Boolean).join(" · ")) + '</div></span><span class="chev">' + ico("mas") + "</span></div>";
        }).join("") : '<div class="vacio">Nada encontrado. Puedes crear tu propio ejercicio en la pestaña Ejercicios.</div>';
        UI.$$("[data-i]", h).forEach(function (el) { el.onclick = function () { alElegir(todos[Number(el.dataset.i)]); cerrar(); }; });
      }
      lista();
      h.querySelector("#eq").oninput = function () { q = this.value; lista(); };
      UI.$$("#em .chip", h).forEach(function (b) { b.onclick = function () { filtro = b.dataset.m; UI.$$("#em .chip", h).forEach(function (x) { x.classList.toggle("on", x === b); }); lista(); }; });
    });
  }

  /* ───────── Biblioteca ───────── */
  V.biblioteca = async function () {
    UI.tabbar(TABS, "entreno");
    app().innerHTML = UI.cargando();
    var r = await Promise.all([UI.biblioteca(), DB.sel("ejercicios", { entrenador_id: eid() }, { orden: "nombre" })]);
    var lib = r[0], propios = r[1];
    var musculos = ["Todos"].concat(Array.from(new Set(lib.map(function (e) { return e.m; }))).sort());
    var vista = propios.length ? "propios" : "biblio", filtro = "Todos", q = "";
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag">' + avatarEnt() + '<div class="cab-txt"><small>Entreno</small><div class="subnav"><a href="#/rutinas">Rutinas</a><a class="on" href="#/biblioteca">Ejercicios</a></div></div>' +
      '<button class="btn-redondo" id="nuevoEj" aria-label="Nuevo ejercicio">' + ico("mas") + "</button></div></section>" +
      '<div class="contenido"><label class="buscador buscador-c">' + ico("buscar", ' width="19" height="19"') + '<input id="buscar" placeholder="Buscar ejercicio" autocomplete="off"></label><div class="segmento"><button data-v="propios">Mis ejercicios (' + propios.length +
      ')</button><button data-v="biblio">Biblioteca (' + lib.length + ')</button></div><div class="chips scroll" id="musc"></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="lista"></div></div></div>';
    function dibujar() {
      UI.$$(".segmento button").forEach(function (b) { b.classList.toggle("on", b.dataset.v === vista); });
      UI.$("#musc").innerHTML = vista === "biblio" ? musculos.map(function (m) { return '<button class="chip' + (m === filtro ? " on" : "") + '" data-m="' + esc(m) + '">' + esc(m) + "</button>"; }).join("") : "";
      UI.$$("#musc .chip").forEach(function (b) { b.onclick = function () { filtro = b.dataset.m; dibujar(); }; });
      var n = UI.normal(q), fs;
      if (vista === "propios") {
        fs = propios.filter(function (e) { return !n || UI.normal(e.nombre).indexOf(n) >= 0; });
        UI.$("#lista").innerHTML = fs.length ? fs.map(function (e) {
          return '<div class="item" data-p="' + e.id + '"><span class="ico cuadro">' + (e.imagen_url ? '<img src="' + esc(e.imagen_url) + '" alt="">' : ico(e.video_url ? "video" : "pesa")) +
            '</span><span class="txt"><div class="t1">' + esc(e.nombre) + '</div><div class="t2">' + esc([e.musculo, e.equipo, e.video_url ? "con video" : ""].filter(Boolean).join(" · ")) +
            '</div></span><span class="chev">' + ico("der") + "</span></div>";
        }).join("") : '<div class="vacio">' + ico("video") + "Sube tus propios ejercicios con tu video de YouTube. Pulsa +.</div>";
        UI.$$("[data-p]").forEach(function (el) { el.onclick = function () { hojaEjercicio(propios.find(function (e) { return e.id === el.dataset.p; })); }; });
      } else {
        fs = lib.filter(function (e) { return (filtro === "Todos" || e.m === filtro) && (!n || UI.normal(e.n + " " + e.en).indexOf(n) >= 0); });
        UI.$("#lista").innerHTML = fs.slice(0, 120).map(function (e) {
          return '<div class="item" data-l="' + esc(e.id) + '"><span class="ico cuadro">' + UI.miniEj({ img: e.img[0] }) + '</span><span class="txt"><div class="t1">' + esc(e.n) +
            '</div><div class="t2">' + esc(e.m + " · " + e.e) + "</div></span></div>";
        }).join("") + (fs.length > 120 ? '<div class="vacio">Y ' + (fs.length - 120) + " más. Busca para afinar.</div>" : "") + (fs.length ? "" : '<div class="vacio">Nada encontrado.</div>');
        UI.$$("[data-l]").forEach(function (el) { el.onclick = function () { verLib(lib.find(function (e) { return e.id === el.dataset.l; })); }; });
      }
    }
    function verLib(e) {
      UI.hoja(e.n, '<p style="color:var(--suave);margin:-8px 0 8px">' + esc(e.m + " · " + e.e + " · " + e.c) + (e.es ? "" : " · " + esc(e.en)) + "</p>" +
        e.img.map(function (i) { return '<img class="foto-ej" src="' + esc(UI.imgEj(i)) + '" alt="">'; }).join(""));
    }
    UI.$$(".segmento button").forEach(function (b) { b.onclick = function () { vista = b.dataset.v; dibujar(); }; });
    UI.$("#buscar").oninput = function () { q = this.value; dibujar(); };
    UI.$("#nuevoEj").onclick = function () { hojaEjercicio(); };
    dibujar();
  };

  function hojaEjercicio(e) {
    e = e || {};
    var tieneVideoArchivo = UI.esVideoArchivo(e.video_url), tieneYt = !!UI.youtube(e.video_url);
    UI.hoja(e.id ? "Editar ejercicio" : "Nuevo ejercicio", '<div class="form">' +
      '<div class="campo"><label>Nombre del ejercicio</label><input class="entrada" id="xN" value="' + esc(e.nombre || "") + '" placeholder="Ej. Sentadilla búlgara"></div>' +
      '<div class="rejilla"><div class="campo"><label>Músculo</label><input class="entrada" id="xM" value="' + esc(e.musculo || "") + '" placeholder="Ej. Pierna"></div>' +
      '<div class="campo"><label>Equipo</label><input class="entrada" id="xE" value="' + esc(e.equipo || "") + '" placeholder="Ej. Mancuernas"></div></div>' +
      '<div class="campo"><label>1. Foto del ejercicio <span class="opc">opcional</span></label>' +
      UI.selector("xI", { tipo: "foto", actual: e.imagen_url, ayuda: "Se ve en tu lista de ejercicios y en las rutinas." }) + "</div>" +
      '<div class="campo"><label>2. Video de cómo se hace <span class="opc">opcional</span></label>' +
      '<div class="segmento" id="xVM"><button type="button" data-m="archivo">Subir un video</button><button type="button" data-m="yt">Enlace de YouTube</button></div>' +
      '<div id="xVar">' + UI.selector("xF", { tipo: "video", actual: tieneVideoArchivo ? e.video_url : "",
        ayuda: "Hasta 2 minutos. La app lo hace más ligero antes de subirlo (sin sonido). Deja la app abierta mientras se sube." }) + "</div>" +
      '<div id="xVyt"><input class="entrada" id="xV" value="' + esc(tieneYt ? e.video_url : "") + '" placeholder="Pega aquí el enlace, ej. https://youtu.be/…">' +
      '<p class="ayuda">En YouTube: botón Compartir › Copiar enlace.</p></div></div>' +
      '<div class="campo"><label>3. Instrucciones <span class="opc">opcional</span></label><textarea class="entrada" id="xT" placeholder="Ej. Baja lento, la rodilla alineada con el pie.">' + esc(e.instrucciones || "") + "</textarea></div>" +
      '<button class="btn" id="xG">' + ico("check") + (e.id ? "Guardar cambios" : "Guardar ejercicio") + "</button>" +
      (e.id ? '<button class="btn peligro" id="xB">' + ico("basura") + "Eliminar ejercicio</button>" : "") + "</div>", function (h, cerrar) {
      var selFoto = UI.enlazarSelector(h, "xI"), selVideo = UI.enlazarSelector(h, "xF");
      var modoV = tieneYt ? "yt" : "archivo";
      function pintarModo() {
        UI.$$("#xVM button", h).forEach(function (b) { b.classList.toggle("on", b.dataset.m === modoV); });
        h.querySelector("#xVyt").hidden = modoV !== "yt"; h.querySelector("#xVar").hidden = modoV !== "archivo";
      }
      UI.$$("#xVM button", h).forEach(function (b) { b.onclick = function () { modoV = b.dataset.m; pintarModo(); }; });
      pintarModo();
      h.querySelector("#xG").onclick = async function () {
        var btn = this;
        var d = { nombre: h.querySelector("#xN").value.trim(), musculo: h.querySelector("#xM").value.trim(), equipo: h.querySelector("#xE").value.trim(),
          instrucciones: h.querySelector("#xT").value.trim() };
        if (!d.nombre) { h.querySelector("#xN").focus(); return UI.aviso("Escribe el nombre del ejercicio", true); }
        var fv = selVideo.archivo();
        if (modoV === "yt") {
          d.video_url = h.querySelector("#xV").value.trim();
          if (d.video_url && !UI.youtube(d.video_url)) return UI.aviso("Ese enlace no es de YouTube. Cópialo con Compartir › Copiar enlace.", true);
        } else if (!fv) {
          d.video_url = selVideo.quitado() ? "" : (tieneVideoArchivo ? e.video_url : "");
        } else {
          if (DB.modo === "demo") return UI.aviso("En el modo demo no se pueden subir videos", true);
          if (fv.size > 400 * 1024 * 1024) return UI.aviso("El video pesa " + Math.round(fv.size / 1048576) + " MB. Recórtalo o grábalo más corto.", true);
        }
        if (selFoto.quitado() && !selFoto.archivo()) d.imagen_url = null;
        btn.disabled = true;
        var giro = '<span class="girar" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></span>';
        try {
          if (modoV === "archivo" && fv) {
            btn.innerHTML = giro + "Preparando video…";
            var subir = fv;
            try {
              subir = await UI.comprimirVideo(fv, function (pct) { btn.innerHTML = giro + "Preparando video… " + pct + "%"; });
              if (subir.size > fv.size) subir = fv;
            } catch (ev) {
              if (/2 minutos/.test(ev.message)) throw ev;
              subir = fv;
            }
            if (subir.size > 50 * 1024 * 1024) throw new Error("El video sigue pesando " + Math.round(subir.size / 1048576) + " MB y el máximo es 50 MB. Recórtalo o grábalo más corto.");
            btn.innerHTML = giro + "Subiendo video…";
            var ext = subir === fv ? ((fv.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4") : (/webm/.test(subir.type) ? "webm" : "mp4");
            var rutaV = eid() + "/" + DB.uuid() + "." + ext;
            await DB.subir("videos", rutaV, subir);
            d.video_url = DB.urlPublica("videos", rutaV);
          }
          var f = selFoto.archivo();
          if (f) {
            btn.innerHTML = giro + "Subiendo foto…";
            var ruta = eid() + "/ej-" + DB.uuid() + ".jpg";
            await DB.subir("logos", ruta, await UI.comprimir(f, 800));
            d.imagen_url = DB.urlPublica("logos", ruta);
          }
          if (e.id) await DB.upd("ejercicios", e.id, d); else await DB.ins("ejercicios", Object.assign({ entrenador_id: eid() }, d));
          cerrar(); UI.aviso("Ejercicio guardado ✓"); A().recargar();
        } catch (er) { UI.error(er); btn.disabled = false; btn.innerHTML = ico("check") + (e.id ? "Guardar cambios" : "Guardar ejercicio"); }
      };
      var b = h.querySelector("#xB");
      if (b) b.onclick = async function () {
        if (!(await UI.confirmar("¿Eliminar “" + e.nombre + "”?", "Las rutinas que ya lo usan lo conservan."))) return;
        try { await DB.del("ejercicios", e.id); cerrar(); A().recargar(); } catch (er) { UI.error(er); }
      };
    });
  }

  /* ───────── Ajustes ───────── */
  var COLORES = ["#3B7BFF", "#1E40AF", "#0EA5E9", "#6366F1", "#7C3AED", "#14B8A6", "#22C55E", "#FF7A59", "#DB2777", "#64748B"];
  V.ajustes = async function () {
    UI.tabbar(TABS, "ajustes");
    var e = A().ent;
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag">' + avatarEnt() + '<div class="cab-txt"><small>' + esc(e.marca || "Pulso") + "</small><h1>Ajustes</h1></div></div></section><div class=\"contenido\">" +
      '<div class="lbl grupo">Tu marca</div><div class="tarjeta form">' +
      '<p>Tus clientes ven tu logo, tu nombre de marca y tu color en su app.</p>' +
      '<div style="display:flex;align-items:center;gap:14px"><div class="avatar grande" id="logoPrev">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.marca))) +
      '</div><label class="btn vidrio chico" style="cursor:pointer">' + ico("camara") + 'Cambiar logo<input type="file" accept="image/*" id="logo" class="oculto-vista"></label></div>' +
      '<div class="campo"><label>Nombre de tu marca</label><input class="entrada" id="marca" value="' + esc(e.marca || "") + '" placeholder="Ej. Team Fuerza"></div>' +
      '<div class="campo"><label>Tu nombre</label><input class="entrada" id="nombre" value="' + esc(e.nombre || "") + '"></div>' +
      '<div class="campo"><label>Color</label><div class="colores" id="colores">' + COLORES.map(function (c) {
        return '<button style="background:' + c + '" data-c="' + c + '" class="' + (c.toLowerCase() === String(e.color).toLowerCase() ? "on" : "") + '" aria-label="Color ' + c + '"></button>'; }).join("") +
      '<input type="color" id="colorLibre" value="' + esc(e.color || "#3B7BFF") + '" style="width:40px;height:40px;border:0;background:none;padding:0;cursor:pointer" aria-label="Otro color"></div></div>' +
      '<button class="btn" id="guardarMarca">Guardar</button></div>' +
      '<div class="lbl grupo">App</div><div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="instalarApp"><span class="ico">' + ico("compartir") + '</span><span class="txt"><div class="t1">Instalar en tu celular</div><div class="t2">Tus clientes hacen lo mismo con su enlace</div></span><span class="chev">' + ico("der") + "</span></div>" +
      '<a class="item" href="#/dietas/recetario"><span class="ico"><span style="font-size:18px">📖</span></span><span class="txt"><div class="t1">Recetario</div><div class="t2">57 recetas para tus planes</div></span><span class="chev">' + ico("der") + "</span></a></div></div>" +
      '<div class="lbl grupo">Cuenta</div>' +
      '<div class="tarjeta sin-relleno" id="adminLink" hidden><div class="lista"><a class="item" href="#/admin"><span class="ico">' + ico("grafica") +
      '</span><span class="txt"><div class="t1">Panel de administrador</div><div class="t2">Quién usa Pulso y qué hace</div></span><span class="chev">' + ico("der") + "</span></a></div></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="salir"><span class="ico">' + ico("salir") + '</span><span class="txt"><div class="t1">Cerrar sesión</div><div class="t2">' +
      esc(A().correo()) + "</div></span></div></div></div></div>";
    UI.$("#instalarApp").onclick = function () {
      UI.hoja("Instalar en tu celular", '<div class="lista" style="margin:0 -18px"><div class="item"><span class="ico">' + ico("compartir") + '</span><span class="txt"><div class="t1">iPhone</div><div class="t2" style="white-space:normal">En Safari, toca Compartir y luego «Agregar a pantalla de inicio».</div></span></div>' +
        '<div class="item"><span class="ico">' + ico("puntos") + '</span><span class="txt"><div class="t1">Android</div><div class="t2" style="white-space:normal">En Chrome, abre el menú ⋮ y toca «Instalar app».</div></span></div></div>');
    };
    var color = e.color;
    UI.$$("#colores [data-c]").forEach(function (b) { b.onclick = function () { color = b.dataset.c; UI.aplicarMarca(color); UI.$$("#colores [data-c]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    UI.$("#colorLibre").oninput = function () { color = this.value; UI.aplicarMarca(color); UI.$$("#colores [data-c]").forEach(function (x) { x.classList.remove("on"); }); };
    UI.$("#logo").onchange = async function () {
      var f = this.files[0]; if (!f) return;
      try {
        var ruta = eid() + "/logo-" + Date.now() + ".jpg";
        await DB.subir("logos", ruta, await UI.comprimir(f, 512));
        var url = DB.urlPublica("logos", ruta);
        A().ent = await DB.upd("entrenadores", eid(), { logo_url: url });
        UI.$("#logoPrev").innerHTML = '<img src="' + esc(url) + '" alt="">'; UI.aviso("Logo actualizado ✓");
      } catch (er) { UI.error(er); }
    };
    UI.$("#guardarMarca").onclick = async function () {
      try {
        A().ent = await DB.upd("entrenadores", eid(), { marca: UI.$("#marca").value.trim() || "Pulso", nombre: UI.$("#nombre").value.trim(), color: color });
        UI.aviso("Guardado ✓");
      } catch (er) { UI.error(er); }
    };
    UI.$("#salir").onclick = function () { A().salir(); };
    if (DB.modo === "supabase") DB.rpc("es_admin", {}).then(function (si) { var l = UI.$("#adminLink"); if (si === true && l) l.hidden = false; }).catch(function () {});
  };

  /* ───────── Panel de administrador (solo el dueño de la plataforma) ───────── */
  var TABS_ADMIN = [
    { id: "panel", ruta: "", ico: "grafica", txt: "Panel" },
    { id: "usuarios", ruta: "usuarios", ico: "clientes", txt: "Usuarios" },
    { id: "ajustes", ruta: "ajustes", ico: "ajustes", txt: "Ajustes" }
  ];
  function esModoAdmin() { return A().rol === "admin"; }
  function tabsAdmin(activa) { if (esModoAdmin()) UI.tabbar(TABS_ADMIN, activa === "ajustes" || activa === "usuarios" ? activa : "panel"); else UI.tabbar(TABS, "ajustes"); }
  var MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var DIA_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  function cuando(iso) {
    if (!iso) return "Nunca";
    var d = new Date(iso), min = Math.round((Date.now() - d.getTime()) / 60000);
    if (min < 1) return "Ahora";
    if (min < 60) return "Hace " + min + " min";
    if (min < 1440) return "Hace " + Math.round(min / 60) + " h";
    var dias = Math.round(min / 1440);
    if (dias < 7) return "Hace " + dias + (dias === 1 ? " día" : " días");
    return UI.fecha(iso);
  }
  function hora(iso) { var d = new Date(iso); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function fechaHora(iso) { if (!iso) return "Nunca"; var d = new Date(iso); return d.getDate() + " " + MESES_C[d.getMonth()] + " · " + hora(iso); }
  function claveDia(iso) { var d = new Date(iso); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); }
  function diaDe(iso) {
    var d = new Date(iso), hoy = new Date(), ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return "Hoy";
    if (d.toDateString() === ayer.toDateString()) return "Ayer";
    return UI.DIAS_L[d.getDay()].replace(/^./, function (x) { return x.toUpperCase(); }) + " " + d.getDate() + " de " + MESES_C[d.getMonth()];
  }
  function mins(m) { m = Math.round(Number(m) || 0); if (m < 60) return m + " min"; return Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60) + " min" : ""); }
  var ICO_TIPO = { entreno: "check", alumno: "persona", rutina: "rutinas", registro: "mas", asignacion: "calendario", medida: "regla", acceso: "reloj" };
  var ES_ENT = { alumno: 1, rutina: 1, asignacion: 1 };

  function avatarAdm(e, clase) {
    return '<span class="' + (clase || "ico") + '" style="position:relative">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.nombre || e.marca))) + "</span>";
  }
  function puntoEnLinea(on) { return on ? '<span class="adm-punto" title="En línea"></span>' : ""; }

  /* Periodo del panel: 7, 30 o 90 días (se recuerda en este celular) */
  var PERIODOS = { "7": "7 días", "30": "30 días", "90": "3 meses" };
  function periodoAdm() { var p = "7"; try { p = localStorage.getItem("pulso_adm_periodo") || "7"; } catch (e) {} return PERIODOS[p] ? p : "7"; }
  function desdePeriodo() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (Number(periodoAdm()) - 1)); return d; }
  function enPeriodo(a) { return new Date(a.cuando) >= desdePeriodo(); }
  function chipsPeriodo() {
    return '<div class="segmento" id="periodoAdm">' + Object.keys(PERIODOS).map(function (k) { return '<button data-p="' + k + '" class="' + (k === periodoAdm() ? "on" : "") + '">' + PERIODOS[k] + "</button>"; }).join("") + "</div>";
  }
  function enlazarPeriodo(volver) {
    UI.$$("#periodoAdm button").forEach(function (b) { b.onclick = function () { try { localStorage.setItem("pulso_adm_periodo", b.dataset.p); } catch (e) {} volver(); }; });
  }
  /* Minutos de uso por día (7 o 30 días) o por semana (3 meses): [{l, ent, alu}] */
  function usoSemana(accesos) {
    var p = Number(periodoAdm()), cub = [], hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (p <= 30) {
      for (var i = p - 1; i >= 0; i--) { var d = new Date(hoy); d.setDate(hoy.getDate() - i); var f = new Date(d); f.setDate(d.getDate() + 1);
        cub.push({ ini: d, fin: f, l: i === 0 ? "Hoy" : (p === 7 ? DIA_C[d.getDay()] : d.getDate() + " " + MESES_C[d.getMonth()]), ent: 0, alu: 0 }); }
    } else {
      for (var w = 12; w >= 0; w--) { var fw = new Date(hoy); fw.setDate(hoy.getDate() + 1 - 7 * w); var iw = new Date(fw); iw.setDate(fw.getDate() - 7);
        cub.push({ ini: iw, fin: fw, l: w === 0 ? "Esta sem." : iw.getDate() + " " + MESES_C[iw.getMonth()], ent: 0, alu: 0 }); }
    }
    accesos.forEach(function (a) {
      var t = new Date(a.cuando), c = cub.find(function (x) { return t >= x.ini && t < x.fin; });
      if (c) c[a.rol === "entrenador" ? "ent" : "alu"] += Number(a.min) || 0;
    });
    return cub;
  }
  function graficaUso(dias, soloUno) {
    var W = 340, H = 150, base = 120, top = 18, max = 1;
    dias.forEach(function (d) { max = Math.max(max, soloUno ? d.ent + d.alu : Math.max(d.ent, d.alu)); });
    var anchoDia = (W - 20) / dias.length, x0 = 10, svg = "", bw = Math.min(22, anchoDia * .62), salto = Math.ceil(dias.length / 7);
    dias.forEach(function (d, i) {
      var cx = x0 + i * anchoDia + anchoDia / 2;
      if (soloUno) {
        var hT = (d.ent + d.alu) / max * (base - top);
        svg += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (base - hT).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(hT, 1.5).toFixed(1) + '" rx="' + Math.min(5, bw / 3).toFixed(1) + '" fill="var(--brand-2)"/>';
        if (d.ent + d.alu && dias.length <= 13) svg += '<text x="' + cx.toFixed(1) + '" y="' + (base - hT - 5).toFixed(1) + '" text-anchor="middle" font-size="10" fill="var(--suave)">' + Math.round(d.ent + d.alu) + "</text>";
      } else {
        var hE = d.ent / max * (base - top), hA = d.alu / max * (base - top);
        svg += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (base - hE).toFixed(1) + '" width="' + (bw / 2).toFixed(1) + '" height="' + Math.max(hE, 1.5).toFixed(1) + '" rx="2" fill="var(--brand-2)"/>';
        svg += '<rect x="' + cx.toFixed(1) + '" y="' + (base - hA).toFixed(1) + '" width="' + (bw / 2).toFixed(1) + '" height="' + Math.max(hA, 1.5).toFixed(1) + '" rx="2" fill="var(--ok)"/>';
      }
      if (i % salto === 0 || i === dias.length - 1) svg += '<text x="' + cx.toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle" font-size="10.5" fill="var(--suave)"' + (i === dias.length - 1 ? ' font-weight="700"' : "") + ">" + d.l + "</text>";
    });
    svg += '<line x1="6" x2="' + (W - 6) + '" y1="' + base + '" y2="' + base + '" stroke="var(--linea)"/>';
    return '<svg class="grafica" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Minutos de uso por día">' + svg + "</svg>" +
      (soloUno ? '<p class="nota-demo" style="text-align:left;margin-top:4px">Minutos de uso por ' + (periodoAdm() === "90" ? "semana" : "día") + " (todos los usuarios)</p>" :
        '<div class="adm-leyenda"><span><i style="background:var(--brand-2)"></i>Entrenador</span><span><i style="background:var(--ok)"></i>Sus alumnos</span><span style="margin-left:auto">minutos por ' + (periodoAdm() === "90" ? "semana" : "día") + "</span></div>");
  }
  function filaMov(a) {
    return '<div class="item"><span class="ico">' + ico(ICO_TIPO[a.tipo] || "info") + '</span><span class="txt"><div class="t1">' + esc(a.quien || "") +
      (a.de ? ' <span class="adm-de">· ' + esc(a.de) + "</span>" : "") + '</div><div class="t2">' + esc(a.detalle || "") + '</div></span><span class="der">' + hora(a.cuando) +
      "<small>" + esc(cuando(a.cuando)) + "</small></span></div>";
  }
  function porDia(lista, render) {
    var html = "", dia = "";
    lista.forEach(function (a) {
      var d = diaDe(a.cuando);
      if (d !== dia) { dia = d; html += '<div class="adm-dia">' + esc(d) + "</div>"; }
      html += (render || filaMov)(a);
    });
    return html;
  }
  async function datosAdmin() {
    if (DB.modo === "demo" && window.__adminDemo) return window.__adminDemo;
    return await DB.rpc("admin_resumen", {});
  }
  function sinAcceso() {
    app().innerHTML = A().bandaDemo() + '<section class="hero"><a class="atras" href="#/ajustes">' + ico("izq", ' width="22" height="22"') + 'Ajustes</a><h1 class="titulo-pag">Administración</h1></section>' +
      '<div class="contenido"><div class="tarjeta"><h3>Sin acceso</h3><p>Este panel es solo para el administrador de Pulso.</p></div></div>';
  }
  function cabAdmin(volver, txt) {
    if (esModoAdmin() && volver === "ajustes") {
      return '<div class="barra-sup" style="justify-content:space-between"><span class="atras" style="cursor:default">' + ico("pulso", ' width="22" height="22"') + "Pulso · Administración</span>" +
        '<button class="btn-redondo" id="recargar" aria-label="Actualizar datos" title="Actualizar datos">' + ico("recargar") + "</button></div>";
    }
    if (esModoAdmin() && volver === "admin") volver = "";
    return '<div class="barra-sup" style="justify-content:space-between"><a class="atras" href="#/' + volver + '">' + ico("izq", ' width="22" height="22"') + esc(txt) +
      '</a><button class="btn-redondo" id="recargar" aria-label="Actualizar datos" title="Actualizar datos">' + ico("recargar") + "</button></div>";
  }

  V.admin = async function (entId) {
    tabsAdmin("panel");
    app().innerHTML = UI.cargando();
    var d; try { d = await datosAdmin(); } catch (e) { d = null; }
    if (!d) return sinAcceso();
    if (entId) return adminEntrenador(d, entId);
    adminPrincipal(d);
  };
  function adminPrincipal(d) {
    var t = d.totales || {}, act = d.actividad || [], ents = d.entrenadores || [], alus = d.alumnos || [];
    var nomP = PERIODOS[periodoAdm()];
    var accP = act.filter(function (a) { return a.tipo === "acceso" && enPeriodo(a); });
    var minP = accP.reduce(function (s, a) { return s + (Number(a.min) || 0); }, 0);
    var personasP = {}; accP.forEach(function (a) { personasP[a.rol + "|" + a.quien] = 1; });
    var entrenosP = act.filter(function (a) { return a.tipo === "entreno" && enPeriodo(a); }).length;
    function usoEnt(e) { return accP.filter(function (a) { return a.ent === e.id && a.rol === "entrenador"; }); }
    var accesos = act.filter(function (a) { return a.tipo === "acceso"; });
    var hoyK = claveDia(new Date());
    var accHoy = accesos.filter(function (a) { return claveDia(a.cuando) === hoyK; });
    var minHoy = accHoy.reduce(function (s, a) { return s + (Number(a.min) || 0); }, 0);
    var entrenosHoy = act.filter(function (a) { return a.tipo === "entreno" && claveDia(a.cuando) === hoyK; }).length;
    var enLinea = ents.filter(function (e) { return e.en_linea; }).map(function (e) { return { n: e.nombre, h: avatarAdm(e, "avatar chico") }; })
      .concat(alus.filter(function (c) { return c.en_linea; }).map(function (c) { return { n: c.nombre, h: UI.avatarCli(c, "avatar chico") }; }));
    var minEnt = {}; ents.forEach(function (e) { minEnt[e.id] = usoEnt(e).reduce(function (s, a) { return s + (Number(a.min) || 0); }, 0); });
    var maxMin = Math.max.apply(null, [1].concat(ents.map(function (e) { return minEnt[e.id]; })));
    var verTodo = false, q = "";

    var DL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], MS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], hoyD = new Date();
    var nEnLinea = t.en_linea || enLinea.length || 0;
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag"><span class="marca-mini" style="color:var(--brand-2)">' + ico("pulso", ' width="22" height="22"') + '</span><div class="cab-txt"><small>' +
      DL[hoyD.getDay()] + " " + hoyD.getDate() + " " + MS[hoyD.getMonth()] + ' · Administración</small><h1>Panel de Pulso</h1></div><button class="btn-redondo" id="recargar" aria-label="Actualizar datos" title="Actualizar datos">' + ico("recargar") + "</button></div></section>" +
      '<div class="contenido"><div class="tarjeta en-linea-card"><div class="promo"><span class="pulso-vivo' + (nEnLinea ? " on" : "") + '"></span><div style="flex:1"><h3>' + nEnLinea + (nEnLinea === 1 ? " persona en línea" : " personas en línea") + "</h3><p>" +
      (enLinea.length ? esc(enLinea.slice(0, 3).map(function (p) { return p.n; }).join(", ")) + (enLinea.length > 3 ? " y " + (enLinea.length - 3) + " más" : "") : "Nadie conectado en este momento") + "</p></div></div>" +
      (enLinea.length ? '<div class="adm-enlinea" style="justify-content:flex-start;margin-top:12px">' + enLinea.slice(0, 8).map(function (p) { return '<span title="' + esc(p.n) + '">' + p.h + "</span>"; }).join("") + "</div>" : "") + "</div>" +
      chipsPeriodo() +
      '<div class="adm-kpis"><div class="dato"><div class="v">' + mins(minP) + '</div><div class="l">Tiempo de uso · ' + nomP + "<br>hoy: " + mins(minHoy) + "</div></div>" +
      '<div class="dato"><div class="v">' + accP.length + '</div><div class="l">Visitas · ' + nomP + "<br>hoy: " + accHoy.length + "</div></div>" +
      '<div class="dato"><div class="v">' + Object.keys(personasP).length + '</div><div class="l">Personas que la usaron · ' + nomP + "</div></div>" +
      '<div class="dato"><div class="v">' + entrenosP + '</div><div class="l">Entrenamientos · ' + nomP + "<br>hoy: " + entrenosHoy + "</div></div></div>" +
      (function () {
        var regP = act.filter(function (a) { return a.tipo === "registro" && enPeriodo(a); }).length;
        var conC = t.alumnos ? Math.round((t.alumnos_con_cuenta || 0) / t.alumnos * 100) : 0;
        var entAct = ents.filter(function (e) { return usoEnt(e).length; }).length;
        return '<div class="titulo-sec"><h2>Salud de la plataforma</h2></div><div class="tarjeta salud">' +
          '<div><b>' + regP + '</b><small>Cuentas nuevas · ' + nomP + "</small></div>" +
          '<div><b>' + entAct + " / " + ents.length + "</b><small>Entrenadores que la usaron · " + nomP + "</small></div>" +
          '<div><b>' + (t.alumnos_con_cuenta || 0) + " de " + (t.alumnos || 0) + "</b><small>Alumnos invitados que ya activaron su cuenta (" + conC + "%)</small></div>" +
          '<div><b>' + (t.sesiones || 0) + "</b><small>Entrenamientos en total</small></div>" +
          '<div><b>' + (t.rutinas || 0) + "</b><small>Rutinas creadas</small></div></div>";
      })() +
      '<div class="titulo-sec"><h2>Uso · ' + nomP + '</h2></div><div class="tarjeta">' + graficaUso(usoSemana(accesos), true) + "</div>" +
      '<div class="titulo-sec"><h2>Entrenadores</h2><span class="adm-de">' + (t.entrenadores || ents.length) + "</span></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + (ents.length ? ents.map(function (e) {
        var pct = Math.round(minEnt[e.id] / maxMin * 100);
        return '<a class="item" href="#/admin/' + e.id + '"><span style="position:relative;flex:none">' + avatarAdm(e) + puntoEnLinea(e.en_linea) + '</span><span class="txt"><div class="t1">' +
          esc(e.nombre || "(sin nombre)") + ' <span class="adm-de">· ' + esc(e.marca || "") + '</span></div><div class="t2">' + e.alumnos + " alumnos · " + e.rutinas + " rutinas · " +
          act.filter(function (a) { return a.tipo === "entreno" && a.ent === e.id && enPeriodo(a); }).length + ' entrenos</div><div class="adm-barra"><i style="width:' + pct + '%"></i></div></span><span class="der">' + mins(minEnt[e.id]) +
          "<small>" + (e.en_linea ? '<b style="color:var(--ok)">En línea</b>' : esc(cuando(e.ultimo_acceso))) + "</small></span>" + '<span class="chev">' + ico("der") + "</span></a>";
      }).join("") : '<div class="vacio">Aún no hay entrenadores.</div>') + "</div></div>" +
      '<p class="nota-demo" style="text-align:left;margin:-6px 4px 0">La barra y el tiempo son su uso de la app en ' + (periodoAdm() === "90" ? "los últimos 3 meses" : "los últimos " + nomP) + ". Cambia el periodo arriba.</p>" +
      '<div class="titulo-sec"><h2>Movimientos</h2><button id="verTodo">Ver todos</button></div>' +
      '<label class="buscador" id="busq" hidden style="background:var(--card);height:44px">' + ico("buscar", ' width="18" height="18"') + '<input id="qAdmin" placeholder="Buscar por nombre o marca"></label>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="listaMov"></div></div>' +
      '<div class="titulo-sec"><h2>Alumnos</h2><span class="adm-de">' + (t.alumnos_con_cuenta || 0) + " de " + (t.alumnos || 0) + " con cuenta</span></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + alus.slice(0, 30).map(filaAlumno).join("") + (alus.length ? "" : '<div class="vacio">Aún no hay alumnos.</div>') + "</div></div></div>";
    function dibujarMov() {
      var n = UI.normal(q);
      var l = act.filter(function (a) { return !n || UI.normal((a.quien || "") + " " + (a.de || "") + " " + (a.detalle || "")).indexOf(n) >= 0; });
      UI.$("#listaMov").innerHTML = (l.length ? porDia(l.slice(0, verTodo ? 300 : 12)) : '<div class="vacio">Sin movimientos.</div>');
    }
    enlazarPeriodo(function () { adminPrincipal(d); });
    UI.$("#verTodo").onclick = function () { verTodo = !verTodo; this.textContent = verTodo ? "Ver menos" : "Ver todos"; UI.$("#busq").hidden = !verTodo; dibujarMov(); };
    UI.$("#qAdmin").oninput = function () { q = this.value; dibujarMov(); };
    UI.$("#recargar").onclick = function () { window.__admRefrescar = true; A().recargar(); };
    dibujarMov();
    UI.cargarFotos(app());
    if (window.__admRefrescar) { window.__admRefrescar = false; UI.aviso("Datos actualizados ✓"); }
  }
  function adminAjustes() {
    tabsAdmin("ajustes");
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag"><span class="marca-mini" style="color:var(--brand-2)">' + ico("ajustes", ' width="22" height="22"') + '</span><div class="cab-txt"><small>Administración</small><h1>Ajustes</h1></div></div></section><div class="contenido">' +
      '<div class="tarjeta"><div class="promo"><span class="avatar grande">' + ico("ajustes", ' width="34" height="34"') + '</span><div><h3>Cuenta de administrador</h3><p>' +
      esc((A().usuario && A().usuario.email) || "") + '</p></div></div><p style="margin-top:14px">Ves el uso de todos los entrenadores y alumnos. Tu propio uso no se registra ni cuenta en las estadísticas.</p></div>' +
      '<a class="tarjeta" href="#/usuarios" style="display:block"><div class="promo"><span class="rut-ico">' + ico("ajustes") + '</span><div style="flex:1"><h3>Mantenimiento de cuentas</h3><p>Entra a la cuenta de cualquier entrenador o alumno para revisar o corregir sus rutinas, dietas y datos.</p></div><span class="chev">' + ico("der") + "</span></div></a>" +
      '<div class="tarjeta"><h3>Ver la app como entrenador</h3><p>Navega la app igual que un entrenador para revisar cómo está acomodada. Lo que hagas ahí no cuenta en las estadísticas.</p>' +
      '<button class="btn" id="verComo" style="margin-top:14px">' + ico("persona") + "Entrar como entrenador</button></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="salir"><span class="ico">' + ico("salir") + '</span><span class="txt"><div class="t1">Cerrar sesión</div></span></div></div></div></div>';
    UI.$("#salir").onclick = function () { A().salir(); };
    UI.$("#verComo").onclick = function () { A().verComoEntrenador(true); };
  }
  var VIS_ADMIN = (window.VISTAS = window.VISTAS || {}).admin = {};
  VIS_ADMIN[""] = function () { return V.admin(); };
  VIS_ADMIN.admin = function (id) { return V.admin(id); };
  VIS_ADMIN.ajustes = adminAjustes;
  VIS_ADMIN.usuarios = adminUsuarios;
  /* Usuarios: todas las cuentas con su correo, rol, alta y último acceso */
  async function adminUsuarios() {
    tabsAdmin("usuarios");
    app().innerHTML = UI.cargando();
    var d; try { d = await datosAdmin(); } catch (e) { d = null; }
    if (!d) return sinAcceso();
    var ents = d.entrenadores || [], alus = d.alumnos || [];
    var todos = ents.map(function (e) { return { id: "e" + e.id, rol: "entrenador", nombre: e.nombre || "(sin nombre)", email: e.email, marca: e.marca, alta: e.alta, ultimo: e.ultimo_acceso, en_linea: e.en_linea, cuenta: true, ent: e.id,
      extra: (e.alumnos || 0) + " alumnos · " + (e.rutinas || 0) + " rutinas", min7: e.min_7d, av: e.logo_url ? avatarAdm(e) : UI.avatarCli({ nombre: e.nombre }) }; })
      .concat(alus.map(function (c) { return { id: "c" + c.id, rol: "alumno", nombre: c.nombre, email: c.email, marca: c.marca || c.entrenador, alta: c.alta, ultimo: c.ultimo_acceso, en_linea: c.en_linea, cuenta: c.tiene_cuenta, ent: c.ent,
        extra: (c.sesiones || 0) + " entrenos · entrena con " + (c.entrenador || c.marca || "—"), min7: c.min_7d, activo: c.activo, av: UI.avatarCli(c) }; }));
    var h7 = Date.now() - 7 * 864e5;
    var nuevos = todos.filter(function (u) { return u.alta && new Date(u.alta).getTime() >= h7; }).length;
    var F = [{ id: "todos", t: "Todos" }, { id: "entrenador", t: "Entrenadores" }, { id: "alumno", t: "Alumnos" }, { id: "sincuenta", t: "Sin cuenta" }, { id: "linea", t: "En línea" }];
    function pasa(u, f) { return f === "todos" || (f === "sincuenta" ? !u.cuenta : f === "linea" ? u.en_linea : u.rol === f); }
    var filtro = "todos", orden = "alta", q = "";
    app().innerHTML = A().bandaDemo() + '<section class="hero compacto"><div class="cab-pag"><span class="marca-mini" style="color:var(--sec-2)">' + ico("clientes", ' width="22" height="22"') + '</span><div class="cab-txt"><small>' +
      todos.length + ' cuentas · Administración</small><h1>Usuarios</h1></div><button class="btn-redondo" id="exportar" aria-label="Descargar lista" title="Descargar lista (CSV)">' + ico("compartir") + "</button></div></section>" +
      '<div class="contenido"><div class="kpi4"><div><b>' + ents.length + "</b><small>Entrenadores</small></div><div><b>" + alus.filter(function (c) { return c.tiene_cuenta; }).length + "</b><small>Alumnos con cuenta</small></div><div><b>" +
      alus.filter(function (c) { return !c.tiene_cuenta; }).length + "</b><small>Sin cuenta</small></div><div><b>" + nuevos + "</b><small>Nuevos (7 días)</small></div></div>" +
      '<div class="titulo-sec"><h2>🏆 Los que más usan Pulso</h2></div><div class="segmento" id="pU"><button data-d="7" class="on">7 días</button><button data-d="30">30 días</button><button data-d="90">3 meses</button></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="rankU"></div></div>' +
      '<div class="titulo-sec"><h2>Todas las cuentas</h2></div>' +
      '<label class="buscador buscador-c">' + ico("buscar", ' width="19" height="19"') + '<input id="qU" placeholder="Buscar por nombre, correo o marca" autocomplete="off"></label>' +
      '<div class="chips scroll" id="fU">' + F.map(function (f) { var n = todos.filter(function (u) { return pasa(u, f.id); }).length; return '<button class="chip' + (f.id === "todos" ? " on" : "") + '" data-f="' + f.id + '">' + f.t + ' <span class="cuenta">' + n + "</span></button>"; }).join("") + "</div>" +
      '<div class="orden-fila"><span>Ordenar por</span><select class="entrada" id="oU"><option value="alta">Más recientes</option><option value="ultimo">Último acceso</option><option value="nombre">Nombre (A–Z)</option><option value="email">Correo (A–Z)</option><option value="uso">Más uso (7 días)</option></select></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="lU"></div></div>' +
      '<p class="nota-demo" style="text-align:left;margin:0 4px">Las contraseñas no se pueden ver: Supabase las guarda cifradas para proteger a tus usuarios. Si alguien la olvidó, ábrelo y mándale el enlace para cambiarla.</p></div>';
    function lista() {
      var n = UI.normal(q);
      var l = todos.filter(function (u) { return pasa(u, filtro) && (!n || UI.normal(u.nombre + " " + (u.email || "") + " " + (u.marca || "")).indexOf(n) >= 0); });
      l.sort(function (a, b) {
        if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
        if (orden === "email") return (a.email || "~").localeCompare(b.email || "~");
        if (orden === "uso") return (b.min7 || 0) - (a.min7 || 0);
        var k = orden === "ultimo" ? "ultimo" : "alta"; return String(b[k] || "").localeCompare(String(a[k] || ""));
      });
      UI.$("#lU").innerHTML = l.length ? l.map(function (u) {
        return '<button class="item fila-btn" data-u="' + u.id + '"><span style="position:relative;flex:none">' + u.av + puntoEnLinea(u.en_linea) + '</span><span class="txt"><div class="t1">' + esc(u.nombre) +
          '</div><div class="t2">' + (u.email ? esc(u.email) : '<span style="color:var(--ambar)">Sin cuenta todavía</span>') + '</div><div class="cli-tags"><span class="tag ' + (u.rol === "entrenador" ? "t-entreno" : "t-bien") + '">' + (u.rol === "entrenador" ? "Entrenador" : "Alumno") + "</span>" +
          (u.marca ? '<span class="tag">' + esc(u.marca) + "</span>" : "") + '</div></span><span class="der"><small>' + (u.en_linea ? '<b style="color:var(--ok)">En línea</b>' : esc(u.ultimo ? cuando(u.ultimo) : "Nunca")) + "</small></span></button>";
      }).join("") : '<div class="vacio">Nadie coincide.</div>';
      UI.cargarFotos(UI.$("#lU"));
      UI.$$("[data-u]", UI.$("#lU")).forEach(function (b) { b.onclick = function () { hojaUsuario(todos.find(function (u) { return u.id === b.dataset.u; })); }; });
    }
    UI.$("#qU").oninput = function () { q = this.value; lista(); };
    UI.$("#oU").onchange = function () { orden = this.value; lista(); };
    UI.$$("#fU .chip").forEach(function (b) { b.onclick = function () { filtro = b.dataset.f; UI.$$("#fU .chip").forEach(function (x) { x.classList.toggle("on", x === b); }); lista(); }; });
    UI.$("#exportar").onclick = function () {
      var filas = [["Nombre", "Correo", "Rol", "Marca / entrenador", "Alta", "Último acceso", "Tiene cuenta"]].concat(todos.map(function (u) {
        return [u.nombre, u.email || "", u.rol, u.marca || "", u.alta ? String(u.alta).slice(0, 10) : "", u.ultimo ? String(u.ultimo).slice(0, 16).replace("T", " ") : "", u.cuenta ? "sí" : "no"];
      }));
      var csv = "﻿" + filas.map(function (f) { return f.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "pulso-usuarios-" + DB.hoyISO() + ".csv"; a.click();
      UI.aviso("Lista descargada ✓");
    };
    lista();
    // Ranking: tiempo dentro de la app por persona (entrenadores y alumnos), del que más al que menos
    var acc = (d.actividad || []).filter(function (a) { return a.tipo === "acceso"; });
    function ranking(dias) {
      var desde = Date.now() - dias * 864e5, m = {};
      acc.forEach(function (a) {
        if (new Date(a.cuando).getTime() < desde) return;
        var k = (a.rol || "") + "|" + (a.quien || "");
        if (!m[k]) m[k] = { rol: a.rol, quien: a.quien, de: a.de, min: 0, vis: 0, ult: a.cuando };
        m[k].min += Number(a.min) || 0; m[k].vis++; if (a.cuando > m[k].ult) m[k].ult = a.cuando;
      });
      var l = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.min - a.min; });
      var max = l.length ? l[0].min : 1, MED = ["🥇", "🥈", "🥉"];
      UI.$("#rankU").innerHTML = l.length ? l.slice(0, 10).map(function (x, i) {
        var u = todos.find(function (t) { return t.rol === x.rol && t.nombre === x.quien; });
        return '<button class="item fila-btn rank-fila"' + (u ? ' data-ru="' + u.id + '"' : "") + '><span class="rank-pos">' + (MED[i] || i + 1) + '</span><span style="position:relative;flex:none">' + (u ? u.av : UI.avatarCli({ nombre: x.quien })) +
          '</span><span class="txt"><div class="t1">' + esc(x.quien || "—") + '</div><div class="cli-tags"><span class="tag ' + (x.rol === "entrenador" ? "t-entreno" : "t-bien") + '">' + (x.rol === "entrenador" ? "Entrenador" : "Alumno") + "</span>" +
          '<span class="tag">' + x.vis + (x.vis === 1 ? " visita" : " visitas") + '</span></div><div class="barrita ancha" style="margin-top:8px;height:6px"><i style="width:' + Math.max(4, Math.round(x.min / max * 100)) + '%"></i></div></span>' +
          '<span class="der"><b class="rank-min">' + mins(x.min) + "</b></span></button>";
      }).join("") : '<div class="vacio">Nadie ha usado la app en este periodo.</div>';
      UI.cargarFotos(UI.$("#rankU"));
      UI.$$("[data-ru]", UI.$("#rankU")).forEach(function (b) { b.onclick = function () { hojaUsuario(todos.find(function (u) { return u.id === b.dataset.ru; })); }; });
    }
    UI.$$("#pU button").forEach(function (b) { b.onclick = function () { UI.$$("#pU button").forEach(function (x) { x.classList.toggle("on", x === b); }); ranking(Number(b.dataset.d)); }; });
    ranking(7);
  }
  function hojaUsuario(u) {
    function fila(t, v) { return '<div class="item"><span class="txt"><div class="t2">' + t + '</div><div class="t1" style="white-space:normal;word-break:break-word">' + v + "</div></span></div>"; }
    UI.hoja(u.nombre, '<div class="cli-tags" style="margin:-6px 0 12px"><span class="tag ' + (u.rol === "entrenador" ? "t-entreno" : "t-bien") + '">' + (u.rol === "entrenador" ? "Entrenador" : "Alumno") + "</span>" +
      (u.en_linea ? '<span class="tag t-comida">En línea ahora</span>' : "") + (u.activo === false ? '<span class="tag">Pausado</span>' : "") + "</div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + fila("Correo", u.email ? esc(u.email) : "Sin cuenta todavía") + fila(u.rol === "entrenador" ? "Marca" : "Entrenador", esc(u.marca || "—")) +
      fila("Alta", u.alta ? esc(fechaHora(u.alta)) : "—") + fila("Último acceso", u.ultimo ? esc(fechaHora(u.ultimo)) : "Nunca") + fila("Uso últimos 7 días", mins(u.min7 || 0)) + fila("Actividad", esc(u.extra)) +
      fila("Contraseña", '<span style="color:var(--suave)">Cifrada · nadie puede verla</span>') + "</div></div>" +
      '<div class="form" style="margin-top:14px">' +
      (u.email ? '<button class="btn" id="uReset">' + ico("enlace") + "Mandar enlace para cambiar contraseña</button>" +
        '<div class="fila-btns"><button class="btn vidrio" id="uCopiar">' + ico("copiar") + 'Copiar correo</button><a class="btn vidrio" href="mailto:' + esc(u.email) + '">' + ico("enlace") + "Escribirle</a></div>" : "") +
      '<button class="btn azul" id="uEntrar">' + ico("persona") + "Entrar a su cuenta</button>" +
      '<a class="btn vidrio" href="#/admin/' + esc(u.ent) + '">' + ico("grafica") + (u.rol === "entrenador" ? "Ver su actividad" : "Ver actividad de su entrenador") + "</a></div>", function (h, cerrar) {
      h.querySelector("#uEntrar").onclick = function () { cerrar(); A().entrarComo(u.rol === "entrenador" ? "ent" : "cli", u.id.slice(1), u.nombre, u.email); };
      UI.$$("a", h).forEach(function (a) { a.addEventListener("click", cerrar); });
      var rs = h.querySelector("#uReset");
      if (rs) rs.onclick = async function () {
        if (!(await UI.confirmar("¿Mandar el enlace a " + u.email + "?", "Le llega un correo para que elija una contraseña nueva. La actual sigue funcionando hasta que la cambie.", "Mandar enlace"))) return;
        try { await DB.recuperar(u.email); UI.aviso("Enlace enviado a " + u.email + " ✓"); } catch (e) { UI.error(e); }
      };
      var cp = h.querySelector("#uCopiar");
      if (cp) cp.onclick = function () { try { navigator.clipboard.writeText(u.email); UI.aviso("Correo copiado ✓"); } catch (e) { UI.aviso(u.email); } };
    });
  }


  function filaAlumno(c) {
    return '<a class="item" href="#/admin/' + c.ent + '"><span style="position:relative;flex:none">' + UI.avatarCli(c) + puntoEnLinea(c.en_linea) + '</span><span class="txt"><div class="t1">' +
      esc(c.nombre) + ' <span class="adm-de">· ' + esc(c.marca || c.entrenador || "") + '</span></div><div class="t2">' +
      (c.tiene_cuenta ? c.sesiones + " entrenos · " + mins(c.min_7d) + " de uso (7 días)" : "Aún no crea su cuenta") + '</div></span><span class="der"><small>' +
      (c.en_linea ? '<b style="color:var(--ok)">En línea</b>' : c.tiene_cuenta ? esc(cuando(c.ultimo_acceso)) : "—") + "</small></span></a>";
  }

  /* Detalle de un entrenador: sus visitas (hora de entrada y salida) y lo que hizo en cada una */
  function adminEntrenador(d, entId) {
    var e = (d.entrenadores || []).find(function (x) { return x.id === entId; });
    if (!e) return A().ir(esModoAdmin() ? "" : "admin");
    var movs = (d.actividad || []).filter(function (a) { return a.ent === entId; });
    var alumnos = (d.alumnos || []).filter(function (c) { return c.ent === entId; });
    var accesos = movs.filter(function (a) { return a.tipo === "acceso"; });
    var filtro = "ent", nomP = PERIODOS[periodoAdm()];
    var accEntP = accesos.filter(function (a) { return a.rol === "entrenador" && enPeriodo(a); });
    var minEntP = accEntP.reduce(function (s, a) { return s + (Number(a.min) || 0); }, 0);
    var entrenosP = movs.filter(function (a) { return a.tipo === "entreno" && enPeriodo(a); }).length;
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:12px">' + cabAdmin("admin", "Administración") +
      '<div class="saldo" style="margin-top:14px"><span style="position:relative;display:inline-block">' + avatarAdm(e, "avatar grande") + "</span>" +
      '<div class="cifra" style="font-size:28px;letter-spacing:-.5px;margin-top:10px">' + esc(e.nombre || "(sin nombre)") + '</div><div class="sub" style="flex-wrap:wrap;justify-content:center">' +
      esc(e.marca || "") + " · " + esc(e.email || "") + "</div>" +
      '<div class="centro" style="margin-top:10px">' + (e.en_linea ? '<span class="etiqueta">● En línea ahora</span>' : '<span class="etiqueta gris">Último acceso: ' + esc(fechaHora(e.ultimo_acceso)) + "</span>") + "</div>" +
      "</div></section><div class=\"contenido\">" + chipsPeriodo() +
      '<div class="adm-kpis"><div class="dato"><div class="v">' + mins(minEntP) + '</div><div class="l">Uso · ' + nomP + " · " + accEntP.length + " visitas<br>hoy: " + mins(e.min_hoy) + "</div></div>" +
      '<div class="dato"><div class="v">' + (accEntP.length ? mins(Math.round(minEntP / accEntP.length)) : "–") + '</div><div class="l">Duración promedio de visita</div></div>' +
      '<div class="dato"><div class="v">' + e.alumnos + '</div><div class="l">Alumnos · ' + e.alumnos_con_cuenta + ' con cuenta</div></div>' +
      '<div class="dato"><div class="v">' + entrenosP + '</div><div class="l">Entrenos de sus alumnos · ' + nomP + "</div></div></div>" +
      '<div class="titulo-sec"><h2>Uso · ' + nomP + '</h2></div><div class="tarjeta">' + graficaUso(usoSemana(accesos)) + "</div>" +
      '<div class="titulo-sec"><h2>Actividad</h2></div>' +
      '<div class="segmento" id="filtros"><button data-f="ent">El entrenador</button><button data-f="alum">Sus alumnos</button><button data-f="todo">Todo</button></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="listaMov"></div></div>' +
      '<div class="titulo-sec"><h2>Sus alumnos</h2><span class="adm-de">' + alumnos.length + "</span></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + (alumnos.length ? alumnos.map(filaAlumno).join("") : '<div class="vacio">Todavía no tiene alumnos.</div>') + "</div></div></div>";

    // Una "visita" del entrenador agrupa lo que hizo entre su hora de entrada y de salida
    function bloqueVisita(v, acciones) {
      return '<div class="adm-visita"><div class="adm-visita-cab"><span class="ico">' + ico("reloj") + '</span><span class="txt"><div class="t1">' + hora(v.cuando) + " – " +
        (v.en_linea ? "ahora" : hora(v.fin || v.cuando)) + '</div><div class="t2">' + (v.en_linea ? "En línea ahora · " : "") + mins(v.min) + " en la app" +
        (acciones.length ? " · " + acciones.length + (acciones.length === 1 ? " acción" : " acciones") : " · solo consultó") + "</div></span></div>" +
        acciones.map(function (a) { return '<div class="adm-accion"><span>' + hora(a.cuando) + "</span>" + ico(ICO_TIPO[a.tipo] || "info") + "<em>" + esc(a.detalle || "") + "</em></div>"; }).join("") + "</div>";
    }
    function dibujar() {
      UI.$$("#filtros button").forEach(function (b) { b.classList.toggle("on", b.dataset.f === filtro); });
      var html = "";
      if (filtro === "ent") {
        var visitas = accesos.filter(function (a) { return a.rol === "entrenador"; });
        var acciones = movs.filter(function (a) { return ES_ENT[a.tipo] || (a.tipo === "registro" && /entrenador/.test(a.detalle)); });
        var usadas = {};
        var items = visitas.map(function (v) {
          var ini = new Date(v.cuando).getTime() - 60000, fin = new Date(v.fin || v.cuando).getTime() + 120000;
          var dentro = acciones.filter(function (a, i) { var t = new Date(a.cuando).getTime(); if (t >= ini && t <= fin && !usadas[i]) { usadas[i] = 1; return true; } return false; })
            .sort(function (x, y) { return x.cuando < y.cuando ? -1 : 1; });
          return { cuando: v.cuando, html: bloqueVisita(v, dentro) };
        });
        acciones.forEach(function (a, i) { if (!usadas[i]) items.push({ cuando: a.cuando, html: filaMov(a) }); });
        items.sort(function (x, y) { return x.cuando < y.cuando ? 1 : -1; });
        html = items.length ? porDia(items, function (x) { return x.html; }) : '<div class="vacio">Sin actividad registrada todavía. Las visitas se miden desde que activaste el registro.</div>';
      } else {
        var l = movs.filter(function (a) {
          if (filtro === "alum") return a.tipo === "entreno" || a.tipo === "medida" || (a.tipo === "acceso" && a.rol === "alumno") || (a.tipo === "registro" && /alumno/.test(a.detalle));
          return true;
        });
        html = l.length ? porDia(l) : '<div class="vacio">Sin movimientos.</div>';
      }
      UI.$("#listaMov").innerHTML = html;
    }
    UI.$$("#filtros button").forEach(function (b) { b.onclick = function () { filtro = b.dataset.f; dibujar(); }; });
    enlazarPeriodo(function () { adminEntrenador(d, entId); });
    UI.$("#recargar").onclick = function () { window.__admRefrescar = true; A().recargar(); };
    dibujar();
    UI.cargarFotos(app());
    if (window.__admRefrescar) { window.__admRefrescar = false; UI.aviso("Datos actualizados ✓"); }
  }
})();
