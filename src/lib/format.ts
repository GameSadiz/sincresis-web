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

const DOT_COLORS = ["bg-primary", "bg-danger", "bg-info", "bg-success", "bg-warning"];

export function dotColorFor(value: string): string {
  const sum = [...value].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return DOT_COLORS[sum % DOT_COLORS.length];
}
