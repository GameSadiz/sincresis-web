-- =========================================================================
-- 004 - Subgrupos A/B/C/D y fases 1/2
--
-- Hasta ahora participantes.grupo y sesiones.fase eran 'text' libre: el
-- formulario ofrecia las opciones correctas, pero nada impedia que entrara
-- otro valor desde el editor SQL o desde la API. Estos CHECK lo cierran.
--
-- Los mismos valores estan en src/lib/experimento.ts. Si cambian aqui,
-- cambialos alli tambien.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- =========================================================================


-- -------------------------------------------------------------------------
-- PASO 1 - VERIFICACION (ejecutalo primero)
--
-- Un CHECK se rechaza si alguna fila existente lo incumple. Esto lista las
-- que darian problema; si devuelve vacio, el PASO 2 pasa limpio.
-- -------------------------------------------------------------------------

select 'participantes' as tabla, id::text, grupo as valor_invalido
from participantes
where grupo not in ('A', 'B', 'C', 'D')

union all

select 'sesiones', id::text, fase
from sesiones
where fase not in ('1', '2');


-- -------------------------------------------------------------------------
-- PASO 2 - RESTRICCIONES
-- -------------------------------------------------------------------------

alter table participantes
  drop constraint if exists participantes_grupo_check;

alter table participantes
  add constraint participantes_grupo_check
  check (grupo in ('A', 'B', 'C', 'D'));

alter table sesiones
  drop constraint if exists sesiones_fase_check;

alter table sesiones
  add constraint sesiones_fase_check
  check (fase in ('1', '2'));


-- -------------------------------------------------------------------------
-- PASO 3 - COMPROBACION
-- -------------------------------------------------------------------------

select conname as restriccion, pg_get_constraintdef(oid) as definicion
from pg_constraint
where conname in ('participantes_grupo_check', 'sesiones_fase_check');
