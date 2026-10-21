import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMiembro } from "@/lib/auth/miembro";
import type { Documento } from "@/lib/types";
import { DocumentosScreen } from "./documentos-screen";

export default async function EquipoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const miembro = await getMiembro(supabase, user.id);
  if (!miembro) redirect("/login");

  // fecha_documento llega con la migracion 005. Mientras no se haya ejecutado
  // en Supabase, la consulta con esa columna falla: se reintenta sin ella para
  // que la pantalla siga funcionando y el campo de fecha simplemente no aparece.
  const base = "id, nombre, categoria, archivo_url, fecha_subida, subido_por:miembros_equipo(nombre)";

  let conFecha = true;
  const conColumna = await supabase
    .from("documentos")
    .select(`${base}, fecha_documento`)
    .order("fecha_subida", { ascending: false });
  let documentos: unknown = conColumna.data;

  if (conColumna.error) {
    conFecha = false;
    const sinColumna = await supabase
      .from("documentos")
      .select(base)
      .order("fecha_subida", { ascending: false });
    documentos = sinColumna.data;
  }

  return (
    <DocumentosScreen
      miembroId={miembro.id}
      miembroNombre={miembro.nombre}
      documentosIniciales={(documentos as Documento[] | null) ?? []}
      conFecha={conFecha}
    />
  );
}
