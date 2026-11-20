-- Pulso · v7: el administrador puede entrar a cualquier cuenta (entrenador o alumno)
-- para darle mantenimiento: ver y modificar sus rutinas, dietas, alumnos, medidas, etc.
-- Pegar en Supabase › SQL Editor › Ejecutar (se puede repetir).

-- 1) Tablas: el admin puede leer y escribir todo
do $$
declare t text;
begin
  foreach t in array array['entrenadores','clientes','ejercicios','rutinas','asignaciones','sesiones','medidas','planes_alim','asig_alim','registro_alim'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists p_admin_todo on %I', t);
      execute format('create policy p_admin_todo on %I for all to authenticated using (es_admin()) with check (es_admin())', t);
    end if;
  end loop;
end $$;

-- 2) Archivos (logos, fotos y videos): el admin puede ver, subir, cambiar y borrar
drop policy if exists p_admin_archivos_ver on storage.objects;
drop policy if exists p_admin_archivos_subir on storage.objects;
drop policy if exists p_admin_archivos_cambiar on storage.objects;
drop policy if exists p_admin_archivos_borrar on storage.objects;
create policy p_admin_archivos_ver on storage.objects for select to authenticated
  using (bucket_id in ('logos','fotos','videos') and es_admin());
create policy p_admin_archivos_subir on storage.objects for insert to authenticated
  with check (bucket_id in ('logos','fotos','videos') and es_admin());
create policy p_admin_archivos_cambiar on storage.objects for update to authenticated
  using (bucket_id in ('logos','fotos','videos') and es_admin());
create policy p_admin_archivos_borrar on storage.objects for delete to authenticated
  using (bucket_id in ('logos','fotos','videos') and es_admin());
