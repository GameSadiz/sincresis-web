export function formatDuracion(segundos: number | null): string {
  if (segundos === null || segundos === undefined) return "—";
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea una fecha que puede venir como dia suelto (yyyy-mm-dd, columna
 * `date`) o como timestamp. El dia suelto se arma en hora local: new Date()
 * lo leeria como medianoche UTC y en Colombia saldria el dia anterior.
 */
export function formatFechaFlexible(valor: string): string {
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  const fecha = dia ? new Date(+dia[1], +dia[2] - 1, +dia[3]) : new Date(valor);
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Storage rechaza acentos y espacios en las rutas: los normaliza. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function formatTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
