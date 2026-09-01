/**
 * Constantes del diseño experimental. Son fijas, no se derivan de los datos:
 * los subgrupos y las fases existen aunque todavia no haya ninguna entrevista
 * registrada, asi que los filtros del dashboard tienen que ofrecerlas igual.
 *
 * Estos valores estan replicados como CHECK en la base (004_grupos_y_fases.sql).
 * Si cambian aqui, hay que cambiarlos alli tambien.
 */

export const GRUPOS = ["A", "B", "C", "D"] as const;

export type Grupo = (typeof GRUPOS)[number];

export const FASES = ["1", "2"] as const;

export type Fase = (typeof FASES)[number];

/** Opciones listas para un <select>. */
export const OPCIONES_GRUPO = GRUPOS.map((g) => ({ value: g, label: `Grupo ${g}` }));

export const OPCIONES_FASE = FASES.map((f) => ({ value: f, label: `Fase ${f}` }));
