"use client";

import { useEffect, useState, useSyncExternalStore, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  alternarTema,
  leerTema,
  leerTemaServidor,
  suscribirTema,
} from "@/lib/tema";

const CLAVE_CONTRAIDA = "sincresis:nav-contraida";

/*
  Store minimo sobre localStorage. Se usa useSyncExternalStore en vez de leer
  el valor dentro de un useEffect por dos razones: el efecto provocaria un
  parpadeo (primero expandida, luego contraida) y ademas React desaconseja
  llamar a setState dentro de un efecto. El evento 'storage' solo avisa a las
  otras pestañas, asi que la propia pestaña notifica a mano a sus oyentes.
*/
let contraidaCache: boolean | null = null;
const oyentes = new Set<() => void>();

function leerContraida(): boolean {
  if (contraidaCache === null) {
    try {
      contraidaCache = window.localStorage.getItem(CLAVE_CONTRAIDA) === "1";
    } catch {
      contraidaCache = false;
    }
  }
  return contraidaCache;
}

/** En el servidor no hay preferencia guardada: siempre expandida. */
function leerContraidaServidor(): boolean {
  return false;
}

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  function desdeOtraPestana() {
    contraidaCache = null;
    alCambiar();
  }
  window.addEventListener("storage", desdeOtraPestana);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener("storage", desdeOtraPestana);
  };
}

function alternarContraida() {
  contraidaCache = !leerContraida();
  try {
    window.localStorage.setItem(CLAVE_CONTRAIDA, contraidaCache ? "1" : "0");
  } catch {
    // Modo privado o almacenamiento bloqueado: se pierde al recargar, nada mas.
  }
  oyentes.forEach((avisar) => avisar());
}

/** Marca del proyecto: tres barras de onda, el mismo motivo del login. */
function LogoOnda(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3" y="7.5" width="2.5" height="5" rx="1.25" />
      <rect x="8.75" y="3.5" width="2.5" height="13" rx="1.25" />
      <rect x="14.5" y="6" width="2.5" height="8" rx="1.25" />
    </svg>
  );
}

function IconoDocumento(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.5v4h4" />
      <path d="M5 2.5h7l4 4v11H5z" />
      <path d="M8 10h4M8 13h4" />
    </svg>
  );
}

function IconoMicrofono(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0011 0" />
      <path d="M10 15v2.5" />
    </svg>
  );
}

function IconoSalir(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8" />
      <path d="M13 13.5L16.5 10 13 6.5" />
      <path d="M16.5 10H7" />
    </svg>
  );
}

function IconoLuna(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.5 11.7A7 7 0 018.3 3.5a7 7 0 108.2 8.2z" />
    </svg>
  );
}

const LINKS = [
  { href: "/equipo", label: "Documentos", Icono: IconoDocumento },
  { href: "/equipo/dashboard", label: "Entrevistas", Icono: IconoMicrofono },
];

/**
 * Interruptor de tema. Vive dentro de la barra, que es oscura en los dos
 * temas, asi que sus colores son blancos translucidos y no tokens.
 */
function InterruptorTema({ contraida }: { contraida: boolean }) {
  const tema = useSyncExternalStore(suscribirTema, leerTema, leerTemaServidor);
  const oscuro = tema === "dark";

  if (contraida) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={oscuro}
        onClick={alternarTema}
        aria-label="Modo oscuro"
        title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="flex w-full items-center justify-center rounded-xl p-2 text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            oscuro ? "bg-accent text-on-accent" : "bg-white/[0.06]"
          }`}
        >
          <IconoLuna className="h-[17px] w-[17px]" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      onClick={alternarTema}
      className="flex w-full items-center gap-3 rounded-xl p-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          oscuro ? "bg-accent text-on-accent" : "bg-white/[0.06] text-white/60"
        }`}
      >
        <IconoLuna className="h-[17px] w-[17px]" />
      </span>
      <span className="flex-1 truncate text-left">Modo oscuro</span>
      {/* Riel del interruptor. */}
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          oscuro ? "bg-accent" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] duration-200 ${
            oscuro ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/** Contenido compartido por la barra fija de escritorio y el cajón móvil. */
function Contenido({
  nombre,
  pathname,
  contraida,
  onCerrarSesion,
  onNavegar,
  onAlternar,
}: {
  nombre: string;
  pathname: string;
  contraida: boolean;
  onCerrarSesion: () => void;
  onNavegar: () => void;
  onAlternar?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div
        className={`flex items-center gap-3 px-3 py-4 ${
          contraida ? "justify-center" : ""
        }`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent"
        >
          <LogoOnda className="h-[18px] w-[18px]" />
        </span>
        {!contraida && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Síncresis</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
              Trabajo de grado
            </p>
          </div>
        )}
        {!contraida && onAlternar && (
          <button
            type="button"
            onClick={onAlternar}
            aria-label="Contraer barra lateral"
            title="Contraer"
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5l-4 5 4 5" />
            </svg>
          </button>
        )}
      </div>

      {contraida && onAlternar && (
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={onAlternar}
            aria-label="Expandir barra lateral"
            title="Expandir"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 5l4 5-4 5" />
            </svg>
          </button>
        </div>
      )}

      {/* Enlaces */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavegar}
              aria-current={active ? "page" : undefined}
              title={contraida ? link.label : undefined}
              className={`group flex items-center gap-3 rounded-xl p-2 text-sm font-medium transition-colors ${
                contraida ? "justify-center" : ""
              } ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-accent text-on-accent"
                    : "bg-white/[0.06] text-white/60 group-hover:text-white"
                }`}
              >
                <link.Icono className="h-[17px] w-[17px]" />
              </span>
              {!contraida && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Preferencias y sesión */}
      <div className="border-t border-white/[0.08] p-3">
        <InterruptorTema contraida={contraida} />

        <div className="my-2 h-px bg-white/[0.08]" />

        {!contraida && (
          <p className="mb-2 truncate px-2 text-[11px] text-white/40">{nombre}</p>
        )}
        <button
          type="button"
          onClick={onCerrarSesion}
          title={contraida ? "Cerrar sesión" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl bg-white/[0.08] p-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
            contraida ? "justify-center" : ""
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
            <IconoSalir className="h-[17px] w-[17px]" />
          </span>
          {!contraida && <span className="truncate">Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}

export function EquipoNav({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const contraida = useSyncExternalStore(
    suscribir,
    leerContraida,
    leerContraidaServidor
  );

  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [abierto]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/*
        Escritorio: panel flotante con margen, para que el fondo claro de la
        pagina lo enmarque en vez de que la barra vaya pegada al borde.
      */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 p-3 transition-[width] duration-200 lg:block ${
          contraida ? "w-[88px]" : "w-[264px]"
        }`}
      >
        <div className="h-full overflow-hidden rounded-2xl bg-sidebar shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <Contenido
            nombre={nombre}
            pathname={pathname}
            contraida={contraida}
            onCerrarSesion={handleLogout}
            onNavegar={() => setAbierto(false)}
            onAlternar={alternarContraida}
          />
        </div>
      </aside>

      {/* Móvil: barra superior con botón de menú. */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-on-accent"
          >
            <LogoOnda className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-foreground">Síncresis</p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 6h14M3 10h14M3 14h14" />
          </svg>
        </button>
      </header>

      {/* El cajón siempre va expandido: contraerlo no aporta nada en móvil. */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 h-full w-full bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 w-[264px] p-3">
            <div className="h-full overflow-hidden rounded-2xl bg-sidebar shadow-xl">
              <Contenido
                nombre={nombre}
                pathname={pathname}
                contraida={false}
                onCerrarSesion={handleLogout}
                onNavegar={() => setAbierto(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
