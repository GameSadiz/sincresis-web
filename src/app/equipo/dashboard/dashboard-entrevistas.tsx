"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { EntrevistaDashboard, ParticipanteOpcion, Sonido } from "@/lib/types";
import { formatDuracion, formatFecha } from "@/lib/format";
import { FASES, GRUPOS } from "@/lib/experimento";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NuevaEntrevista } from "./nueva-entrevista";
import { EntrevistaModal } from "./entrevista-modal";

/*
  Opciones de filtro fijas. Antes se derivaban de las entrevistas ya cargadas,
  lo que dejaba los desplegables vacios mientras no hubiera ni una registrada:
  los subgrupos y las fases existen por diseño experimental, no porque alguien
  haya subido datos.
*/
const OPCIONES_FILTRO_GRUPO = GRUPOS.map((g) => ({ value: g, label: g }));
const OPCIONES_FILTRO_FASE = FASES.map((f) => ({ value: f, label: f }));

const PERFIL_LABEL: Record<string, string> = {
  diseñador: "Diseñador gráfico",
  general: "No diseñador",
};

/**
 * Chip de identidad (grupo, fase, variante de sonido). Deliberadamente neutro:
 * la etiqueta ya dice cual es el valor, asi que el color no aportaria
 * informacion, y en esta tabla el verde y el naranja significan estado de
 * transcripcion. Un chip de color competiria con ese significado.
 */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </span>
  );
}

/**
 * Tarjeta de indicador. El numero va en tinta normal, no en el color del
 * estado: un punto al lado carga esa lectura. Y usa cifras proporcionales, no
 * tabulares, porque a este tamaño las tabulares se ven sueltas.
 */
function Indicador({
  etiqueta,
  valor,
  puntoClassName,
}: {
  etiqueta: string;
  valor: number;
  puntoClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5">
        {puntoClassName && (
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 rounded-full ${puntoClassName}`}
          />
        )}
        <p className="text-xs text-muted">{etiqueta}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold text-foreground">{valor}</p>
    </div>
  );
}

function FiltroSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className="w-full appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="todos">{placeholder}: Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {placeholder}: {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>
    </div>
  );
}

interface DashboardEntrevistasProps {
  entrevistasIniciales: EntrevistaDashboard[];
  participantes: ParticipanteOpcion[];
  sonidos: Sonido[];
}

export function DashboardEntrevistas({
  entrevistasIniciales,
  participantes,
  sonidos,
}: DashboardEntrevistasProps) {
  const [entrevistas, setEntrevistas] = useState(entrevistasIniciales);
  const [listaParticipantes, setListaParticipantes] = useState(participantes);
  const [formAbierto, setFormAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [sonido, setSonido] = useState("todos");
  const [fase, setFase] = useState("todos");
  const [perfil, setPerfil] = useState("todos");
  const [abiertaId, setAbiertaId] = useState<string | null>(null);

  // Se deriva de la lista para que el modal vea siempre el ultimo estado
  // guardado en lugar de una copia congelada al abrirlo.
  const abierta = entrevistas.find((e) => e.id === abiertaId) ?? null;

  // El filtro de sonido sale del catalogo, no de las entrevistas, por la
  // misma razon que los de grupo y fase.
  const sonidosDisponibles = useMemo(
    () =>
      sonidos
        .map((s) => `${s.nombre} · ${s.variante}`)
        .sort()
        .map((s) => ({ value: s, label: s })),
    [sonidos]
  );

  const filtradas = useMemo(() => {
    return entrevistas.filter((e) => {
      const p = e.sesion?.participante;
      const s = e.sesion?.sonido;
      const sonidoKey = s ? `${s.nombre} · ${s.variante}` : "";

      if (grupo !== "todos" && p?.grupo !== grupo) return false;
      if (sonido !== "todos" && sonidoKey !== sonido) return false;
      if (fase !== "todos" && e.sesion?.fase !== fase) return false;
      if (perfil !== "todos" && p?.rol !== perfil) return false;
      if (busqueda && !p?.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [entrevistas, grupo, sonido, fase, perfil, busqueda]);

  const transcritas = entrevistas.filter((e) => e.transcripcion).length;
  const pendientes = entrevistas.length - transcritas;
  const participantesUnicos = new Set(
    entrevistas.map((e) => e.sesion?.participante?.nombre).filter(Boolean)
  ).size;

  const hayFiltros =
    busqueda !== "" ||
    grupo !== "todos" ||
    sonido !== "todos" ||
    fase !== "todos" ||
    perfil !== "todos";

  function limpiarFiltros() {
    setBusqueda("");
    setGrupo("todos");
    setSonido("todos");
    setFase("todos");
    setPerfil("todos");
  }

  function handleCreada(
    entrevista: EntrevistaDashboard,
    participanteNuevo: ParticipanteOpcion | null
  ) {
    setEntrevistas((prev) => [entrevista, ...prev]);
    if (participanteNuevo) {
      setListaParticipantes((prev) =>
        [...prev, participanteNuevo].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
    }
  }

  function handleGuardada(id: string, transcripcion: string | null) {
    setEntrevistas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, transcripcion } : e))
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Entrevistas</h1>
          <p className="mt-1 text-sm text-muted">
            Registro de sesiones del experimento y sus transcripciones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAbierto((v) => !v)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          {formAbierto ? "Cancelar" : "+ Subir entrevista"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador etiqueta="Entrevistas" valor={entrevistas.length} />
        <Indicador
          etiqueta="Con transcripción"
          valor={transcritas}
          puntoClassName="bg-success"
        />
        <Indicador etiqueta="Pendientes" valor={pendientes} puntoClassName="bg-warning" />
        <Indicador etiqueta="Participantes" valor={participantesUnicos} />
      </div>

      {formAbierto && (
        <NuevaEntrevista
          participantes={listaParticipantes}
          sonidos={sonidos}
          onCreada={handleCreada}
        />
      )}

      {/* Los filtros van juntos en un bloque en vez de sueltos sobre el fondo. */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13 13l4 4" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar participante…"
              aria-label="Buscar participante"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <FiltroSelect
              value={grupo}
              onChange={setGrupo}
              options={OPCIONES_FILTRO_GRUPO}
              placeholder="Grupo"
            />
            <FiltroSelect
              value={sonido}
              onChange={setSonido}
              options={sonidosDisponibles}
              placeholder="Sonido"
            />
            <FiltroSelect
              value={fase}
              onChange={setFase}
              options={OPCIONES_FILTRO_FASE}
              placeholder="Fase"
            />
            <FiltroSelect
              value={perfil}
              onChange={setPerfil}
              options={[
                { value: "diseñador", label: "Diseñador gráfico" },
                { value: "general", label: "No diseñador" },
              ]}
              placeholder="Perfil"
            />
          </div>

          {hayFiltros && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-xs text-muted">
                {filtradas.length} de {entrevistas.length}{" "}
                {entrevistas.length === 1 ? "entrevista" : "entrevistas"}
              </p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        {filtradas.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">
            {entrevistas.length === 0
              ? "Todavía no hay entrevistas. Sube la primera grabación."
              : "No hay entrevistas que coincidan con estos filtros."}
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Participante</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Sonido</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Audio</th>
                <th className="px-4 py-3">Transcripción</th>
                <th className="w-8 px-4 py-3">
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtradas.map((e) => {
                const p = e.sesion?.participante;
                const s = e.sesion?.sonido;
                return (
                  <tr
                    key={e.id}
                    onClick={() => setAbiertaId(e.id)}
                    className="group cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                  >
                    {/* El perfil viaja bajo el nombre: era una columna entera
                        repitiendo el mismo par de valores. */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p?.nombre ?? "—"}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {p ? PERFIL_LABEL[p.rol] ?? p.rol : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip>{p?.grupo ?? "—"}</Chip>
                    </td>
                    <td className="px-4 py-3 text-foreground">{s?.variante ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Chip>{e.sesion?.fase ?? "—"}</Chip>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground">
                      {formatDuracion(e.duracion_segundos)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatFecha(e.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {e.audio_url ? (
                        <svg
                          className="h-4 w-4 text-muted"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-label="Tiene audio"
                          role="img"
                        >
                          <path d="M4 8v4M7 5.5v9M10 7v6M13 4.5v11M16 8v4" />
                        </svg>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      {e.transcripcion ? (
                        <p className="truncate text-muted">
                          {e.transcripcion.split("\n")[0]}
                        </p>
                      ) : (
                        <Badge tone="warning">Pendiente</Badge>
                      )}
                    </td>
                    {/* Señal de que la fila abre el detalle. */}
                    <td className="px-4 py-3">
                      <svg
                        className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M8 5l5 5-5 5" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {abierta && (
        <EntrevistaModal
          key={abierta.id}
          entrevista={abierta}
          onClose={() => setAbiertaId(null)}
          onGuardada={handleGuardada}
        />
      )}
    </main>
  );
}
