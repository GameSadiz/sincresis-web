import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRol } from "@/lib/auth/get-role";
import { EquipoNav } from "./equipo-nav";

export default async function EquipoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = await getRol(supabase, user.id);
  if (rol !== "equipo") redirect("/grabar");

  return (
    <div className="min-h-screen bg-background">
      <EquipoNav />
      {children}
    </div>
  );
}
