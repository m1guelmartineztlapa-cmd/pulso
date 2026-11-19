-- Pulso · panel de administrador (solo para el dueño de la plataforma).
-- Pegar en Supabase › SQL Editor › Ejecutar. Después, darte acceso con el bloque del final.

create table if not exists admins (user_id uuid primary key references auth.users on delete cascade);
alter table admins enable row level security;   -- sin reglas: nadie la lee desde la app

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where user_id = auth.uid()) $$;
grant execute on function es_admin() to authenticated;

-- Todo lo que ve el panel, en un solo paquete. Si no eres admin, no devuelve nada.
create or replace function admin_resumen() returns jsonb
language plpgsql stable security definer set search_path = public, auth as
$$ declare r jsonb;
begin
  if not es_admin() then return null; end if;
  select jsonb_build_object(
    'totales', jsonb_build_object(
      'entrenadores', (select count(*) from entrenadores),
      'alumnos', (select count(*) from clientes),
      'alumnos_con_cuenta', (select count(*) from clientes where user_id is not null),
      'rutinas', (select count(*) from rutinas),
      'sesiones', (select count(*) from sesiones where terminada),
      'sesiones_7d', (select count(*) from sesiones where terminada and fecha >= current_date - 7),
      'activos_7d', (select count(*) from auth.users where last_sign_in_at >= now() - interval '7 days')),
    'entrenadores', coalesce((select jsonb_agg(x order by x->>'ultimo_acceso' desc nulls last) from (
      select jsonb_build_object(
        'id', e.id, 'nombre', e.nombre, 'marca', e.marca, 'email', u.email,
        'alta', u.created_at, 'ultimo_acceso', u.last_sign_in_at,
        'alumnos', (select count(*) from clientes c where c.entrenador_id = e.id),
        'alumnos_con_cuenta', (select count(*) from clientes c where c.entrenador_id = e.id and c.user_id is not null),
        'rutinas', (select count(*) from rutinas t where t.entrenador_id = e.id),
        'sesiones_7d', (select count(*) from sesiones s where s.entrenador_id = e.id and s.terminada and s.fecha >= current_date - 7)) x
      from entrenadores e left join auth.users u on u.id = e.id) q), '[]'::jsonb),
    'alumnos', coalesce((select jsonb_agg(x order by x->>'ultimo_acceso' desc nulls last) from (
      select jsonb_build_object(
        'id', c.id, 'nombre', c.nombre, 'entrenador', e.nombre, 'marca', e.marca, 'email', u.email,
        'tiene_cuenta', c.user_id is not null, 'activo', c.activo,
        'alta', c.creado, 'ultimo_acceso', u.last_sign_in_at,
        'sesiones', (select count(*) from sesiones s where s.cliente_id = c.id and s.terminada),
        'ultima_sesion', (select max(s.fecha) from sesiones s where s.cliente_id = c.id and s.terminada)) x
      from clientes c join entrenadores e on e.id = c.entrenador_id left join auth.users u on u.id = c.user_id) q), '[]'::jsonb),
    'actividad', coalesce((select jsonb_agg(a order by a->>'cuando' desc) from (
      select a from (
        select jsonb_build_object('cuando', s.creado, 'tipo', 'entreno', 'quien', c.nombre, 'de', e.marca,
          'detalle', coalesce(s.rutina_nombre, 'Rutina') || coalesce(' · ★' || s.calificacion, '') || coalesce(' · “' || s.comentario || '”', '')) a
          from sesiones s join clientes c on c.id = s.cliente_id join entrenadores e on e.id = s.entrenador_id where s.terminada
        union all
        select jsonb_build_object('cuando', c.creado, 'tipo', 'alumno', 'quien', e.nombre, 'de', e.marca, 'detalle', 'Agregó a ' || c.nombre)
          from clientes c join entrenadores e on e.id = c.entrenador_id
        union all
        select jsonb_build_object('cuando', t.actualizado, 'tipo', 'rutina', 'quien', e.nombre, 'de', e.marca,
          'detalle', case when t.actualizado > t.creado + interval '1 minute' then 'Editó la rutina ' else 'Creó la rutina ' end || t.nombre)
          from rutinas t join entrenadores e on e.id = t.entrenador_id
        union all
        select jsonb_build_object('cuando', u.created_at, 'tipo', 'registro', 'quien', coalesce(e.nombre, c.nombre, u.email),
          'de', coalesce(e.marca, ''), 'detalle', case when e.id is not null then 'Creó su cuenta de entrenador' when c.id is not null then 'Creó su cuenta de alumno' else 'Creó una cuenta' end)
          from auth.users u left join entrenadores e on e.id = u.id left join clientes c on c.user_id = u.id
      ) todo order by a->>'cuando' desc limit 100) z), '[]'::jsonb)
  ) into r;
  return r;
end $$;
grant execute on function admin_resumen() to authenticated;

-- ───── Darte acceso de administrador ─────
-- Cambia TU_CORREO por el correo con el que entras a Pulso y ejecuta esta línea:
-- insert into admins (user_id) select id from auth.users where email = 'TU_CORREO' on conflict do nothing;
