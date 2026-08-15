import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SesionConDetalle } from "@/lib/types";
import { Grabador } from "./grabador";

export default async function SesionPage({
  params,
}: {
  params: Promise<{ sesionId: string }>;
}) {
  const { sesionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sesion } = await supabase
    .from("sesiones")
    .select(
      "id, fase, participante:participantes(nombre, grupo), sonido:sonidos(nombre, variante)"
    )
    .eq("id", sesionId)
    .maybeSingle();

  if (!sesion) notFound();

  return <Grabador sesion={sesion as unknown as SesionConDetalle} />;
}
