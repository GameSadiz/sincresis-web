import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMiembro } from "@/lib/auth/miembro";
import { EquipoNav } from "./equipo-nav";

export default async function EquipoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const miembro = await getMiembro(supabase, user.id);
  if (!miembro) redirect("/login");

  return (
    /*
      En escritorio la navegacion es una columna a la izquierda y el contenido
      ocupa el resto; en movil EquipoNav se pinta como barra superior, asi que
      el mismo apilado en columna sirve para los dos casos.
    */
    <div className="min-h-screen bg-background lg:flex lg:items-start">
      <EquipoNav nombre={miembro.nombre} />
      {/* min-w-0 evita que una tabla o un nombre largo desborden la columna. */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
