-- Pulso · esquema de base de datos para Supabase
-- Pegar entero en Supabase › SQL Editor › New query › Run. Se puede repetir.

create extension if not exists pgcrypto;

-- ───────── Tablas ─────────
create table if not exists entrenadores (
  id uuid primary key default auth.uid() references auth.users on delete cascade,
  nombre text not null default '',
  marca text not null default 'Pulso',
  logo_url text,
  color text not null default '#2F6BFF',
  creado timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  user_id uuid unique references auth.users on delete set null,
  nombre text not null,
  email text,
  telefono text,
  objetivo text,
  notas text,
  activo boolean not null default true,
  codigo text unique default encode(gen_random_bytes(6), 'hex'),
  creado timestamptz not null default now()
);

create table if not exists ejercicios (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  nombre text not null,
  musculo text,
  equipo text,
  video_url text,
  imagen_url text,
  instrucciones text,
  creado timestamptz not null default now()
);

create table if not exists rutinas (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  nombre text not null,
  descripcion text,
  bloques jsonb not null default '[]',
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists asignaciones (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  cliente_id uuid not null references clientes on delete cascade,
  rutina_id uuid not null references rutinas on delete cascade,
  dias int[] not null default '{}',          -- 0 = domingo … 6 = sábado
  activa boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null references entrenadores on delete cascade,
  cliente_id uuid not null references clientes on delete cascade,
  rutina_id uuid references rutinas on delete set null,
  rutina_nombre text,
  fecha date not null default current_date,
  terminada boolean not null default false,
  comentario text,
  calificacion int check (calificacion between 1 and 5),
  series jsonb not null default '[]',
  creado timestamptz not null default now()
);

create table if not exists medidas (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null references entrenadores on delete cascade,
  cliente_id uuid not null references clientes on delete cascade,
  fecha date not null default current_date,
  peso numeric, cintura numeric, cadera numeric, pecho numeric, brazo numeric, pierna numeric, grasa numeric,
  foto_path text,
  nota text,
  creado timestamptz not null default now()
);

create index if not exists clientes_ent on clientes(entrenador_id);
create index if not exists rutinas_ent on rutinas(entrenador_id);
create index if not exists asig_cli on asignaciones(cliente_id);
create index if not exists ses_cli on sesiones(cliente_id, fecha desc);
create index if not exists med_cli on medidas(cliente_id, fecha desc);

-- ───────── Funciones de ayuda ─────────
create or replace function mi_cliente_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from clientes where user_id = auth.uid() limit 1 $$;

create or replace function mi_entrenador_de_cliente() returns uuid
language sql stable security definer set search_path = public as
$$ select entrenador_id from clientes where user_id = auth.uid() limit 1 $$;

-- Datos de marca para la pantalla de invitación (antes de iniciar sesión)
create or replace function invitacion(p_codigo text)
returns table (cliente_nombre text, marca text, logo_url text, color text, entrenador text, usada boolean)
language sql stable security definer set search_path = public as
$$ select c.nombre, e.marca, e.logo_url, e.color, e.nombre, c.user_id is not null
   from clientes c join entrenadores e on e.id = c.entrenador_id
   where c.codigo = p_codigo $$;

-- El cliente recién registrado reclama su invitación
create or replace function reclamar_invitacion(p_codigo text) returns uuid
language plpgsql security definer set search_path = public as
$$ declare v uuid;
begin
  update clientes set user_id = auth.uid()
   where codigo = p_codigo and (user_id is null or user_id = auth.uid())
   returning id into v;
  if v is null then raise exception 'Invitación no válida o ya usada'; end if;
  return v;
end $$;

grant execute on function invitacion(text) to anon, authenticated;
grant execute on function reclamar_invitacion(text) to authenticated;

-- ───────── Reglas de acceso (RLS) ─────────
alter table entrenadores enable row level security;
alter table clientes     enable row level security;
alter table ejercicios   enable row level security;
alter table rutinas      enable row level security;
alter table asignaciones enable row level security;
alter table sesiones     enable row level security;
alter table medidas      enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and policyname like 'p_%' loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- Entrenador: lo suyo. Cliente: ver la marca de su entrenador.
create policy p_ent_propio on entrenadores for all using (id = auth.uid()) with check (id = auth.uid());
create policy p_ent_cliente on entrenadores for select using (id = mi_entrenador_de_cliente());

create policy p_cli_ent on clientes for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_cli_yo on clientes for select using (user_id = auth.uid());

create policy p_eje_ent on ejercicios for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_eje_cli on ejercicios for select using (entrenador_id = mi_entrenador_de_cliente());

create policy p_rut_ent on rutinas for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_rut_cli on rutinas for select using (
  exists (select 1 from asignaciones a where a.rutina_id = rutinas.id and a.cliente_id = mi_cliente_id()));

create policy p_asi_ent on asignaciones for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_asi_cli on asignaciones for select using (cliente_id = mi_cliente_id());

create policy p_ses_ent on sesiones for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_ses_cli on sesiones for all
  using (cliente_id = mi_cliente_id())
  with check (cliente_id = mi_cliente_id() and entrenador_id = mi_entrenador_de_cliente());

create policy p_med_ent on medidas for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_med_cli on medidas for all
  using (cliente_id = mi_cliente_id())
  with check (cliente_id = mi_cliente_id() and entrenador_id = mi_entrenador_de_cliente());

-- ───────── Archivos: logos (públicos) y fotos de progreso (privadas) ─────────
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', false) on conflict (id) do nothing;

drop policy if exists p_logos_subir on storage.objects;
drop policy if exists p_logos_cambiar on storage.objects;
drop policy if exists p_fotos_ver on storage.objects;
drop policy if exists p_fotos_subir on storage.objects;
drop policy if exists p_fotos_borrar on storage.objects;

-- logos/<entrenador_id>/archivo
create policy p_logos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy p_logos_cambiar on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- fotos/<entrenador_id>/<cliente_id>/archivo
create policy p_fotos_ver on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text
                                  or (storage.foldername(name))[2] = mi_cliente_id()::text));
create policy p_fotos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text
                                       or (storage.foldername(name))[2] = mi_cliente_id()::text));
create policy p_fotos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text
                                  or (storage.foldername(name))[2] = mi_cliente_id()::text));
