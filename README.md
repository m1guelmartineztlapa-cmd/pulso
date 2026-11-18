# Pulso

App para entrenadores y sus clientes: el entrenador arma rutinas por bloques
(series, reps, peso, RIR/RPE/%, superseries, descansos), las asigna por días y ve
el progreso de cada cliente. El cliente abre su enlace, instala la app en el
celular, ve lo que le toca hoy y registra cada serie viendo lo de la vez pasada.

- **App**: `docs/` (HTML + CSS + JS, sin compilar). Se publica con GitHub Pages.
- **Datos y cuentas**: Supabase (plan gratis). Esquema en `supabase/esquema.sql`.
- **Sin configurar Supabase**, la app arranca en **modo demo** con datos de
  ejemplo guardados solo en el navegador.

## Probar en tu PC

```
python -m http.server 8765 --directory docs
```
y abre http://localhost:8765

## Conectar Supabase

Ver [SUPABASE.md](SUPABASE.md).

## Publicar cambios

```
git add -A
git commit -m "lo que cambiaste"
git push
```
GitHub Pages lo publica en 1-2 minutos. Tras cambios en CSS/JS, sube la versión
`?v=` en `docs/index.html` y `docs/sw.js` para que los celulares no usen la copia vieja.

## Créditos

- Ejercicios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  (dominio público, Unlicense). Nombres traducidos al español.
- Hecho con la skill `miguel-copia-software`.
