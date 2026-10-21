"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { formatFecha, formatFechaFlexible } from "@/lib/format";
import {
  CATEGORIA_ACTA,
  TONO_CATEGORIA,
  normalizar,
  ordenarDocumentos,
} from "@/lib/documentos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconoArchivo } from "@/components/icono-archivo";
import { SubirDocumentoModal } from "./subir-documento-modal";
import { DocumentoModal } from "./documento-modal";

const TODOS = "Todos";

function IconoDescarga({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5" />
      <path d="M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14" />
    </svg>
  );
}

/** Linea secundaria de cada fila: la fecha que importa primero, luego quien subio. */
function detalle(doc: Documento): string {
  const autor = doc.subido_por?.nombre ?? "—";
  if (doc.fecha_documento) {
    const etiqueta = doc.categoria === CATEGORIA_ACTA ? "Asesoría del" : "Fecha:";
    return `${etiqueta} ${formatFechaFlexible(doc.fecha_documento)} · subido por ${autor}`;
  }
  return `${autor} · ${formatFecha(doc.fecha_subida)}`;
}

export function DocumentosScreen({
  miembroId,
  miembroNombre,
  documentosIniciales,
  conFecha,
}: {
  miembroId: string;
  miembroNombre: string;
  documentosIniciales: Documento[];
  /** Si la columna fecha_documento ya existe (migracion 005). */
  conFecha: boolean;
}) {
  const [documentos, setDocumentos] = useState(() => ordenarDocumentos(documentosIniciales));
  const [filtro, setFiltro] = useState(TODOS);
  const [busqueda, setBusqueda] = useState("");

  // null = cerrado; { archivo } = abierto, con o sin archivo soltado.
  const [subida, setSubida] = useState<{ archivo: File | null } | null>(null);
  const [abierto, setAbierto] = useState<Documento | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);

  const [arrastrando, setArrastrando] = useState(false);
  const profundidad = useRef(0);

  /** Solo se muestran pestañas de categorias que tienen documentos. */
  const pestanas = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const d of documentos) conteo.set(d.categoria, (conteo.get(d.categoria) ?? 0) + 1);
    return [
      { categoria: TODOS, total: documentos.length },
      ...[...conteo.entries()].map(([categoria, total]) => ({ categoria, total })),
    ];
  }, [documentos]);

  // Si se borra el ultimo documento de una categoria, su pestaña desaparece
  // y el filtro vuelve solo a "Todos".
  const filtroActivo = pestanas.some((p) => p.categoria === filtro) ? filtro : TODOS;

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return documentos.filter(
      (d) =>
        (filtroActivo === TODOS || d.categoria === filtroActivo) &&
        (!q || normalizar(`${d.nombre} ${d.categoria}`).includes(q))
    );
  }, [documentos, filtroActivo, busqueda]);

  async function handleDescargar(doc: Documento) {
    setDescargando(doc.id);
    const { data, error } = await createClient()
      .storage.from("documentos")
      .createSignedUrl(doc.archivo_url, 60);
    setDescargando(null);
    if (error || !data) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  // Arrastrar un archivo sobre la lista abre el formulario con el archivo listo.
  // Se cuenta la profundidad porque dragenter/dragleave saltan en cada hijo.
  function onDragEnter(e: DragEvent) {
    if (!e.dataTransfer.types.includes("Files") || subida) return;
    profundidad.current += 1;
    setArrastrando(true);
  }
  function onDragLeave() {
    profundidad.current = Math.max(0, profundidad.current - 1);
    if (profundidad.current === 0) setArrastrando(false);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    profundidad.current = 0;
    setArrastrando(false);
    const archivo = e.dataTransfer.files?.[0];
    if (archivo && !subida) setSubida({ archivo });
  }

  return (
    <main
      className="relative min-h-screen w-full max-w-[1400px] px-4 py-10 sm:px-8 lg:px-12"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Documentos</h1>
          <p className="mt-1 text-sm text-muted">
            Avances, marco teórico y actas de asesoría del equipo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSubida({ archivo: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="M10 4v12M4 10h12" />
          </svg>
          Subir documento
        </button>
      </header>

      {documentos.length > 0 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filtrar por categoría" className="flex flex-wrap gap-1.5">
            {pestanas.map(({ categoria, total }) => {
              const activa = filtroActivo === categoria;
              return (
                <button
                  key={categoria}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setFiltro(categoria)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activa
                      ? "bg-foreground text-background"
                      : "bg-foreground/[0.05] text-foreground hover:bg-foreground/[0.09]"
                  }`}
                >
                  {categoria}
                  <span className={activa ? "opacity-70" : "text-muted"}>{total}</span>
                </button>
              );
            })}
          </div>

          <label className="relative block sm:w-64">
            <span className="sr-only">Buscar documentos</span>
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13 13l4 4" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
        </div>
      )}

      <section className="mt-4">
        {documentos.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-14 text-center">
            <svg className="h-8 w-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 3v5h5" />
              <path d="M6 3h8l5 5v13H6z" />
            </svg>
            <p className="text-sm font-medium text-foreground">Todavía no hay documentos</p>
            <p className="max-w-[22rem] text-xs text-muted">
              Arrastra un archivo a esta página o usa “Subir documento”.
            </p>
          </Card>
        ) : visibles.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">Ningún documento coincide</p>
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setFiltro(TODOS);
              }}
              className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Limpiar filtros
            </button>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0!">
            <ul className="divide-y divide-border">
              {visibles.map((doc) => (
                <li key={doc.id} className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-foreground/[0.03]">
                  <IconoArchivo nombre={doc.archivo_url} />

                  <div className="min-w-0 flex-1">
                    {/* El boton cubre toda la fila (after:inset-0) para abrir el detalle. */}
                    <button
                      type="button"
                      onClick={() => setAbierto(doc)}
                      className="block max-w-full truncate text-left text-sm font-medium text-foreground after:absolute after:inset-0 focus:outline-none focus-visible:underline"
                    >
                      {doc.nombre}
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted">{detalle(doc)}</p>
                  </div>

                  <div className="relative flex shrink-0 items-center gap-2">
                    <span className="hidden sm:inline">
                      <Badge tone={TONO_CATEGORIA[doc.categoria] ?? "neutral"}>{doc.categoria}</Badge>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDescargar(doc)}
                      disabled={descargando === doc.id}
                      aria-label={`Descargar ${doc.nombre}`}
                      title="Descargar"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-50"
                    >
                      <IconoDescarga className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {arrastrando && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-primary/10 p-6 backdrop-blur-[1px]">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-surface px-8 py-6 text-center shadow-xl">
            <p className="text-sm font-semibold text-foreground">Suelta para subir el archivo</p>
            <p className="mt-1 text-xs text-muted">Luego le pones nombre y categoría.</p>
          </div>
        </div>
      )}

      {subida && (
        <SubirDocumentoModal
          miembroId={miembroId}
          miembroNombre={miembroNombre}
          archivoInicial={subida.archivo}
          conFecha={conFecha}
          onClose={() => setSubida(null)}
          onSubido={(doc) => {
            setDocumentos((prev) => ordenarDocumentos([doc, ...prev]));
            setSubida(null);
          }}
        />
      )}

      {abierto && (
        <DocumentoModal
          documento={abierto}
          conFecha={conFecha}
          onClose={() => setAbierto(null)}
          onActualizado={(doc) => {
            setDocumentos((prev) => ordenarDocumentos(prev.map((d) => (d.id === doc.id ? doc : d))));
            setAbierto(doc);
          }}
          onEliminado={(id) => {
            setDocumentos((prev) => prev.filter((d) => d.id !== id));
            setAbierto(null);
          }}
        />
      )}
    </main>
  );
}
