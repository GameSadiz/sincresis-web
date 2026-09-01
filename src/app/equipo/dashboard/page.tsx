import { createClient } from "@/lib/supabase/server";
import type { EntrevistaDashboard, ParticipanteOpcion, Sonido } from "@/lib/types";
import { DashboardEntrevistas } from "./dashboard-entrevistas";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: entrevistas }, { data: participantes }, { data: sonidos }] = await Promise.all([
    supabase
      .from("entrevistas")
      .select(
        "id, audio_url, duracion_segundos, transcripcion, created_at, sesion:sesiones(fase, participante:participantes(nombre, grupo, rol), sonido:sonidos(nombre, variante))"
      )
      .order("created_at", { ascending: false }),
    supabase.from("participantes").select("id, nombre, rol, grupo").order("nombre"),
    supabase.from("sonidos").select("id, nombre, variante, archivo_url").order("nombre"),
  ]);

  return (
    <DashboardEntrevistas
      entrevistasIniciales={(entrevistas as unknown as EntrevistaDashboard[]) ?? []}
      participantes={(participantes as ParticipanteOpcion[]) ?? []}
      sonidos={(sonidos as Sonido[]) ?? []}
    />
  );
}
