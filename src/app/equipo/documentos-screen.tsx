"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CATEGORIAS = ["Avance", "Marco teórico", "Acta de asesoría", "Otro"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentosScreen({
  miembroId,
  miembroNombre,
  documentosIniciales,
}: {
  miembroId: string;
  miembroNombre: string;
  documentosIniciales: Documento[];
}) {
  const [documentos, setDocumentos] = useState(documentosIniciales);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ nombre?: string; categoria?: string; archivo?: string }>(
    {}
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);
  const archivoInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const next: typeof errors = {};
    if (!nombre.trim()) next.nombre = "Ponle un nombre al documento.";
    if (!categoria) next.categoria = "Selecciona una categoría.";
    if (!archivo) next.archivo = "Elige un archivo para subir.";
    setErrors(next);
    if (Object.keys(next).length > 0 || !archivo) return;

    setUploading(true);
    const supabase = createClient();
    const path = `${categoria}/${Date.now()}-${sanitizeFileName(archivo.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(path, archivo, { contentType: archivo.type || undefined });

    if (uploadError) {
      setSubmitError("No se pudo subir el archivo. Intenta de nuevo.");
      setUploading(false);
      return;
    }

    const { data: doc, error: insertError } = await supabase
      .from("documentos")
      .insert({
        subido_por: miembroId,
        nombre: nombre.trim(),
        categoria,
        archivo_url: path,
      })
      .select("id, nombre, categoria, archivo_url, fecha_subida")
      .single();

    if (insertError || !doc) {
      setSubmitError("El archivo se subió, pero no se pudo registrar. Avisa al equipo.");
      setUploading(false);
      return;
    }

    setDocumentos((prev) => [{ ...doc, subido_por: { nombre: miembroNombre } }, ...prev]);
    setNombre("");
    setCategoria("");
    setArchivo(null);
    if (archivoInputRef.current) archivoInputRef.current.value = "";
    setUploading(false);
  }

  async function handleDescargar(doc: Documento) {
    setDescargando(doc.id);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(doc.archivo_url, 60);

    setDescargando(null);
    if (error || !data) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        <p className="mt-1 text-sm text-muted">
          Avances, marco teórico y actas de asesoría del equipo.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-foreground">Subir documento</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <Field label="Archivo" htmlFor="archivo" error={errors.archivo}>
            <input
              id="archivo"
              ref={archivoInputRef}
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
            />
          </Field>

          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}

          <Button type="submit" disabled={uploading} className="sm:w-auto">
            {uploading ? "Subiendo…" : "Subir documento"}
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Ya subidos ({documentos.length})
          </h2>
        </div>

        {documentos.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted">Todavía no hay documentos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {documentos.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{doc.nombre}</p>
                  <p className="mt-1 text-xs text-muted">
                    {doc.subido_por?.nombre ?? "—"} · {formatFecha(doc.fecha_subida)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="primary">{doc.categoria}</Badge>
                  <button
                    type="button"
                    onClick={() => handleDescargar(doc)}
                    disabled={descargando === doc.id}
                    className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
                  >
                    {descargando === doc.id ? "…" : "Descargar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
