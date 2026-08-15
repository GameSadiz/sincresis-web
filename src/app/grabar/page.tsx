import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Sonido } from "@/lib/types";
import { FormularioPrevio } from "./formulario-previo";

export default async function GrabarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sonidos } = await supabase
    .from("sonidos")
    .select("id, nombre, variante, archivo_url")
    .order("nombre");

  return <FormularioPrevio sonidos={(sonidos as Sonido[]) ?? []} />;
}
