-- =========================================================================
-- Proyecto Sincresis - esquema inicial de Supabase
-- Pegar y ejecutar completo en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- Tablas
-- -------------------------------------------------------------------------

-- Miembros del equipo del proyecto (Sara, Juliana, Samuel).
-- user_id se vincula a auth.users despues de que cada uno cree su cuenta
-- (ver instrucciones al final del archivo).
create table if not exists miembros_equipo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- Participantes del experimento. No son usuarios de la app: el equipo
-- captura sus datos al subir cada entrevista.
create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rol text not null check (rol in ('diseñador', 'general')),
  grupo text not null,
  created_at timestamptz not null default now()
);

-- Sonidos / variantes usados en el experimento.
create table if not exists sonidos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  variante text not null,
  archivo_url text,
  created_at timestamptz not null default now()
);

-- Sesiones: cruce de un participante con un sonido en una fase y fecha.
create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references participantes(id) on delete cascade,
  sonido_id uuid not null references sonidos(id) on delete restrict,
  fase text not null,
  fecha timestamptz not null default now()
);

-- Entrevistas grabadas para una sesion (audio + transcripcion).
create table if not exists entrevistas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones(id) on delete cascade,
  audio_url text,
  transcripcion text,
  created_at timestamptz not null default now()
);

-- Documentos del equipo (avances, marco teorico, actas de asesoria, etc.)
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  subido_por uuid not null references miembros_equipo(id) on delete restrict,
  nombre text not null,
  categoria text not null,
  archivo_url text not null,
  fecha_subida timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- Helper: ¿el usuario autenticado es miembro del equipo?
-- -------------------------------------------------------------------------

create or replace function is_equipo()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from miembros_equipo where user_id = auth.uid()
  );
$$;

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------

alter table miembros_equipo enable row level security;
alter table participantes enable row level security;
alter table sonidos enable row level security;
alter table sesiones enable row level security;
alter table entrevistas enable row level security;
alter table documentos enable row level security;

-- miembros_equipo: cada quien ve su propia fila, o cualquier miembro ve a todos.
create policy "miembros_equipo_select" on miembros_equipo
  for select using (is_equipo() or user_id = auth.uid());

-- participantes: exclusivo del equipo.
create policy "participantes_select" on participantes
  for select using (is_equipo());

create policy "participantes_insert" on participantes
  for insert with check (is_equipo());

create policy "participantes_update" on participantes
  for update using (is_equipo());

create policy "participantes_delete" on participantes
  for delete using (is_equipo());

-- sonidos: catalogo interno del equipo.
create policy "sonidos_select" on sonidos
  for select using (is_equipo());

create policy "sonidos_insert" on sonidos
  for insert with check (is_equipo());

create policy "sonidos_update" on sonidos
  for update using (is_equipo());

create policy "sonidos_delete" on sonidos
  for delete using (is_equipo());

-- sesiones: exclusivo del equipo.
create policy "sesiones_select" on sesiones
  for select using (is_equipo());

create policy "sesiones_insert" on sesiones
  for insert with check (is_equipo());

create policy "sesiones_update" on sesiones
  for update using (is_equipo());

create policy "sesiones_delete" on sesiones
  for delete using (is_equipo());

-- entrevistas: exclusivo del equipo.
create policy "entrevistas_select" on entrevistas
  for select using (is_equipo());

create policy "entrevistas_insert" on entrevistas
  for insert with check (is_equipo());

create policy "entrevistas_update" on entrevistas
  for update using (is_equipo());

create policy "entrevistas_delete" on entrevistas
  for delete using (is_equipo());

-- documentos: exclusivo del equipo del proyecto.
create policy "documentos_select" on documentos
  for select using (is_equipo());

create policy "documentos_insert" on documentos
  for insert with check (is_equipo());

create policy "documentos_update" on documentos
  for update using (is_equipo());

create policy "documentos_delete" on documentos
  for delete using (is_equipo());

-- -------------------------------------------------------------------------
-- Storage: dos buckets privados (documentos y audios de entrevistas)
-- -------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audios-entrevistas', 'audios-entrevistas', false)
on conflict (id) do nothing;

-- documentos: solo el equipo sube, lista y descarga.
create policy "storage_documentos_select" on storage.objects
  for select using (bucket_id = 'documentos' and is_equipo());

create policy "storage_documentos_insert" on storage.objects
  for insert with check (bucket_id = 'documentos' and is_equipo());

create policy "storage_documentos_update" on storage.objects
  for update using (bucket_id = 'documentos' and is_equipo());

create policy "storage_documentos_delete" on storage.objects
  for delete using (bucket_id = 'documentos' and is_equipo());

-- audios-entrevistas: el equipo sube las grabaciones hechas localmente y
-- es el unico que puede listarlas, escucharlas o borrarlas.
create policy "storage_audios_insert" on storage.objects
  for insert with check (bucket_id = 'audios-entrevistas' and is_equipo());

create policy "storage_audios_select" on storage.objects
  for select using (bucket_id = 'audios-entrevistas' and is_equipo());

create policy "storage_audios_delete" on storage.objects
  for delete using (bucket_id = 'audios-entrevistas' and is_equipo());

-- =========================================================================
-- Despues de ejecutar este script:
--
-- 1. Ve a Authentication -> Users y crea las cuentas de Sara, Juliana y
--    Samuel (con su email y una contraseña), o pideles que se registren
--    desde la app.
-- 2. Por cada una, copia su "User UID" y ejecuta:
--
--    insert into miembros_equipo (user_id, nombre)
--    values ('<uid-copiado>', 'Sara');
--
--    (repite para Juliana y Samuel)
--
-- 3. La app tiene un solo tipo de usuario. Una cuenta que no este en
--    miembros_equipo no pasa del login: las policies de arriba le niegan
--    todo, y el propio formulario la cierra sesion al detectarlo.
-- =========================================================================
