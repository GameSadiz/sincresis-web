"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getMiembro } from "@/lib/auth/miembro";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/text-input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { OndaSonora } from "@/components/onda-sonora";

/** Entrada escalonada: cada bloque arranca un poco despues del anterior. */
const entrada = "motion-safe:animate-[aparecer_0.7s_cubic-bezier(0.2,0.6,0.2,1)_both]";

export default function LoginPage() {
  const router = useRouter();
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

    // Solo el equipo del trabajo de grado usa la app: una cuenta que no
    // este en miembros_equipo no puede pasar de aqui.
    const miembro = await getMiembro(supabase, data.user.id);

    if (!miembro) {
      await supabase.auth.signOut();
      setErrorMsg("Esta cuenta no pertenece al equipo del proyecto.");
      setLoading(false);
      return;
    }

    router.push("/equipo");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/*
        Fondo a sangre. La foto es horizontal y narrativa (disco -> notas ->
        cuadro), asi que se deja completa en vez de recortarla a una columna.
      */}
      <Image
        src="/fondo-1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center motion-safe:animate-[acercar_28s_ease-in-out_infinite_alternate]"
      />

      {/* Velo base: mas denso en movil, donde el texto ocupa todo el ancho. */}
      <div aria-hidden className="absolute inset-0 bg-[#0b0910]/70 lg:bg-[#0b0910]/45" />
      {/* En escritorio se oscurece la izquierda y se deja respirar el cuadro. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, rgba(11,9,16,0.92) 0%, rgba(11,9,16,0.6) 45%, rgba(11,9,16,0.2) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-14 lg:grid lg:grid-cols-[1.1fr_420px] lg:items-center lg:gap-20 lg:px-12">
        {/* Bloque editorial sobre la fotografia */}
        <section className="max-w-[34rem]">
          <p className={`text-sm font-semibold text-white ${entrada}`}>
            Proyecto Síncresis
          </p>

          <div className={entrada} style={{ animationDelay: "0.1s" }}>
            <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              Trabajo de grado
            </p>
            <h1 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight text-balance text-white sm:text-[2.4rem]">
              La <span className="text-accent">música</span> como elemento
              compositivo para la potenciación del{" "}
              <span className="text-accent">mensaje visual</span>
            </h1>
          </div>

          <div className={entrada} style={{ animationDelay: "0.2s" }}>
            <OndaSonora
              className="mt-9 h-14 w-full max-w-[26rem]"
              barraClassName="bg-accent"
            />
            <p className="mt-7 max-w-[28rem] text-sm leading-relaxed text-white/70">
              Espacio de trabajo del equipo: entrevistas, transcripción y
              documentos de la investigación en un solo lugar.
            </p>
          </div>

          <div
            className={`mt-9 flex items-center gap-2.5 ${entrada}`}
            style={{ animationDelay: "0.3s" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
              Acceso restringido al equipo
            </p>
          </div>
        </section>

        {/*
          La tarjeta se mantiene opaca y clara: sobre una foto tan cargada, un
          panel de vidrio dejaria los campos ilegibles, y asi conserva el mismo
          lenguaje visual del resto de la aplicacion.
        */}
        <Card
          className={`w-full max-w-[420px] lg:justify-self-end ${entrada}`}
          style={{ animationDelay: "0.15s" }}
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Iniciar sesión
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Ingresa con la cuenta que registraste en el proyecto.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
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

            <Field label="Contraseña" htmlFor="password">
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

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
            Acceso exclusivo del equipo del trabajo de grado.
          </p>
        </Card>
      </div>
    </main>
  );
}
