-- Telar · esquema base de la app (Supabase / Postgres).
-- Pegar entero en Supabase → SQL Editor → Run. Es idempotente: se puede correr de nuevo.

-- ========== tablas ==========

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  creado_en timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan text not null default 'gratis',
  dueno uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table if not exists public.miembros (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'admin' check (rol in ('admin','editor','lector')),
  creado_en timestamptz not null default now(),
  primary key (workspace_id, usuario_id)
);

-- Herramientas conectadas (Slack, Gmail, Drive…). El refresh token se guarda
-- en config->oauth cifrado con AES-GCM: la clave (CLAVE_CIFRADO) vive solo en
-- el worker, así la fila no sirve de nada sin él. Nada en texto plano.
create table if not exists public.conexiones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proveedor text not null,
  nombre text,
  estado text not null default 'pendiente' check (estado in ('pendiente','activa','error','revocada')),
  cuenta text,
  config jsonb not null default '{}'::jsonb,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create table if not exists public.automatizaciones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  nombre text not null,
  descripcion text,
  estado text not null default 'borrador' check (estado in ('borrador','activa','pausada')),
  -- {disparador:{...}, pasos:[...]} — el editor visual escribe acá.
  definicion jsonb not null default '{"disparador":null,"pasos":[]}'::jsonb,
  creada_por uuid references auth.users(id) on delete set null,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create table if not exists public.ejecuciones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automatizacion_id uuid not null references public.automatizaciones(id) on delete cascade,
  estado text not null default 'corriendo' check (estado in ('corriendo','ok','error','cancelada','esperando_aprobacion')),
  empezada_en timestamptz not null default now(),
  terminada_en timestamptz,
  error text,
  pasos jsonb not null default '[]'::jsonb
);

create index if not exists ix_miembros_usuario on public.miembros(usuario_id);
create index if not exists ix_autom_ws on public.automatizaciones(workspace_id);
create index if not exists ix_conex_ws on public.conexiones(workspace_id);
create index if not exists ix_ejec_autom on public.ejecuciones(automatizacion_id, empezada_en desc);

-- ========== helper de permisos (security definer, evita recursión en RLS) ==========

create or replace function public.es_miembro(ws uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.miembros m
    where m.workspace_id = ws and m.usuario_id = auth.uid()
  );
$$;

-- ========== RLS ==========

alter table public.perfiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.miembros            enable row level security;
alter table public.conexiones          enable row level security;
alter table public.automatizaciones    enable row level security;
alter table public.ejecuciones         enable row level security;

drop policy if exists perfil_propio on public.perfiles;
create policy perfil_propio on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists ws_visible on public.workspaces;
create policy ws_visible on public.workspaces
  for select using (public.es_miembro(id));
drop policy if exists ws_crear on public.workspaces;
create policy ws_crear on public.workspaces
  for insert with check (dueno = auth.uid());
drop policy if exists ws_dueno on public.workspaces;
create policy ws_dueno on public.workspaces
  for update using (dueno = auth.uid()) with check (dueno = auth.uid());

drop policy if exists miembros_ver on public.miembros;
create policy miembros_ver on public.miembros
  for select using (usuario_id = auth.uid() or public.es_miembro(workspace_id));
drop policy if exists miembros_alta on public.miembros;
create policy miembros_alta on public.miembros
  for insert with check (
    usuario_id = auth.uid()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.dueno = auth.uid())
  );

do $$
declare t text;
begin
  foreach t in array array['conexiones','automatizaciones','ejecuciones'] loop
    execute format('drop policy if exists %I_miembros on public.%I', t, t);
    execute format(
      'create policy %I_miembros on public.%I for all using (public.es_miembro(workspace_id)) with check (public.es_miembro(workspace_id))',
      t, t);
  end loop;
end $$;

-- ========== alta automática: perfil + workspace personal ==========

create or replace function public.al_crear_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare ws uuid;
begin
  insert into public.perfiles (id, email, nombre)
  values (new.id, new.email, split_part(coalesce(new.email,''), '@', 1))
  on conflict (id) do nothing;

  insert into public.workspaces (nombre, dueno)
  values (coalesce(split_part(new.email, '@', 1), 'Mi espacio'), new.id)
  returning id into ws;

  insert into public.miembros (workspace_id, usuario_id, rol)
  values (ws, new.id, 'admin')
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists tr_al_crear_usuario on auth.users;
create trigger tr_al_crear_usuario
  after insert on auth.users
  for each row execute function public.al_crear_usuario();

-- ========== actualizada_en ==========

create or replace function public.tocar()
returns trigger language plpgsql as $$
begin new.actualizada_en = now(); return new; end $$;

drop trigger if exists tr_tocar_autom on public.automatizaciones;
create trigger tr_tocar_autom before update on public.automatizaciones
  for each row execute function public.tocar();
drop trigger if exists tr_tocar_conex on public.conexiones;
create trigger tr_tocar_conex before update on public.conexiones
  for each row execute function public.tocar();
