"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getRol } from "@/lib/auth/get-role";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { Button } from "@/components/ui/button";
import { RoleTile } from "./role-tile";

export default function LoginPage() {
  const router = useRouter();
  const [rolHint, setRolHint] = useState<"equipo" | "participante">("equipo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setErrorMsg("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const rol = await getRol(supabase, data.user.id);
    router.push(rol === "equipo" ? "/equipo" : "/grabar");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-[420px]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Proyecto Síncresis</p>
            <p className="text-xs text-muted">Sonido y percepción de marca</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-muted">
              INGRESAS COMO
            </p>
            <div className="flex gap-3">
              <RoleTile
                title="Equipo del proyecto"
                description="Sara, Juliana, Samuel — documentos y avances"
                selected={rolHint === "equipo"}
                onSelect={() => setRolHint("equipo")}
              />
              <RoleTile
                title="Participante"
                description="Acceso solo a grabar tu entrevista"
                selected={rolHint === "participante"}
                onSelect={() => setRolHint("participante")}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          <Field label="Correo" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <span className="text-xs text-primary">¿Olvidaste tu contraseña?</span>
            </div>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {errorMsg}
            </p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          ¿Problemas para entrar? Contacta al equipo del proyecto.
        </p>
      </Card>
    </main>
  );
}
