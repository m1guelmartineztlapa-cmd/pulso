# Conectar Pulso a Supabase (10 minutos, una sola vez)

Supabase guarda las cuentas, los clientes, las rutinas y el progreso. El plan
gratis alcanza de sobra para un entrenador.

## 1. Crear el proyecto
1. Entra en **supabase.com** › **Start your project** › entra con **GitHub**.
2. **New project**. Nombre: `pulso`. Pon una contraseña de base de datos (guárdala,
   pero no la necesitas para la app). Región: la más cercana (p. ej. *East US*).
   Plan **Free**. Pulsa **Create new project** y espera 1-2 minutos.

## 2. Crear las tablas
1. Menú izquierdo › **SQL Editor** › **New query**.
2. Pega TODO el contenido de `supabase/esquema.sql` y pulsa **Run**.
   Debe decir *Success. No rows returned*.

## 3. Que las cuentas entren sin confirmar correo (recomendado)
**Authentication** › **Sign In / Providers** › **Email** › desactiva
**Confirm email** › **Save**. Así tus clientes crean su cuenta y entran al momento.

## 4. Pasarle los datos a Claude
**Project Settings** (engrane) › **Data API** / **API Keys**. Copia:
- **Project URL** (`https://xxxx.supabase.co`)
- La clave **anon public** (o *publishable*)

Esas dos son públicas por diseño (van dentro de la web). **Nunca** compartas la
clave **service_role** / *secret*.

## Ojo con el plan gratis
Si nadie usa la app en 7 días, Supabase pausa el proyecto. Se reactiva entrando a
supabase.com y pulsando **Restore project**.
