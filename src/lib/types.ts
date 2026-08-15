export interface Sonido {
  id: string;
  nombre: string;
  variante: string;
  archivo_url: string | null;
}

export interface Participante {
  id: string;
  user_id: string | null;
  nombre: string;
  rol: "diseñador" | "general";
  grupo: string;
  created_at: string;
}

export interface Sesion {
  id: string;
  participante_id: string;
  sonido_id: string;
  fase: string;
  fecha: string;
}

export interface SesionConDetalle {
  id: string;
  fase: string;
  participante: { nombre: string; grupo: string } | null;
  sonido: { nombre: string; variante: string } | null;
}

export interface EntrevistaDashboard {
  id: string;
  duracion_segundos: number | null;
  transcripcion: string | null;
  created_at: string;
  sesion: {
    fase: string;
    participante: { nombre: string; grupo: string; rol: "diseñador" | "general" } | null;
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
