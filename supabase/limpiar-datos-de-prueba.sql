-- =========================================================================
-- Limpieza de datos de prueba - Proyecto Sincresis
--
-- ESTO NO ES UNA MIGRACION. No lleva prefijo numerico a proposito: no debe
-- ejecutarse como parte de la secuencia de migraciones ni en un despliegue.
-- Es un script manual, destructivo e IRREVERSIBLE.
--
-- Borra:   entrevistas, sesiones y participantes
-- Conserva: sonidos, documentos, miembros_equipo y las cuentas de auth
--
-- OJO: los archivos de audio NO se borran con esto. Viven en el bucket
-- 'audios-entrevistas' de Storage y quedaran huerfanos. Para eliminarlos:
-- Supabase Dashboard -> Storage -> audios-entrevistas -> seleccionar todo
-- -> Delete.
--
-- Uso: Supabase Dashboard -> SQL Editor. Ejecuta el PASO 1, revisa lo que
-- devuelve, y solo entonces ejecuta el PASO 2.
-- =========================================================================


-- -------------------------------------------------------------------------
-- PASO 1 - VERIFICACION (no borra nada, ejecutalo primero)
-- -------------------------------------------------------------------------

-- Cuanto hay hoy en cada tabla.
select 'entrevistas      (SE BORRA)' as tabla, count(*) as filas from entrevistas
union all select 'sesiones         (SE BORRA)', count(*) from sesiones
union all select 'participantes    (SE BORRA)', count(*) from participantes
union all select 'sonidos          (se conserva)', count(*) from sonidos
union all select 'documentos       (se conserva)', count(*) from documentos
union all select 'miembros_equipo  (se conserva)', count(*) from miembros_equipo
order by tabla;

-- Los participantes que van a desaparecer. Revisa esta lista: si alguno es
-- un participante real que quieres conservar, avisa antes de seguir.
select nombre, rol, grupo, created_at
from participantes
order by created_at;


-- -------------------------------------------------------------------------
-- PASO 2 - BORRADO (irreversible)
--
-- Va dentro de una transaccion: si cualquiera de los tres DELETE falla, no
-- se aplica ninguno y la base queda como estaba.
--
-- El orden importa. La cascada del esquema va de sesiones hacia entrevistas
-- (entrevistas.sesion_id ... on delete cascade), nunca al reves, asi que hay
-- que borrar de la hoja hacia la raiz: primero entrevistas, luego sesiones y
-- al final participantes.
-- -------------------------------------------------------------------------

begin;

delete from entrevistas;
delete from sesiones;
delete from participantes;

commit;


-- -------------------------------------------------------------------------
-- PASO 3 - COMPROBACION (deberia devolver 0 en las tres)
-- -------------------------------------------------------------------------

select 'entrevistas' as tabla, count(*) as quedan from entrevistas
union all select 'sesiones', count(*) from sesiones
union all select 'participantes', count(*) from participantes
order by tabla;
