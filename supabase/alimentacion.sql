-- Pulso · Alimentación: planes de comida, asignación a alumnos y registro diario
-- (comidas cumplidas, checklist y "¿Cómo te sientes hoy?").
-- Pegar en Supabase › SQL Editor › Ejecutar (se puede repetir).

create table if not exists planes_alim (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  nombre text not null,
  descripcion text,
  dias jsonb not null default '[]',
  indicadores jsonb not null default '["Energía","Digestión","Hinchazón","Glucosa","Hidratación","Descanso"]',
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists asig_alim (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null default auth.uid() references entrenadores on delete cascade,
  cliente_id uuid not null references clientes on delete cascade,
  plan_id uuid not null references planes_alim on delete cascade,
  inicio date not null default current_date,
  activa boolean not null default true,
  creado timestamptz not null default now()
);

-- Un registro por alumno y por día
create table if not exists registro_alim (
  id uuid primary key default gen_random_uuid(),
  entrenador_id uuid not null references entrenadores on delete cascade,
  cliente_id uuid not null references clientes on delete cascade,
  fecha date not null default current_date,
  comidas jsonb not null default '{}',    -- {"desayuno": {"estado": "si|cambio|no", "foto": "ruta"}}
  checklist jsonb not null default '{}',  -- {"Vegetales": true}
  sentir jsonb not null default '{}',     -- {"Energía": 4, "Digestión": 5}
  nota text,
  actualizado timestamptz not null default now(),
  unique (cliente_id, fecha)
);

create index if not exists planes_alim_ent on planes_alim(entrenador_id);
create index if not exists asig_alim_cli on asig_alim(cliente_id);
create index if not exists registro_alim_cli on registro_alim(cliente_id, fecha desc);

grant select, insert, update, delete on planes_alim, asig_alim, registro_alim to authenticated;

alter table planes_alim enable row level security;
alter table asig_alim enable row level security;
alter table registro_alim enable row level security;

drop policy if exists p_pal_ent on planes_alim;
drop policy if exists p_pal_cli on planes_alim;
drop policy if exists p_aal_ent on asig_alim;
drop policy if exists p_aal_cli on asig_alim;
drop policy if exists p_ral_ent on registro_alim;
drop policy if exists p_ral_cli on registro_alim;

create policy p_pal_ent on planes_alim for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_pal_cli on planes_alim for select using (
  exists (select 1 from asig_alim a where a.plan_id = planes_alim.id and a.cliente_id = mi_cliente_id()));

create policy p_aal_ent on asig_alim for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_aal_cli on asig_alim for select using (cliente_id = mi_cliente_id());

create policy p_ral_ent on registro_alim for all using (entrenador_id = auth.uid()) with check (entrenador_id = auth.uid());
create policy p_ral_cli on registro_alim for all
  using (cliente_id = mi_cliente_id())
  with check (cliente_id = mi_cliente_id() and entrenador_id = mi_entrenador_de_cliente());
