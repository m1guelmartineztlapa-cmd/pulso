// Pulso · función de IA (Supabase Edge Function, Deno).
// La clave de Anthropic vive SOLO aquí, como secreto ANTHROPIC_API_KEY. Nunca en la web.
// Acciones: "rutina" (armar una rutina), "variar" (ajustar una rutina), "resumen" (cómo va un cliente).
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

// Modelo más económico por petición de Miguel. Se puede cambiar con el secreto MODELO_IA.
const MODELO = Deno.env.get("MODELO_IA") || "claude-haiku-5-5";
const TOPE_DIARIO = Number(Deno.env.get("TOPE_IA_DIARIO") || "30"); // peticiones por entrenador al día

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function responder(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, "Content-Type": "application/json" } });
}

/* ───────── Esquemas de salida (structured outputs) ───────── */
const ESQUEMA_RUTINA = {
  type: "object",
  properties: {
    nombre: { type: "string" },
    descripcion: { type: "string" },
    bloques: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nombre: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ref: { type: "string" },
                series: { type: "integer" },
                reps: { type: "string" },
                tiempo: { type: "string" },
                descanso: { type: "integer" },
                intTipo: { type: "string", enum: ["", "RIR", "RPE", "%"] },
                int: { type: "string" },
                nota: { type: "string" },
                superserie_con_siguiente: { type: "boolean" },
              },
              required: ["ref", "series", "reps", "tiempo", "descanso", "intTipo", "int", "nota", "superserie_con_siguiente"],
              additionalProperties: false,
            },
          },
        },
        required: ["nombre", "items"],
        additionalProperties: false,
      },
    },
  },
  required: ["nombre", "descripcion", "bloques"],
  additionalProperties: false,
};
const ESQUEMA_RESUMEN = {
  type: "object",
  properties: {
    resumen: { type: "string" },
    sugerencias: { type: "array", items: { type: "string" } },
  },
  required: ["resumen", "sugerencias"],
  additionalProperties: false,
};

const SISTEMA_RUTINAS = `Eres un entrenador personal certificado que ayuda a otro entrenador a armar rutinas de gimnasio para sus clientes en México.
Escribe todo en español de México, claro y breve.
Solo puedes usar ejercicios de la lista que te dan: en cada ejercicio pon en "ref" exactamente el valor "ref" de la lista.
Organiza la rutina en bloques con nombres simples (por ejemplo "Calentamiento", "Bloque principal", "Abdomen").
"reps" es texto como "10" o "8-10"; deja "tiempo" vacío salvo en ejercicios por tiempo (por ejemplo "30 s"); "descanso" va en segundos.
Usa intensidad (RIR, RPE o %) solo si el pedido o el nivel lo justifican; si no, deja "intTipo" e "int" vacíos.
"superserie_con_siguiente" es true solo cuando ese ejercicio se alterna sin descanso con el siguiente del mismo bloque.
Las notas son consejos de técnica de una línea, o vacías.
Ajusta volumen e intensidad al nivel y objetivo que se piden. Si el pedido menciona lesiones o dolor, elige variantes seguras y dilo en la nota.`;

const SISTEMA_RESUMEN = `Eres un entrenador personal que ayuda a otro entrenador a revisar cómo va su cliente.
Con los datos que te dan (objetivo, sesiones recientes con pesos y comentarios, medidas), escribe en español de México:
- "resumen": 3 a 5 frases sobre constancia, progreso de fuerza, cómo se siente y medidas. Usa solo los datos; si faltan, dilo.
- "sugerencias": 2 a 4 ajustes concretos y prácticos para las próximas semanas.
No des consejos médicos ni diagnostiques; si hay dolor o lesión, sugiere consultar a un profesional de la salud.`;

/* ───────── Llamada a Claude ───────── */
const anthropic = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno

async function pedirJSON(sistema: string, texto: string, esquema: unknown, maxTokens: number) {
  const respuesta = await anthropic.messages.create({
    model: MODELO,
    max_tokens: maxTokens,
    system: sistema,
    // effort "low": menos razonamiento = más barato; suficiente para armar rutinas.
    output_config: { effort: "low", format: { type: "json_schema", schema: esquema } },
    messages: [{ role: "user", content: texto }],
  } as any);
  if (respuesta.stop_reason === "refusal") throw new Error("La IA no pudo ayudar con ese pedido. Prueba a escribirlo de otra forma.");
  if (respuesta.stop_reason === "max_tokens") throw new Error("La respuesta salió demasiado larga. Pide algo más corto.");
  const texto_ = respuesta.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return JSON.parse(texto_);
}

type Ej = { ref: string; nombre: string; m?: string; e?: string };
function listaEjercicios(ejercicios: Ej[]) {
  return ejercicios.map((e) => `${e.ref} | ${e.nombre}${e.m ? " | " + e.m : ""}${e.e ? " | " + e.e : ""}`).join("\n");
}
function limpiarRutina(r: any, permitidos: Set<string>) {
  r.bloques = (r.bloques || []).map((b: any) => ({ ...b, items: (b.items || []).filter((it: any) => permitidos.has(it.ref)) }))
    .filter((b: any) => b.items.length);
  return r;
}

/* ───────── Servidor ───────── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return responder({ error: "Método no permitido" }, 405);
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return responder({ error: "La IA aún no está configurada (falta la clave de Anthropic)." }, 503);

  // Quién llama: solo entrenadores con sesión iniciada
  const auth = req.headers.get("Authorization") || "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: usuario } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
  if (!usuario?.user) return responder({ error: "Inicia sesión otra vez." }, 401);
  const { data: ent } = await sb.from("entrenadores").select("id").eq("id", usuario.user.id).maybeSingle();
  if (!ent) return responder({ error: "Solo los entrenadores pueden usar la IA." }, 403);

  let cuerpo: any;
  try { cuerpo = await req.json(); } catch { return responder({ error: "Petición no válida." }, 400); }
  const accion = String(cuerpo?.accion || "");
  const pedido = String(cuerpo?.pedido || "").slice(0, 600);

  // Tope diario
  const { data: permitido, error: errTope } = await sb.rpc("usar_ia", { p_limite: TOPE_DIARIO });
  if (errTope) return responder({ error: "No se pudo comprobar el límite diario." }, 500);
  if (!permitido) return responder({ error: `Llegaste al límite de ${TOPE_DIARIO} usos de IA por hoy. Mañana se renueva.` }, 429);

  try {
    if (accion === "rutina" || accion === "variar") {
      const ejercicios: Ej[] = (Array.isArray(cuerpo.ejercicios) ? cuerpo.ejercicios : []).slice(0, 500)
        .map((e: any) => ({ ref: String(e.ref || ""), nombre: String(e.nombre || "").slice(0, 80), m: String(e.m || "").slice(0, 30), e: String(e.e || "").slice(0, 30) }))
        .filter((e: Ej) => e.ref && e.nombre);
      if (!ejercicios.length) return responder({ error: "No hay ejercicios disponibles." }, 400);
      if (!pedido.trim()) return responder({ error: "Escribe qué rutina quieres." }, 400);
      let texto = `Pedido del entrenador: ${pedido}\n\nEjercicios disponibles (ref | nombre | músculo | equipo):\n${listaEjercicios(ejercicios)}`;
      if (accion === "variar") {
        const actual = JSON.stringify(cuerpo.rutina || {}).slice(0, 12000);
        texto = `Esta es la rutina actual (JSON):\n${actual}\n\nAjústala según este pedido del entrenador: ${pedido}\nConserva lo que el pedido no cambie.\n\nEjercicios disponibles (ref | nombre | músculo | equipo):\n${listaEjercicios(ejercicios)}`;
      }
      const r = await pedirJSON(SISTEMA_RUTINAS, texto, ESQUEMA_RUTINA, 8000);
      return responder({ rutina: limpiarRutina(r, new Set(ejercicios.map((e) => e.ref))) });
    }
    if (accion === "resumen") {
      const datos = JSON.stringify(cuerpo.datos || {}).slice(0, 15000);
      const r = await pedirJSON(SISTEMA_RESUMEN, `Datos del cliente (JSON):\n${datos}`, ESQUEMA_RESUMEN, 3000);
      return responder(r);
    }
    return responder({ error: "Acción desconocida." }, 400);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Anthropic.RateLimitError ? "La IA está saturada, intenta en un minuto."
      : e instanceof Anthropic.AuthenticationError ? "La clave de Anthropic no es válida."
      : e instanceof Anthropic.APIError ? "La IA no respondió bien. Intenta de nuevo."
      : (e as Error).message || "Error de la IA.";
    return responder({ error: msg }, 502);
  }
});
