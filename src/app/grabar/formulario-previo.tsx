"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Sonido } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const GRUPOS = ["A", "B", "C", "D"];
const FASES = [
  { value: "1", label: "Fase 1" },
  { value: "2", label: "Fase 2" },
];
const ROLES = [
  { value: "diseñador", label: "Diseñador gráfico" },
  { value: "general", label: "No diseñador" },
];

interface FormState {
  nombre: string;
  rol: string;
  grupo: string;
  sonidoId: string;
  fase: string;
}

const initialState: FormState = {
  nombre: "",
  rol: "",
  grupo: "",
  sonidoId: "",
  fase: "",
};

export function FormularioPrevio({ sonidos }: { sonidos: Sonido[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) next.nombre = "Escribe el nombre del participante.";
    if (!form.rol) next.rol = "Selecciona el rol antes de continuar.";
    if (!form.grupo) next.grupo = "Selecciona un grupo antes de continuar.";
    if (!form.sonidoId) next.sonidoId = "Selecciona el sonido usado antes de continuar.";
    if (!form.fase) next.fase = "Selecciona la fase antes de continuar.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitError("Tu sesión expiró. Vuelve a iniciar sesión.");
      setSubmitting(false);
      return;
    }

    const { data: participante, error: participanteError } = await supabase
      .from("participantes")
      .insert({
        user_id: user.id,
        nombre: form.nombre.trim(),
        rol: form.rol,
        grupo: form.grupo,
      })
      .select("id")
      .single();

    if (participanteError || !participante) {
      setSubmitError("No se pudo registrar al participante. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const { data: sesion, error: sesionError } = await supabase
      .from("sesiones")
      .insert({
        participante_id: participante.id,
        sonido_id: form.sonidoId,
        fase: form.fase,
      })
      .select("id")
      .single();

    if (sesionError || !sesion) {
      setSubmitError("No se pudo crear la sesión. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    router.push(`/grabar/${sesion.id}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-[440px]">
        <h1 className="text-2xl font-bold text-foreground">Antes de grabar</h1>
        <p className="mt-1.5 text-sm text-muted">
          Completa estos datos antes de comenzar la entrevista.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <Field label="Nombre" htmlFor="nombre" error={errors.nombre}>
            <TextInput
              id="nombre"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Nombre del participante"
              invalid={Boolean(errors.nombre)}
            />
          </Field>

          <Field label="Rol" htmlFor="rol" error={errors.rol}>
            <Select
              id="rol"
              value={form.rol}
              onChange={(e) => update("rol", e.target.value)}
              invalid={Boolean(errors.rol)}
            >
              <option value="">Selecciona el rol</option>
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
              value={form.grupo}
              onChange={(e) => update("grupo", e.target.value)}
              invalid={Boolean(errors.grupo)}
            >
              <option value="">Selecciona un grupo</option>
              {GRUPOS.map((g) => (
                <option key={g} value={g}>
                  Grupo {g}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Sonido usado" htmlFor="sonido" error={errors.sonidoId}>
            <Select
              id="sonido"
              value={form.sonidoId}
              onChange={(e) => update("sonidoId", e.target.value)}
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
              value={form.fase}
              onChange={(e) => update("fase", e.target.value)}
              invalid={Boolean(errors.fase)}
            >
              <option value="">Selecciona la fase</option>
              {FASES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>

          {submitError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {submitError}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Continuar a grabación"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
