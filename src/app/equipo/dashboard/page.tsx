import { createClient } from "@/lib/supabase/server";
import type { EntrevistaDashboard } from "@/lib/types";
import { DashboardEntrevistas } from "./dashboard-entrevistas";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: entrevistas } = await supabase
    .from("entrevistas")
    .select(
      "id, duracion_segundos, transcripcion, created_at, sesion:sesiones(fase, participante:participantes(nombre, grupo, rol), sonido:sonidos(nombre, variante))"
    )
    .order("created_at", { ascending: false });

  return (
    <DashboardEntrevistas
      entrevistas={(entrevistas as unknown as EntrevistaDashboard[]) ?? []}
    />
  );
}
