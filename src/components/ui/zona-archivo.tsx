"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { IconoArchivo } from "@/components/icono-archivo";
import { formatTamano } from "@/lib/format";

interface ZonaArchivoProps {
  id: string;
  archivo: File | null;
  onArchivo: (archivo: File | null) => void;
  invalid?: boolean;
}

export function ZonaArchivo({
  id,
  archivo,
  onArchivo,
  invalid = false,
}: ZonaArchivoProps) {
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuando el padre limpia el archivo (tras subirlo), hay que limpiar tambien
  // el input: si conserva el valor anterior, volver a elegir el mismo archivo
  // no dispara onChange.
  useEffect(() => {
    if (!archivo && inputRef.current) inputRef.current.value = "";
  }, [archivo]);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastrando(false);
    const soltado = e.dataTransfer.files?.[0];
    if (soltado) onArchivo(soltado);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setArrastrando(true)}
      onDragLeave={(e) => {
        // dragleave tambien se dispara al pasar sobre los hijos: solo cuenta
        // si el puntero salio de verdad del contenedor.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setArrastrando(false);
        }
      }}
      onDrop={handleDrop}
    >
      <input
        id={id}
        ref={inputRef}
        type="file"
        className="peer sr-only"
        onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
      />

      {archivo ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <IconoArchivo nombre={archivo.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{archivo.name}</p>
            <p className="mt-0.5 text-xs text-muted">{formatTamano(archivo.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onArchivo(null)}
            aria-label="Quitar archivo"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 ${
            arrastrando
              ? "border-primary bg-primary-soft"
              : invalid
                ? "border-danger bg-surface hover:border-primary"
                : "border-border bg-surface hover:border-primary hover:bg-primary-soft/40"
          }`}
        >
          <svg
            className={`h-6 w-6 ${arrastrando ? "text-primary" : "text-muted"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16V4m0 0L8 8m4-4l4 4" />
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span className="text-sm font-medium text-foreground">
            {arrastrando ? "Suelta el archivo aquí" : "Arrastra un archivo"}
          </span>
          <span className="text-xs text-muted">
            o <span className="font-semibold text-primary">búscalo en tu equipo</span>
          </span>
        </label>
      )}
    </div>
  );
}
