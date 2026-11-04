import { redirect } from "next/navigation";

/*
  Aqui estaba el registro de entrevistas de voz, que la practica ya no usa:
  se midio con encuestas y grupos focales. La ruta se conserva para que los
  enlaces viejos lleguen a la seccion nueva.
*/
export default function DashboardPage() {
  redirect("/equipo/grupos-focales");
}
