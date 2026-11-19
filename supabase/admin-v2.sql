-- Pulso · panel de administrador v2: registro de accesos y movimientos por entrenador.
-- Pegar en Supabase › SQL Editor › Ejecutar (se puede repetir).

-- Cada vez que alguien abre la app se apunta (como máximo una vez cada 30 minutos por persona).
create table if not exists accesos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  cuando timestamptz not null default now()
);
create index if not exists accesos_user on accesos(user_id, cuando desc);
alter table accesos enable row level security;   -- sin reglas: solo se escribe con la función de abajo

create or replace function registrar_acceso() returns void
language plpgsql security definer set search_path = public as
$$ begin
  if auth.uid() is null then return; end if;
  if not exists (select 1 from accesos where user_id = auth.uid() and cuando > now() - interval '30 minutes') then
    insert into accesos (user_id) values (auth.uid());
  end if;
  delete from accesos where cuando < now() - interval '90 days';   -- se guardan 90 días
end $$;
grant execute on function registrar_acceso() to authenticated;

-- Resumen para el panel. Cada movimiento lleva el entrenador ("ent") para poder filtrarlo.
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
      'activos_7d', (select count(distinct user_id) from accesos where cuando >= now() - interval '7 days')),
    'entrenadores', coalesce((select jsonb_agg(x order by x->>'ultimo_acceso' desc nulls last) from (
      select jsonb_build_object(
        'id', e.id, 'nombre', e.nombre, 'marca', e.marca, 'email', u.email,
        'alta', u.created_at,
        'ultimo_acceso', greatest(u.last_sign_in_at, (select max(a.cuando) from accesos a where a.user_id = e.id)),
        'accesos_7d', (select count(*) from accesos a where a.user_id = e.id and a.cuando >= now() - interval '7 days'),
        'alumnos', (select count(*) from clientes c where c.entrenador_id = e.id),
        'alumnos_con_cuenta', (select count(*) from clientes c where c.entrenador_id = e.id and c.user_id is not null),
        'rutinas', (select count(*) from rutinas t where t.entrenador_id = e.id),
        'sesiones_7d', (select count(*) from sesiones s where s.entrenador_id = e.id and s.terminada and s.fecha >= current_date - 7)) x
      from entrenadores e left join auth.users u on u.id = e.id) q), '[]'::jsonb),
    'alumnos', coalesce((select jsonb_agg(x order by x->>'ultimo_acceso' desc nulls last) from (
      select jsonb_build_object(
        'id', c.id, 'ent', c.entrenador_id, 'nombre', c.nombre, 'entrenador', e.nombre, 'marca', e.marca, 'email', u.email,
        'tiene_cuenta', c.user_id is not null, 'activo', c.activo, 'alta', c.creado,
        'ultimo_acceso', greatest(u.last_sign_in_at, (select max(a.cuando) from accesos a where a.user_id = c.user_id)),
        'sesiones', (select count(*) from sesiones s where s.cliente_id = c.id and s.terminada),
        'ultima_sesion', (select max(s.fecha) from sesiones s where s.cliente_id = c.id and s.terminada)) x
      from clientes c join entrenadores e on e.id = c.entrenador_id left join auth.users u on u.id = c.user_id) q), '[]'::jsonb),
    'actividad', coalesce((select jsonb_agg(a order by a->>'cuando' desc) from (
      select a from (
        select jsonb_build_object('cuando', s.creado, 'tipo', 'entreno', 'ent', s.entrenador_id, 'quien', c.nombre, 'de', e.marca,
          'detalle', 'Entrenó ' || coalesce(s.rutina_nombre, 'Rutina') || coalesce(' · ★' || s.calificacion, '') || coalesce(' · “' || s.comentario || '”', '')) a
          from sesiones s join clientes c on c.id = s.cliente_id join entrenadores e on e.id = s.entrenador_id where s.terminada
        union all
        select jsonb_build_object('cuando', c.creado, 'tipo', 'alumno', 'ent', e.id, 'quien', e.nombre, 'de', e.marca, 'detalle', 'Agregó a ' || c.nombre)
          from clientes c join entrenadores e on e.id = c.entrenador_id
        union all
        select jsonb_build_object('cuando', t.actualizado, 'tipo', 'rutina', 'ent', e.id, 'quien', e.nombre, 'de', e.marca,
          'detalle', case when t.actualizado > t.creado + interval '1 minute' then 'Editó la rutina ' else 'Creó la rutina ' end || t.nombre)
          from rutinas t join entrenadores e on e.id = t.entrenador_id
        union all
        select jsonb_build_object('cuando', g.creado, 'tipo', 'asignacion', 'ent', e.id, 'quien', e.nombre, 'de', e.marca,
          'detalle', 'Asignó ' || t.nombre || ' a ' || c.nombre)
          from asignaciones g join entrenadores e on e.id = g.entrenador_id join rutinas t on t.id = g.rutina_id join clientes c on c.id = g.cliente_id
        union all
        select jsonb_build_object('cuando', m.creado, 'tipo', 'medida', 'ent', m.entrenador_id, 'quien', c.nombre, 'de', e.marca,
          'detalle', 'Medidas registradas' || case when m.foto_path is not null then ' (con foto)' else '' end)
          from medidas m join clientes c on c.id = m.cliente_id join entrenadores e on e.id = m.entrenador_id
        union all
        select jsonb_build_object('cuando', ac.cuando, 'tipo', 'acceso', 'ent', coalesce(e.id, c.entrenador_id),
          'quien', coalesce(e.nombre, c.nombre, u.email), 'de', coalesce(e.marca, e2.marca, ''),
          'detalle', case when e.id is not null then 'Abrió la app (entrenador)' else 'Abrió la app (alumno)' end)
          from accesos ac join auth.users u on u.id = ac.user_id
          left join entrenadores e on e.id = ac.user_id
          left join clientes c on c.user_id = ac.user_id left join entrenadores e2 on e2.id = c.entrenador_id
          where ac.cuando >= now() - interval '30 days'
        union all
        select jsonb_build_object('cuando', u.created_at, 'tipo', 'registro', 'ent', coalesce(e.id, c.entrenador_id),
          'quien', coalesce(e.nombre, c.nombre, u.email), 'de', coalesce(e.marca, ''),
          'detalle', case when e.id is not null then 'Creó su cuenta de entrenador' when c.id is not null then 'Creó su cuenta de alumno' else 'Creó una cuenta' end)
          from auth.users u left join entrenadores e on e.id = u.id left join clientes c on c.user_id = u.id
      ) todo order by a->>'cuando' desc limit 400) z), '[]'::jsonb)
  ) into r;
  return r;
end $$;
grant execute on function admin_resumen() to authenticated;
