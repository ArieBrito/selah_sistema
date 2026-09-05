-- Roles de acceso: administrador y usuario.
--
-- `perfiles` liga cada cuenta de Supabase Auth con su rol y con el empleado que
-- le corresponde. El administrador entra a todo el sistema; el usuario solo al
-- registro de pulseras, y ahí únicamente ve sus propios registros.
--
-- Para cambiar el rol de alguien, edita su fila en el Table Editor de Supabase.
--
-- Ejecutar completo en el SQL Editor de Supabase.

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null default 'usuario' check (rol in ('admin', 'usuario')),
  id_empleado smallint references public.empleados(id_empleado),
  creado_en timestamptz not null default now()
);

-- El proxy lee el rol con la sesión del propio usuario, así que necesita poder
-- leer su fila. La clave de servicio que usa el servidor se salta RLS.
alter table public.perfiles enable row level security;

drop policy if exists "perfil propio lectura" on public.perfiles;
create policy "perfil propio lectura" on public.perfiles
  for select to authenticated using (auth.uid() = id);

-- Toda cuenta nueva nace como usuario; se sube a admin a mano.
create or replace function public.crear_perfil_nuevo_usuario() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, rol) values (new.id, 'usuario') on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.crear_perfil_nuevo_usuario();

-- Perfiles de las cuentas que ya existen.
insert into public.perfiles (id, rol, id_empleado)
select u.id,
       case when u.email = 'ariebritomacin@gmail.com' then 'admin' else 'usuario' end,
       case u.email
         when 'ariebritomacin@gmail.com' then (select id_empleado from public.empleados where nombre = 'Arie Moisés' limit 1)
         when 'gbrit.2310@gmail.com' then (select id_empleado from public.empleados where nombre = 'Gabriela Salem' limit 1)
       end
from auth.users u
on conflict (id) do nothing;
