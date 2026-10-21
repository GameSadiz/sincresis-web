"use client";

import type { ReactNode } from "react";
import type { Documento } from "@/lib/types";
import { formatFechaFlexible } from "@/lib/format";
import { CATEGORIA_ACTA, fechaReferencia } from "@/lib/documentos";
import { Card } from "@/components/ui/card";
import { IconoArchivo } from "@/components/icono-archivo";

/** Dias enteros entre dos fechas (yyyy-mm-dd o ISO), sin importar la hora. */
function diasEntre(a: string, b: string): number {
  const dia = (v: string) => {
    const [y, m, d] = v.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((dia(b) - dia(a)) / 86_400_000);
}

function hace(valor: string): string {
  const hoy = new Date();
  const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const n = diasEntre(valor.length > 10 ? new Date(valor).toLocaleDateString("en-CA") : valor, iso);
  if (n <= 0) return "hoy";
  if (n === 1) return "ayer";
  if (n < 30) return `hace ${n} días`;
  const meses = Math.round(n / 30);
  return meses === 1 ? "hace un mes" : `hace ${meses} meses`;
}

function Dato({
  etiqueta,
  valor,
  detalle,
  acento,
}: {
  etiqueta: string;
  valor: ReactNode;
  detalle?: ReactNode;
  acento?: string;
}) {
  return (
    <Card className="p-5!">
      <p className="flex items-center gap-2 text-xs font-medium text-muted">
        {acento && <span className={`h-2 w-2 rounded-full ${acento}`} aria-hidden />}
        {etiqueta}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{valor}</p>
      {detalle && <p className="mt-1 truncate text-xs text-muted">{detalle}</p>}
    </Card>
  );
}

/** Franja de cifras: lo que el equipo quiere saber antes de leer la lista. */
export function ResumenDocumentos({ documentos }: { documentos: Documento[] }) {
  const actas = documentos.filter((d) => d.categoria === CATEGORIA_ACTA);
  const ultimaActa = actas.map(fechaReferencia).sort().at(-1);
  const avances = documentos.filter((d) => d.categoria === "Avance").length;
  const teoria = documentos.filter((d) => d.categoria === "Marco teórico").length;
  const ultimaSubida = [...documentos].sort((a, b) =>
    b.fecha_subida.localeCompare(a.fecha_subida),
  )[0];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Dato
        etiqueta="Asesorías registradas"
        acento="bg-success"
        valor={actas.length}
        detalle={ultimaActa ? `Última: ${formatFechaFlexible(ultimaActa)}` : "Aún sin actas"}
      />
      <Dato
        etiqueta="Avances"
        acento="bg-primary"
        valor={avances}
        detalle={avances === 1 ? "documento de avance" : "documentos de avance"}
      />
      <Dato
        etiqueta="Marco teórico"
        acento="bg-info"
        valor={teoria}
        detalle={teoria === 0 ? "Sube lecturas y fichas aquí" : "documentos de referencia"}
      />
      <Dato
        etiqueta="Última actualización"
        valor={ultimaSubida ? hace(ultimaSubida.fecha_subida) : "—"}
        detalle={
          ultimaSubida
            ? `${ultimaSubida.nombre} · ${ultimaSubida.subido_por?.nombre ?? "—"}`
            : "Todavía no hay documentos"
        }
      />
    </div>
  );
}

/** Cronologia de las asesorias a partir de las actas, la mas antigua arriba. */
export function LineaAsesorias({
  documentos,
  onAbrir,
}: {
  documentos: Documento[];
  onAbrir: (doc: Documento) => void;
}) {
  const actas = documentos
    .filter((d) => d.categoria === CATEGORIA_ACTA)
    .sort((a, b) => fechaReferencia(a).localeCompare(fechaReferencia(b)));

  return (
    <Card className="p-5!">
      <h2 className="text-sm font-semibold text-foreground">Línea de asesorías</h2>
      {actas.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          Cuando subas un acta de asesoría con su fecha, aparecerá aquí.
        </p>
      ) : (
        <ol className="mt-4">
          {actas.map((acta, i) => {
            const anterior = actas[i - 1];
            const sinFecha = !acta.fecha_documento;
            const ultima = i === actas.length - 1;
            return (
              <li key={acta.id} className="relative flex gap-3 pb-4 last:pb-0">
                {/* Riel vertical entre puntos. */}
                {!ultima && (
                  <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-border" />
                )}
                <span
                  aria-hidden
                  className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                    ultima ? "border-success bg-success" : "border-success bg-surface"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onAbrir(acta)}
                  className="-mx-2 -my-1 min-w-0 flex-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-foreground/[0.04]"
                >
                  <p className="truncate text-sm font-medium text-foreground">{acta.nombre}</p>
                  <p className="text-xs text-muted">
                    {sinFecha ? (
                      <span className="text-warning">Sin fecha de asesoría · ponla aquí</span>
                    ) : (
                      <>
                        {formatFechaFlexible(acta.fecha_documento!)}
                        {anterior?.fecha_documento &&
                          ` · ${diasEntre(anterior.fecha_documento, acta.fecha_documento!)} días después`}
                      </>
                    )}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/** Ultimos archivos subidos, para ver que cambio sin revisar toda la lista. */
export function ActividadReciente({
  documentos,
  onAbrir,
}: {
  documentos: Documento[];
  onAbrir: (doc: Documento) => void;
}) {
  const recientes = [...documentos]
    .sort((a, b) => b.fecha_subida.localeCompare(a.fecha_subida))
    .slice(0, 4);

  if (recientes.length === 0) return null;

  return (
    <Card className="p-5!">
      <h2 className="text-sm font-semibold text-foreground">Subidos recientemente</h2>
      <ul className="mt-3 flex flex-col gap-1">
        {recientes.map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => onAbrir(doc)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
            >
              <IconoArchivo nombre={doc.archivo_url} className="h-8 w-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{doc.nombre}</span>
                <span className="block text-xs text-muted">
                  {doc.subido_por?.nombre ?? "—"} · {hace(doc.fecha_subida)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Atajo visible para subir: recuerda que se puede arrastrar a la pagina. */
export function AtajoSubida({ onSubir }: { onSubir: () => void }) {
  return (
    <button
      type="button"
      onClick={onSubir}
      className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-soft/40"
    >
      <svg
        className="h-6 w-6 text-muted"
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
      <span className="text-sm font-medium text-foreground">Arrastra archivos a la página</span>
      <span className="text-xs text-muted">
        o <span className="font-semibold text-primary">selecciónalos desde tu computador</span>
      </span>
    </button>
  );
}
