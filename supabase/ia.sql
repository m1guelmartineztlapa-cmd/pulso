-- Pulso · tope diario de IA. Pegar en Supabase › SQL Editor › Run (una vez; se puede repetir).
create table if not exists ia_uso (
  entrenador_id uuid not null references entrenadores on delete cascade,
  fecha date not null default current_date,
  usos int not null default 0,
  primary key (entrenador_id, fecha)
);
alter table ia_uso enable row level security;
drop policy if exists p_ia_ver on ia_uso;
create policy p_ia_ver on ia_uso for select using (entrenador_id = auth.uid());
grant select on ia_uso to authenticated;

-- Suma un uso si no se pasó del límite. Devuelve true si puede usar la IA.
create or replace function usar_ia(p_limite int) returns boolean
language plpgsql security definer set search_path = public as
$$ declare v int;
begin
  if not exists (select 1 from entrenadores where id = auth.uid()) then return false; end if;
  insert into ia_uso (entrenador_id, fecha, usos) values (auth.uid(), current_date, 1)
  on conflict (entrenador_id, fecha) do update set usos = ia_uso.usos + 1
  where ia_uso.usos < p_limite
  returning usos into v;
  return v is not null;
end $$;
grant execute on function usar_ia(int) to authenticated;
