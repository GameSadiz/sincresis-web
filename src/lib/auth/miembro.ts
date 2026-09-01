import type { SupabaseClient } from "@supabase/supabase-js";

export interface Miembro {
  id: string;
  nombre: string;
}

/**
 * La app tiene un solo tipo de usuario: el equipo del trabajo de grado.
 * Una cuenta sin fila en miembros_equipo no tiene nada que hacer aqui.
 */
export async function getMiembro(
  supabase: SupabaseClient,
  userId: string
): Promise<Miembro | null> {
  const { data } = await supabase
    .from("miembros_equipo")
    .select("id, nombre")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as Miembro | null) ?? null;
}
