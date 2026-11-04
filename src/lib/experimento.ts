/**
 * Constantes del diseño experimental. Son fijas, no se derivan de los datos:
 * los subgrupos y las fases existen aunque todavia no haya ningun registro,
 * asi que los filtros tienen que ofrecerlas igual.
 *
 * GRUPOS y FASES estan replicados como CHECK en la base (004_grupos_y_fases.sql).
 * Si cambian aqui, hay que cambiarlos alli tambien.
 */

import { normalizar } from "@/lib/documentos";

export const GRUPOS = ["A", "B", "C", "D"] as const;

export type Grupo = (typeof GRUPOS)[number];

export const FASES = ["1", "2"] as const;

export type Fase = (typeof FASES)[number];

/*
  La practica se midio con encuestas (Fase 1 y Fase 2) en la web
  practica-percepcion.vercel.app, no con entrevistas de voz. Las respuestas
  viven alla y en el Excel que se sube a Documentos, asi que esta cifra no se
  cuenta desde la base: se actualiza a mano si se aplican mas encuestas.
*/
export const ENCUESTAS = {
  completadas: 12,
  meta: 12,
  /** Dia en que se aplico la practica. */
  fecha: "2026-11-03",
  panel: "https://practica-percepcion.vercel.app/equipo",
} as const;

/** Categoria de documento con la que se guardan los audios de los grupos focales. */
export const CATEGORIA_GRUPO_FOCAL = "Grupo focal";

export type ClaveSesion = "gf1" | "gf2" | "general";

export interface SesionGrupoFocal {
  clave: ClaveSesion;
  /** Nombre con el que se sube el audio; tambien es el titulo de la tarjeta. */
  nombre: string;
  descripcion: string;
}

/** Los tres audios esperados: un grupo focal por mitad de la muestra y un cierre general. */
export const SESIONES_GRUPO_FOCAL: SesionGrupoFocal[] = [
  {
    clave: "gf1",
    nombre: "Grupo focal 1",
    descripcion: "P01, P02, P05, P07, P11 y P12",
  },
  {
    clave: "gf2",
    nombre: "Grupo focal 2",
    descripcion: "P03, P04, P06, P08, P09 y P10",
  },
  {
    clave: "general",
    nombre: "Grupo focal · General",
    descripcion: "Análisis general de los dos grupos focales",
  },
];

/**
 * A que sesion corresponde un audio, por su nombre. Se busca "general"
 * primero porque "General" puede venir junto a un numero ("General 1 y 2").
 */
export function sesionDe(nombre: string): ClaveSesion | null {
  const n = normalizar(nombre);
  if (n.includes("general")) return "general";
  if (/\b2\b/.test(n)) return "gf2";
  if (/\b1\b/.test(n)) return "gf1";
  return null;
}
