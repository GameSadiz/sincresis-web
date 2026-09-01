"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { formatFecha, sanitizeFileName } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ZonaArchivo } from "@/components/ui/zona-archivo";
import { IconoArchivo } from "@/components/icono-archivo";

const CATEGORIAS = ["Avance", "Marco teórico", "Acta de asesoría", "Otro"];

/** Cada categoria con su tono, para poder escanear la lista de un vistazo. */
const TONO_CATEGORIA: Record<string, BadgeTone> = {
  Avance: "primary",
  "Marco teórico": "info",
  "Acta de asesoría": "success",
  Otro: "neutral",
};

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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Documentos</h1>
        <p className="mt-1 text-sm text-muted">
          Avances, marco teórico y actas de asesoría del equipo.
        </p>
      </header>

      {/*
        La lista es el contenido principal: es lo que el equipo consulta a
        diario. Subir es una accion puntual, asi que va al panel lateral.
      */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">Todos los documentos</h2>
            <span className="text-xs text-muted">
              {documentos.length} {documentos.length === 1 ? "documento" : "documentos"}
            </span>
          </div>

          {documentos.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 py-14 text-center">
              <svg
                className="h-8 w-8 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 3v5h5" />
                <path d="M6 3h8l5 5v13H6z" />
              </svg>
              <p className="text-sm font-medium text-foreground">Todavía no hay documentos</p>
              <p className="max-w-[22rem] text-xs text-muted">
                El primero que subas aparecerá aquí, con su categoría y quién lo cargó.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <ul className="divide-y divide-border">
                {documentos.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-foreground/[0.03]"
                  >
                    <IconoArchivo nombre={doc.archivo_url} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doc.nombre}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {doc.subido_por?.nombre ?? "—"} · {formatFecha(doc.fecha_subida)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden sm:inline">
                        <Badge tone={TONO_CATEGORIA[doc.categoria] ?? "neutral"}>
                          {doc.categoria}
                        </Badge>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDescargar(doc)}
                        disabled={descargando === doc.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.05] disabled:opacity-50"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5" />
                          <path d="M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14" />
                        </svg>
                        {descargando === doc.id ? "Abriendo…" : "Descargar"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        {/* El panel acompaña el scroll de la lista en pantallas grandes. */}
        <aside className="lg:sticky lg:top-6">
          <Card>
            <h2 className="text-sm font-semibold text-foreground">Subir documento</h2>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
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

              <Field label="Archivo" htmlFor="archivo" error={errors.archivo}>
                <ZonaArchivo
                  id="archivo"
                  archivo={archivo}
                  onArchivo={setArchivo}
                  invalid={Boolean(errors.archivo)}
                />
              </Field>

              {submitError && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                  {submitError}
                </p>
              )}

              <Button type="submit" disabled={uploading}>
                {uploading ? "Subiendo…" : "Subir documento"}
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </main>
  );
}
