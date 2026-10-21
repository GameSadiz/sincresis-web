import type { BadgeTone } from "@/components/ui/badge";
import type { Documento } from "@/lib/types";
import { extensionDe } from "@/components/icono-archivo";

export const CATEGORIAS = ["Avance", "Marco teórico", "Acta de asesoría", "Otro"] as const;

export const CATEGORIA_ACTA = "Acta de asesoría";

/** Cada categoria con su tono, para poder escanear la lista de un vistazo. */
export const TONO_CATEGORIA: Record<string, BadgeTone> = {
  Avance: "primary",
  "Marco teórico": "info",
  "Acta de asesoría": "success",
  Otro: "neutral",
};

/**
 * Fecha con la que se ordena y se muestra un documento. Para un acta importa
 * el dia de la asesoria, no el dia en que alguien la subio: si no, dos actas
 * de agosto subidas el mismo dia de septiembre parecen de septiembre.
 */
export function fechaReferencia(doc: Documento): string {
  return doc.fecha_documento ?? doc.fecha_subida;
}

export function ordenarDocumentos(docs: Documento[]): Documento[] {
  return [...docs].sort((a, b) =>
    fechaReferencia(b).localeCompare(fechaReferencia(a))
  );
}

/** Quita acentos y mayusculas para que "teorico" encuentre "teórico". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export type TipoVista = "pdf" | "imagen" | "audio" | "video" | "ninguna";

/** Que formatos se pueden ver dentro del navegador sin mandar el archivo a terceros. */
export function tipoVista(ruta: string): TipoVista {
  const ext = extensionDe(ruta);
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "imagen";
  if (["mp3", "wav", "m4a", "ogg", "aac"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return "ninguna";
}
