export interface Sonido {
  id: string;
  nombre: string;
  variante: string;
  archivo_url: string | null;
}

export type RolParticipante = "diseñador" | "general";

/**
 * Sujeto del experimento. No es un usuario de la app: el equipo captura
 * sus datos al registrar la entrevista.
 */
export interface Participante {
  id: string;
  nombre: string;
  rol: RolParticipante;
  grupo: string;
  created_at: string;
}

export type ParticipanteOpcion = Pick<Participante, "id" | "nombre" | "rol" | "grupo">;

export interface Sesion {
  id: string;
  participante_id: string;
  sonido_id: string;
  fase: string;
  fecha: string;
}

export interface EntrevistaDashboard {
  id: string;
  audio_url: string | null;
  duracion_segundos: number | null;
  transcripcion: string | null;
  created_at: string;
  sesion: {
    fase: string;
    participante: { nombre: string; grupo: string; rol: RolParticipante } | null;
    sonido: { nombre: string; variante: string } | null;
  } | null;
}

export interface Documento {
  id: string;
  nombre: string;
  categoria: string;
  archivo_url: string;
  fecha_subida: string;
  subido_por: { nombre: string } | null;
}
