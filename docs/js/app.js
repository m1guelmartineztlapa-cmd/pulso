/* Pulso · arranque, sesión y rutas */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var C = window.PULSO_CONFIG || {};
  var APP = window.APP = { usuario: null, rol: null, ent: null, cli: null, marca: null };
  var VISTAS = window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} };
  var LLAVE_INV = "pulso_invitacion";
  // El enlace de "Olvidé mi contraseña" llega con type=recovery; lo leemos antes de que Supabase limpie la dirección.
  var esRecuperacion = /type=recovery/.test(location.hash), hojaClaveAbierta = false;

  function ruta() {
    var h = (location.hash || "#/").replace(/^#\/?/, "");
    var partes = h.split("/").filter(Boolean).map(decodeURIComponent);
    return { nombre: partes[0] || "", params: partes.slice(1) };
  }
  APP.ir = function (r) { if (location.hash === "#/" + r) pintar(); else location.hash = "#/" + r; };
  APP.recargar = function () { pintar(); };
  APP.app = function () { return UI.$("#app"); };

  function bandaDemo() {
    if (APP.esAdmin && APP.suplanta)
      return '<div class="banda-demo banda-admin">🔧 Dentro de la cuenta de <b>' + UI.esc(APP.suplanta.nombre || "") + "</b> (" + (APP.suplanta.tipo === "ent" ? "entrenador" : "alumno") + ')<button data-volver-admin>Salir</button></div>';
    if (APP.esAdmin && APP.rol === "entrenador")
      return '<div class="banda-demo banda-admin">Estás viendo la app como entrenador<button data-volver-admin>Volver al panel</button></div>';
    if (DB.modo !== "demo") return "";
    return '<div class="banda-demo">Modo demo · los datos solo viven en este navegador<button data-reinicio>Reiniciar</button></div>';
  }
  APP.bandaDemo = bandaDemo;
  // El admin entra a la cuenta de un entrenador o alumno para darle mantenimiento
  APP.entrarComo = async function (tipo, id, nombre) {
    try { sessionStorage.removeItem("pulso_ver_como"); sessionStorage.setItem("pulso_suplanta", JSON.stringify({ tipo: tipo, id: id, nombre: nombre })); } catch (e) {}
    await detectarRol(); location.hash = "#/"; pintar();
    if (APP.suplanta) UI.aviso("Estás dentro de la cuenta de " + nombre + ". Lo que cambies se guarda en su cuenta.");
    else UI.aviso("No pude abrir esa cuenta. ¿Ya corriste el SQL admin-v7?", true);
  };
  APP.verComoEntrenador = async function (si) {
    try { sessionStorage.removeItem("pulso_suplanta"); if (si) sessionStorage.setItem("pulso_ver_como", "1"); else sessionStorage.removeItem("pulso_ver_como"); } catch (e) {}
    await detectarRol(); location.hash = "#/"; pintar();
    if (si) UI.aviso("Modo entrenador · usa «Volver al panel» arriba para regresar");
  };
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-volver-admin]")) { APP.verComoEntrenador(false); return; }
    if (e.target.closest("[data-reinicio]")) { DB.reiniciar(); DB.salir(); location.hash = "#/"; location.reload(); }
  });

  async function detectarRol() {
    APP.usuario = await DB.usuario();
    APP.rol = null; APP.ent = null; APP.cli = null; APP.esAdmin = false; APP.suplanta = null; window.__suplanta = null;
    if (!APP.usuario) return;
    var uid = APP.usuario.id;
    var pendiente = localStorage.getItem(LLAVE_INV);
    var ent = await DB.uno("entrenadores", { id: uid });
    // El administrador (dueño de Pulso) entra directo a su panel; su uso no se registra.
    var esAdmin = false;
    if (DB.modo === "supabase") { try { esAdmin = (await DB.rpc("es_admin", {})) === true; } catch (e) {} }
    else esAdmin = !!window.__adminDemo;
    APP.esAdmin = esAdmin;
    if (esAdmin) {
      localStorage.removeItem(LLAVE_INV);
      var sup = null; try { sup = JSON.parse(sessionStorage.getItem("pulso_suplanta") || "null"); } catch (e) {}
      if (sup && sup.id) {
        try {
          if (sup.tipo === "ent") {
            var e2 = await DB.uno("entrenadores", { id: sup.id });
            if (e2) { APP.rol = "entrenador"; APP.ent = e2; APP.suplanta = sup; window.__suplanta = e2.id; return; }
          } else {
            var c2 = await DB.uno("clientes", { id: sup.id });
            if (c2) { APP.rol = "cliente"; APP.cli = c2; APP.ent = await DB.uno("entrenadores", { id: c2.entrenador_id }); APP.suplanta = sup; window.__suplanta = c2.entrenador_id; return; }
          }
        } catch (e) {}
        try { sessionStorage.removeItem("pulso_suplanta"); } catch (e) {}
      }
      var verComo = false; try { verComo = sessionStorage.getItem("pulso_ver_como") === "1"; } catch (e) {}
      if (verComo) {
        if (!ent) { try { ent = await DB.ins("entrenadores", { nombre: (APP.usuario.email || "").split("@")[0] }); } catch (e) {} }
        if (ent) { APP.rol = "entrenador"; APP.ent = ent; return; }
      }
      APP.rol = "admin"; APP.ent = ent; return;
    }
    if (ent) { APP.rol = "entrenador"; APP.ent = ent; localStorage.removeItem(LLAVE_INV); latido(); return; }
    var cli = await DB.miCliente(uid);
    if (!cli && pendiente) {
      try { await DB.rpc("reclamar_invitacion", { p_codigo: pendiente }); } catch (e) { UI.error(e); }
      localStorage.removeItem(LLAVE_INV);
      cli = await DB.miCliente(uid);
    }
    if (cli) {
      APP.rol = "cliente"; APP.cli = cli;
      APP.ent = await DB.uno("entrenadores", { id: cli.entrenador_id });
    }
    latido();
  }
  APP.detectarRol = detectarRol;

  // Tiempo en línea: un "latido" al abrir y cada minuto mientras la app está visible
  var tLatido = null, ultLatido = 0;
  function latido() {
    if (DB.modo !== "supabase" || !APP.usuario || APP.esAdmin || document.hidden) return;
    if (Date.now() - ultLatido < 45000) return; // como máximo uno cada 45 s
    ultLatido = Date.now();
    DB.rpc("registrar_acceso", {}).catch(function () {});
    if (!tLatido) tLatido = setInterval(latido, 60000);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) latido(); });

  async function pintar() {
    var r = ruta(), app = UI.$("#app");
    UI.$("#capa").innerHTML = "";
    document.body.classList.remove("ancho");
    window.onbeforeunload = null;
    if (APP.alSalirVista) { try { APP.alSalirVista(); } catch (e) {} APP.alSalirVista = null; }
    if (r.nombre === "invitacion") { UI.tabbar(null); return pantallaInvitacion(r.params[0]); }
    if (!APP.usuario) { UI.tabbar(null); UI.aplicarMarca(C.COLOR); return pantallaEntrar(); }
    if (!APP.rol) { UI.tabbar(null); return pantallaSinRol(); }
    UI.aplicarMarca(APP.ent && APP.ent.color);
    var mapa = VISTAS[APP.rol];
    var vista = mapa[r.nombre] || mapa[""];
    window.scrollTo(0, 0);
    try { await vista.apply(null, r.params); } catch (e) { UI.error(e); app.innerHTML = '<div class="vacio" style="padding-top:120px">Algo salió mal. <a href="#/" style="color:var(--brand-2)">Volver al inicio</a></div>'; }
  }
  window.addEventListener("hashchange", pintar);

  /* ───────── Pantalla de entrada ───────── */
  function logoMarca(url) {
    return '<div class="logo">' + (url ? '<img src="' + esc(url) + '" alt="">' : ico("pulso", ' stroke-width="2.4"')) + "</div>";
  }
  function pantallaEntrar() {
    var app = UI.$("#app"), modo = "cliente", crear = false;
    function dibujar() {
      var demo = DB.modo === "demo";
      app.innerHTML = bandaDemo() + '<section class="entrar"><div class="marca-grande">' + logoMarca() +
        "<h1>" + esc(C.MARCA || "Pulso") + "</h1><p>Tus rutinas, tu progreso y tu entrenador en una sola app.</p></div>" +
        (demo ?
          '<div class="form"><button class="btn" data-demo="entrenador@demo">' + ico("rutinas") + 'Entrar como entrenador</button>' +
          '<button class="btn vidrio" data-demo="cliente@demo">' + ico("persona") + 'Entrar como cliente</button>' +
          '<p class="nota-demo">Estás en el modo demo, con datos de ejemplo. Cuando se conecte la base de datos, aquí saldrá el inicio de sesión real.</p></div>'
          :
          '<div class="form"><div class="segmento"><button data-modo="cliente" class="' + (modo === "cliente" ? "on" : "") + '">Soy cliente</button>' +
          '<button data-modo="entrenador" class="' + (modo === "entrenador" ? "on" : "") + '">Soy entrenador</button></div>' +
          '<div class="campo"><input class="entrada" id="email" type="email" autocomplete="email" placeholder="Correo"></div>' +
          '<div class="campo"><input class="entrada" id="clave" type="password" autocomplete="' + (crear ? "new-password" : "current-password") + '" placeholder="Contraseña"></div>' +
          (crear ? '<div class="campo"><input class="entrada" id="nombre" autocomplete="name" placeholder="Tu nombre"></div>' : "") +
          '<button class="btn" id="ir">' + (crear ? "Crear mi cuenta" : "Entrar") + "</button>" +
          (modo === "entrenador" ? '<button class="btn vidrio" id="alternar">' + (crear ? "Ya tengo cuenta" : "Crear cuenta de entrenador") + "</button>" :
            '<p class="nota-demo">¿Primera vez? Tu entrenador te manda un enlace para crear tu cuenta.</p>') +
          '<button class="nota-demo" id="olvide" style="background:none;border:0;cursor:pointer;text-decoration:underline">Olvidé mi contraseña</button></div>') +
        "</section>";
      UI.$$("[data-demo]", app).forEach(function (b) {
        b.onclick = async function () { await DB.entrarComo(b.dataset.demo); await detectarRol(); APP.ir(""); };
      });
      UI.$$("[data-modo]", app).forEach(function (b) { b.onclick = function () { modo = b.dataset.modo; crear = false; dibujar(); }; });
      var alt = UI.$("#alternar", app); if (alt) alt.onclick = function () { crear = !crear; dibujar(); };
      var olv = UI.$("#olvide", app);
      if (olv) olv.onclick = async function () {
        var email = UI.$("#email").value.trim();
        if (!email) return UI.aviso("Escribe tu correo primero", true);
        try { await DB.recuperar(email); UI.aviso("Te mandamos un correo para cambiarla"); } catch (e) { UI.error(e); }
      };
      var ir = UI.$("#ir", app);
      if (ir) ir.onclick = async function () {
        var email = UI.$("#email").value.trim(), clave = UI.$("#clave").value;
        if (!email || !clave) return UI.aviso("Escribe tu correo y contraseña", true);
        ir.disabled = true;
        try {
          if (crear) {
            var nombre = (UI.$("#nombre").value || "").trim() || email.split("@")[0];
            var res = await DB.registrar(email, clave);
            if (!res.sesion) { localStorage.setItem("pulso_nuevo_entrenador", nombre); UI.aviso("Revisa tu correo para confirmar la cuenta"); ir.disabled = false; return; }
            await DB.ins("entrenadores", { nombre: nombre });
          } else {
            await DB.entrar(email, clave);
          }
          await detectarRol(); APP.ir("");
        } catch (e) { UI.error(e); ir.disabled = false; }
      };
    }
    dibujar();
  }

  /* Cuenta sin entrenador ni cliente */
  async function pantallaSinRol() {
    var app = UI.$("#app");
    var nombreNuevo = localStorage.getItem("pulso_nuevo_entrenador");
    if (nombreNuevo) {
      try { await DB.ins("entrenadores", { nombre: nombreNuevo }); localStorage.removeItem("pulso_nuevo_entrenador"); await detectarRol(); return pintar(); } catch (e) { UI.error(e); }
    }
    app.innerHTML = '<section class="entrar"><div class="marca-grande">' + logoMarca() + "<h1>Casi listo</h1><p>Tu cuenta (" + esc(APP.usuario.email || "") +
      ") todavía no está ligada a un entrenador. Abre el enlace que te mandó tu entrenador, o crea tu espacio de entrenador.</p></div>" +
      '<div class="form"><button class="btn" id="serEnt">Soy entrenador: crear mi espacio</button><button class="btn vidrio" id="salir">Cerrar sesión</button></div></section>';
    UI.$("#serEnt").onclick = async function () {
      try { await DB.ins("entrenadores", { nombre: (APP.usuario.email || "").split("@")[0] }); await detectarRol(); APP.ir(""); } catch (e) { UI.error(e); }
    };
    UI.$("#salir").onclick = async function () { await DB.salir(); APP.usuario = null; APP.ir(""); };
  }

  /* ───────── Invitación de cliente ───────── */
  async function pantallaInvitacion(codigo) {
    var app = UI.$("#app");
    app.innerHTML = UI.cargando();
    var inv;
    try { inv = (await DB.rpc("invitacion", { p_codigo: codigo }))[0]; } catch (e) { inv = null; }
    if (!inv) {
      app.innerHTML = '<section class="entrar"><div class="marca-grande">' + logoMarca() + "<h1>Enlace no válido</h1><p>Pídele a tu entrenador que te mande uno nuevo.</p></div>" +
        '<a class="btn" href="#/">Ir al inicio</a></section>';
      return;
    }
    UI.aplicarMarca(inv.color);
    var logo = inv.logo_url;
    var crear = !inv.usada;
    function dibujar() {
      app.innerHTML = bandaDemo() + '<section class="entrar"><div class="marca-grande">' + logoMarca(logo) + "<h1>" + esc(inv.marca || "Pulso") + "</h1><p>Hola " +
        esc((inv.cliente_nombre || "").split(" ")[0]) + ", " + esc(inv.entrenador || "tu entrenador") + " te invitó. Aquí verás tus rutinas y registrarás tu progreso.</p></div>" +
        (APP.usuario && APP.rol === "entrenador" ?
          '<div class="form"><p class="nota-demo" style="font-size:15px;color:#fff">Estás dentro con tu cuenta de <b>entrenador</b>. Esta invitación es para tu alumno: mándale el enlace para que la abra en su celular.</p>' +
          '<a class="btn" href="#/">Volver a mi panel</a><button class="btn vidrio" id="otra">Cerrar sesión y crear la cuenta del alumno aquí</button></div>' :
         APP.usuario && APP.rol === "cliente" ?
          '<div class="form"><p class="nota-demo" style="font-size:15px;color:#fff">Ya tienes tu cuenta de alumno con ' + esc(APP.usuario.email || "tu correo") + '.</p>' +
          '<a class="btn" href="#/">Ir a mi app</a><button class="btn vidrio" id="otra">Usar otra cuenta</button></div>' :
         APP.usuario ?
          '<div class="form"><button class="btn" id="aceptar">Aceptar invitación</button><p class="nota-demo">Entrarás con ' + esc(APP.usuario.email || "tu cuenta") + "</p>" +
          '<button class="btn vidrio" id="otra">Usar otra cuenta</button></div>' :
          '<div class="form"><div class="campo"><input class="entrada" id="email" type="email" autocomplete="email" placeholder="Tu correo"></div>' +
          '<div class="campo"><input class="entrada" id="clave" type="password" autocomplete="' + (crear ? "new-password" : "current-password") + '" placeholder="' + (crear ? "Crea una contraseña (6+)" : "Contraseña") + '"></div>' +
          '<button class="btn" id="ir">' + (crear ? "Crear mi cuenta" : "Entrar") + '</button><button class="btn vidrio" id="alternar">' + (crear ? "Ya tengo cuenta" : "Crear cuenta nueva") + "</button>" +
          (DB.modo === "demo" ? '<p class="nota-demo">Modo demo: crea una cuenta con cualquier correo.</p>' : "") + "</div>") +
        "</section>";
      var ac = UI.$("#aceptar", app);
      if (ac) ac.onclick = async function () {
        try { await DB.rpc("reclamar_invitacion", { p_codigo: codigo }); await detectarRol(); APP.ir(""); } catch (e) { UI.error(e); }
      };
      var otra = UI.$("#otra", app); if (otra) otra.onclick = async function () { await DB.salir(); APP.usuario = null; APP.rol = null; APP.ent = null; APP.cli = null; UI.aplicarMarca(inv.color); dibujar(); };
      var alt = UI.$("#alternar", app); if (alt) alt.onclick = function () { crear = !crear; dibujar(); };
      var ir = UI.$("#ir", app);
      if (ir) ir.onclick = async function () {
        var email = UI.$("#email").value.trim(), clave = UI.$("#clave").value;
        if (!email || !clave) return UI.aviso("Escribe tu correo y contraseña", true);
        ir.disabled = true;
        localStorage.setItem(LLAVE_INV, codigo);
        try {
          if (crear) {
            var res = await DB.registrar(email, clave);
            if (!res.sesion) { UI.aviso("Revisa tu correo para confirmar y luego entra"); ir.disabled = false; return; }
          } else {
            await DB.entrar(email, clave);
          }
          await detectarRol();
          location.hash = "#/";
        } catch (e) { UI.error(e); ir.disabled = false; }
      };
    }
    dibujar();
  }

  function hojaNuevaClave() {
    if (hojaClaveAbierta) return; hojaClaveAbierta = true;
    UI.hoja("Nueva contraseña", '<div class="form"><input class="entrada" id="nueva" type="password" autocomplete="new-password" placeholder="Nueva contraseña (6+)"><button class="btn" id="guardarClave">Guardar</button></div>', function (h, cerrar) {
      h.querySelector("#guardarClave").onclick = async function () {
        try { await DB.cambiarClave(h.querySelector("#nueva").value); cerrar(); hojaClaveAbierta = false; UI.aviso("Contraseña cambiada ✓"); } catch (e) { UI.error(e); }
      };
    });
  }
  // Enter en los campos de correo/contraseña pulsa el botón principal
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || !e.target.matches || !e.target.matches("#email, #clave, #nombre")) return;
    var b = UI.$("#ir"); if (b && !b.disabled) { e.preventDefault(); b.click(); }
  });

  /* ───────── Arranque ───────── */
  async function arrancar() {
    UI.aplicarMarca(C.COLOR);
    UI.$("#app").innerHTML = UI.cargando();
    DB.alCambiar(async function (ev) {
      if (ev === "PASSWORD_RECOVERY") hojaNuevaClave();
      if (ev === "SIGNED_OUT") { APP.usuario = null; APP.rol = null; }
    });
    try { await detectarRol(); } catch (e) { UI.error(e); }
    if (esRecuperacion) { history.replaceState(null, "", location.pathname + location.search + "#/"); hojaNuevaClave(); }
    pintar();
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
    buscarVersionNueva();
  }

  /* Actualización automática: si se publicó una versión nueva, la app se recarga sola
     (al volver a abrirla o cada 5 minutos), salvo que haya una rutina sin guardar. */
  var VERSION_ACTUAL = ((UI.$('script[src*="js/app.js"]') || {}).src || "").replace(/.*[?&]v=([^&]+).*/, "$1");
  function buscarVersionNueva() {
    if (!VERSION_ACTUAL || location.protocol !== "https:") return;
    fetch("index.html?_=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (html) {
      var m = html.match(/js\/app\.js\?v=([^"&]+)/);
      if (m && m[1] !== VERSION_ACTUAL && !window.onbeforeunload) {
        var ult = 0; try { ult = Number(sessionStorage.getItem("pulso_recarga")) || 0; } catch (e) {}
        if (Date.now() - ult < 60000) return; // evita recargar en bucle
        try { sessionStorage.setItem("pulso_recarga", String(Date.now())); } catch (e) {}
        location.reload();
      }
    }).catch(function () {});
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) buscarVersionNueva(); });
  setInterval(buscarVersionNueva, 5 * 60000);
  APP.salir = async function () { document.body.removeAttribute("data-sec"); await DB.salir(); APP.usuario = null; APP.rol = null; location.hash = "#/"; pintar(); };
  APP.enlaceInvitacion = function (codigo) { return location.href.split("#")[0] + "#/invitacion/" + codigo; };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
