/**
 * Recuadro con la extension del archivo. Se prefiere el texto real sobre un
 * glifo generico: distingue un .docx de un .pdf sin que el usuario adivine.
 */
const COLORES: Record<string, string> = {
  pdf: "bg-danger-soft text-danger",
  doc: "bg-info-soft text-info",
  docx: "bg-info-soft text-info",
  xls: "bg-success-soft text-success",
  xlsx: "bg-success-soft text-success",
  csv: "bg-success-soft text-success",
  ppt: "bg-warning-soft text-warning",
  pptx: "bg-warning-soft text-warning",
  // Multimedia (imagen, audio, video) comparte el ambar del proyecto.
  jpg: "bg-primary-soft text-primary",
  jpeg: "bg-primary-soft text-primary",
  png: "bg-primary-soft text-primary",
  webp: "bg-primary-soft text-primary",
  gif: "bg-primary-soft text-primary",
  mp3: "bg-primary-soft text-primary",
  wav: "bg-primary-soft text-primary",
  m4a: "bg-primary-soft text-primary",
  webm: "bg-primary-soft text-primary",
};

export function extensionDe(nombre: string): string {
  const limpio = nombre.split("?")[0].split("/").pop() ?? "";
  const punto = limpio.lastIndexOf(".");
  if (punto === -1 || punto === limpio.length - 1) return "";
  return limpio.slice(punto + 1).toLowerCase();
}

interface IconoArchivoProps {
  /** Nombre o ruta del archivo; de ahi se deduce la extension. */
  nombre: string;
  className?: string;
}

export function IconoArchivo({ nombre, className = "" }: IconoArchivoProps) {
  const ext = extensionDe(nombre);
  const color = COLORES[ext] ?? "bg-foreground/[0.06] text-muted";

  return (
    <span
      aria-hidden
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight ${color} ${className}`}
    >
      {ext ? ext.slice(0, 4) : "···"}
    </span>
  );
}
