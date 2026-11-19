/* Pulso · panel del entrenador */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var V = (window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} }).entrenador;
  var TABS = [
    { id: "inicio", ruta: "", ico: "inicio", txt: "Inicio" },
    { id: "clientes", ruta: "clientes", ico: "clientes", txt: "Clientes" },
    { id: "rutinas", ruta: "rutinas", ico: "rutinas", txt: "Rutinas" },
    { id: "biblioteca", ruta: "biblioteca", ico: "biblio", txt: "Ejercicios" },
    { id: "ajustes", ruta: "ajustes", ico: "ajustes", txt: "Ajustes" }
  ];
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

  /* ───────── Inicio ───────── */
  V[""] = async function () {
    UI.tabbar(TABS, "inicio");
    app().innerHTML = UI.cargando();
    var d = await cargarTodo();
    var activos = d.clientes.filter(function (c) { return c.activo; });
    var semana = d.ses.filter(function (s) { return s.fecha >= inicioSemana(); }).length;
    var pendientes = activos.filter(function (c) { return !c.user_id; });
    var nombreCli = {}, porIdCli = {}; d.clientes.forEach(function (c) { nombreCli[c.id] = c.nombre; porIdCli[c.id] = c; });
    var html = A().bandaDemo() + '<section class="hero">' + cabecera("Buscar cliente") +
      '<div class="saldo"><div class="etq">Clientes activos</div><div class="cifra">' + activos.length + '</div>' +
      '<div class="sub">' + ico("rayo") + semana + (semana === 1 ? " sesión esta semana " : " sesiones esta semana ") + ico("info") + "</div></div>" +
      '<div class="centro"><a class="pastilla" href="#/clientes">Mis clientes</a></div>' +
      '<div class="acciones">' +
      '<button class="accion" id="aCliente"><span class="circ">' + ico("mas") + "</span>Cliente</button>" +
      '<a class="accion" href="#/rutina/nueva"><span class="circ">' + ico("rutinas") + "</span>Rutina</a>" +
      '<button class="accion" id="aAsignar"><span class="circ">' + ico("calendario") + "</span>Asignar</button>" +
      '<a class="accion" href="#/ajustes"><span class="circ">' + ico("puntos") + "</span>Más</a></div></section>" +
      '<div class="contenido">';
    if (pendientes.length) {
      var hechos = activos.length - pendientes.length, pct = activos.length ? hechos / activos.length : 0;
      html += '<div class="tarjeta"><div class="promo">' + anillo(hechos + "/" + activos.length, pct) +
        '<div><h3>Invita a tus clientes</h3><p>' + pendientes.length + (pendientes.length === 1 ? " cliente aún no ha" : " clientes aún no han") +
        " entrado a la app. Mándales su enlace por WhatsApp.</p></div></div>" +
        '<a class="btn" style="margin-top:16px" href="#/cliente/' + pendientes[0].id + '">Invitar a ' + esc(pendientes[0].nombre.split(" ")[0]) + "</a></div>";
    } else if (!d.rutinas.length) {
      html += '<div class="tarjeta"><div class="promo">' + anillo("0/1", 0) + '<div><h3>Crea tu primera rutina</h3><p>Arma bloques con la biblioteca de ejercicios y asígnala a tus clientes.</p></div></div>' +
        '<a class="btn" style="margin-top:16px" href="#/rutina/nueva">Crear rutina</a></div>';
    }
    html += '<div class="tarjeta sin-relleno"><div class="titulo-sec" style="margin:12px 18px 4px"><h2>Actividad reciente</h2></div><div class="lista">';
    var rec = d.ses.slice(0, 12);
    if (!rec.length) html += '<div class="vacio">' + ico("fuego") + "Cuando tus clientes terminen una rutina, la verás aquí.</div>";
    rec.forEach(function (s) {
      var vol = (s.series || []).reduce(function (t, x) { return t + (Number(x.peso) || 0) * (Number(x.reps) || 0); }, 0);
      html += '<a class="item" href="#/cliente/' + s.cliente_id + '">' + UI.avatarCli(porIdCli[s.cliente_id] || { nombre: nombreCli[s.cliente_id] }) + '<span class="txt"><div class="t1">' +
        esc(nombreCli[s.cliente_id] || "Cliente") + " → " + esc(s.rutina_nombre || "Rutina") + '</div><div class="t2">' + esc(UI.fecha(s.fecha)) +
        (s.comentario ? " · “" + esc(s.comentario) + "”" : "") + '</div></span><span class="der">' + (s.calificacion ? "★ " + s.calificacion : "") +
        (vol ? "<small>" + Math.round(vol).toLocaleString("es-MX") + " kg</small>" : "") + "</span></a>";
    });
    html += "</div></div></div>";
    app().innerHTML = html;
    UI.cargarFotos(app());
    UI.$("#aCliente").onclick = function () { hojaCliente(); };
    UI.$("#aAsignar").onclick = function () { hojaAsignar({ clientes: d.clientes, rutinas: d.rutinas }); };
    UI.$("#buscar").addEventListener("keydown", function (e) { if (e.key === "Enter") A().ir("clientes/" + encodeURIComponent(this.value)); });
  };
  function anillo(txt, pct) {
    var c = 2 * Math.PI * 25;
    return '<div class="anillo"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>' +
      '<circle cx="29" cy="29" r="25" fill="none" stroke="var(--brand-2)" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' +
      (c * (1 - pct)).toFixed(1) + '"/></svg>' + esc(txt) + "</div>";
  }

  /* ───────── Clientes ───────── */
  V.clientes = async function (q) {
    UI.tabbar(TABS, "clientes");
    app().innerHTML = UI.cargando();
    var d = await cargarTodo();
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px">' + cabecera("Buscar cliente",
      '<button class="btn-redondo" id="nuevo" aria-label="Nuevo cliente">' + ico("mas") + "</button>") +
      '<h1 class="titulo-pag">Clientes</h1></section><div class="contenido"><div class="chips scroll" id="filtros">' +
      '<button class="chip on" data-f="activos">Activos</button><button class="chip" data-f="pendientes">Sin entrar</button><button class="chip" data-f="todos">Todos</button></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista" id="lista"></div></div></div>';
    var filtro = "activos", busq = q || "";
    UI.$("#buscar").value = busq;
    function lista() {
      var n = UI.normal(busq);
      var fs = d.clientes.filter(function (c) {
        if (filtro === "activos" && !c.activo) return false;
        if (filtro === "pendientes" && c.user_id) return false;
        return !n || UI.normal(c.nombre + " " + (c.email || "")).indexOf(n) >= 0;
      });
      UI.$("#lista").innerHTML = fs.length ? fs.map(function (c) {
        var asig = d.asig.filter(function (a) { return a.cliente_id === c.id && a.activa; }).length;
        return '<a class="item" href="#/cliente/' + c.id + '">' + UI.avatarCli(c) + '<span class="txt"><div class="t1">' + esc(c.nombre) +
          '</div><div class="t2">' + esc(UI.hace(ultimaSesion(d.ses, c.id))) + " · " + asig + (asig === 1 ? " rutina" : " rutinas") + '</div></span><span class="der">' +
          (!c.activo ? '<span class="etiqueta gris">Pausado</span>' : c.user_id ? '<span class="etiqueta">Activo</span>' : '<span class="etiqueta ambar">Sin entrar</span>') + "</span></a>";
      }).join("") : '<div class="vacio">' + ico("clientes") + (d.clientes.length ? "Nadie coincide con la búsqueda." : "Aún no tienes clientes. Pulsa + para dar de alta al primero.") + "</div>";
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
    var semana = ses.filter(function (s) { return s.fecha >= inicioSemana(); }).length;
    var calif = ses.filter(function (s) { return s.calificacion; });
    var prom = calif.length ? calif.reduce(function (t, s) { return t + s.calificacion; }, 0) / calif.length : null;
    var ejs = UI.ejerciciosRegistrados(ses);
    var html = A().bandaDemo() + '<section class="hero">' + '<div class="barra-sup" style="justify-content:space-between">' + atras("clientes", "Clientes") +
      '<button class="btn-redondo" id="editar" aria-label="Editar">' + ico("editar") + "</button></div>" +
      '<div class="saldo" style="margin-top:18px"><label class="foto-perfil" title="Cambiar foto">' + UI.avatarCli(c, "avatar grande") +
      '<span class="foto-cam">' + ico("camara") + '</span><input type="file" accept="image/*" id="fotoCli" class="oculto-vista"></label>' +
      '<div class="cifra" style="font-size:32px;letter-spacing:-.6px;margin-top:12px">' + esc(c.nombre) + '</div><div class="sub">' +
      (c.objetivo ? esc(c.objetivo) + " · " : "") + esc(UI.hace(ses[0] && ses[0].fecha)) + "</div></div>" +
      '<div class="acciones">' +
      '<button class="accion" id="asignar"><span class="circ">' + ico("calendario") + "</span>Asignar</button>" +
      '<button class="accion" id="invitar"><span class="circ">' + ico("enlace") + "</span>Invitar</button>" +
      '<button class="accion" id="medir"><span class="circ">' + ico("regla") + "</span>Medidas</button>" +
      '<a class="accion" ' + (c.telefono ? 'target="_blank" rel="noopener" href="https://wa.me/' + (function (t) { t = t.replace(/\D/g, ""); return t.length === 10 ? "52" + t : t; })(c.telefono) + '"' : 'href="javascript:void 0" id="sinTel"') +
      '><span class="circ">' + ico("whatsapp") + "</span>Mensaje</a></div></section>" +
      '<div class="contenido"><div class="datos"><div class="dato"><div class="v">' + ses.length + '</div><div class="l">Sesiones</div></div>' +
      '<div class="dato"><div class="v">' + semana + '</div><div class="l">Esta semana</div></div><div class="dato"><div class="v">' + (prom ? "★ " + UI.num(prom) : "–") +
      '</div><div class="l">Calificación</div></div></div>';
    if (!c.user_id) html += '<div class="tarjeta"><h3>Aún no entra a la app</h3><p>Mándale su enlace para que cree su cuenta y vea sus rutinas.</p><button class="btn" style="margin-top:14px" id="invitar2">' + ico("whatsapp") + "Mandar invitación</button></div>";
    html += '<div class="titulo-sec"><h2>Rutinas asignadas</h2><button id="asignar2">+ Asignar</button></div><div class="tarjeta sin-relleno"><div class="lista">';
    html += asig.length ? asig.map(function (a) {
      var rt = rutPorId[a.rutina_id] || { nombre: "Rutina eliminada" };
      var n = (rt.bloques || []).reduce(function (t, b) { return t + b.items.length; }, 0);
      return '<div class="item" data-asig="' + a.id + '"><span class="ico cuadro">' + ico("rutinas") + '</span><span class="txt"><div class="t1">' + esc(rt.nombre) +
        '</div><div class="t2">' + esc(UI.diasTxt(a.dias)) + " · " + n + ' ejercicios</div></span><span class="chev">' + ico("der") + "</span></div>";
    }).join("") : '<div class="vacio">Sin rutinas todavía.</div>';
    html += "</div></div>";
    if (iaActiva() && (ses.length || med.length)) html += '<div class="tarjeta" id="iaResumen"><div class="promo"><span class="avatar" style="background:var(--brand)">' + ico("chispa", ' width="22" height="22"') +
      '</span><div><h3>¿Cómo va ' + esc(c.nombre.split(" ")[0]) + '?</h3><p>La IA lee sus sesiones, comentarios y medidas y te da un resumen con sugerencias.</p></div></div>' +
      '<button class="btn vidrio" style="margin-top:14px" id="pedirResumen">' + ico("chispa") + "Resumen con IA</button></div>";
    html += '<div class="titulo-sec"><h2>Progreso de fuerza</h2></div><div class="tarjeta">';
    if (ejs.length) {
      html += '<div class="chips scroll" id="chipsEj">' + ejs.map(function (e, i) { return '<button class="chip' + (i ? "" : " on") + '" data-ref="' + esc(e.ref) + '">' + esc(e.nombre) + "</button>"; }).join("") +
        '</div><div id="graf" style="margin-top:12px"></div>';
    } else html += '<div class="vacio" style="padding:10px">Cuando registre pesos, aquí verás su progreso.</div>';
    html += "</div>";
    html += '<div class="titulo-sec"><h2>Historial</h2></div><div class="tarjeta sin-relleno"><div class="lista">';
    html += ses.length ? ses.slice(0, 30).map(function (s) {
      return '<div class="item" data-ses="' + s.id + '"><span class="ico">' + ico("check") + '</span><span class="txt"><div class="t1">' + esc(s.rutina_nombre || "Rutina") +
        '</div><div class="t2">' + esc(UI.fecha(s.fecha)) + (s.comentario ? " · “" + esc(s.comentario) + "”" : "") + '</div></span><span class="der">' + (s.calificacion ? "★ " + s.calificacion : "") + "</span></div>";
    }).join("") : '<div class="vacio">Aún no ha entrenado.</div>';
    html += "</div></div>";
    html += '<div class="titulo-sec"><h2>Medidas y fotos</h2><button id="medir2">+ Agregar</button></div><div class="tarjeta" id="medidas">' + resumenMedidas(med) + "</div>";
    if (c.notas) html += '<div class="titulo-sec"><h2>Notas</h2></div><div class="tarjeta"><p style="white-space:pre-wrap">' + esc(c.notas) + "</p></div>";
    html += "</div>";
    app().innerHTML = html;
    pintarFotos(med);

    function graf(ref) { UI.$("#graf").innerHTML = UI.grafica(UI.serieFuerza(ses, ref), "kg"); }
    if (ejs.length) {
      graf(ejs[0].ref);
      UI.$$("#chipsEj .chip").forEach(function (b) { b.onclick = function () { UI.$$("#chipsEj .chip").forEach(function (x) { x.classList.toggle("on", x === b); }); graf(b.dataset.ref); }; });
    }
    UI.cargarFotos(app());
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
    ["#invitar", "#invitar2"].forEach(function (s) { var b = UI.$(s); if (b) b.onclick = function () { hojaInvitar(c); }; });
    ["#asignar", "#asignar2"].forEach(function (s) { UI.$(s).onclick = function () { hojaAsignar({ clienteId: c.id, rutinas: rutinas }); }; });
    ["#medir", "#medir2"].forEach(function (s) { UI.$(s).onclick = function () { V.hojaMedida(c); }; });
    var st = UI.$("#sinTel"); if (st) st.onclick = function () { UI.aviso("Agrega su teléfono en Editar", true); };
    var pr = UI.$("#pedirResumen");
    if (pr) pr.onclick = async function () {
      pr.disabled = true; pr.innerHTML = '<span class="girar" style="width:18px;height:18px;border-width:2px"></span>Pensando…';
      var datos = {
        objetivo: c.objetivo || "", notas_del_entrenador: c.notas || "",
        sesiones: ses.slice(0, 12).map(function (s) {
          var porEj = {};
          (s.series || []).forEach(function (x) { (porEj[x.nombre] = porEj[x.nombre] || []).push((x.peso ? x.peso + "kg×" : "") + (x.reps || "?")); });
          return { fecha: s.fecha, rutina: s.rutina_nombre, calificacion: s.calificacion, comentario: s.comentario || "", series: porEj };
        }),
        medidas: med.slice(-6).map(function (m) { return { fecha: m.fecha, peso: m.peso, cintura: m.cintura, cadera: m.cadera, grasa: m.grasa }; })
      };
      try {
        var r = await DB.ia({ accion: "resumen", datos: datos });
        UI.$("#iaResumen").innerHTML = '<h3 style="display:flex;align-items:center;gap:8px">' + ico("chispa", ' width="20" height="20"') + "Resumen con IA</h3>" +
          '<p style="color:#fff;margin-top:8px;line-height:1.5">' + esc(r.resumen) + '</p><div class="lbl" style="margin:14px 0 6px">Sugerencias</div>' +
          (r.sugerencias || []).map(function (s) { return '<p style="margin-top:6px">• ' + esc(s) + "</p>"; }).join("") +
          '<p class="nota-demo" style="text-align:left;margin-top:12px">Hecho con IA: revísalo con tu criterio.</p>';
      } catch (e) { UI.error(e); pr.disabled = false; pr.innerHTML = ico("chispa") + "Resumen con IA"; }
    };
    UI.$$("[data-asig]").forEach(function (el) {
      el.onclick = function () { hojaAsignar({ asig: asig.find(function (a) { return a.id === el.dataset.asig; }) }); };
    });
    UI.$$("[data-ses]").forEach(function (el) {
      el.onclick = function () { V.hojaSesion(ses.find(function (s) { return s.id === el.dataset.ses; })); };
    });
  };

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
      '</div><div class="campo"><label>Foto de progreso (opcional)</label><input class="entrada" type="file" accept="image/*" id="mFoto" style="padding-top:12px"></div>' +
      '<button class="btn" id="mGuardar">Guardar</button></div>', function (h, cerrar) {
      h.querySelector("#mGuardar").onclick = async function () {
        var fila = { entrenador_id: c.entrenador_id, cliente_id: c.id, fecha: DB.hoyISO() }, alguno = false;
        UI.$$("[data-k]", h).forEach(function (i) { var v = i.value.replace(",", ".").trim(); if (v) { fila[i.dataset.k] = Number(v); alguno = true; } });
        var f = h.querySelector("#mFoto").files[0];
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
    UI.tabbar(TABS, "rutinas");
    app().innerHTML = UI.cargando();
    var d = await cargarTodo();
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px">' + cabecera("Buscar rutina",
      '<a class="btn-redondo" href="#/rutina/nueva" aria-label="Nueva rutina">' + ico("mas") + "</a>") +
      '<h1 class="titulo-pag">Rutinas</h1></section><div class="contenido"><div class="tarjeta sin-relleno"><div class="lista" id="lista"></div></div>' +
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
        return '<a class="item" href="#/rutina/' + r.id + '"><span class="ico cuadro">' + ico("rutinas") + '</span><span class="txt"><div class="t1">' + esc(r.nombre) +
          '</div><div class="t2">' + (r.bloques || []).length + ((r.bloques || []).length === 1 ? " bloque · " : " bloques · ") + ne + " ejercicios" + (r.descripcion ? " · " + esc(r.descripcion) : "") +
          '</div></span><span class="der">' + nc + "<small>" + (nc === 1 ? "cliente" : "clientes") + "</small></span></a>";
      }).join("") : '<div class="vacio">' + ico("rutinas") + (d.rutinas.length ? "Nada coincide." : "Aún no tienes rutinas.") + "</div>";
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
      return '<div class="ej' + (it.grupo ? " super" : "") + '" data-i="' + i + '"><div class="ej-cab"><span class="ico">' + UI.miniEj(it) + '</span><div class="nom">' + esc(it.nombre) +
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
      app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:6px"><div class="barra-sup" style="justify-content:space-between">' + atras("rutinas", "Rutinas") +
        '<div style="display:flex;gap:8px">' + (iaActiva() ? '<button class="btn-redondo" id="ajustarIA" aria-label="Ajustar con IA" title="Ajustar con IA">' + ico("chispa") + "</button>" : "") + (r.id ? '<button class="btn-redondo" id="duplicar" aria-label="Duplicar">' + ico("duplicar") + '</button><button class="btn-redondo" id="borrar" aria-label="Eliminar">' + ico("basura") + "</button>" : "") +
        '</div></div><input class="titulo-pag" id="rNombre" value="' + esc(r.nombre) + '" placeholder="Nombre de la rutina" style="background:none;border:0;outline:0;width:100%;color:#fff">' +
        '<input id="rDesc" value="' + esc(r.descripcion || "") + '" placeholder="Descripción (opcional)" style="background:none;border:0;outline:0;width:100%;color:var(--suave);font-size:16px;margin-top:4px"></section>' +
        '<div class="contenido" id="bloques">' + r.bloques.map(function (b, bi) {
          return '<div class="bloque" data-b="' + bi + '"><div class="bloque-cab"><input data-bn value="' + esc(b.nombre) + '" placeholder="Nombre del bloque">' +
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
        ir.disabled = true; ir.innerHTML = '<span class="girar" style="width:18px;height:18px;border-width:2px;border-top-color:#0A0F25;border-color:rgba(10,15,37,.2);border-top-color:#0A0F25"></span>Pensando…';
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
    UI.tabbar(TABS, "biblioteca");
    app().innerHTML = UI.cargando();
    var r = await Promise.all([UI.biblioteca(), DB.sel("ejercicios", { entrenador_id: eid() }, { orden: "nombre" })]);
    var lib = r[0], propios = r[1];
    var musculos = ["Todos"].concat(Array.from(new Set(lib.map(function (e) { return e.m; }))).sort());
    var vista = propios.length ? "propios" : "biblio", filtro = "Todos", q = "";
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px">' + cabecera("Buscar ejercicio",
      '<button class="btn-redondo" id="nuevoEj" aria-label="Nuevo ejercicio">' + ico("mas") + "</button>") +
      '<h1 class="titulo-pag">Ejercicios</h1></section><div class="contenido"><div class="segmento"><button data-v="propios">Mis ejercicios (' + propios.length +
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
    UI.hoja(e.id ? "Editar ejercicio" : "Ejercicio propio", '<div class="form">' +
      '<div class="campo"><label>Nombre</label><input class="entrada" id="xN" value="' + esc(e.nombre || "") + '"></div>' +
      '<div class="rejilla"><div class="campo"><label>Músculo</label><input class="entrada" id="xM" value="' + esc(e.musculo || "") + '" placeholder="Pierna"></div>' +
      '<div class="campo"><label>Equipo</label><input class="entrada" id="xE" value="' + esc(e.equipo || "") + '" placeholder="Mancuernas"></div></div>' +
      '<div class="campo"><label>Video (opcional)</label><div class="segmento" id="xVM"><button type="button" data-m="archivo">Subir mi video</button><button type="button" data-m="yt">Enlace de YouTube</button></div>' +
      '<div id="xVyt"><input class="entrada" id="xV" value="' + esc(UI.youtube(e.video_url) ? e.video_url : "") + '" placeholder="https://youtu.be/…"></div>' +
      '<div id="xVar">' + (UI.esVideoArchivo(e.video_url) ? '<video class="video-ej" src="' + esc(e.video_url) + '" controls playsinline preload="metadata"></video>' : "") +
      '<input class="entrada" type="file" accept="video/mp4,video/quicktime,video/webm,video/*" id="xF" style="padding-top:12px;margin-top:8px">' +
      '<p class="nota-demo" style="text-align:left;margin-top:6px">Hasta 2 minutos. La app lo optimiza antes de subirlo (unos 5 MB por cada 30 segundos, sin sonido): deja la app abierta mientras tanto, tarda lo que dura el video.</p></div></div>' +
      '<div class="campo"><label>Imagen (opcional)</label><input class="entrada" type="file" accept="image/*" id="xI" style="padding-top:12px"></div>' +
      '<div class="campo"><label>Instrucciones</label><textarea class="entrada" id="xT">' + esc(e.instrucciones || "") + "</textarea></div>" +
      '<button class="btn" id="xG">Guardar</button>' + (e.id ? '<button class="btn peligro" id="xB">Eliminar</button>' : "") + "</div>", function (h, cerrar) {
      var modoV = UI.youtube(e.video_url) ? "yt" : "archivo";
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
        if (!d.nombre) return UI.aviso("Escribe el nombre", true);
        var fv = h.querySelector("#xF").files[0];
        if (modoV === "yt") {
          d.video_url = h.querySelector("#xV").value.trim();
          if (d.video_url && !UI.youtube(d.video_url)) return UI.aviso("Ese enlace no parece de YouTube", true);
        } else if (!fv) {
          d.video_url = UI.esVideoArchivo(e.video_url) ? e.video_url : "";
        } else {
          if (DB.modo === "demo") return UI.aviso("En el modo demo no se pueden subir videos", true);
          if (fv.size > 400 * 1024 * 1024) return UI.aviso("El video pesa " + Math.round(fv.size / 1048576) + " MB. Recórtalo o grábalo más corto.", true);
        }
        btn.disabled = true;
        try {
          if (modoV === "archivo" && fv) {
            var giro = '<span class="girar" style="width:18px;height:18px;border-width:2px;border-color:rgba(10,15,37,.2);border-top-color:#0A0F25"></span>';
            btn.innerHTML = giro + "Optimizando video…";
            var subir = fv;
            try {
              subir = await UI.comprimirVideo(fv, function (pct) { btn.innerHTML = giro + "Optimizando video… " + pct + "%"; });
              if (subir.size > fv.size) subir = fv; // si salió más pesado, nos quedamos con el original
            } catch (ev) {
              if (/2 minutos/.test(ev.message)) throw ev;
              subir = fv; // el navegador no pudo optimizar: se intenta subir el original
            }
            if (subir.size > 50 * 1024 * 1024) throw new Error("El video sigue pesando " + Math.round(subir.size / 1048576) + " MB y el máximo es 50 MB. Recórtalo o grábalo más corto.");
            btn.innerHTML = giro + "Subiendo video (" + Math.max(1, Math.round(subir.size / 1048576)) + " MB)…";
            var ext = subir === fv ? ((fv.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4") : (/webm/.test(subir.type) ? "webm" : "mp4");
            var rutaV = eid() + "/" + DB.uuid() + "." + ext;
            await DB.subir("videos", rutaV, subir);
            d.video_url = DB.urlPublica("videos", rutaV);
          }
          var f = h.querySelector("#xI").files[0];
          if (f) {
            var ruta = eid() + "/ej-" + DB.uuid() + ".jpg";
            await DB.subir("logos", ruta, await UI.comprimir(f, 800));
            d.imagen_url = DB.urlPublica("logos", ruta);
          }
          if (e.id) await DB.upd("ejercicios", e.id, d); else await DB.ins("ejercicios", Object.assign({ entrenador_id: eid() }, d));
          cerrar(); UI.aviso("Ejercicio guardado ✓"); A().recargar();
        } catch (er) { UI.error(er); btn.disabled = false; btn.textContent = "Guardar"; }
      };
      var b = h.querySelector("#xB");
      if (b) b.onclick = async function () {
        if (!(await UI.confirmar("¿Eliminar “" + e.nombre + "”?", "Las rutinas que ya lo usan lo conservan."))) return;
        try { await DB.del("ejercicios", e.id); cerrar(); A().recargar(); } catch (er) { UI.error(er); }
      };
    });
  }

  /* ───────── Ajustes ───────── */
  var COLORES = ["#2F6BFF", "#1E40AF", "#0EA5E9", "#6366F1", "#7C3AED", "#0F766E", "#16A34A", "#DC2626", "#DB2777", "#111827"];
  V.ajustes = async function () {
    UI.tabbar(TABS, "ajustes");
    var e = A().ent;
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px"><h1 class="titulo-pag" style="margin-top:30px">Ajustes</h1></section><div class="contenido">' +
      '<div class="titulo-sec"><h2>Tu marca</h2></div><div class="tarjeta form">' +
      '<p>Tus clientes ven tu logo, tu nombre de marca y tu color en su app.</p>' +
      '<div style="display:flex;align-items:center;gap:14px"><div class="avatar grande" id="logoPrev">' + (e.logo_url ? '<img src="' + esc(e.logo_url) + '" alt="">' : esc(UI.iniciales(e.marca))) +
      '</div><label class="btn vidrio chico" style="cursor:pointer">' + ico("camara") + 'Cambiar logo<input type="file" accept="image/*" id="logo" class="oculto-vista"></label></div>' +
      '<div class="campo"><label>Nombre de tu marca</label><input class="entrada" id="marca" value="' + esc(e.marca || "") + '" placeholder="Ej. Team Fuerza"></div>' +
      '<div class="campo"><label>Tu nombre</label><input class="entrada" id="nombre" value="' + esc(e.nombre || "") + '"></div>' +
      '<div class="campo"><label>Color</label><div class="colores" id="colores">' + COLORES.map(function (c) {
        return '<button style="background:' + c + '" data-c="' + c + '" class="' + (c.toLowerCase() === String(e.color).toLowerCase() ? "on" : "") + '" aria-label="Color ' + c + '"></button>'; }).join("") +
      '<input type="color" id="colorLibre" value="' + esc(e.color || "#2F6BFF") + '" style="width:40px;height:40px;border:0;background:none;padding:0;cursor:pointer" aria-label="Otro color"></div></div>' +
      '<button class="btn" id="guardarMarca">Guardar</button></div>' +
      '<div class="titulo-sec"><h2>Instalar en tu celular</h2></div><div class="tarjeta"><p><b style="color:#fff">iPhone:</b> en Safari, botón Compartir → «Agregar a pantalla de inicio».<br>' +
      '<b style="color:#fff">Android:</b> en Chrome, menú ⋮ → «Instalar app».<br>Tus clientes hacen lo mismo con su enlace.</p></div>' +
      '<div class="tarjeta sin-relleno" id="adminLink" hidden><div class="lista"><a class="item" href="#/admin"><span class="ico">' + ico("grafica") +
      '</span><span class="txt"><div class="t1">Panel de administrador</div><div class="t2">Quién usa Pulso y qué hace</div></span><span class="chev">' + ico("der") + "</span></a></div></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="salir"><span class="ico">' + ico("salir") + '</span><span class="txt"><div class="t1">Cerrar sesión</div><div class="t2">' +
      esc((A().usuario && A().usuario.email) || "") + "</div></span></div></div></div></div>";
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
    { id: "ajustes", ruta: "ajustes", ico: "ajustes", txt: "Ajustes" }
  ];
  function esModoAdmin() { return A().rol === "admin"; }
  function tabsAdmin(activa) { if (esModoAdmin()) UI.tabbar(TABS_ADMIN, activa === "ajustes" ? "ajustes" : "panel"); else UI.tabbar(TABS, "ajustes"); }
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

  /* Minutos de uso por día en los últimos 7 días: [{l, ent, alu}] */
  function usoSemana(accesos) {
    var dias = [], hoy = new Date();
    for (var i = 6; i >= 0; i--) { var d = new Date(hoy); d.setDate(hoy.getDate() - i); dias.push({ k: claveDia(d), l: i === 0 ? "Hoy" : DIA_C[d.getDay()], ent: 0, alu: 0 }); }
    accesos.forEach(function (a) {
      var dia = dias.find(function (x) { return x.k === claveDia(a.cuando); });
      if (dia) dia[a.rol === "entrenador" ? "ent" : "alu"] += Number(a.min) || 0;
    });
    return dias;
  }
  function graficaUso(dias, soloUno) {
    var W = 340, H = 150, base = 120, top = 18, max = 1;
    dias.forEach(function (d) { max = Math.max(max, soloUno ? d.ent + d.alu : Math.max(d.ent, d.alu)); });
    var anchoDia = (W - 20) / dias.length, x0 = 10, svg = "";
    dias.forEach(function (d, i) {
      var cx = x0 + i * anchoDia + anchoDia / 2;
      if (soloUno) {
        var hT = (d.ent + d.alu) / max * (base - top);
        svg += '<rect x="' + (cx - 11).toFixed(1) + '" y="' + (base - hT).toFixed(1) + '" width="22" height="' + Math.max(hT, 1.5).toFixed(1) + '" rx="5" fill="var(--brand-2)"/>';
        if (d.ent + d.alu) svg += '<text x="' + cx.toFixed(1) + '" y="' + (base - hT - 5).toFixed(1) + '" text-anchor="middle" font-size="10" fill="var(--suave)">' + Math.round(d.ent + d.alu) + "</text>";
      } else {
        var hE = d.ent / max * (base - top), hA = d.alu / max * (base - top);
        svg += '<rect x="' + (cx - 12).toFixed(1) + '" y="' + (base - hE).toFixed(1) + '" width="11" height="' + Math.max(hE, 1.5).toFixed(1) + '" rx="3" fill="var(--brand-2)"/>';
        svg += '<rect x="' + (cx + 1).toFixed(1) + '" y="' + (base - hA).toFixed(1) + '" width="11" height="' + Math.max(hA, 1.5).toFixed(1) + '" rx="3" fill="var(--ok)"/>';
      }
      svg += '<text x="' + cx.toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle" font-size="11" fill="var(--suave)"' + (d.l === "Hoy" ? ' font-weight="700"' : "") + ">" + d.l + "</text>";
    });
    svg += '<line x1="6" x2="' + (W - 6) + '" y1="' + base + '" y2="' + base + '" stroke="var(--linea)"/>';
    return '<svg class="grafica" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Minutos de uso por día">' + svg + "</svg>" +
      (soloUno ? '<p class="nota-demo" style="text-align:left;margin-top:4px">Minutos de uso por día (todos los usuarios)</p>' :
        '<div class="adm-leyenda"><span><i style="background:var(--brand-2)"></i>Entrenador</span><span><i style="background:var(--ok)"></i>Sus alumnos</span><span style="margin-left:auto">minutos por día</span></div>');
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
    var t = d.totales || {}, act = d.actividad || [], ents = d.entrenadores || [], alus = d.alumnos || [];
    var accesos = act.filter(function (a) { return a.tipo === "acceso"; });
    var hoyK = claveDia(new Date());
    var accHoy = accesos.filter(function (a) { return claveDia(a.cuando) === hoyK; });
    var minHoy = accHoy.reduce(function (s, a) { return s + (Number(a.min) || 0); }, 0);
    var entrenosHoy = act.filter(function (a) { return a.tipo === "entreno" && claveDia(a.cuando) === hoyK; }).length;
    var enLinea = ents.filter(function (e) { return e.en_linea; }).map(function (e) { return { n: e.nombre, h: avatarAdm(e, "avatar chico") }; })
      .concat(alus.filter(function (c) { return c.en_linea; }).map(function (c) { return { n: c.nombre, h: UI.avatarCli(c, "avatar chico") }; }));
    var maxMin = Math.max.apply(null, [1].concat(ents.map(function (e) { return Number(e.min_7d) || 0; })));
    var verTodo = false, q = "";

    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:14px">' + cabAdmin("ajustes", "Ajustes") +
      '<div class="saldo" style="margin-top:18px"><div class="etq">En línea ahora</div><div class="cifra">' + (t.en_linea || enLinea.length || 0) + '</div>' +
      (enLinea.length ? '<div class="adm-enlinea">' + enLinea.slice(0, 8).map(function (p) { return '<span title="' + esc(p.n) + '">' + p.h + "</span>"; }).join("") + "</div>" :
        '<div class="sub">' + ico("persona") + "Nadie conectado en este momento</div>") +
      '</div></section><div class="contenido">' +
      '<div class="adm-kpis"><div class="dato"><div class="v">' + mins(minHoy) + '</div><div class="l">Tiempo de uso hoy</div></div>' +
      '<div class="dato"><div class="v">' + accHoy.length + '</div><div class="l">Visitas hoy</div></div>' +
      '<div class="dato"><div class="v">' + (t.activos_7d || 0) + '</div><div class="l">Personas que la usaron (7 días)</div></div>' +
      '<div class="dato"><div class="v">' + (t.sesiones_7d || 0) + '</div><div class="l">Entrenamientos (7 días) · ' + entrenosHoy + " hoy</div></div></div>" +
      '<div class="titulo-sec"><h2>Uso de la semana</h2></div><div class="tarjeta">' + graficaUso(usoSemana(accesos), true) + "</div>" +
      '<div class="titulo-sec"><h2>Entrenadores</h2><span class="adm-de">' + (t.entrenadores || ents.length) + "</span></div>" +
      '<div class="tarjeta sin-relleno"><div class="lista">' + (ents.length ? ents.map(function (e) {
        var pct = Math.round((Number(e.min_7d) || 0) / maxMin * 100);
        return '<a class="item" href="#/admin/' + e.id + '"><span style="position:relative;flex:none">' + avatarAdm(e) + puntoEnLinea(e.en_linea) + '</span><span class="txt"><div class="t1">' +
          esc(e.nombre || "(sin nombre)") + ' <span class="adm-de">· ' + esc(e.marca || "") + '</span></div><div class="t2">' + e.alumnos + " alumnos · " + e.rutinas + " rutinas · " +
          e.sesiones_7d + ' entrenos</div><div class="adm-barra"><i style="width:' + pct + '%"></i></div></span><span class="der">' + mins(e.min_7d) +
          "<small>" + (e.en_linea ? '<b style="color:var(--ok)">En línea</b>' : esc(cuando(e.ultimo_acceso))) + "</small></span>" + '<span class="chev">' + ico("der") + "</span></a>";
      }).join("") : '<div class="vacio">Aún no hay entrenadores.</div>') + "</div></div>" +
      '<p class="nota-demo" style="text-align:left;margin:-6px 4px 0">La barra y el tiempo son su uso de la app en los últimos 7 días.</p>' +
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
    UI.$("#verTodo").onclick = function () { verTodo = !verTodo; this.textContent = verTodo ? "Ver menos" : "Ver todos"; UI.$("#busq").hidden = !verTodo; dibujarMov(); };
    UI.$("#qAdmin").oninput = function () { q = this.value; dibujarMov(); };
    UI.$("#recargar").onclick = function () { window.__admRefrescar = true; A().recargar(); };
    dibujarMov();
    UI.cargarFotos(app());
    if (window.__admRefrescar) { window.__admRefrescar = false; UI.aviso("Datos actualizados ✓"); }
  };
  function adminAjustes() {
    tabsAdmin("ajustes");
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px"><h1 class="titulo-pag" style="margin-top:30px">Ajustes</h1></section><div class="contenido">' +
      '<div class="tarjeta"><div class="promo"><span class="avatar grande">' + ico("ajustes", ' width="34" height="34"') + '</span><div><h3>Cuenta de administrador</h3><p>' +
      esc((A().usuario && A().usuario.email) || "") + '</p></div></div><p style="margin-top:14px">Ves el uso de todos los entrenadores y alumnos. Tu propio uso no se registra ni cuenta en las estadísticas.</p></div>' +
      '<div class="tarjeta sin-relleno"><div class="lista"><div class="item" id="salir"><span class="ico">' + ico("salir") + '</span><span class="txt"><div class="t1">Cerrar sesión</div></span></div></div></div></div>';
    UI.$("#salir").onclick = function () { A().salir(); };
  }
  var VIS_ADMIN = (window.VISTAS = window.VISTAS || {}).admin = {};
  VIS_ADMIN[""] = function () { return V.admin(); };
  VIS_ADMIN.admin = function (id) { return V.admin(id); };
  VIS_ADMIN.ajustes = adminAjustes;

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
    var filtro = "ent";
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:12px">' + cabAdmin("admin", "Administración") +
      '<div class="saldo" style="margin-top:14px"><span style="position:relative;display:inline-block">' + avatarAdm(e, "avatar grande") + "</span>" +
      '<div class="cifra" style="font-size:28px;letter-spacing:-.5px;margin-top:10px">' + esc(e.nombre || "(sin nombre)") + '</div><div class="sub" style="flex-wrap:wrap;justify-content:center">' +
      esc(e.marca || "") + " · " + esc(e.email || "") + "</div>" +
      '<div class="centro" style="margin-top:10px">' + (e.en_linea ? '<span class="etiqueta">● En línea ahora</span>' : '<span class="etiqueta gris">Último acceso: ' + esc(fechaHora(e.ultimo_acceso)) + "</span>") + "</div>" +
      "</div></section><div class=\"contenido\">" +
      '<div class="adm-kpis"><div class="dato"><div class="v">' + mins(e.min_hoy) + '</div><div class="l">Uso hoy</div></div>' +
      '<div class="dato"><div class="v">' + mins(e.min_7d) + '</div><div class="l">Uso en 7 días · ' + (e.accesos_7d || 0) + ' visitas</div></div>' +
      '<div class="dato"><div class="v">' + e.alumnos + '</div><div class="l">Alumnos · ' + e.alumnos_con_cuenta + ' con cuenta</div></div>' +
      '<div class="dato"><div class="v">' + e.sesiones_7d + '</div><div class="l">Entrenos de sus alumnos (7 días)</div></div></div>' +
      '<div class="titulo-sec"><h2>Uso por día</h2></div><div class="tarjeta">' + graficaUso(usoSemana(accesos)) + "</div>" +
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
    UI.$("#recargar").onclick = function () { window.__admRefrescar = true; A().recargar(); };
    dibujar();
    UI.cargarFotos(app());
    if (window.__admRefrescar) { window.__admRefrescar = false; UI.aviso("Datos actualizados ✓"); }
  }
})();
