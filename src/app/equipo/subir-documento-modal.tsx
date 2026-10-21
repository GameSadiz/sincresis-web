"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { sanitizeFileName } from "@/lib/format";
import { CATEGORIAS, CATEGORIA_ACTA } from "@/lib/documentos";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ZonaArchivo } from "@/components/ui/zona-archivo";

interface SubirDocumentoModalProps {
  miembroId: string;
  miembroNombre: string;
  /** Archivo soltado sobre la lista antes de abrir el modal. */
  archivoInicial: File | null;
  /** Falso mientras no se haya ejecutado la migracion 005 en Supabase. */
  conFecha: boolean;
  onClose: () => void;
  onSubido: (doc: Documento) => void;
}

/** Nombre sugerido a partir del archivo: sin extension ni guiones bajos. */
function nombreSugerido(archivo: File | null): string {
  if (!archivo) return "";
  return archivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export function SubirDocumentoModal({
  miembroId,
  miembroNombre,
  archivoInicial,
  conFecha,
  onClose,
  onSubido,
}: SubirDocumentoModalProps) {
  const [nombre, setNombre] = useState(() => nombreSugerido(archivoInicial));
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [archivo, setArchivo] = useState<File | null>(archivoInicial);
  const [errors, setErrors] = useState<{
    nombre?: string;
    categoria?: string;
    fecha?: string;
    archivo?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const esActa = categoria === CATEGORIA_ACTA;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !uploading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, uploading]);

  function elegirArchivo(nuevo: File | null) {
    setArchivo(nuevo);
    // Solo se autocompleta si el usuario aun no escribio un nombre propio.
    if (nuevo && !nombre.trim()) setNombre(nombreSugerido(nuevo));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const next: typeof errors = {};
    if (!nombre.trim()) next.nombre = "Ponle un nombre al documento.";
    if (!categoria) next.categoria = "Selecciona una categoría.";
    if (conFecha && esActa && !fecha) next.fecha = "Indica el día de la asesoría.";
    if (!archivo) next.archivo = "Elige un archivo para subir.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !archivo) return;

    setUploading(true);
    const supabase = createClient();
    const path = `${sanitizeFileName(categoria)}/${Date.now()}-${sanitizeFileName(archivo.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(path, archivo, { contentType: archivo.type || undefined });

    if (uploadError) {
      setSubmitError("No se pudo subir el archivo. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const fila: Record<string, string | null> = {
      subido_por: miembroId,
      nombre: nombre.trim(),
      categoria,
      archivo_url: path,
    };
    if (conFecha) fila.fecha_documento = fecha || null;

    const columnas = conFecha
      ? "id, nombre, categoria, archivo_url, fecha_subida, fecha_documento"
      : "id, nombre, categoria, archivo_url, fecha_subida";

    const { data: doc, error: insertError } = await supabase
      .from("documentos")
      .insert(fila)
      .select(columnas)
      .single();

    if (insertError || !doc) {
      // Sin fila no hay forma de llegar al archivo: se limpia para no dejar huerfanos.
      await supabase.storage.from("documentos").remove([path]);
      setSubmitError("No se pudo registrar el documento. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    onSubido({
      ...(doc as unknown as Omit<Documento, "subido_por">),
      subido_por: { nombre: miembroNombre },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={() => !uploading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-subir"
        className="flex max-h-full w-full max-w-md flex-col rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id="titulo-subir" className="text-sm font-semibold text-foreground">
            Subir documento
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <Field label="Archivo" htmlFor="archivo" error={errors.archivo}>
            <ZonaArchivo
              id="archivo"
              archivo={archivo}
              onArchivo={elegirArchivo}
              invalid={Boolean(errors.archivo)}
            />
          </Field>

          <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
            <TextInput
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Avance capítulo 2"
              invalid={Boolean(errors.nombre)}
            />
          </Field>

          <Field label="Categoría" htmlFor="categoria" error={errors.categoria}>
            <Select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              invalid={Boolean(errors.categoria)}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          {conFecha && (
            <Field
              label={esActa ? "Fecha de la asesoría" : "Fecha del documento (opcional)"}
              htmlFor="fecha"
              error={errors.fecha}
            >
              <TextInput
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                invalid={Boolean(errors.fecha)}
              />
            </Field>
          )}

          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{submitError}</p>
          )}

          <div className="mt-1 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Subiendo…" : "Subir"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
