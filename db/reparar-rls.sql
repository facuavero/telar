-- Telar · reparar permisos (RLS). Correr entero en Supabase → SQL Editor.
-- La corrida anterior creó las tablas pero no las policies: con un usuario real,
-- select devuelve vacío e insert falla con 42501.
-- Esto es idempotente y no toca los datos.

-- 1) helper de membresía (security definer: no entra en recursión con las policies)
create or replace function public.es_miembro(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.miembros m
                 where m.workspace_id = ws and m.usuario_id = auth.uid());
$$;
grant execute on function public.es_miembro(uuid) to authenticated;

-- 2) RLS prendido en todo
alter table public.perfiles         enable row level security;
alter table public.workspaces       enable row level security;
alter table public.miembros         enable row level security;
alter table public.conexiones       enable row level security;
alter table public.automatizaciones enable row level security;
alter table public.ejecuciones      enable row level security;

-- 3) policies (se borran y se rehacen, así no importa cuáles quedaron a medias)
drop policy if exists perfil_propio on public.perfiles;
create policy perfil_propio on public.perfiles to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists ws_visible on public.workspaces;
create policy ws_visible on public.workspaces for select to authenticated
  using (dueno = auth.uid() or public.es_miembro(id));

drop policy if exists ws_crear on public.workspaces;
create policy ws_crear on public.workspaces for insert to authenticated
  with check (dueno = auth.uid());

drop policy if exists ws_editar on public.workspaces;
create policy ws_editar on public.workspaces for update to authenticated
  using (dueno = auth.uid()) with check (dueno = auth.uid());

drop policy if exists ws_borrar on public.workspaces;
create policy ws_borrar on public.workspaces for delete to authenticated
  using (dueno = auth.uid());

drop policy if exists miembros_ver on public.miembros;
create policy miembros_ver on public.miembros for select to authenticated
  using (usuario_id = auth.uid() or public.es_miembro(workspace_id));

drop policy if exists miembros_alta on public.miembros;
create policy miembros_alta on public.miembros for insert to authenticated
  with check (usuario_id = auth.uid()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.dueno = auth.uid()));

drop policy if exists miembros_baja on public.miembros;
create policy miembros_baja on public.miembros for delete to authenticated
  using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.dueno = auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['conexiones','automatizaciones','ejecuciones'] loop
    execute format('drop policy if exists %I_miembros on public.%I', t, t);
    execute format($f$create policy %I_miembros on public.%I to authenticated
                      using (public.es_miembro(workspace_id))
                      with check (public.es_miembro(workspace_id))$f$, t, t);
  end loop;
end $$;

-- 4) alta automática de perfil + workspace al registrarse.
--    Si el editor no deja tocar auth.users, este bloque avisa y sigue:
--    la app igual crea el workspace sola la primera vez que entrás.
create or replace function public.al_crear_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  insert into public.perfiles (id, email, nombre)
  values (new.id, new.email, split_part(coalesce(new.email,''), '@', 1))
  on conflict (id) do nothing;

  insert into public.workspaces (nombre, dueno)
  values (coalesce(nullif(split_part(coalesce(new.email,''), '@', 1), ''), 'Mi espacio'), new.id)
  returning id into ws;

  insert into public.miembros (workspace_id, usuario_id, rol)
  values (ws, new.id, 'admin') on conflict do nothing;
  return new;
exception when others then
  -- nunca romper el alta del usuario por esto
  return new;
end $$;

do $$
begin
  drop trigger if exists tr_al_crear_usuario on auth.users;
  create trigger tr_al_crear_usuario after insert on auth.users
    for each row execute function public.al_crear_usuario();
exception when insufficient_privilege then
  raise notice 'Sin permiso para el trigger en auth.users. No pasa nada: la app crea el workspace al entrar.';
end $$;

-- 5) control: tiene que devolver 6 filas con al menos una policy cada una
select c.relname as tabla, c.relrowsecurity as rls, count(p.polname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('perfiles','workspaces','miembros','conexiones','automatizaciones','ejecuciones')
group by c.relname, c.relrowsecurity
order by c.relname;
