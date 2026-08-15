"use client";

import { useMemo, useState } from "react";
import type { EntrevistaDashboard } from "@/lib/types";
import { formatDuracion, formatFecha, dotColorFor } from "@/lib/format";
import { TextInput } from "@/components/ui/text-input";

const PERFIL_LABEL: Record<string, string> = {
  diseñador: "Diseñador gráfico",
  general: "No diseñador",
};

function Dot({ value }: { value: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColorFor(value)}`} />;
}

function FilterPill({
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <option value="todos">{placeholder}: Todos</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {placeholder}: {o.label}
        </option>
      ))}
    </select>
  );
}

export function DashboardEntrevistas({ entrevistas }: { entrevistas: EntrevistaDashboard[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [sonido, setSonido] = useState("todos");
  const [fase, setFase] = useState("todos");
  const [perfil, setPerfil] = useState("todos");
  const [abierta, setAbierta] = useState<EntrevistaDashboard | null>(null);

  const gruposDisponibles = useMemo(() => {
    const set = new Set(entrevistas.map((e) => e.sesion?.participante?.grupo).filter(Boolean));
    return [...set].sort().map((g) => ({ value: g as string, label: g as string }));
  }, [entrevistas]);

  const sonidosDisponibles = useMemo(() => {
    const set = new Set(
      entrevistas
        .map((e) =>
          e.sesion?.sonido ? `${e.sesion.sonido.nombre} · ${e.sesion.sonido.variante}` : null
        )
        .filter(Boolean)
    );
    return [...set].sort().map((s) => ({ value: s as string, label: s as string }));
  }, [entrevistas]);

  const fasesDisponibles = useMemo(() => {
    const set = new Set(entrevistas.map((e) => e.sesion?.fase).filter(Boolean));
    return [...set].sort().map((f) => ({ value: f as string, label: `Fase ${f}` }));
  }, [entrevistas]);

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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrevistas grabadas</h1>
          <p className="mt-1 text-sm text-muted">
            {filtradas.length} de {entrevistas.length} entrevista
            {entrevistas.length === 1 ? "" : "s"} registradas
          </p>
        </div>
        <TextInput
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar participante..."
          className="w-64"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill value={grupo} onChange={setGrupo} options={gruposDisponibles} placeholder="Grupo" />
        <FilterPill
          value={sonido}
          onChange={setSonido}
          options={sonidosDisponibles}
          placeholder="Sonido"
        />
        <FilterPill value={fase} onChange={setFase} options={fasesDisponibles} placeholder="Fase" />
        <FilterPill
          value={perfil}
          onChange={setPerfil}
          options={[
            { value: "diseñador", label: "Diseñador gráfico" },
            { value: "general", label: "No diseñador" },
          ]}
          placeholder="Perfil"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        {filtradas.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            No hay entrevistas que coincidan con estos filtros.
          </p>
        ) : (
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Participante</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Sonido</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Transcripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtradas.map((e) => {
                const p = e.sesion?.participante;
                const s = e.sesion?.sonido;
                return (
                  <tr
                    key={e.id}
                    onClick={() => e.transcripcion && setAbierta(e)}
                    className={e.transcripcion ? "cursor-pointer hover:bg-black/[0.02]" : ""}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{p?.nombre ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Dot value={p?.grupo ?? ""} />
                        {p?.grupo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Dot value={s?.variante ?? ""} />
                        {s?.variante ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{e.sesion?.fase ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {p ? PERFIL_LABEL[p.rol] ?? p.rol : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground">
                      {formatDuracion(e.duracion_segundos)}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatFecha(e.created_at)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-muted">
                      {e.transcripcion ? (
                        <span className="underline decoration-dotted underline-offset-2">
                          &quot;{e.transcripcion.split("\n")[0]}&quot;
                        </span>
                      ) : (
                        "Pendiente…"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setAbierta(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {abierta.sesion?.participante?.nombre ?? "Participante"}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Grupo {abierta.sesion?.participante?.grupo ?? "—"} · Fase{" "}
                  {abierta.sesion?.fase ?? "—"} · {formatDuracion(abierta.duracion_segundos)} ·{" "}
                  {formatFecha(abierta.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierta(null)}
                aria-label="Cerrar"
                className="shrink-0 text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {abierta.transcripcion}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
