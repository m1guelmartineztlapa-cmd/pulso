-- Pulso · arreglo: los alumnos ya no pueden leer las "notas privadas" del entrenador.
-- Pegar en Supabase › SQL Editor › Ejecutar (una vez; se puede repetir).

-- El alumno lee su propia ficha solo con estos campos (sin notas, teléfono ni código de invitación).
create or replace function mi_cliente()
returns table (id uuid, entrenador_id uuid, user_id uuid, nombre text, objetivo text, activo boolean)
language sql stable security definer set search_path = public as
$$ select c.id, c.entrenador_id, c.user_id, c.nombre, c.objetivo, c.activo
   from clientes c where c.user_id = auth.uid() limit 1 $$;
grant execute on function mi_cliente() to authenticated;

-- Quitar la regla que dejaba al alumno leer su fila completa de "clientes".
drop policy if exists p_cli_yo on clientes;
