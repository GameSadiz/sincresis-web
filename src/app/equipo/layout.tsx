import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMiembro } from "@/lib/auth/miembro";
import { EquipoNav, type EstadoProyecto } from "./equipo-nav";

export default async function EquipoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const miembro = await getMiembro(supabase, user.id);
  if (!miembro) redirect("/login");

  // Cifras del bloque de estado de la barra. Son conteos (head: true), asi que
  // no traen filas; si alguna falla, la barra muestra "—" en vez de romperse.
  const [participantes, entrevistas, ultimaActa] = await Promise.all([
    supabase.from("participantes").select("id", { count: "exact", head: true }),
    supabase.from("entrevistas").select("id", { count: "exact", head: true }),
    supabase
      .from("documentos")
      .select("fecha_documento")
      .eq("categoria", "Acta de asesoría")
      .not("fecha_documento", "is", null)
      .order("fecha_documento", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const estado: EstadoProyecto = {
    participantes: participantes.error ? null : (participantes.count ?? 0),
    entrevistas: entrevistas.error ? null : (entrevistas.count ?? 0),
    ultimaAsesoria:
      (ultimaActa.data as { fecha_documento: string | null } | null)?.fecha_documento ?? null,
  };

  return (
    /*
      En escritorio la navegacion es una columna a la izquierda y el contenido
      ocupa el resto; en movil EquipoNav se pinta como barra superior, asi que
      el mismo apilado en columna sirve para los dos casos.
    */
    <div className="min-h-screen bg-background lg:flex lg:items-start">
      <EquipoNav nombre={miembro.nombre} correo={user.email ?? null} estado={estado} />
      {/* min-w-0 evita que una tabla o un nombre largo desborden la columna. */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
