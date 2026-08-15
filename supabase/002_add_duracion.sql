-- Ejecutar en el SQL Editor de Supabase (una sola vez).
-- Agrega la duracion de cada entrevista, necesaria para el dashboard
-- del equipo (columna "Duracion").

alter table entrevistas
  add column if not exists duracion_segundos integer;
