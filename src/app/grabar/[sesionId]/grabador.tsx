"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pickMimeType, extensionFor } from "@/lib/audio/pick-mime-type";
import type { SesionConDetalle } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EstadoGrabacion = "reposo" | "grabando" | "pausado" | "guardando" | "guardada";

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 5v14l11-7-11-7Z" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Grabador({ sesion }: { sesion: SesionConDetalle }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoGrabacion>("reposo");
  const [segundos, setSegundos] = useState(0);
  const [duracionFinal, setDuracionFinal] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segundosRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const detenerIntervalo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const subirYGuardar = useCallback(
    async (blob: Blob, mimeType: string, duracion: number) => {
      setEstado("guardando");
      const supabase = createClient();
      const ext = extensionFor(mimeType);
      const path = `${sesion.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("audios-entrevistas")
        .upload(path, blob, { contentType: mimeType || "audio/webm" });

      if (uploadError) {
        setErrorMsg("No se pudo subir el audio. Intenta de nuevo.");
        setEstado("reposo");
        return;
      }

      const { data: entrevista, error: insertError } = await supabase
        .from("entrevistas")
        .insert({ sesion_id: sesion.id, audio_url: path, duracion_segundos: duracion })
        .select("id")
        .single();

      if (insertError || !entrevista) {
        setErrorMsg("El audio se subió, pero no se pudo registrar la entrevista.");
        setEstado("reposo");
        return;
      }

      // Dispara la transcripción en segundo plano; no bloquea la pantalla
      // de confirmación ni el flujo del participante.
      fetch("/api/transcribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entrevistaId: entrevista.id }),
      }).catch(() => {
        // Falla silenciosa: la transcripción se puede reintentar después
        // desde el panel del equipo; no afecta al participante.
      });

      setDuracionFinal(duracion);
      setEstado("guardada");
    },
    [sesion.id]
  );

  async function iniciarGrabacion() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        detenerIntervalo();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        void subirYGuardar(blob, mimeType, segundosRef.current);
      };

      recorder.start();
      segundosRef.current = 0;
      setSegundos(0);
      setEstado("grabando");
      intervalRef.current = setInterval(() => {
        segundosRef.current += 1;
        setSegundos(segundosRef.current);
      }, 1000);
    } catch {
      setErrorMsg("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function pausarGrabacion() {
    mediaRecorderRef.current?.pause();
    detenerIntervalo();
    setEstado("pausado");
  }

  function reanudarGrabacion() {
    mediaRecorderRef.current?.resume();
    setEstado("grabando");
    intervalRef.current = setInterval(() => {
      segundosRef.current += 1;
      setSegundos(segundosRef.current);
    }, 1000);
  }

  function detenerGrabacion() {
    mediaRecorderRef.current?.stop();
  }

  const grupo = sesion.participante?.grupo ?? "—";
  const sonidoLabel = sesion.sonido
    ? `${sesion.sonido.nombre} · ${sesion.sonido.variante}`
    : "—";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="flex gap-2">
        <Badge tone="primary">Grupo {grupo}</Badge>
        <Badge tone="danger">Sonido {sesion.sonido?.variante ?? "—"}</Badge>
        <Badge tone="info">Fase {sesion.fase}</Badge>
      </div>

      <Card className="w-full max-w-[400px] text-center">
        {estado === "reposo" && (
          <>
            <button
              type="button"
              onClick={iniciarGrabacion}
              aria-label="Iniciar grabación"
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-foreground text-white transition-transform hover:scale-[1.03]"
            >
              <MicIcon className="h-10 w-10" />
            </button>
            <p className="mt-5 text-sm font-semibold text-foreground">Toca para grabar</p>
            <p className="mt-1 text-xs text-muted">El audio se guarda automáticamente</p>
          </>
        )}

        {(estado === "grabando" || estado === "pausado") && (
          <>
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-danger text-white">
              <MicIcon className="h-10 w-10" />
            </div>
            <p
              className={`mt-4 text-lg ${
                estado === "grabando" ? "animate-pulse text-danger" : "text-muted"
              }`}
              aria-hidden="true"
            >
              ▮▮▮▮
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {formatTiempo(segundos)}
            </p>
            <div className="mt-5 flex items-center justify-center gap-4">
              {estado === "grabando" ? (
                <button
                  type="button"
                  onClick={pausarGrabacion}
                  aria-label="Pausar"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-black/[0.03]"
                >
                  <PauseIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reanudarGrabacion}
                  aria-label="Reanudar"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-black/[0.03]"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={detenerGrabacion}
                aria-label="Detener"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-white hover:opacity-90"
              >
                <StopIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              {estado === "grabando" ? "Pausar" : "Reanudar"} · Detener
            </p>
          </>
        )}

        {estado === "guardando" && (
          <>
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-black/[0.04] text-muted">
              <MicIcon className="h-10 w-10 animate-pulse" />
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground">Guardando entrevista…</p>
          </>
        )}

        {estado === "guardada" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckIcon className="h-8 w-8" />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">Entrevista guardada</p>

            <dl className="mt-5 divide-y divide-border rounded-xl border border-border text-left text-sm">
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-muted">Grupo</dt>
                <dd className="font-medium text-foreground">{grupo}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-muted">Sonido</dt>
                <dd className="font-medium text-foreground">{sonidoLabel}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-muted">Fase</dt>
                <dd className="font-medium text-foreground">{sesion.fase}</dd>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <dt className="text-muted">Duración</dt>
                <dd className="font-medium text-foreground">{formatTiempo(duracionFinal)}</dd>
              </div>
            </dl>

            <Button className="mt-6" onClick={() => router.push("/grabar")}>
              Grabar otra entrevista
            </Button>
          </>
        )}

        {errorMsg && (
          <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {errorMsg}
          </p>
        )}
      </Card>
    </main>
  );
}
