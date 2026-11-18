/* Configuración de Pulso.
   Sin datos de Supabase, la app arranca en MODO DEMO (datos de ejemplo guardados solo en este navegador).
   La "anon key" de Supabase es pública por diseño: la seguridad la ponen las reglas de la base de datos. */
window.PULSO_CONFIG = {
  SUPABASE_URL: "https://adkzrnmhvshqbiwpzemx.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_1Z-UKL06N1_d0W5a_o6NEQ_awyynRA9",
  // true cuando la función de IA esté desplegada en Supabase con su clave de Anthropic
  IA_ACTIVA: false,
  MARCA: "Pulso",
  COLOR: "#2F6BFF"
};
