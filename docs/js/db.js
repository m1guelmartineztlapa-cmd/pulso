/* Pulso · capa de datos. Dos motores con la misma forma:
   - Supabase (real, con cuentas)
   - Demo (localStorage, para probar sin cuenta) */
(function () {
  "use strict";
  var C = window.PULSO_CONFIG || {};
  // ?demo en la dirección fuerza el modo demo (para enseñar la app sin tocar datos reales)
  var real = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) && !/[?&]demo\b/.test(location.search);

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  function hoyISO(d) { d = d || new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function ordenar(filas, o) {
    if (!o || !o.orden) return filas;
    var k = o.orden, s = o.desc ? -1 : 1;
    return filas.slice().sort(function (a, b) { return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * s; });
  }

  /* ───────────── Supabase ───────────── */
  function motorSupabase() {
    var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    function r(res) { if (res.error) throw new Error(res.error.message); return res.data; }
    return {
      modo: "supabase",
      usuario: async function () { var s = await sb.auth.getSession(); return s.data.session ? s.data.session.user : null; },
      registrar: async function (email, clave) {
        var d = r(await sb.auth.signUp({ email: email, password: clave, options: { emailRedirectTo: location.href.split("#")[0] } }));
        return { usuario: d.user, sesion: !!d.session };
      },
      entrar: async function (email, clave) { return r(await sb.auth.signInWithPassword({ email: email, password: clave })).user; },
      salir: async function () { await sb.auth.signOut(); },
      recuperar: async function (email) { r(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] })); },
      cambiarClave: async function (clave) { r(await sb.auth.updateUser({ password: clave })); },
      alCambiar: function (fn) { sb.auth.onAuthStateChange(function (ev) { fn(ev); }); },
      sel: async function (tabla, filtro, o) {
        o = o || {};
        var q = sb.from(tabla).select(o.campos || "*");
        Object.keys(filtro || {}).forEach(function (k) {
          var v = filtro[k];
          if (Array.isArray(v)) q = q.in(k, v); else if (v === null) q = q.is(k, null); else q = q.eq(k, v);
        });
        if (o.desde) q = q.gte(o.desde[0], o.desde[1]);
        if (o.orden) q = q.order(o.orden, { ascending: !o.desc });
        if (o.limite) q = q.limit(o.limite);
        return r(await q) || [];
      },
      uno: async function (tabla, filtro) { var f = await this.sel(tabla, filtro, { limite: 1 }); return f[0] || null; },
      ins: async function (tabla, fila) { return r(await sb.from(tabla).insert(fila).select().single()); },
      upd: async function (tabla, id, cambios) { return r(await sb.from(tabla).update(cambios).eq("id", id).select().single()); },
      del: async function (tabla, id) { r(await sb.from(tabla).delete().eq("id", id)); },
      rpc: async function (nombre, args) { return r(await sb.rpc(nombre, args)); },
      // El alumno lee su ficha con una función segura (sin las notas privadas del entrenador).
      miCliente: async function (uid) {
        var res = await sb.rpc("mi_cliente");
        if (!res.error) { var d = Array.isArray(res.data) ? res.data[0] : res.data; return d || null; }
        return await this.uno("clientes", { user_id: uid }); // por si aún no existe la función
      },
      subir: async function (cubeta, ruta, archivo) {
        r(await sb.storage.from(cubeta).upload(ruta, archivo, { upsert: false, contentType: archivo.type || "image/jpeg" }));
        return ruta;
      },
      urlPublica: function (cubeta, ruta) { return sb.storage.from(cubeta).getPublicUrl(ruta).data.publicUrl; },
      urlFirmada: async function (cubeta, ruta) {
        var d = r(await sb.storage.from(cubeta).createSignedUrl(ruta, 3600)); return d.signedUrl;
      },
      borrarArchivo: async function (cubeta, ruta) { await sb.storage.from(cubeta).remove([ruta]); },
      ia: async function (cuerpo) {
        var res = await sb.functions.invoke("ia", { body: cuerpo });
        if (res.error) {
          var msg = "La IA no está disponible ahora.";
          try { var j = await res.error.context.json(); if (j && j.error) msg = j.error; } catch (e) {}
          throw new Error(msg);
        }
        return res.data;
      }
    };
  }

  /* ───────────── Demo (localStorage) ───────────── */
  var LLAVE = "pulso_demo_v1";
  var ENT = "00000000-0000-4000-8000-000000000001";
  var USR_CLI = "00000000-0000-4000-8000-000000000002";
  var TABLAS = ["entrenadores", "clientes", "ejercicios", "rutinas", "asignaciones", "sesiones", "medidas"];

  function semilla() {
    var t = {}; TABLAS.forEach(function (k) { t[k] = []; });
    var ahora = new Date().toISOString();
    t.entrenadores.push({ id: ENT, nombre: "Profe Demo", marca: "Pulso", logo_url: null, color: "#2F6BFF", creado: ahora });
    var c1 = { id: uuid(), entrenador_id: ENT, user_id: USR_CLI, nombre: "Ana López", email: "ana@ejemplo.com", telefono: "", objetivo: "Ganar fuerza", notas: "", activo: true, codigo: "demo01", creado: ahora };
    var c2 = { id: uuid(), entrenador_id: ENT, user_id: null, nombre: "Carlos Ruiz", email: "", telefono: "", objetivo: "Bajar de peso", notas: "", activo: true, codigo: "demo02", creado: ahora };
    var c3 = { id: uuid(), entrenador_id: ENT, user_id: null, nombre: "Sofía Méndez", email: "", telefono: "", objetivo: "Tonificar", notas: "", activo: true, codigo: "demo03", creado: ahora };
    t.clientes.push(c1, c2, c3);
    function it(ref, nombre, img, series, reps, desc, intTipo, int, grupo) {
      return { id: uuid(), ref: ref, nombre: nombre, img: img, series: series, reps: reps, tiempo: "", descanso: desc, peso: "", intTipo: intTipo || "", int: int || "", nota: "", grupo: grupo || "" };
    }
    var IMG = function (id) { return id + "/0.jpg"; };
    var r1 = { id: uuid(), entrenador_id: ENT, nombre: "Pierna y glúteo", descripcion: "Fuerza tren inferior", creado: ahora, actualizado: ahora, bloques: [
      { id: uuid(), nombre: "Calentamiento", items: [it("lib:Bodyweight_Squat", "Sentadilla libre", IMG("Bodyweight_Squat"), 2, "15", 45)] },
      { id: uuid(), nombre: "Fuerza", items: [
        it("lib:Barbell_Squat", "Sentadilla con barra", IMG("Barbell_Squat"), 4, "8", 120, "RIR", "2"),
        it("lib:Romanian_Deadlift", "Peso muerto rumano", IMG("Romanian_Deadlift"), 3, "10", 90, "RIR", "2"),
        it("lib:Barbell_Hip_Thrust", "Hip thrust con barra", IMG("Barbell_Hip_Thrust"), 3, "12", 60, "", "", "A"),
        it("lib:Leg_Extensions", "Extensión de pierna", IMG("Leg_Extensions"), 3, "15", 60, "", "", "A")] }
    ] };
    var r2 = { id: uuid(), entrenador_id: ENT, nombre: "Torso", descripcion: "Pecho, espalda y brazos", creado: ahora, actualizado: ahora, bloques: [
      { id: uuid(), nombre: "Fuerza", items: [
        it("lib:Barbell_Bench_Press_-_Medium_Grip", "Press de banca con barra", IMG("Barbell_Bench_Press_-_Medium_Grip"), 4, "8", 120, "RPE", "8"),
        it("lib:Wide-Grip_Lat_Pulldown", "Jalón al pecho agarre abierto", IMG("Wide-Grip_Lat_Pulldown"), 4, "10", 90),
        it("lib:Dumbbell_Shoulder_Press", "Press de hombro con mancuernas", IMG("Dumbbell_Shoulder_Press"), 3, "10", 90),
        it("lib:Hammer_Curls", "Curl martillo", IMG("Hammer_Curls"), 3, "12", 45, "", "", "B"),
        it("lib:Triceps_Pushdown_-_Rope_Attachment", "Jalón de tríceps con cuerda", IMG("Triceps_Pushdown_-_Rope_Attachment"), 3, "12", 45, "", "", "B")] }
    ] };
    t.rutinas.push(r1, r2);
    t.asignaciones.push(
      { id: uuid(), entrenador_id: ENT, cliente_id: c1.id, rutina_id: r1.id, dias: [1, 4], activa: true, creado: ahora },
      { id: uuid(), entrenador_id: ENT, cliente_id: c1.id, rutina_id: r2.id, dias: [2, 5], activa: true, creado: ahora },
      { id: uuid(), entrenador_id: ENT, cliente_id: c2.id, rutina_id: r2.id, dias: [1, 3, 5], activa: true, creado: ahora });
    // historial de Ana: 6 sesiones de pierna con progreso
    for (var i = 6; i >= 1; i--) {
      var f = new Date(); f.setDate(f.getDate() - i * 4);
      var p = 50 + (6 - i) * 2.5;
      t.sesiones.push({ id: uuid(), entrenador_id: ENT, cliente_id: c1.id, rutina_id: r1.id, rutina_nombre: r1.nombre, fecha: hoyISO(f), terminada: true,
        comentario: i === 1 ? "Me sentí fuerte hoy 💪" : "", calificacion: 4 + (i % 2), creado: f.toISOString(),
        series: [1, 2, 3, 4].map(function (n) { return { ref: "lib:Barbell_Squat", nombre: "Sentadilla con barra", serie: n, peso: p, reps: 8, rir: 2 }; })
          .concat([1, 2, 3].map(function (n) { return { ref: "lib:Romanian_Deadlift", nombre: "Peso muerto rumano", serie: n, peso: p - 10, reps: 10, rir: 2 }; })) });
    }
    t.medidas.push({ id: uuid(), entrenador_id: ENT, cliente_id: c1.id, fecha: hoyISO(new Date(Date.now() - 20 * 864e5)), peso: 64, cintura: 74, cadera: 98, pecho: 88, brazo: 28, pierna: 55, grasa: 26, foto_path: null, nota: "", creado: ahora },
      { id: uuid(), entrenador_id: ENT, cliente_id: c1.id, fecha: hoyISO(), peso: 62.5, cintura: 71, cadera: 97, pecho: 88, brazo: 28.5, pierna: 55.5, grasa: 24, foto_path: null, nota: "", creado: ahora });
    return { tablas: t, usuario: null, archivos: {} };
  }

  function motorDemo() {
    var est;
    try { est = JSON.parse(localStorage.getItem(LLAVE)); } catch (e) { est = null; }
    if (!est || !est.tablas) est = semilla();
    function guardar() { try { localStorage.setItem(LLAVE, JSON.stringify(est)); } catch (e) { /* sin espacio: seguimos en memoria */ } }
    guardar();
    function coincide(f, filtro) {
      return Object.keys(filtro || {}).every(function (k) {
        var v = filtro[k];
        if (Array.isArray(v)) return v.indexOf(f[k]) >= 0;
        return f[k] === v;
      });
    }
    var USUARIOS = { "entrenador@demo": { id: ENT, email: "entrenador@demo" }, "cliente@demo": { id: USR_CLI, email: "cliente@demo" } };
    var oyentes = [];
    function avisar(ev) { oyentes.forEach(function (fn) { fn(ev); }); }
    return {
      modo: "demo",
      usuario: async function () { return est.usuario; },
      entrarComo: async function (quien) { est.usuario = USUARIOS[quien]; guardar(); avisar("SIGNED_IN"); return est.usuario; },
      registrar: async function (email) {
        var u = { id: uuid(), email: email }; USUARIOS[email] = u; est.usuario = u; guardar(); return { usuario: u, sesion: true };
      },
      entrar: async function (email) {
        var u = USUARIOS[email] || Object.values(USUARIOS).find(function (x) { return x.email === email; });
        if (!u) throw new Error("En el modo demo usa los botones de demo.");
        est.usuario = u; guardar(); return u;
      },
      salir: async function () { est.usuario = null; guardar(); avisar("SIGNED_OUT"); },
      recuperar: async function () { throw new Error("No disponible en el modo demo."); },
      cambiarClave: async function () {},
      alCambiar: function (fn) { oyentes.push(fn); },
      reiniciar: function () { est = semilla(); guardar(); },
      sel: async function (tabla, filtro, o) {
        o = o || {};
        var filas = est.tablas[tabla].filter(function (f) { return coincide(f, filtro); });
        if (o.desde) filas = filas.filter(function (f) { return f[o.desde[0]] >= o.desde[1]; });
        filas = ordenar(filas, o);
        if (o.limite) filas = filas.slice(0, o.limite);
        return JSON.parse(JSON.stringify(filas));
      },
      uno: async function (tabla, filtro) { var f = await this.sel(tabla, filtro, { limite: 1 }); return f[0] || null; },
      miCliente: async function (uid) { return await this.uno("clientes", { user_id: uid }); },
      ins: async function (tabla, fila) {
        var ahora = new Date().toISOString();
        var n = Object.assign({ id: uuid(), creado: ahora }, fila);
        var uid = est.usuario && est.usuario.id;
        if (tabla === "entrenadores") n.id = fila.id || uid;
        if (["clientes", "ejercicios", "rutinas", "asignaciones"].indexOf(tabla) >= 0 && !n.entrenador_id) n.entrenador_id = uid;
        if (tabla === "clientes") { if (!n.codigo) n.codigo = Math.random().toString(16).slice(2, 14); if (n.activo === undefined) n.activo = true; if (n.user_id === undefined) n.user_id = null; }
        if (tabla === "rutinas") { n.actualizado = ahora; if (!n.bloques) n.bloques = []; }
        if (tabla === "sesiones" && !n.fecha) n.fecha = hoyISO();
        if (tabla === "medidas" && !n.fecha) n.fecha = hoyISO();
        est.tablas[tabla].push(n); guardar(); return JSON.parse(JSON.stringify(n));
      },
      upd: async function (tabla, id, cambios) {
        var f = est.tablas[tabla].find(function (x) { return x.id === id; });
        if (!f) throw new Error("No encontrado");
        Object.assign(f, cambios); guardar(); return JSON.parse(JSON.stringify(f));
      },
      del: async function (tabla, id) {
        est.tablas[tabla] = est.tablas[tabla].filter(function (x) { return x.id !== id; });
        if (tabla === "clientes") ["asignaciones", "sesiones", "medidas"].forEach(function (t) { est.tablas[t] = est.tablas[t].filter(function (x) { return x.cliente_id !== id; }); });
        if (tabla === "rutinas") est.tablas.asignaciones = est.tablas.asignaciones.filter(function (x) { return x.rutina_id !== id; });
        guardar();
      },
      rpc: async function (nombre, args) {
        if (nombre === "invitacion") {
          var c = est.tablas.clientes.find(function (x) { return x.codigo === args.p_codigo; });
          if (!c) return [];
          var e = est.tablas.entrenadores.find(function (x) { return x.id === c.entrenador_id; });
          return [{ cliente_nombre: c.nombre, marca: e.marca, logo_url: e.logo_url, color: e.color, entrenador: e.nombre, usada: !!c.user_id }];
        }
        if (nombre === "reclamar_invitacion") {
          var cl = est.tablas.clientes.find(function (x) { return x.codigo === args.p_codigo; });
          if (!cl || (cl.user_id && cl.user_id !== est.usuario.id)) throw new Error("Invitación no válida o ya usada");
          cl.user_id = est.usuario.id; guardar(); return cl.id;
        }
        throw new Error("Función desconocida: " + nombre);
      },
      subir: async function (cubeta, ruta, archivo) {
        var url = await new Promise(function (ok, mal) { var l = new FileReader(); l.onload = function () { ok(l.result); }; l.onerror = mal; l.readAsDataURL(archivo); });
        est.archivos[cubeta + "/" + ruta] = url; guardar(); return ruta;
      },
      urlPublica: function (cubeta, ruta) { return est.archivos[cubeta + "/" + ruta] || ""; },
      urlFirmada: async function (cubeta, ruta) { return est.archivos[cubeta + "/" + ruta] || ""; },
      borrarArchivo: async function (cubeta, ruta) { delete est.archivos[cubeta + "/" + ruta]; guardar(); },
      ia: async function () { throw new Error("La IA no está disponible en el modo demo."); }
    };
  }

  window.DB = real ? motorSupabase() : motorDemo();
  window.DB.uuid = uuid;
  window.DB.hoyISO = hoyISO;
})();
