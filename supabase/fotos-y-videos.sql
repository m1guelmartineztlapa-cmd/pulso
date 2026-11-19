-- Pulso · foto de perfil del alumno y videos propios de ejercicios.
-- Pegar en Supabase › SQL Editor › Ejecutar (una vez; se puede repetir).

-- 1) Foto de perfil del alumno (se guarda en la carpeta privada "fotos")
alter table clientes add column if not exists foto_path text;

drop function if exists mi_cliente();
create function mi_cliente()
returns table (id uuid, entrenador_id uuid, user_id uuid, nombre text, objetivo text, activo boolean, foto_path text)
language sql stable security definer set search_path = public as
$$ select c.id, c.entrenador_id, c.user_id, c.nombre, c.objetivo, c.activo, c.foto_path
   from clientes c where c.user_id = auth.uid() limit 1 $$;
grant execute on function mi_cliente() to authenticated;

-- El alumno cambia SOLO su foto (solo puede apuntar a su propia carpeta).
create or replace function cambiar_mi_foto(p_path text) returns void
language plpgsql security definer set search_path = public as
$$ begin
  update clientes set foto_path = p_path
   where user_id = auth.uid()
     and (p_path is null or p_path like entrenador_id::text || '/' || id::text || '/%');
end $$;
grant execute on function cambiar_mi_foto(text) to authenticated;

-- 2) Videos propios del entrenador (carpeta pública "videos", máx. 50 MB por video)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 52428800, array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 52428800,
  allowed_mime_types = array['video/mp4','video/quicktime','video/webm'];

drop policy if exists p_videos_subir on storage.objects;
drop policy if exists p_videos_borrar on storage.objects;
-- videos/<entrenador_id>/archivo
create policy p_videos_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy p_videos_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);
