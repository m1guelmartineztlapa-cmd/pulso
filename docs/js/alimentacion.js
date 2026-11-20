/* Pulso · Alimentación: planes de comida, registro diario y "¿Cómo te sientes hoy?" */
(function () {
  "use strict";
  var UI = window.UI, DB = window.DB, esc = UI.esc, ico = UI.ico;
  var VIS = (window.VISTAS = window.VISTAS || { entrenador: {}, cliente: {} });
  var VE = VIS.entrenador, VC = VIS.cliente;
  function A() { return window.APP; }
  function app() { return UI.$("#app"); }

  var TIEMPOS = [
    { id: "desayuno", txt: "Desayuno", ico: "☀️" }, { id: "almuerzo", txt: "Almuerzo", ico: "🍽️" }, { id: "comida", txt: "Comida", ico: "🍲" },
    { id: "cena", txt: "Cena", ico: "🌙" }, { id: "snack", txt: "Snack", ico: "🥕" }, { id: "bebida", txt: "Bebida", ico: "🍵" }
  ];
  var T = {}; TIEMPOS.forEach(function (t) { T[t.id] = t; });
  var INDICADORES_BASE = ["Energía", "Digestión", "Hinchazón", "Glucosa", "Hidratación", "Descanso"];
  var INDICADORES_EXTRA = ["Antojos", "Saciedad", "Ánimo", "Estrés"];
  var CARITAS = ["😣", "🙁", "😐", "🙂", "😄"];
  var NIVEL = ["Muy bajo", "Bajo", "Regular", "Bien", "Excelente"];
  var PORCIONES = ["", "1 palma (proteína)", "2 puños (vegetales)", "1 puño (carbohidrato)", "1 pulgar (grasa)", "1 taza", "1 puñito"];

  /* ───────── Utilidades ───────── */
  var plantillas = null;
  function cargarPlantillas() {
    if (!plantillas) plantillas = fetch("datos/plantillas-alimentacion.json").then(function (r) { return r.json(); }).catch(function () { plantillas = null; return []; });
    return plantillas;
  }
  var recetario = null;
  function cargarRecetario() {
    if (!recetario) recetario = fetch("datos/recetario.json").then(function (r) { return r.json(); }).catch(function () { recetario = null; return []; });
    return recetario;
  }
  var CATS = [
    { id: "frasco", txt: "Ensaladas en frasco", corto: "Ensaladas", e: "🫙", cls: "verde" },
    { id: "proteina", txt: "Proteínas", corto: "Proteínas", e: "🍗", cls: "azul" },
    { id: "salsa", txt: "Salsas y untables", corto: "Salsas", e: "🥣", cls: "ambar" },
    { id: "topping", txt: "Toppings crujientes", corto: "Toppings", e: "🥜", cls: "rosa" },
    { id: "base", txt: "Bases para cocinar el domingo", corto: "Bases", e: "🍱", cls: "morado" }
  ];
  function catDe(id) { return CATS.find(function (k) { return k.id === id; }) || { e: "🍽️", cls: "azul", txt: "" }; }
  function sinAcentos(x) { return String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function buscarRecetas(lista, q, cat) {
    var qq = sinAcentos(q);
    return lista.filter(function (r) { return (!cat || r.categoria === cat) && (!qq || sinAcentos(r.nombre + " " + (r.ingredientes || []).join(" ")).indexOf(qq) >= 0); });
  }
  function filaReceta(r) {
    var k = catDe(r.categoria);
    return '<button type="button" class="item fila-btn" data-r="' + esc(r.id) + '"><span class="ico cuadro cat-' + k.cls + '" style="font-size:22px">' + k.e + '</span><span class="txt"><div class="t1">' + esc(r.nombre) +
      '</div><div class="t2">' + esc([r.kcal != null ? r.kcal + " kcal" : "", r.prot != null ? r.prot + " g proteína" : "", r.porcion].filter(Boolean).slice(0, 2).join(" · ")) + '</div></span><span class="chev">' + ico("der") + "</span></button>";
  }
  function macroCajas(c) {
    if (c.kcal == null && c.prot == null) return "";
    function caja(v, u, t) { return "<div><b>" + (v == null ? "—" : v + u) + "</b><small>" + t + "</small></div>"; }
    return '<div class="macro-cajas">' + caja(c.kcal, "", "kcal") + caja(c.prot, "g", "proteína") + caja(c.carbs, "g", "carbs") + caja(c.grasa, "g", "grasa") + "</div>";
  }
  function pasosHTML(txt) {
    var p = String(txt || "").split(/\.\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).map(function (x) { return x.trim().replace(/\.$/, ""); }).filter(Boolean);
    if (p.length < 2) return '<p class="receta-txt">' + esc(txt) + "</p>";
    return '<ol class="pasos">' + p.map(function (x) { return "<li><span>" + esc(x) + ".</span></li>"; }).join("") + "</ol>";
  }
  function recetaAComida(r, tiempo) {
    var c = JSON.parse(JSON.stringify(r)); delete c.id; delete c.categoria;
    c.tiempo = tiempo || r.tiempo || "comida"; return c;
  }
  function ordenarComidas(d) {
    var ord = TIEMPOS.map(function (t) { return t.id; });
    d.comidas = (d.comidas || []).map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) {
      return (ord.indexOf(a.c.tiempo || "comida") - ord.indexOf(b.c.tiempo || "comida")) || (a.i - b.i);
    }).map(function (x) { return x.c; });
  }
  /* Elegir una receta (desde el editor del plan) */
  async function hojaRecetario(alElegir, o) {
    o = o || {};
    var lista = await cargarRecetario(), cat = "", q = "";
    var titulo = o.tiempo && T[o.tiempo] ? "Agregar " + T[o.tiempo].txt.toLowerCase() : "Elegir receta";
    UI.hoja(titulo, (o.alPropia ? '<button type="button" class="btn vidrio" id="rPropia" style="margin-bottom:12px">' + ico("editar") + "Escribir mi propia receta</button>" : "") +
      '<input class="entrada" id="rB" type="search" placeholder="Buscar: pollo, aguacate, salmón…" style="margin-bottom:10px">' +
      '<div class="chips" id="rC" style="flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px"><button type="button" class="chip on" data-k="" style="flex:none">Todas</button>' +
      CATS.map(function (k) { return '<button type="button" class="chip" data-k="' + k.id + '" style="flex:none">' + k.e + " " + k.corto + "</button>"; }).join("") + "</div>" +
      '<div class="lista" id="rL" style="margin-top:8px"></div>', function (h, cerrar) {
      function pintar() {
        var vis = buscarRecetas(lista, q, cat);
        h.querySelector("#rL").innerHTML = vis.length ? vis.map(filaReceta).join("") : '<div class="vacio">No encontré recetas con eso.</div>';
        UI.$$("[data-r]", h).forEach(function (b) {
          b.onclick = function () { var r = lista.find(function (x) { return x.id === b.dataset.r; }); cerrar(); alElegir(JSON.parse(JSON.stringify(r))); };
        });
      }
      var pr = h.querySelector("#rPropia"); if (pr) pr.onclick = function () { cerrar(); o.alPropia(); };
      h.querySelector("#rB").oninput = function () { q = this.value; pintar(); };
      UI.$$("#rC .chip", h).forEach(function (b) { b.onclick = function () { cat = b.dataset.k; UI.$$("#rC .chip", h).forEach(function (x) { x.classList.toggle("on", x === b); }); pintar(); }; });
      pintar();
    });
  }
  VE.hojaRecetario = hojaRecetario;
  function diasEntre(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5); }
  function sumarDias(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return DB.hoyISO(d); }
  var SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  function diaSemanaIdx(iso) { return (new Date(iso + "T12:00:00").getDay() + 6) % 7; }
  function temaDe(nombre) { return String(nombre || "").replace(/^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo|Día\s*\d+)\s*(·|-|:)?\s*/i, "").trim(); }
  // Deja el plan con 7 días (lunes a domingo) y nombres por día de la semana
  function semanaCompleta(dias) {
    var out = JSON.parse(JSON.stringify(dias || []));
    for (var i = 0; i < 7; i++) {
      if (!out[i]) out[i] = { consejo: "", checklist: ((out[i - 1] || {}).checklist || ["Vegetales", "Proteína", "Hidratación"]).slice(), comidas: [] };
      var t = temaDe(out[i].nombre); out[i].nombre = SEMANA[i] + (t ? " · " + t : "");
    }
    return out;
  }
  // Qué día del plan toca: los planes de 7 días van por día de la semana; los demás se repiten en ciclo
  function indiceDia(asig, plan, fecha) {
    var n = (plan.dias || []).length; if (!n) return 0;
    if (n === 7) return diaSemanaIdx(fecha);
    var d = diasEntre(asig.inicio, fecha); return ((d % n) + n) % n;
  }
  function claveComida(c, i) { return (c.tiempo || "comida") + "-" + i; }
  async function registroDe(cliId, fecha) { return await DB.uno("registro_alim", { cliente_id: cliId, fecha: fecha }); }
  async function guardarRegistro(cli, fecha, cambios) {
    var r = await registroDe(cli.id, fecha);
    var fila = Object.assign({ actualizado: new Date().toISOString() }, cambios);
    if (r) return await DB.upd("registro_alim", r.id, fila);
    return await DB.ins("registro_alim", Object.assign({ entrenador_id: cli.entrenador_id, cliente_id: cli.id, fecha: fecha }, fila));
  }
  async function planDeCliente(cliId) {
    var asig = (await DB.sel("asig_alim", { cliente_id: cliId }, { orden: "creado", desc: true })).filter(function (a) { return a.activa !== false; })[0];
    if (!asig) return null;
    var plan = await DB.uno("planes_alim", { id: asig.plan_id });
    return plan ? { asig: asig, plan: plan } : null;
  }
  function indicadoresDe(plan) { return (plan && plan.indicadores && plan.indicadores.length) ? plan.indicadores : INDICADORES_BASE; }
  function imgComida(c) { return c.img ? '<img src="' + esc(c.img) + '" alt="">' : '<span style="font-size:24px">' + ((T[c.tiempo] || {}).ico || "🍽️") + "</span>"; }

  /* ───────── "¿Cómo te sientes hoy?" (se llena a cualquier hora y se puede cambiar) ───────── */
  function hojaSentir(cli, plan, fecha, reg, alGuardar) {
    var inds = indicadoresDe(plan), val = Object.assign({}, (reg && reg.sentir) || {});
    UI.hoja("¿Cómo te sientes hoy?", '<p class="ayuda" style="margin:-8px 0 12px">Califica del 1 al 5. Lo puedes llenar a cualquier hora y cambiarlo después.</p>' +
      '<div class="sentir">' + inds.map(function (n) {
        return '<div class="sentir-fila"><div class="sentir-nom">' + esc(n) + '<small id="niv-' + esc(n) + '">' + (val[n] ? NIVEL[val[n] - 1] : "Sin calificar") + '</small></div><div class="sentir-caras" data-ind="' + esc(n) + '">' +
          CARITAS.map(function (c, i) { return '<button type="button" data-v="' + (i + 1) + '" class="' + (val[n] === i + 1 ? "on" : "") + '" aria-label="' + esc(n) + " " + (i + 1) + '">' + c + "</button>"; }).join("") + "</div></div>";
      }).join("") + '</div><div class="campo" style="margin-top:12px"><label>Notas <span class="opc">opcional</span></label><textarea class="entrada" id="sNota" placeholder="Ej. Me sentí con más energía después del almuerzo.">' +
      esc((reg && reg.nota) || "") + '</textarea></div><button class="btn" id="sGuardar" style="margin-top:12px">' + ico("check") + "Guardar</button>", function (h, cerrar) {
      UI.$$(".sentir-caras", h).forEach(function (fila) {
        UI.$$("button", fila).forEach(function (b) {
          b.onclick = function () {
            var n = fila.dataset.ind, v = Number(b.dataset.v); val[n] = v;
            UI.$$("button", fila).forEach(function (x) { x.classList.toggle("on", x === b); });
            var et = h.querySelector('[id="niv-' + n + '"]'); if (et) et.textContent = NIVEL[v - 1];
          };
        });
      });
      h.querySelector("#sGuardar").onclick = async function () {
        this.disabled = true;
        try { await guardarRegistro(cli, fecha, { sentir: val, nota: h.querySelector("#sNota").value.trim() || null }); cerrar(); UI.aviso("Guardado ✓"); if (alGuardar) alGuardar(); }
        catch (e) { UI.error(e); this.disabled = false; }
      };
    });
  }

  /* Ver una receta completa (o.alAgregar muestra el botón "Agregar a un plan") */
  function hojaReceta(c, o) {
    var k = c.categoria ? catDe(c.categoria) : null;
    UI.hoja(c.nombre, (c.img ? '<img class="foto-ej" src="' + esc(c.img) + '" alt="" style="object-fit:cover">' : (k ? '<div class="receta-banner cat-' + k.cls + '">' + k.e + "</div>" : "")) +
      '<div class="chips" style="margin:10px 0">' + '<span class="chip on">' + esc(k ? k.corto : ((T[c.tiempo] || {}).txt || "Comida")) + "</span>" + (c.porcion ? '<span class="chip">' + esc(c.porcion) + "</span>" : "") +
      (c.clave ? '<span class="chip">⭐ ' + esc(c.clave) + "</span>" : "") + (c.dura ? '<span class="chip">🧊 ' + esc(c.dura) + "</span>" : "") + "</div>" + macroCajas(c) +
      ((c.ingredientes || []).length ? '<div class="lbl">Ingredientes</div><ul class="receta-lista">' + c.ingredientes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      (c.preparacion ? '<div class="lbl" style="margin-top:14px">Pasos</div>' + pasosHTML(c.preparacion) : "") +
      (c.sustitucion ? '<div class="tarjeta" style="margin-top:12px;padding:12px"><p>🔄 <b style="color:#fff">Puedes cambiarlo por:</b> ' + esc(c.sustitucion) + "</p></div>" : "") +
      (c.nota ? '<p class="ayuda" style="margin-top:10px">💡 ' + esc(c.nota) + "</p>" : "") +
      (o && o.alAgregar ? '<button class="btn" id="rAgregar" style="margin-top:16px">' + ico("mas") + "Agregar a un plan</button>" : ""), function (h, cerrar) {
      var b = h.querySelector("#rAgregar"); if (b) b.onclick = function () { cerrar(); o.alAgregar(c); };
    });
  }

  /* ───────── ALUMNO: pestaña Comida ───────── */
  VC.comida = async function (fechaParam) {
    UI.tabbar(VC.__TABS, "comida");
    app().innerHTML = UI.cargando();
    var cli = A().cli, hoy = DB.hoyISO(), fecha = fechaParam || hoy;
    var pd = await planDeCliente(cli.id);
    var reg = await registroDe(cli.id, fecha);
    var plan = pd && pd.plan;
    var html = A().bandaDemo() + '<section class="hero" style="padding-bottom:10px">' + '<div class="barra-sup" style="justify-content:space-between"><h1 class="titulo-pag" style="margin:6px 0 0">Alimentación</h1>' +
      '<div style="display:flex;gap:8px">' + (fecha !== sumarDias(hoy, -6) ? '<button class="btn-redondo" id="diaAnt" aria-label="Día anterior">' + ico("izq") + "</button>" : "") +
      (fecha < hoy ? '<button class="btn-redondo" id="diaSig" aria-label="Día siguiente">' + ico("der") + "</button>" : "") + "</div></div>";
    var dia = null;
    if (plan) {
      var idx = indiceDia(pd.asig, plan, fecha); dia = plan.dias[idx];
      html += '<div class="saldo" style="margin-top:16px"><div class="etq">' + (fecha === hoy ? "Hoy" : UI.fecha(fecha)) + " · " + esc(plan.nombre) + '</div><div class="cifra" style="font-size:30px;letter-spacing:-.6px">' +
        esc(dia ? dia.nombre : "Día " + (idx + 1)) + "</div>" + (dia && dia.consejo ? '<div class="sub">💡 ' + esc(dia.consejo) + "</div>" : "") + "</div>";
    }
    html += "</section><div class=\"contenido\">";
    // ¿Cómo te sientes?
    var sentir = (reg && reg.sentir) || {}, inds = indicadoresDe(plan), hechos = inds.filter(function (n) { return sentir[n]; });
    html += '<button class="tarjeta sentir-tarjeta" id="abrirSentir"><div class="promo"><span class="avatar" style="background:var(--brand);font-size:22px">' + (hechos.length ? CARITAS[Math.round(hechos.reduce(function (t, n) { return t + sentir[n]; }, 0) / hechos.length) - 1] : "🙂") +
      '</span><div style="text-align:left"><h3>¿Cómo te sientes ' + (fecha === hoy ? "hoy" : "ese día") + "?</h3><p>" +
      (hechos.length ? hechos.map(function (n) { return esc(n) + " " + CARITAS[sentir[n] - 1]; }).join(" · ") : "Toca para calificar tu energía, digestión y más. Toma 1 minuto.") + "</p></div></div></button>";
    if (!plan) {
      html += '<div class="tarjeta"><h3>Aún no tienes plan de alimentación</h3><p>Cuando tu entrenador te asigne uno, aquí verás tus comidas de cada día. Mientras, puedes registrar cómo te sientes.</p></div></div>';
      app().innerHTML = html; enlazarComun(); return;
    }
    var comidas = (dia && dia.comidas) || [], estados = (reg && reg.comidas) || {};
    var hechas = comidas.filter(function (c, i) { var e = estados[claveComida(c, i)]; return e && (e.estado === "si" || e.estado === "cambio"); }).length;
    html += '<div class="titulo-sec"><h2>Comidas del día</h2><span class="adm-de">' + hechas + " de " + comidas.length + "</span></div>";
    html += comidas.map(function (c, i) {
      var k = claveComida(c, i), e = (estados[k] || {}).estado;
      return '<div class="tarjeta comida" data-k="' + esc(k) + '" data-i="' + i + '"><div class="comida-cab" data-ver><span class="comida-img">' + imgComida(c) + '</span><span class="txt"><div class="lbl">' +
        esc((T[c.tiempo] || {}).txt || "Comida") + '</div><div class="t1">' + esc(c.nombre) + '</div><div class="t2">' + esc([c.porcion, (c.ingredientes || []).length + " ingredientes"].filter(Boolean).join(" · ")) +
        '</div></span><span class="chev">' + ico("der") + '</span></div><div class="comida-btns">' +
        '<button data-e="si" class="' + (e === "si" ? "on ok" : "") + '">✓ La comí</button><button data-e="cambio" class="' + (e === "cambio" ? "on amb" : "") + '">🔄 La cambié</button><button data-e="no" class="' + (e === "no" ? "on mal" : "") + '">✗ No</button></div></div>';
    }).join("");
    // Checklist
    var chk = (dia && dia.checklist) || [], marcados = (reg && reg.checklist) || {};
    if (chk.length) html += '<div class="titulo-sec"><h2>Checklist del día</h2></div><div class="tarjeta checklist">' + chk.map(function (x) {
      return '<label class="chk"><input type="checkbox" data-c="' + esc(x) + '"' + (marcados[x] ? " checked" : "") + "><span>" + esc(x) + "</span></label>"; }).join("") + "</div>";
    html += '<button class="btn vidrio" id="super">' + ico("rutinas") + "Lista del súper de la semana</button></div>";
    app().innerHTML = html;
    enlazarComun();
    UI.$$(".comida").forEach(function (el) {
      var c = comidas[Number(el.dataset.i)], k = el.dataset.k;
      el.querySelector("[data-ver]").onclick = function () { hojaReceta(c); };
      UI.$$(".comida-btns button", el).forEach(function (b) {
        b.onclick = async function () {
          var actual = ((estados[k] || {}).estado === b.dataset.e) ? null : b.dataset.e; // tocar de nuevo lo quita
          var nuevo = Object.assign({}, estados); if (actual) nuevo[k] = Object.assign({}, nuevo[k] || {}, { estado: actual }); else delete nuevo[k];
          try { reg = await guardarRegistro(cli, fecha, { comidas: nuevo }); estados = reg.comidas || {}; VC.comida(fecha === hoy ? undefined : fecha); } catch (e) { UI.error(e); }
        };
      });
    });
    UI.$$(".checklist input").forEach(function (inp) {
      inp.onchange = async function () {
        var m = Object.assign({}, marcados); if (inp.checked) m[inp.dataset.c] = true; else delete m[inp.dataset.c];
        try { reg = await guardarRegistro(cli, fecha, { checklist: m }); marcados = reg.checklist || {}; } catch (e) { UI.error(e); }
      };
    });
    UI.$("#super").onclick = function () { hojaSuper(plan, pd.asig, fecha); };

    function enlazarComun() {
      UI.$("#abrirSentir").onclick = function () { hojaSentir(cli, plan, fecha, reg, function () { VC.comida(fecha === hoy ? undefined : fecha); }); };
      var ant = UI.$("#diaAnt"); if (ant) ant.onclick = function () { A().ir("comida/" + sumarDias(fecha, -1)); };
      var sig = UI.$("#diaSig"); if (sig) sig.onclick = function () { var s = sumarDias(fecha, 1); A().ir(s === hoy ? "comida" : "comida/" + s); };
    }
  };

  var BASICOS = { "sal": 1, "pimienta": 1, "sal y pimienta": 1, "agua": 1, "hielo": 1, "agua caliente": 1, "agua tibia": 1 };
  // "1/2 taza de quinoa cocida" -> "Quinoa" para juntar el mismo ingrediente
  function baseIngrediente(x) {
    var t = String(x).toLowerCase().replace(/\(.*?\)/g, "").trim();
    var cant = /^((\d+(\s+\d+\/\d+)?([\/.,]\d+)?)(\s*([–-]|a)\s*\d+([\/.,]\d+)?)?\s*)?(g|ml|kg|cdas?|cdtas?|tazas?|rodajas?|dientes?|puñitos?|puñito|vasos?|filetes?|cuadritos?|rajas?|astillas?|pizca|unas gotas|jugo|cáscara|hojas)?(?=\s|$)\s*(de\s+)?/;
    for (var i = 0; i < 2; i++) t = t.replace(cant, "").trim(); // "jugo de 1/2 limón" -> "limón"
    t = t.split(/,|\s(en|o|al|a la|para|sin|con)\s|\s(cocid|asad|picad|rallad|fresc|grande|pequeñ|madur|natural|ligera|tostad|molid|deshebrad|frí|caliente)/)[0].trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }
  /* Lista del súper: ingredientes de los próximos 7 días del plan */
  function hojaSuper(plan, asig, desde) {
    var conteo = {}, orden = [];
    for (var d = 0; d < 7; d++) {
      var dia = plan.dias[indiceDia(asig, plan, sumarDias(desde, d))];
      ((dia && dia.comidas) || []).forEach(function (c) {
        (c.ingredientes || []).forEach(function (x) {
          var limpio = baseIngrediente(x);
          var k = UI.normal(limpio); if (!k || BASICOS[k]) return;
          if (!conteo[k]) { conteo[k] = { n: limpio.charAt(0).toUpperCase() + limpio.slice(1), veces: 0 }; orden.push(k); }
          conteo[k].veces++;
        });
      });
    }
    var LL = "pulso_super_" + desde, marc = {};
    try { marc = JSON.parse(localStorage.getItem(LL) || "{}"); } catch (e) {}
    orden.sort(function (a, b) { return a < b ? -1 : 1; });
    UI.hoja("Lista del súper", '<p class="ayuda" style="margin:-8px 0 10px">Todo lo que necesitas para los próximos 7 días. Ve palomeando lo que ya compraste.</p><div class="checklist">' +
      orden.map(function (k) { return '<label class="chk"><input type="checkbox" data-k="' + esc(k) + '"' + (marc[k] ? " checked" : "") + "><span>" + esc(conteo[k].n) +
        (conteo[k].veces > 1 ? ' <small class="adm-de">×' + conteo[k].veces + "</small>" : "") + "</span></label>"; }).join("") + "</div>", function (h) {
      UI.$$("input", h).forEach(function (i) { i.onchange = function () { if (i.checked) marc[i.dataset.k] = 1; else delete marc[i.dataset.k]; try { localStorage.setItem(LL, JSON.stringify(marc)); } catch (e) {} }; });
    });
  }

  /* Tarjeta para "Hoy" del alumno */
  VC.tarjetaAlimHoy = async function (cont) {
    try {
      var cli = A().cli, pd = await planDeCliente(cli.id), reg = await registroDe(cli.id, DB.hoyISO());
      var sentir = (reg && reg.sentir) || {}, lleno = Object.keys(sentir).length > 0, txt;
      if (pd) {
        var dia = pd.plan.dias[indiceDia(pd.asig, pd.plan, DB.hoyISO())] || {}, comidas = dia.comidas || [], est = (reg && reg.comidas) || {};
        var n = comidas.filter(function (c, i) { var e = est[claveComida(c, i)]; return e && e.estado !== "no"; }).length;
        txt = n + " de " + comidas.length + " comidas registradas" + (lleno ? " · ya registraste cómo te sientes" : " · ¿cómo te sientes hoy?");
      } else txt = lleno ? "Ya registraste cómo te sientes hoy ✓" : "Registra cómo te sientes hoy: energía, digestión y más.";
      cont.innerHTML = '<a class="tarjeta" href="#/comida" style="display:block"><div class="promo"><span class="avatar" style="background:var(--brand);font-size:22px">🥗</span><div><h3>Alimentación de hoy</h3><p>' + esc(txt) + "</p></div></div></a>";
    } catch (e) { cont.innerHTML = ""; }
  };

  // Para la lista "Tu día" del alumno
  VC.estadoAlimHoy = async function () {
    try {
      var cli = A().cli, pd = await planDeCliente(cli.id), reg = await registroDe(cli.id, DB.hoyISO());
      var res = { total: 0, hechas: 0, sentir: !!(reg && reg.sentir && Object.keys(reg.sentir).length) };
      if (pd) {
        var dia = pd.plan.dias[indiceDia(pd.asig, pd.plan, DB.hoyISO())] || {}, comidas = dia.comidas || [], est = (reg && reg.comidas) || {};
        res.total = comidas.length;
        res.hechas = comidas.filter(function (c, i) { var e = est[claveComida(c, i)]; return e && e.estado; }).length;
      }
      return res;
    } catch (e) { return null; }
  };

  /* ───────── Resumen de alimentación (alumno y entrenador) ───────── */
  UI.resumenAlim = function (regs, pd, dias) {
    var hoy = DB.hoyISO(), desde = sumarDias(hoy, -(dias - 1));
    var en = regs.filter(function (r) { return r.fecha >= desde && r.fecha <= hoy; });
    var inds = indicadoresDe(pd && pd.plan);
    // cumplimiento de comidas
    var total = 0, hechas = 0, cambios = 0;
    if (pd) for (var d = 0; d < dias; d++) {
      var f = sumarDias(desde, d); if (f < pd.asig.inicio) continue;
      var dia = pd.plan.dias[indiceDia(pd.asig, pd.plan, f)] || {}, comidas = dia.comidas || [], r = en.find(function (x) { return x.fecha === f; }), est = (r && r.comidas) || {};
      total += comidas.length;
      comidas.forEach(function (c, i) { var e = (est[claveComida(c, i)] || {}).estado; if (e === "si") hechas++; if (e === "cambio") { hechas++; cambios++; } });
    }
    var pct = total ? Math.round(hechas / total * 100) : null;
    // promedio por indicador
    var prom = inds.map(function (n) { var v = en.map(function (r) { return (r.sentir || {})[n]; }).filter(Boolean); return { n: n, v: v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null }; });
    var diasConSentir = en.filter(function (r) { return Object.keys(r.sentir || {}).length; }).length;
    // gráfica: promedio general por día
    var W = 340, H = 140, base = 112, alto = 88, pts = [];
    for (var k = 0; k < dias; k++) {
      var fk = sumarDias(desde, k), rk = en.find(function (x) { return x.fecha === fk; }), vals = rk ? inds.map(function (n) { return (rk.sentir || {})[n]; }).filter(Boolean) : [];
      pts.push({ f: fk, v: vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null });
    }
    var paso = (W - 30) / Math.max(1, dias - 1), svg = "";
    [1, 3, 5].forEach(function (y) { var yy = base - (y - 1) / 4 * alto; svg += '<line x1="22" x2="' + (W - 4) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--linea)"/><text x="2" y="' + (yy + 4) + '" font-size="12">' + CARITAS[y - 1] + "</text>"; });
    var linea = "", ant = null;
    pts.forEach(function (p, i) {
      if (p.v === null) { ant = null; return; }
      var x = 26 + i * paso, y = base - (p.v - 1) / 4 * alto;
      linea += (ant ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " "; ant = p;
      svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.5" fill="var(--ok)"/>';
    });
    if (linea) svg = svg + '<path d="' + linea + '" fill="none" stroke="var(--ok)" stroke-width="2.5" stroke-linejoin="round"/>';
    svg += '<text x="26" y="' + (H - 4) + '" font-size="10.5" fill="var(--suave)">' + esc(UI.fecha(desde)) + '</text><text x="' + (W - 4) + '" y="' + (H - 4) + '" font-size="10.5" fill="var(--suave)" text-anchor="end">Hoy</text>';
    return '<div class="res-kpis"><div class="dato"><div class="v">' + (pct === null ? "–" : pct + "%") + '</div><div class="l">Comidas cumplidas' + (cambios ? " · " + cambios + " cambiadas" : "") + "</div>" +
      (pct !== null ? '<div class="adm-barra"><i style="width:' + pct + '%;background:' + (pct >= 80 ? "var(--ok)" : pct >= 50 ? "var(--ambar)" : "var(--malo)") + '"></i></div>' : "") + "</div>" +
      '<div class="dato"><div class="v">' + diasConSentir + " / " + dias + '</div><div class="l">Días que registró cómo se sintió</div></div></div>' +
      '<div class="lbl" style="margin:14px 0 4px">Cómo se ha sentido (promedio del día)</div>' +
      (diasConSentir ? '<svg class="grafica" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Cómo se ha sentido">' + svg + "</svg>" : '<p class="nota-demo" style="text-align:left">Todavía sin registros en este periodo.</p>') +
      '<div class="ind-lista">' + prom.map(function (p) {
        return '<div class="ind"><span>' + esc(p.n) + '</span><div class="adm-barra" style="flex:1;margin:0"><i style="width:' + (p.v ? (p.v / 5 * 100) : 0) + '%;background:' + (p.v >= 4 ? "var(--ok)" : p.v >= 3 ? "var(--ambar)" : "var(--malo)") + '"></i></div><b>' +
          (p.v ? CARITAS[Math.round(p.v) - 1] + " " + UI.num(p.v) : "–") + "</b></div>";
      }).join("") + "</div>" +
      (en.filter(function (r) { return r.nota; }).length ? '<div class="lbl" style="margin:14px 0 6px">Notas recientes</div>' + en.filter(function (r) { return r.nota; }).sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; }).slice(0, 4).map(function (r) {
        return '<div class="res-rec"><span>' + esc(UI.fecha(r.fecha)) + "</span><b style=\"white-space:normal;font-weight:500\">“" + esc(r.nota) + "”</b></div>"; }).join("") : "");
  };
  UI.montarResumenAlim = function (cont, regs, pd) {
    var dias = 7;
    cont.innerHTML = '<div class="segmento res-periodo"><button data-d="7">7 días</button><button data-d="30">30 días</button><button data-d="90">3 meses</button></div><div class="res-cuerpo"></div>';
    function pintar() {
      UI.$$(".res-periodo button", cont).forEach(function (b) { b.classList.toggle("on", Number(b.dataset.d) === dias); });
      UI.$(".res-cuerpo", cont).innerHTML = UI.resumenAlim(regs, pd, dias);
    }
    UI.$$(".res-periodo button", cont).forEach(function (b) { b.onclick = function () { dias = Number(b.dataset.d); pintar(); }; });
    pintar();
  };
  VC.cargarResumenAlim = async function (cont, cliId) {
    var r = await Promise.all([DB.sel("registro_alim", { cliente_id: cliId }, { orden: "fecha", desc: true, limite: 120 }), planDeCliente(cliId)]);
    UI.montarResumenAlim(cont, r[0], r[1]);
    return r[1];
  };

  /* ───────── ENTRENADOR: Dietas (Mis planes · Recetario · Plantillas) ───────── */
  var SEGS = [{ id: "planes", txt: "Mis planes" }, { id: "recetario", txt: "Recetario" }, { id: "plantillas", txt: "Plantillas" }];
  VE.dietas = async function (seg) {
    UI.tabbar(VE.__TABS(), "dietas");
    seg = SEGS.some(function (s) { return s.id === seg; }) ? seg : "planes";
    app().innerHTML = UI.cargando();
    var r = await Promise.all([DB.sel("planes_alim", { entrenador_id: A().ent.id }, { orden: "actualizado", desc: true }), DB.sel("asig_alim", { entrenador_id: A().ent.id }), cargarPlantillas(), cargarRecetario()]);
    var planes = r[0], asig = r[1], pls = r[2], recetas = r[3], cat = "", q = "";
    app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:8px"><div class="barra-sup" style="justify-content:space-between"><h1 class="titulo-pag" style="margin:6px 0 0">Dietas</h1>' +
      '<a class="btn-redondo" href="#/dieta/nueva" aria-label="Nuevo plan">' + ico("mas") + '</a></div><div class="segmento" id="segD" style="margin-top:14px">' +
      SEGS.map(function (s) { return '<button data-s="' + s.id + '">' + s.txt + "</button>"; }).join("") + '</div></section><div class="contenido" id="contD"></div>';
    var cont = UI.$("#contD");

    function verPlanes() {
      cont.innerHTML = planes.length ? '<div class="tarjeta sin-relleno"><div class="lista">' + planes.map(function (p) {
        var n = asig.filter(function (a) { return a.plan_id === p.id && a.activa !== false; }).length;
        var com = (p.dias || []).reduce(function (t, d) { return t + (d.comidas || []).length; }, 0);
        return '<a class="item" href="#/dieta/' + p.id + '"><span class="ico cuadro cat-verde" style="font-size:20px">🥗</span><span class="txt"><div class="t1">' + esc(p.nombre) + '</div><div class="t2">' +
          com + (com === 1 ? " comida" : " comidas") + " en la semana</div></span><span class=\"der\">" + n + "<small>" + (n === 1 ? "alumno" : "alumnos") + "</small></span></a>";
      }).join("") + "</div></div>" + '<a class="btn azul" href="#/dieta/nueva">' + ico("mas") + "Crear plan nuevo</a>"
        : '<div class="tarjeta"><div class="vacio" style="padding:10px 4px 16px"><div style="font-size:40px;margin-bottom:8px">🥗</div><b style="color:#fff;font-size:17px">Arma tu primer plan</b><br>Empieza con una plantilla lista o créalo desde cero.</div>' +
          '<button class="btn" data-ir="plantillas">Ver plantillas</button><a class="btn vidrio" href="#/dieta/nueva" style="margin-top:8px">' + ico("mas") + "Crear desde cero</a></div>";
    }
    function verRecetario() {
      var html = '<input class="entrada" id="rB" type="search" placeholder="Buscar: pollo, aguacate, salmón…" value="' + esc(q) + '">';
      if (!q && !cat) {
        html += '<div class="cat-tiles">' + CATS.filter(function (k) { return k.id !== "base"; }).map(function (k) {
          var n = recetas.filter(function (x) { return x.categoria === k.id; }).length;
          return '<button class="cat-tile cat-' + k.cls + '" data-cat="' + k.id + '"><span class="e">' + k.e + "</span><span><b>" + esc(k.corto) + "</b><small>" + n + " recetas</small></span></button>";
        }).join("") + "</div>" +
          '<div class="titulo-sec"><h2>🍱 Para cocinar el domingo</h2></div><p class="ayuda" style="margin:0 4px">Se preparan una vez y sirven para toda la semana.</p>' +
          '<div class="tarjeta sin-relleno"><div class="lista">' + recetas.filter(function (x) { return x.categoria === "base"; }).map(filaReceta).join("") + "</div></div>";
      } else {
        var vis = buscarRecetas(recetas, q, cat), k = catDe(cat);
        html += (cat ? '<div class="titulo-sec"><h2>' + k.e + " " + esc(k.txt) + '</h2><button data-cat="">Ver todas</button></div>' : '<div class="titulo-sec"><h2>' + vis.length + (vis.length === 1 ? " receta" : " recetas") + "</h2></div>") +
          '<div class="tarjeta sin-relleno"><div class="lista">' + (vis.length ? vis.map(filaReceta).join("") : '<div class="vacio">No encontré recetas con eso.</div>') + "</div></div>";
      }
      cont.innerHTML = html;
      var bx = UI.$("#rB", cont);
      bx.oninput = function () { q = this.value; var pos = this.selectionStart; verRecetario(); var n = UI.$("#rB", cont); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} };
      UI.$$("[data-cat]", cont).forEach(function (b) { b.onclick = function () { cat = b.dataset.cat; q = ""; verRecetario(); window.scrollTo(0, 0); }; });
      UI.$$("[data-r]", cont).forEach(function (b) {
        b.onclick = function () { var rr = recetas.find(function (x) { return x.id === b.dataset.r; }); hojaReceta(rr, { alAgregar: hojaAgregarAPlan }); };
      });
    }
    function verPlantillas() {
      cont.innerHTML = '<p class="ayuda" style="margin:0 4px 4px">Planes completos de lunes a domingo. Al usar uno se copia a “Mis planes” y lo puedes cambiar.</p>' + pls.map(function (p) {
        var com = (p.dias || []).reduce(function (t, d) { return t + (d.comidas || []).length; }, 0);
        return '<div class="tarjeta"><div class="promo"><span class="avatar cat-verde" style="font-size:22px">🌿</span><div><h3>' + esc(p.nombre) + "</h3><p>" + esc(p.descripcion) + '</p><p class="ayuda" style="margin-top:6px">' + com + ' comidas en la semana</p></div></div><button class="btn" data-pl="' + esc(p.id) +
          '" style="margin-top:14px">Usar esta plantilla</button></div>';
      }).join("");
      UI.$$("[data-pl]", cont).forEach(function (b) {
        b.onclick = async function () {
          var p = pls.find(function (x) { return x.id === b.dataset.pl; }); b.disabled = true;
          try {
            var n = await DB.ins("planes_alim", { entrenador_id: A().ent.id, nombre: p.nombre, descripcion: p.descripcion, dias: semanaCompleta(p.dias), indicadores: p.indicadores });
            UI.aviso("Plantilla copiada ✓ Ajústala a tu gusto"); A().ir("dieta/" + n.id);
          } catch (e) { UI.error(e); b.disabled = false; }
        };
      });
    }
    function mostrar(s) {
      seg = s;
      UI.$$("#segD button").forEach(function (b) { b.classList.toggle("on", b.dataset.s === s); });
      try { history.replaceState(null, "", "#/dietas" + (s === "planes" ? "" : "/" + s)); } catch (e) {}
      if (s === "recetario") verRecetario(); else if (s === "plantillas") verPlantillas(); else verPlanes();
      UI.$$("[data-ir]", cont).forEach(function (b) { b.onclick = function () { mostrar(b.dataset.ir); }; });
    }
    UI.$$("#segD button").forEach(function (b) { b.onclick = function () { mostrar(b.dataset.s); }; });
    mostrar(seg);
  };

  /* Agregar una receta del recetario a un plan */
  async function hojaAgregarAPlan(r) {
    var planes = await DB.sel("planes_alim", { entrenador_id: A().ent.id }, { orden: "actualizado", desc: true });
    var tiempo = r.tiempo || "comida", dia = 0, pid = planes[0] && planes[0].id;
    UI.hoja("Agregar a un plan", '<div class="form">' + '<p class="ayuda" style="margin:-8px 0 4px">' + esc(r.nombre) + "</p>" +
      (planes.length ? '<div class="campo"><label>Plan</label><select class="entrada" id="gP">' + planes.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + "</option>"; }).join("") + "</select></div>" :
        '<p class="ayuda">Aún no tienes planes. Se creará uno nuevo con esta receta.</p>') +
      '<div class="campo"><label>Día</label><div class="chips dias-sem" id="gD">' + SEMANA.map(function (s, i) { return '<button type="button" class="chip' + (i === 0 ? " on" : "") + '" data-d="' + i + '" aria-label="' + s + '">' + s.charAt(0) + "</button>"; }).join("") + "</div></div>" +
      '<div class="campo"><label>Momento del día</label><div class="chips" id="gT">' + TIEMPOS.map(function (t) { return '<button type="button" class="chip' + (t.id === tiempo ? " on" : "") + '" data-t="' + t.id + '">' + t.ico + " " + t.txt + "</button>"; }).join("") + "</div></div>" +
      '<button class="btn" id="gG">' + ico("check") + "Agregar</button></div>", function (h, cerrar) {
      UI.$$("#gD .chip", h).forEach(function (b) { b.onclick = function () { dia = Number(b.dataset.d); UI.$$("#gD .chip", h).forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
      UI.$$("#gT .chip", h).forEach(function (b) { b.onclick = function () { tiempo = b.dataset.t; UI.$$("#gT .chip", h).forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
      h.querySelector("#gG").onclick = async function () {
        this.disabled = true;
        try {
          var sp = h.querySelector("#gP"); pid = sp ? sp.value : null;
          var p = pid ? planes.find(function (x) { return x.id === pid; }) : { nombre: "Mi plan", descripcion: "", indicadores: INDICADORES_BASE.slice(), dias: [] };
          var dias = semanaCompleta(p.dias); dias[dia].comidas = dias[dia].comidas || []; dias[dia].comidas.push(recetaAComida(r, tiempo)); ordenarComidas(dias[dia]);
          if (pid) await DB.upd("planes_alim", pid, { dias: dias, actualizado: new Date().toISOString() });
          else { var n = await DB.ins("planes_alim", { entrenador_id: A().ent.id, nombre: p.nombre, descripcion: "", indicadores: p.indicadores, dias: dias }); pid = n.id; }
          cerrar(); UI.aviso("Agregada al " + SEMANA[dia].toLowerCase() + " de “" + p.nombre + "” ✓");
        } catch (e) { UI.error(e); this.disabled = false; }
      };
    });
  }

  /* Editor del plan: la semana de lunes a domingo, con huecos por momento del día */
  VE.dieta = async function (id) {
    UI.tabbar(null); document.body.classList.add("ancho");
    app().innerHTML = UI.cargando();
    var p = id === "nueva" ? { nombre: "", descripcion: "", indicadores: INDICADORES_BASE.slice(), dias: [] } : await DB.uno("planes_alim", { id: id });
    if (!p) return A().ir("dietas");
    p.dias = semanaCompleta(p.dias); p.indicadores = p.indicadores || INDICADORES_BASE.slice();
    var cambios = false, sel = diaSemanaIdx(DB.hoyISO());
    function marcar() { cambios = true; window.onbeforeunload = function () { return "Hay cambios sin guardar"; }; }
    function totales(d) {
      var k = 0, pr = 0, hay = (d.comidas || []).length > 0;
      (d.comidas || []).forEach(function (c) { if (c.kcal == null) hay = false; k += Number(c.kcal) || 0; pr += Number(c.prot) || 0; });
      var n = (d.comidas || []).length;
      return n ? (hay ? "Total del día: <b>" + k + "</b> kcal · <b>" + pr + "</b> g proteína" : n + (n === 1 ? " comida" : " comidas")) : "Día sin comidas todavía";
    }
    function dibujar() {
      var d = p.dias[sel];
      app().innerHTML = A().bandaDemo() + '<section class="hero" style="padding-bottom:6px"><div class="barra-sup" style="justify-content:space-between"><a class="atras" href="#/dietas">' + ico("izq", ' width="22" height="22"') + "Dietas</a>" +
        (p.id ? '<button class="btn-redondo" id="borrarP" aria-label="Eliminar plan">' + ico("basura") + "</button>" : "") + "</div>" +
        '<input class="titulo-pag" id="pNombre" value="' + esc(p.nombre) + '" placeholder="Nombre del plan" style="background:none;border:0;outline:0;width:100%;color:#fff">' +
        '<input id="pDesc" value="' + esc(p.descripcion || "") + '" placeholder="Descripción (opcional)" style="background:none;border:0;outline:0;width:100%;color:var(--suave);font-size:16px;margin-top:4px">' +
        '<div class="dias-sem" id="dSem">' + p.dias.map(function (x, i) {
          var n = (x.comidas || []).length;
          return '<button class="dia-btn' + (i === sel ? " on" : "") + '" data-i="' + i + '" aria-label="' + esc(SEMANA[i] || "Día " + (i + 1)) + '"><b>' + esc((SEMANA[i] || String(i + 1)).charAt(0)) + "</b><i" + (n ? ' class="lleno"' : "") + "></i></button>";
        }).join("") + "</div></section>" +
        '<div class="contenido"><div class="tarjeta">' +
        '<div class="dia-cab"><div style="flex:1;min-width:0"><h2>' + esc(SEMANA[sel] || "Día " + (sel + 1)) + '</h2><input id="dTema" value="' + esc(temaDe(d.nombre)) + '" placeholder="Tema del día (opcional)"></div>' +
        '<button class="mini" id="dCopiar" aria-label="Copiar este día a otros">' + ico("duplicar") + '</button><button class="mini" id="dVaciar" aria-label="Vaciar este día">' + ico("basura") + "</button></div>" +
        '<p class="dia-total">' + totales(d) + "</p>" +
        TIEMPOS.map(function (t) {
          var items = (d.comidas || []).map(function (c, ci) { return { c: c, ci: ci }; }).filter(function (x) { return (x.c.tiempo || "comida") === t.id; });
          if (!items.length) return '<button class="slot-add" data-add="' + t.id + '">' + t.ico + " Agregar " + t.txt.toLowerCase() + "</button>";
          return '<div class="slot"><div class="slot-lbl">' + t.ico + " " + t.txt + "</div>" + items.map(function (x) {
            return '<div class="slot-item" data-ci="' + x.ci + '"><span class="comida-img">' + imgComida(x.c) + '</span><span class="txt"><div class="t1">' + esc(x.c.nombre || "(sin nombre)") + '</div><div class="t2">' +
              esc([x.c.kcal != null ? x.c.kcal + " kcal" : "", x.c.prot != null ? x.c.prot + " g proteína" : "", (x.c.ingredientes || []).length + " ingredientes"].filter(Boolean).slice(0, 2).join(" · ")) +
              '</div></span><button class="mini" data-quita="' + x.ci + '" aria-label="Quitar">' + ico("x") + "</button></div>";
          }).join("") + '<button class="slot-add chico" data-add="' + t.id + '">' + ico("mas") + "Agregar otra opción</button></div>";
        }).join("") +
        '<details class="mas"' + (d.consejo ? " open" : "") + '><summary>Checklist y consejo del día</summary>' +
        '<div class="campo"><label>Checklist del día <span class="opc">separado por comas</span></label><input class="entrada" id="dChk" value="' + esc((d.checklist || []).join(", ")) + '" placeholder="Vegetales, Proteína, Hidratación"></div>' +
        '<div class="campo" style="margin-top:10px"><label>Consejo del día <span class="opc">opcional</span></label><input class="entrada" id="dCons" value="' + esc(d.consejo || "") + '"></div></details></div>' +
        '<div class="titulo-sec"><h2>¿Cómo te sientes?</h2></div><div class="tarjeta"><p>Lo que el alumno califica del 1 al 5 cuando quiera durante el día.</p><div class="chips" id="inds" style="margin-top:10px">' +
        INDICADORES_BASE.concat(INDICADORES_EXTRA).map(function (n) { return '<button class="chip' + (p.indicadores.indexOf(n) >= 0 ? " on" : "") + '" data-ind="' + esc(n) + '">' + esc(n) + "</button>"; }).join("") + "</div></div>" +
        '<div class="fila-btns" style="position:sticky;bottom:calc(12px + var(--abajo));z-index:5"><button class="btn" id="guardarP">' + ico("check") + "Guardar plan</button>" +
        (p.id ? '<button class="btn azul" id="asignarP" style="flex:.6">Asignar</button>' : "") + "</div></div>";
      enlazar();
    }
    function agregar(tiempo) {
      var d = p.dias[sel];
      function meter(c) { d.comidas = d.comidas || []; d.comidas.push(c); ordenarComidas(d); marcar(); dibujar(); }
      hojaRecetario(function (r) { meter(recetaAComida(r, tiempo)); UI.aviso("Agregada ✓ Tócala si quieres cambiar algo"); },
        { tiempo: tiempo, alPropia: function () { hojaComida({ tiempo: tiempo, ingredientes: [] }, meter); } });
    }
    function hojaCopiarDia() {
      var origen = sel, dest = {};
      UI.hoja("Copiar " + SEMANA[origen].toLowerCase() + " a…", '<p class="ayuda" style="margin:-8px 0 12px">Las comidas, el checklist y el consejo se copian a los días que elijas (reemplazan lo que tengan).</p>' +
        '<div class="chips" id="cpD">' + SEMANA.map(function (s, i) { return i === origen ? "" : '<button type="button" class="chip" data-i="' + i + '">' + s + "</button>"; }).join("") + "</div>" +
        '<button class="btn" id="cpG" style="margin-top:16px">' + ico("duplicar") + "Copiar</button>", function (h, cerrar) {
        UI.$$("#cpD .chip", h).forEach(function (b) { b.onclick = function () { var i = b.dataset.i; dest[i] = !dest[i]; b.classList.toggle("on", dest[i]); }; });
        h.querySelector("#cpG").onclick = function () {
          var ids = Object.keys(dest).filter(function (k) { return dest[k]; }).map(Number);
          if (!ids.length) return UI.aviso("Elige al menos un día", true);
          ids.forEach(function (i) { var c = JSON.parse(JSON.stringify(p.dias[origen])); c.nombre = SEMANA[i] + (temaDe(c.nombre) ? " · " + temaDe(c.nombre) : ""); p.dias[i] = c; });
          cerrar(); marcar(); dibujar(); UI.aviso("Copiado a " + ids.length + (ids.length === 1 ? " día ✓" : " días ✓"));
        };
      });
    }
    function enlazar() {
      var d = p.dias[sel];
      UI.$("#pNombre").oninput = function () { p.nombre = this.value; marcar(); };
      UI.$("#pDesc").oninput = function () { p.descripcion = this.value; marcar(); };
      UI.$$("#dSem .dia-btn").forEach(function (b) { b.onclick = function () { sel = Number(b.dataset.i); dibujar(); }; });
      UI.$("#dTema").oninput = function () { var v = this.value.trim(); d.nombre = (SEMANA[sel] || "Día " + (sel + 1)) + (v ? " · " + v : ""); marcar(); };
      UI.$("#dChk").oninput = function () { d.checklist = this.value.split(",").map(function (x) { return x.trim(); }).filter(Boolean); marcar(); };
      UI.$("#dCons").oninput = function () { d.consejo = this.value; marcar(); };
      UI.$("#dCopiar").onclick = hojaCopiarDia;
      UI.$("#dVaciar").onclick = async function () {
        if (!(d.comidas || []).length) return UI.aviso("Este día ya está vacío");
        if (!(await UI.confirmar("¿Vaciar el " + SEMANA[sel].toLowerCase() + "?", "Se quitan sus " + d.comidas.length + " comidas.", "Vaciar"))) return;
        d.comidas = []; marcar(); dibujar();
      };
      UI.$$("[data-add]").forEach(function (b) { b.onclick = function () { agregar(b.dataset.add); }; });
      UI.$$(".slot-item").forEach(function (el) {
        var ci = Number(el.dataset.ci);
        el.onclick = function (e) {
          if (e.target.closest("[data-quita]")) { d.comidas.splice(ci, 1); marcar(); return dibujar(); }
          hojaComida(JSON.parse(JSON.stringify(d.comidas[ci])), function (c) { d.comidas[ci] = c; ordenarComidas(d); marcar(); dibujar(); });
        };
      });
      UI.$$("#inds .chip").forEach(function (b) {
        b.onclick = function () { var n = b.dataset.ind, i = p.indicadores.indexOf(n); if (i >= 0) p.indicadores.splice(i, 1); else p.indicadores.push(n); b.classList.toggle("on"); marcar(); };
      });
      UI.$("#guardarP").onclick = guardar;
      var as = UI.$("#asignarP"); if (as) as.onclick = async function () { if (cambios) await guardar(true); hojaAsignarDieta({ planId: p.id }); };
      var bo = UI.$("#borrarP");
      if (bo) bo.onclick = async function () {
        if (!(await UI.confirmar("¿Eliminar “" + p.nombre + "”?", "Los alumnos que lo tienen asignado dejarán de verlo. Sus registros se conservan."))) return;
        try { await DB.del("planes_alim", p.id); cambios = false; window.onbeforeunload = null; A().ir("dietas"); } catch (e) { UI.error(e); }
      };
      var salir = UI.$(".hero .atras");
      salir.onclick = async function (e) { if (!cambios) return; e.preventDefault(); if (await UI.confirmar("¿Salir sin guardar?", "Tienes cambios en este plan que todavía no guardaste.", "Salir sin guardar")) { cambios = false; window.onbeforeunload = null; A().ir("dietas"); } };
    }
    async function guardar(silencio) {
      if (!p.nombre.trim()) { UI.aviso("Ponle nombre al plan", true); return UI.$("#pNombre").focus(); }
      if (!p.indicadores.length) p.indicadores = INDICADORES_BASE.slice();
      try {
        var datos = { nombre: p.nombre.trim(), descripcion: (p.descripcion || "").trim(), dias: p.dias, indicadores: p.indicadores, actualizado: new Date().toISOString() };
        if (p.id) await DB.upd("planes_alim", p.id, datos);
        else { var n = await DB.ins("planes_alim", Object.assign({ entrenador_id: A().ent.id }, datos)); p.id = n.id; cambios = false; window.onbeforeunload = null; UI.aviso("Plan guardado ✓"); return A().ir("dieta/" + p.id); }
        cambios = false; window.onbeforeunload = null; if (silencio !== true) UI.aviso("Plan guardado ✓");
      } catch (e) { UI.error(e); }
    }
    dibujar();
  };

  /* Editar una comida */
  function hojaComida(c, alGuardar) {
    UI.hoja(c.nombre ? "Editar comida" : "Nueva comida", '<div class="form">' +
      '<button type="button" class="btn vidrio" id="cR">📖 Elegir del recetario</button>' +
      '<div class="campo"><label>Momento del día</label><div class="chips" id="cT">' + TIEMPOS.map(function (t) { return '<button type="button" class="chip' + (c.tiempo === t.id ? " on" : "") + '" data-t="' + t.id + '">' + t.ico + " " + t.txt + "</button>"; }).join("") + "</div></div>" +
      '<div class="campo"><label>Nombre del platillo</label><input class="entrada" id="cN" value="' + esc(c.nombre || "") + '" placeholder="Ej. Bowl de quinoa con pollo"></div>' +
      '<div class="campo"><label>Foto <span class="opc">opcional</span></label>' + UI.selector("cF", { tipo: "foto", actual: c.img, ayuda: "Así el alumno sabe cómo debe verse." }) + "</div>" +
      '<div class="campo"><label>Ingredientes <span class="opc">uno por renglón</span></label><textarea class="entrada" id="cI" rows="5" placeholder="120 g de pechuga de pollo&#10;3/4 taza de quinoa cocida">' + esc((c.ingredientes || []).join("\n")) + "</textarea></div>" +
      '<div class="campo"><label>Preparación</label><textarea class="entrada" id="cP" placeholder="Pasos para prepararlo">' + esc(c.preparacion || "") + "</textarea></div>" +
      '<div class="rejilla"><div class="campo"><label>Porción</label><select class="entrada" id="cPo">' + PORCIONES.concat(c.porcion && PORCIONES.indexOf(c.porcion) < 0 ? [c.porcion] : []).map(function (x) { return '<option value="' + esc(x) + '"' + ((c.porcion || "") === x ? " selected" : "") + ">" + (x || "—") + "</option>"; }).join("") + "</select></div>" +
      '<div class="campo"><label>Ingrediente clave <span class="opc">opcional</span></label><input class="entrada" id="cK" value="' + esc(c.clave || "") + '" placeholder="Ej. Omega-3"></div></div>' +
      '<div class="campo"><label>Puede cambiarlo por <span class="opc">opcional</span></label><input class="entrada" id="cS" value="' + esc(c.sustitucion || "") + '" placeholder="Ej. Arroz integral en lugar de quinoa"></div>' +
      '<button class="btn" id="cG">' + ico("check") + "Listo</button></div>", function (h, cerrar) {
      var sel = UI.enlazarSelector(h, "cF"), tiempo = c.tiempo || "desayuno", extra = { kcal: c.kcal, prot: c.prot, carbs: c.carbs, grasa: c.grasa, nota: c.nota, dura: c.dura };
      h.querySelector("#cR").onclick = function () {
        hojaRecetario(function (r) {
          h.querySelector("#cN").value = r.nombre; h.querySelector("#cI").value = (r.ingredientes || []).join("\n"); h.querySelector("#cP").value = r.preparacion || "";
          h.querySelector("#cK").value = r.clave || ""; h.querySelector("#cS").value = r.sustitucion || "";
          var po = h.querySelector("#cPo"); if (r.porcion && !Array.prototype.some.call(po.options, function (o) { return o.value === r.porcion; })) po.add(new Option(r.porcion, r.porcion)); po.value = r.porcion || "";
          extra = { kcal: r.kcal, prot: r.prot, carbs: r.carbs, grasa: r.grasa, nota: r.nota, dura: r.dura };
          if (!c.nombre && r.tiempo) { tiempo = r.tiempo; UI.$$("#cT .chip", h).forEach(function (x) { x.classList.toggle("on", x.dataset.t === tiempo); }); }
          UI.aviso("Receta cargada ✓ Ajústala si quieres");
        });
      };
      UI.$$("#cT .chip", h).forEach(function (b) { b.onclick = function () { tiempo = b.dataset.t; UI.$$("#cT .chip", h).forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
      h.querySelector("#cG").onclick = async function () {
        var n = h.querySelector("#cN").value.trim(); if (!n) return UI.aviso("Escribe el nombre del platillo", true);
        var out = { tiempo: tiempo, nombre: n, ingredientes: h.querySelector("#cI").value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean),
          preparacion: h.querySelector("#cP").value.trim(), porcion: h.querySelector("#cPo").value, clave: h.querySelector("#cK").value.trim(), sustitucion: h.querySelector("#cS").value.trim(), img: sel.quitado() ? "" : (c.img || "") };
        Object.keys(extra).forEach(function (k) { if (extra[k] != null && extra[k] !== "") out[k] = extra[k]; });
        var f = sel.archivo(); this.disabled = true;
        try {
          if (f) { var ruta = A().ent.id + "/comida-" + DB.uuid() + ".jpg"; await DB.subir("logos", ruta, await UI.comprimir(f, 900)); out.img = DB.urlPublica("logos", ruta); }
          cerrar(); alGuardar(out);
        } catch (e) { UI.error(e); this.disabled = false; }
      };
    });
  }

  /* Asignar plan a un alumno */
  function hojaAsignarDieta(o) {
    Promise.all([DB.sel("planes_alim", { entrenador_id: A().ent.id }, { orden: "nombre" }), DB.sel("clientes", { entrenador_id: A().ent.id }, { orden: "nombre" })]).then(function (r) {
      var planes = r[0], clientes = r[1].filter(function (c) { return c.activo; });
      UI.hoja("Asignar plan de alimentación", '<div class="form">' +
        (o.planId ? "" : '<div class="campo"><label>Plan</label><select class="entrada" id="aP"><option value="">Elige un plan</option>' + planes.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + "</option>"; }).join("") + "</select></div>") +
        (o.clienteId ? "" : '<div class="campo"><label>Alumno</label><select class="entrada" id="aC"><option value="">Elige un alumno</option>' + clientes.map(function (c) { return '<option value="' + c.id + '">' + esc(c.nombre) + "</option>"; }).join("") + "</select></div>") +
        '<div class="campo"><label>Empieza el</label><input class="entrada" type="date" id="aI" value="' + DB.hoyISO() + '"></div>' +
        '<p class="ayuda">Cada día verá lo que pusiste para ese día de la semana (el lunes, lo del lunes). Si ya tenía otro plan, se reemplaza.</p>' +
        (planes.length ? "" : '<p class="ayuda" style="color:var(--ambar)">Primero crea un plan en la pestaña Dietas.</p>') +
        '<button class="btn" id="aG">Asignar</button></div>', function (h, cerrar) {
        h.querySelector("#aG").onclick = async function () {
          var pid = o.planId || h.querySelector("#aP").value, cid = o.clienteId || h.querySelector("#aC").value, ini = h.querySelector("#aI").value || DB.hoyISO();
          if (!pid || !cid) return UI.aviso("Elige plan y alumno", true);
          this.disabled = true;
          try {
            var viejas = await DB.sel("asig_alim", { cliente_id: cid });
            for (var i = 0; i < viejas.length; i++) if (viejas[i].activa !== false) await DB.upd("asig_alim", viejas[i].id, { activa: false });
            await DB.ins("asig_alim", { entrenador_id: A().ent.id, cliente_id: cid, plan_id: pid, inicio: ini, activa: true });
            cerrar(); UI.aviso("Plan asignado ✓"); A().recargar();
          } catch (e) { UI.error(e); this.disabled = false; }
        };
      });
    });
  }
  VE.hojaAsignarDieta = hojaAsignarDieta;

  /* Sección "Alimentación" en la ficha del alumno (vista del entrenador) */
  VE.fichaAlim = async function (cont, c) {
    try {
      var r = await Promise.all([DB.sel("registro_alim", { cliente_id: c.id }, { orden: "fecha", desc: true, limite: 120 }), planDeCliente(c.id)]);
      var pd = r[1];
      cont.innerHTML = '<div class="promo" style="margin-bottom:14px"><span class="avatar" style="background:var(--ok);font-size:22px">🥗</span><div style="flex:1"><h3>' +
        (pd ? esc(pd.plan.nombre) : "Sin plan de alimentación") + "</h3><p>" + (pd ? "Desde " + esc(UI.fecha(pd.asig.inicio)) + " · hoy le toca " + esc((pd.plan.dias[indiceDia(pd.asig, pd.plan, DB.hoyISO())] || {}).nombre || "") :
        "Asígnale un plan para que vea sus comidas de cada día.") + '</p></div></div><button class="btn vidrio chico" id="asigDieta" style="width:100%;margin-bottom:14px">' + ico("calendario") + (pd ? "Cambiar plan" : "Asignar plan") + '</button><div id="resAlim"></div>';
      UI.montarResumenAlim(UI.$("#resAlim", cont), r[0], pd);
      UI.$("#asigDieta", cont).onclick = function () { hojaAsignarDieta({ clienteId: c.id }); };
    } catch (e) { cont.innerHTML = '<p class="nota-demo">No se pudo cargar la alimentación.</p>'; }
  };
})();
