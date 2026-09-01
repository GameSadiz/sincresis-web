"use client";

import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { leerDuracionSegundos } from "@/lib/audio/duracion";
import type {
  EntrevistaDashboard,
  ParticipanteOpcion,
  RolParticipante,
  Sonido,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OPCIONES_FASE, OPCIONES_GRUPO } from "@/lib/experimento";

const ROLES: { value: RolParticipante; label: string }[] = [
  { value: "diseñador", label: "Diseñador gráfico" },
  { value: "general", label: "No diseñador" },
];

/** Valor del select de participante cuando se va a crear uno nuevo. */
const NUEVO = "__nuevo__";

const FILE_INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary";

function extensionDe(nombre: string): string {
  const match = nombre.match(/\.([a-zA-Z0-9]{1,5})$/);
  return match ? match[1].toLowerCase() : "mp3";
}

interface FormErrors {
  nombre?: string;
  rol?: string;
  grupo?: string;
  sonidoId?: string;
  fase?: string;
  archivo?: string;
}

interface NuevaEntrevistaProps {
  participantes: ParticipanteOpcion[];
  sonidos: Sonido[];
  onCreada: (
    entrevista: EntrevistaDashboard,
    participanteNuevo: ParticipanteOpcion | null
  ) => void;
}

export function NuevaEntrevista({ participantes, sonidos, onCreada }: NuevaEntrevistaProps) {
  const [participanteId, setParticipanteId] = useState(NUEVO);
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [grupo, setGrupo] = useState("");
  const [sonidoId, setSonidoId] = useState("");
  const [fase, setFase] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [transcripcion, setTranscripcion] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const archivoRef = useRef<HTMLInputElement>(null);
  const txtRef = useRef<HTMLInputElement>(null);

  const esNuevo = participanteId === NUEVO;

  function limpiar() {
    setParticipanteId(NUEVO);
    setNombre("");
    setRol("");
    setGrupo("");
    setSonidoId("");
    setFase("");
    setArchivo(null);
    setTranscripcion("");
    if (archivoRef.current) archivoRef.current.value = "";
    if (txtRef.current) txtRef.current.value = "";
  }

  async function cargarTxt(file: File | null) {
    if (!file) return;
    setTranscripcion(await file.text());
  }

  function validar(): boolean {
    const next: FormErrors = {};
    if (esNuevo) {
      if (!nombre.trim()) next.nombre = "Escribe el nombre del participante.";
      if (!rol) next.rol = "Selecciona el perfil del participante.";
      if (!grupo) next.grupo = "Selecciona un grupo.";
    }
    if (!sonidoId) next.sonidoId = "Selecciona el sonido usado.";
    if (!fase) next.fase = "Selecciona la fase.";
    if (!archivo) next.archivo = "Elige el archivo de audio de la entrevista.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setOk(null);

    if (!validar() || !archivo) return;

    setGuardando(true);
    const supabase = createClient();

    // La duracion se lee en el navegador; si el formato no la expone, la
    // entrevista se guarda igual, solo sin ese dato.
    const duracion = await leerDuracionSegundos(archivo);

    let idParticipante = participanteId;
    let participanteNuevo: ParticipanteOpcion | null = null;

    if (esNuevo) {
      const { data, error } = await supabase
        .from("participantes")
        .insert({ nombre: nombre.trim(), rol, grupo })
        .select("id, nombre, rol, grupo")
        .single();

      if (error || !data) {
        setSubmitError("No se pudo registrar al participante. Intenta de nuevo.");
        setGuardando(false);
        return;
      }

      idParticipante = data.id;
      participanteNuevo = data as ParticipanteOpcion;
    }

    const { data: sesion, error: sesionError } = await supabase
      .from("sesiones")
      .insert({ participante_id: idParticipante, sonido_id: sonidoId, fase })
      .select("id")
      .single();

    if (sesionError || !sesion) {
      setSubmitError("No se pudo crear la sesión. Intenta de nuevo.");
      setGuardando(false);
      return;
    }

    const path = `${sesion.id}/${Date.now()}.${extensionDe(archivo.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("audios-entrevistas")
      .upload(path, archivo, { contentType: archivo.type || "audio/mpeg" });

    if (uploadError) {
      setSubmitError("No se pudo subir el audio. Revisa el archivo e intenta de nuevo.");
      setGuardando(false);
      return;
    }

    const texto = transcripcion.trim();

    const { data: creada, error: insertError } = await supabase
      .from("entrevistas")
      .insert({
        sesion_id: sesion.id,
        audio_url: path,
        transcripcion: texto || null,
        duracion_segundos: duracion,
      })
      .select("id, created_at")
      .single();

    if (insertError || !creada) {
      setSubmitError("El audio se subió, pero no se pudo registrar la entrevista.");
      setGuardando(false);
      return;
    }

    const participanteFinal =
      participanteNuevo ?? participantes.find((p) => p.id === idParticipante) ?? null;
    const sonido = sonidos.find((s) => s.id === sonidoId) ?? null;

    onCreada(
      {
        id: creada.id,
        audio_url: path,
        duracion_segundos: duracion,
        transcripcion: texto || null,
        created_at: creada.created_at,
        sesion: {
          fase,
          participante: participanteFinal
            ? {
                nombre: participanteFinal.nombre,
                grupo: participanteFinal.grupo,
                rol: participanteFinal.rol,
              }
            : null,
          sonido: sonido ? { nombre: sonido.nombre, variante: sonido.variante } : null,
        },
      },
      participanteNuevo
    );

    limpiar();
    setGuardando(false);
    setOk(
      texto
        ? "Entrevista guardada con su transcripción."
        : "Audio guardado. Puedes pegar la transcripción abriendo la entrevista en la tabla."
    );
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-foreground">Nueva entrevista</h2>
      <p className="mt-1 text-xs text-muted">
        Sube la grabación hecha localmente y pega la transcripción que generó la IA. Si
        todavía no la tienes, guarda el audio y agrégala después.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Participante" htmlFor="participante">
            <Select
              id="participante"
              value={participanteId}
              onChange={(e) => setParticipanteId(e.target.value)}
            >
              <option value={NUEVO}>+ Participante nuevo</option>
              {participantes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · Grupo {p.grupo}
                </option>
              ))}
            </Select>
          </Field>

          {esNuevo && (
            <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
              <TextInput
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del participante"
                invalid={Boolean(errors.nombre)}
              />
            </Field>
          )}
        </div>

        {esNuevo && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Perfil" htmlFor="rol" error={errors.rol}>
              <Select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                invalid={Boolean(errors.rol)}
              >
                <option value="">Selecciona el perfil</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Grupo" htmlFor="grupo" error={errors.grupo}>
              <Select
                id="grupo"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                invalid={Boolean(errors.grupo)}
              >
                <option value="">Selecciona un grupo</option>
                {OPCIONES_GRUPO.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sonido usado" htmlFor="sonido" error={errors.sonidoId}>
            <Select
              id="sonido"
              value={sonidoId}
              onChange={(e) => setSonidoId(e.target.value)}
              invalid={Boolean(errors.sonidoId)}
              disabled={sonidos.length === 0}
            >
              <option value="">
                {sonidos.length === 0 ? "No hay sonidos cargados" : "Selecciona el sonido"}
              </option>
              {sonidos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.variante}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Fase" htmlFor="fase" error={errors.fase}>
            <Select
              id="fase"
              value={fase}
              onChange={(e) => setFase(e.target.value)}
              invalid={Boolean(errors.fase)}
            >
              <option value="">Selecciona la fase</option>
              {OPCIONES_FASE.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Grabación (mp3)" htmlFor="archivo" error={errors.archivo}>
          <input
            id="archivo"
            ref={archivoRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className={FILE_INPUT_CLASS}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="transcripcion" className="text-sm font-medium text-foreground">
              Transcripción <span className="font-normal text-muted">(opcional)</span>
            </label>
            <button
              type="button"
              onClick={() => txtRef.current?.click()}
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Cargar desde .txt
            </button>
          </div>
          <input
            ref={txtRef}
            type="file"
            accept=".txt,text/plain"
            hidden
            onChange={(e) => cargarTxt(e.target.files?.[0] ?? null)}
          />
          <Textarea
            id="transcripcion"
            rows={6}
            value={transcripcion}
            onChange={(e) => setTranscripcion(e.target.value)}
            placeholder="Pega aquí el texto que arrojó la IA…"
          />
        </div>

        {submitError && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {submitError}
          </p>
        )}

        {ok && <p className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{ok}</p>}

        <Button type="submit" disabled={guardando} className="sm:w-auto sm:self-start">
          {guardando ? "Guardando…" : "Guardar entrevista"}
        </Button>
      </form>
    </Card>
  );
}
