import type { SupabaseClient } from "@supabase/supabase-js";

export type Rol = "equipo" | "participante";

export async function getRol(
  supabase: SupabaseClient,
  userId: string
): Promise<Rol> {
  const { data } = await supabase
    .from("miembros_equipo")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? "equipo" : "participante";
}
