-- =========================================================================
-- 005 - Fecha propia de cada documento
--
-- La lista mostraba solo fecha_subida, asi que un acta de agosto subida en
-- septiembre parecia de septiembre. fecha_documento guarda el dia que importa
-- (en un acta, el de la asesoria). Es opcional: si queda vacia, la app usa
-- fecha_subida.
--
-- La app ya funciona sin esta columna; al ejecutarla aparece el campo de
-- fecha en el formulario de subida y en el detalle de cada documento.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- =========================================================================

alter table documentos
  add column if not exists fecha_documento date;


-- -------------------------------------------------------------------------
-- OPCIONAL - Fechas de las actas ya subidas
--
-- Revisa los nombres con este select y ajusta los UPDATE si no coinciden.
-- (La fecha del acta 3 tambien se puede poner desde la app, en su detalle.)
-- -------------------------------------------------------------------------

select id, nombre, categoria, fecha_subida, fecha_documento
from documentos
where categoria = 'Acta de asesoría'
order by nombre;

update documentos set fecha_documento = '2026-08-14'
where categoria = 'Acta de asesoría' and nombre = 'Acta asesoría 1';

update documentos set fecha_documento = '2026-08-27'
where categoria = 'Acta de asesoría' and nombre = 'Acta asesoría 2';
