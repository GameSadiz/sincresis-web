-- =========================================================================
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
--
-- La app pasa a tener un solo tipo de usuario: el equipo del trabajo de
-- grado. Los participantes del experimento ya no inician sesion ni graban
-- desde la pagina; el equipo captura sus datos al subir cada entrevista.
--
-- No borra ningun dato de entrevistas, sesiones ni participantes: solo
-- reescribe las policies y elimina el vinculo participante -> auth.users,
-- que deja de tener sentido.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Policies: lo que antes abria acceso al rol "participante" pasa a ser
--    exclusivo del equipo. Se dropean primero porque varias dependen de
--    participantes.user_id, la columna que se elimina al final.
-- -------------------------------------------------------------------------

drop policy if exists "participantes_select" on participantes;
drop policy if exists "participantes_insert" on participantes;

create policy "participantes_select" on participantes
  for select using (is_equipo());

create policy "participantes_insert" on participantes
  for insert with check (is_equipo());

-- El catalogo de sonidos ya no lo lee ningun participante.
drop policy if exists "sonidos_select" on sonidos;

create policy "sonidos_select" on sonidos
  for select using (is_equipo());

drop policy if exists "sesiones_select" on sesiones;
drop policy if exists "sesiones_insert" on sesiones;

create policy "sesiones_select" on sesiones
  for select using (is_equipo());

create policy "sesiones_insert" on sesiones
  for insert with check (is_equipo());

drop policy if exists "entrevistas_select" on entrevistas;
drop policy if exists "entrevistas_insert" on entrevistas;

create policy "entrevistas_select" on entrevistas
  for select using (is_equipo());

create policy "entrevistas_insert" on entrevistas
  for insert with check (is_equipo());

-- -------------------------------------------------------------------------
-- 2. Storage: subir audio deja de estar abierto a cualquier autenticado.
-- -------------------------------------------------------------------------

drop policy if exists "storage_audios_insert" on storage.objects;

create policy "storage_audios_insert" on storage.objects
  for insert with check (bucket_id = 'audios-entrevistas' and is_equipo());

-- -------------------------------------------------------------------------
-- 3. participantes.user_id ya no aplica: un participante no es un usuario.
--    Las filas de participantes se conservan intactas.
-- -------------------------------------------------------------------------

alter table participantes drop column if exists user_id;

-- =========================================================================
-- Despues de ejecutar este script:
--
-- 1. Ve a Authentication -> Users y borra las cuentas que no sean de Sara,
--    Juliana o Samuel. Con las policies de arriba ya no verian nada, pero
--    dejarlas activas no tiene ningun proposito.
-- 2. Verifica en Table Editor -> participantes que la columna user_id
--    desaparecio y que las filas siguen ahi.
-- =========================================================================
