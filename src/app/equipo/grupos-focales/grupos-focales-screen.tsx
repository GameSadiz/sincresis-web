"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Documento } from "@/lib/types";
import { formatFecha, formatFechaFlexible } from "@/lib/format";
import { normalizar, ordenarDocumentos } from "@/lib/documentos";
import {
  CATEGORIA_GRUPO_FOCAL,
  ENCUESTAS,
  SESIONES_GRUPO_FOCAL,
  sesionDe,
  type SesionGrupoFocal,
} from "@/lib/experimento";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { extensionDe } from "@/components/icono-archivo";
import { SubirDocumentoModal } from "../subir-documento-modal";
import { DocumentoModal } from "../documento-modal";

/** Reproductor con URL firmada: el bucket es privado. */
function AudioFirmado({ ruta }: { ruta: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    createClient()
      .storage.from("documentos")
      .createSignedUrl(ruta, 3600)
      .then(({ data, error: err }) => {
        if (!vigente) return;
        if (err || !data) setError(true);
        else setUrl(data.signedUrl);
      });
    return () => {
      vigente = false;
    };
  }, [ruta]);

  if (error) return <p className="text-xs text-danger">No se pudo cargar el audio.</p>;
  if (!url) return <div className="h-10 animate-pulse rounded-lg bg-foreground/[0.06]" />;
  return <audio controls preload="none" src={url} className="w-full" />;
}

/** El Excel de la practica que el equipo sube a Documentos. */
function esExcelDeEncuestas(doc: Documento): boolean {
  const ext = extensionDe(doc.archivo_url);
  if (ext !== "xlsx" && ext !== "xls" && ext !== "csv") return false;
  const n = normalizar(`${doc.nombre} ${doc.archivo_url}`);
  return n.includes("respuesta") || n.includes("practica") || n.includes("encuesta");
}

function lineaDetalle(doc: Documento): string {
  const autor = doc.subido_por?.nombre ?? "—";
  const fecha = doc.fecha_documento
    ? formatFechaFlexible(doc.fecha_documento)
    : formatFecha(doc.fecha_subida);
  return `${autor} · ${fecha}`;
}

function TarjetaSesion({
  sesion,
  audio,
  onSubir,
  onAbrir,
}: {
  sesion: SesionGrupoFocal;
  audio: Documento | undefined;
  onSubir: () => void;
  onAbrir: (doc: Documento) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{sesion.nombre}</h2>
          <p className="mt-0.5 text-xs text-muted">{sesion.descripcion}</p>
        </div>
        <Badge tone={audio ? "success" : "neutral"}>{audio ? "Audio subido" : "Pendiente"}</Badge>
      </div>

      {audio ? (
        <>
          <AudioFirmado ruta={audio.archivo_url} />
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs text-muted">{lineaDetalle(audio)}</p>
            <button
              type="button"
              onClick={() => onAbrir(audio)}
              className="shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Detalles
            </button>
          </div>
        </>
      ) : (
        <Button type="button" variant="secondary" onClick={onSubir} className="mt-auto">
          Subir audio
        </Button>
      )}
    </Card>
  );
}

export function GruposFocalesScreen({
  miembroId,
  miembroNombre,
  documentosIniciales,
  conFecha,
}: {
  miembroId: string;
  miembroNombre: string;
  documentosIniciales: Documento[];
  conFecha: boolean;
}) {
  const [documentos, setDocumentos] = useState(documentosIniciales);
  const [subiendo, setSubiendo] = useState<SesionGrupoFocal | null>(null);
  const [abierto, setAbierto] = useState<Documento | null>(null);

  const { porSesion, otros, excel } = useMemo(() => {
    const audios = ordenarDocumentos(
      documentos.filter((d) => d.categoria === CATEGORIA_GRUPO_FOCAL)
    );
    const mapa = new Map<string, Documento>();
    const sueltos: Documento[] = [];
    for (const doc of audios) {
      const clave = sesionDe(doc.nombre);
      // El mas reciente gana; uno repetido queda en "Otros archivos".
      if (clave && !mapa.has(clave)) mapa.set(clave, doc);
      else sueltos.push(doc);
    }
    return {
      porSesion: mapa,
      otros: sueltos,
      excel: ordenarDocumentos(documentos).find(esExcelDeEncuestas),
    };
  }, [documentos]);

  const subidos = SESIONES_GRUPO_FOCAL.filter((s) => porSesion.has(s.clave)).length;

  return (
    <main className="flex w-full max-w-[1200px] flex-col gap-6 px-4 py-10 sm:px-8 lg:px-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Grupos focales</h1>
        <p className="mt-1 text-sm text-muted">
          Resultados de las encuestas de la práctica y audios de los grupos focales.
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="whitespace-nowrap font-semibold tabular-nums text-foreground">
            <span className="text-3xl">{ENCUESTAS.completadas}</span>
            <span className="text-sm font-normal text-muted"> / {ENCUESTAS.meta}</span>
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Encuestas completadas</p>
            <p className="mt-0.5 text-xs text-muted">
              Fase 1 y Fase 2 de los 12 participantes · aplicadas el{" "}
              {formatFechaFlexible(ENCUESTAS.fecha)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {excel && (
            <button
              type="button"
              onClick={() => setAbierto(excel)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
            >
              Ver Excel de respuestas
            </button>
          )}
          <a
            href={ENCUESTAS.panel}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.04]"
          >
            Panel de la práctica ↗
          </a>
        </div>
      </Card>

      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Audios</h2>
        <p className="text-xs text-muted">
          {subidos} de {SESIONES_GRUPO_FOCAL.length} subidos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {SESIONES_GRUPO_FOCAL.map((s) => (
          <TarjetaSesion
            key={s.clave}
            sesion={s}
            audio={porSesion.get(s.clave)}
            onSubir={() => setSubiendo(s)}
            onAbrir={setAbierto}
          />
        ))}
      </div>

      {otros.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Otros archivos de grupos focales</h2>
          <ul className="mt-3 divide-y divide-border">
            {otros.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{d.nombre}</p>
                  <p className="text-xs text-muted">{lineaDetalle(d)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAbierto(d)}
                  className="shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Abrir
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {subiendo && (
        <SubirDocumentoModal
          miembroId={miembroId}
          miembroNombre={miembroNombre}
          archivoInicial={null}
          conFecha={conFecha}
          titulo={`Subir audio · ${subiendo.nombre}`}
          nombreInicial={subiendo.nombre}
          categoriaInicial={CATEGORIA_GRUPO_FOCAL}
          onClose={() => setSubiendo(null)}
          onSubido={(doc) => {
            setDocumentos((prev) => [doc, ...prev]);
            setSubiendo(null);
          }}
        />
      )}

      {abierto && (
        <DocumentoModal
          documento={abierto}
          conFecha={conFecha}
          onClose={() => setAbierto(null)}
          onActualizado={(doc) => {
            setDocumentos((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
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
