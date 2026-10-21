"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { formatFecha } from "@/lib/format";
import { CATEGORIAS, CATEGORIA_ACTA, tipoVista } from "@/lib/documentos";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IconoArchivo, extensionDe } from "@/components/icono-archivo";

interface DocumentoModalProps {
  documento: Documento;
  conFecha: boolean;
  onClose: () => void;
  onActualizado: (doc: Documento) => void;
  onEliminado: (id: string) => void;
}

export function DocumentoModal({
  documento,
  conFecha,
  onClose,
  onActualizado,
  onEliminado,
}: DocumentoModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);

  const [nombre, setNombre] = useState(documento.nombre);
  const [categoria, setCategoria] = useState(documento.categoria);
  const [fecha, setFecha] = useState(documento.fecha_documento ?? "");
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const vista = tipoVista(documento.archivo_url);
  const sucio =
    nombre.trim() !== documento.nombre ||
    categoria !== documento.categoria ||
    (conFecha && fecha !== (documento.fecha_documento ?? ""));

  useEffect(() => {
    let vigente = true;
    // Bucket privado: URL firmada de una hora para ver o descargar.
    createClient()
      .storage.from("documentos")
      .createSignedUrl(documento.archivo_url, 3600)
      .then(({ data, error: err }) => {
        if (!vigente) return;
        if (err || !data) setUrlError(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      vigente = false;
    };
  }, [documento.archivo_url]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function guardar() {
    if (!nombre.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    if (conFecha && categoria === CATEGORIA_ACTA && !fecha) {
      setError("Un acta necesita la fecha de la asesoría.");
      return;
    }
    setGuardando(true);
    setError(null);
    setOk(false);

    const cambios: Record<string, string | null> = { nombre: nombre.trim(), categoria };
    if (conFecha) cambios.fecha_documento = fecha || null;

    const { error: err } = await createClient()
      .from("documentos")
      .update(cambios)
      .eq("id", documento.id);

    setGuardando(false);
    if (err) {
      setError("No se pudieron guardar los cambios. Intenta de nuevo.");
      return;
    }
    setOk(true);
    onActualizado({
      ...documento,
      nombre: nombre.trim(),
      categoria,
      ...(conFecha ? { fecha_documento: fecha || null } : {}),
    });
  }

  async function eliminar() {
    setBorrando(true);
    setError(null);
    const supabase = createClient();

    // Primero la fila: si falla, el archivo sigue accesible desde la lista.
    const { error: err } = await supabase.from("documentos").delete().eq("id", documento.id);
    if (err) {
      setBorrando(false);
      setError("No se pudo eliminar el documento.");
      return;
    }
    await supabase.storage.from("documentos").remove([documento.archivo_url]);
    onEliminado(documento.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-documento"
        className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <IconoArchivo nombre={documento.archivo_url} />
          <div className="min-w-0 flex-1">
            <p id="titulo-documento" className="truncate text-sm font-semibold text-foreground">
              {documento.nombre}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              Subido por {documento.subido_por?.nombre ?? "—"} el {formatFecha(documento.fecha_subida)}
            </p>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.05] sm:inline-flex"
            >
              Descargar
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_280px]">
          {/* Vista previa */}
          <div className="flex min-h-[260px] items-center justify-center bg-background p-4 md:min-h-[420px]">
            {urlError ? (
              <p className="text-sm text-danger">No se pudo cargar el archivo.</p>
            ) : !url ? (
              <p className="text-sm text-muted">Cargando…</p>
            ) : vista === "pdf" ? (
              <iframe src={url} title={documento.nombre} className="h-[60vh] w-full rounded-lg border border-border bg-surface" />
            ) : vista === "imagen" ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal, no pasa por next/image.
              <img src={url} alt={documento.nombre} className="max-h-[60vh] max-w-full rounded-lg object-contain" />
            ) : vista === "audio" ? (
              <audio controls src={url} className="w-full" />
            ) : vista === "video" ? (
              <video controls src={url} className="max-h-[60vh] w-full rounded-lg" />
            ) : (
              <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                <IconoArchivo nombre={documento.archivo_url} className="h-14 w-14 text-xs" />
                <p className="text-sm font-medium text-foreground">
                  Vista previa no disponible para .{extensionDe(documento.archivo_url) || "archivo"}
                </p>
                <p className="text-xs text-muted">
                  Los documentos de Word se abren en tu computador para no enviar los datos de la investigación a servicios externos.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
                >
                  Descargar
                </a>
              </div>
            )}
          </div>

          {/* Detalles editables */}
          <div className="flex flex-col gap-4 border-t border-border p-5 md:border-l md:border-t-0">
            <Field label="Nombre" htmlFor="doc-nombre">
              <TextInput
                id="doc-nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setOk(false);
                }}
              />
            </Field>
            <Field label="Categoría" htmlFor="doc-categoria">
              <Select
                id="doc-categoria"
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  setOk(false);
                }}
              >
                {/* Conserva categorias viejas que ya no esten en la lista. */}
                {!(CATEGORIAS as readonly string[]).includes(categoria) && (
                  <option value={categoria}>{categoria}</option>
                )}
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            {conFecha && (
              <Field
                label={categoria === CATEGORIA_ACTA ? "Fecha de la asesoría" : "Fecha del documento"}
                htmlFor="doc-fecha"
              >
                <TextInput
                  id="doc-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setOk(false);
                  }}
                />
              </Field>
            )}

            {error && (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
            )}
            {ok && !sucio && <p className="text-xs text-success">Cambios guardados.</p>}

            <Button type="button" onClick={guardar} disabled={guardando || !sucio}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>

            <div className="mt-auto border-t border-border pt-4">
              {confirmarBorrado ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-foreground">
                    ¿Eliminar este documento? No se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmarBorrado(false)}
                      disabled={borrando}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-foreground/[0.05]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={eliminar}
                      disabled={borrando}
                      className="flex-1 rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {borrando ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarBorrado(true)}
                  className="text-xs font-semibold text-danger hover:underline"
                >
                  Eliminar documento
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
