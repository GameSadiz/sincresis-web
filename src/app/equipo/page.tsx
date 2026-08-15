import { createClient } from "@/lib/supabase/server";
import type { Documento } from "@/lib/types";
import { DocumentosScreen } from "./documentos-screen";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: miembro } = await supabase
    .from("miembros_equipo")
    .select("id, nombre")
    .eq("user_id", user!.id)
    .single();

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, nombre, categoria, archivo_url, fecha_subida, subido_por:miembros_equipo(nombre)")
    .order("fecha_subida", { ascending: false });

  return (
    <DocumentosScreen
      miembroId={miembro!.id}
      miembroNombre={miembro!.nombre}
      documentosIniciales={(documentos as unknown as Documento[]) ?? []}
    />
  );
}
