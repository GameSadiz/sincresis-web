import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CLAVE_TEMA } from "@/lib/tema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proyecto Síncresis",
  description:
    "Trabajo de grado: la música como elemento compositivo para la potenciación del mensaje visual.",
};

/*
  Se ejecuta de forma sincrona antes de pintar: si esperara a que React
  hidratara, el usuario con tema oscuro veria un fogonazo blanco en cada carga.
  Cuando no hay preferencia guardada no toca nada y manda el media query del
  CSS, que ya sigue al sistema.
*/
const SCRIPT_TEMA = `try{var t=localStorage.getItem(${JSON.stringify(CLAVE_TEMA)});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // El script escribe data-theme antes de hidratar: el servidor no puede
      // conocer ese valor y la diferencia es esperada.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
