"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDuracion, formatFecha } from "@/lib/format";
import type { EntrevistaDashboard } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EntrevistaModalProps {
  entrevista: EntrevistaDashboard;
  onClose: () => void;
  onGuardada: (id: string, transcripcion: string | null) => void;
}

export function EntrevistaModal({ entrevista, onClose, onGuardada }: EntrevistaModalProps) {
  const [texto, setTexto] = useState(entrevista.transcripcion ?? "");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const sucio = texto.trim() !== (entrevista.transcripcion ?? "").trim();

  useEffect(() => {
    const path = entrevista.audio_url;
    if (!path) return;

    let vigente = true;

    // El audio vive en un bucket privado: se pide una URL firmada de una
    // hora, suficiente para escucharlo o descargarlo sin exponer el bucket.
    createClient()
      .storage.from("audios-entrevistas")
      .createSignedUrl(path, 3600)
      .then(({ data, error: err }) => {
        if (!vigente) return;
        if (err || !data) setAudioError(true);
        else setAudioUrl(data.signedUrl);
      });

    return () => {
      vigente = false;
    };
  }, [entrevista.audio_url]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setOk(false);

    const limpio = texto.trim();
    const valor = limpio || null;

    const { error: updateError } = await createClient()
      .from("entrevistas")
      .update({ transcripcion: valor })
      .eq("id", entrevista.id);

    setGuardando(false);

    if (updateError) {
      setError("No se pudo guardar la transcripción. Intenta de nuevo.");
      return;
    }

    setOk(true);
    onGuardada(entrevista.id, valor);
  }

  const p = entrevista.sesion?.participante;
  const s = entrevista.sesion?.sonido;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la entrevista"
        className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{p?.nombre ?? "Participante"}</p>
            <p className="mt-0.5 text-xs text-muted">
              Grupo {p?.grupo ?? "—"} · Fase {entrevista.sesion?.fase ?? "—"} ·{" "}
              {s ? `${s.nombre} · ${s.variante}` : "Sin sonido"} ·{" "}
              {formatDuracion(entrevista.duracion_segundos)} · {formatFecha(entrevista.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Grabación
            </p>
            {!entrevista.audio_url ? (
              <p className="text-sm text-muted">Esta entrevista no tiene audio adjunto.</p>
            ) : audioError ? (
              <p className="text-sm text-danger">No se pudo cargar el audio.</p>
            ) : audioUrl ? (
              <div className="flex flex-wrap items-center gap-3">
                <audio controls src={audioUrl} className="h-10 min-w-0 flex-1" />
                <a
                  href={audioUrl}
                  download
                  className="text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  Descargar
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted">Cargando audio…</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Transcripción
            </p>
            <Textarea
              rows={12}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setOk(false);
              }}
              placeholder="Pega aquí el texto que arrojó la IA…"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
          <p className="text-xs text-muted">
            {ok && !sucio ? "Transcripción guardada." : sucio ? "Cambios sin guardar." : ""}
          </p>
          <div className="flex shrink-0 gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={guardar}
              disabled={guardando || !sucio}
              className="w-auto"
            >
              {guardando ? "Guardando…" : "Guardar transcripción"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
