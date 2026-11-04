import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMiembro } from "@/lib/auth/miembro";
import { CATEGORIA_GRUPO_FOCAL, sesionDe } from "@/lib/experimento";
import { EquipoNav, type EstadoProyecto } from "./equipo-nav";

export default async function EquipoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const miembro = await getMiembro(supabase, user.id);
  if (!miembro) redirect("/login");

  // Cifras del bloque de estado de la barra; si alguna consulta falla, la
  // barra muestra "—" en vez de romperse.
  const [audios, ultimaActa] = await Promise.all([
    supabase.from("documentos").select("nombre").eq("categoria", CATEGORIA_GRUPO_FOCAL),
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
    // Sesiones distintas con audio, no archivos: dos versiones del mismo
    // grupo focal cuentan una vez.
    gruposFocales: audios.error
      ? null
      : new Set(
          ((audios.data as { nombre: string }[] | null) ?? [])
            .map((a) => sesionDe(a.nombre))
            .filter(Boolean)
        ).size,
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
