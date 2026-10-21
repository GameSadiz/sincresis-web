"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { alternarTema, leerTema, leerTemaServidor, suscribirTema } from "@/lib/tema";
import { formatFechaFlexible } from "@/lib/format";
import { META_ENTREVISTAS, META_PARTICIPANTES } from "@/lib/experimento";

const CLAVE_CONTRAIDA = "sincresis:nav-contraida";

/** Cifras que el layout calcula en el servidor para el bloque de estado. */
export interface EstadoProyecto {
  participantes: number | null;
  entrevistas: number | null;
  /** yyyy-mm-dd de la ultima acta con fecha, o null si no hay. */
  ultimaAsesoria: string | null;
}

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

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

function Trazo(props: SVGProps<SVGSVGElement>) {
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
    />
  );
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

const IconoDocumento = (p: SVGProps<SVGSVGElement>) => (
  <Trazo {...p}>
    <path d="M12 2.5v4h4" />
    <path d="M5 2.5h7l4 4v11H5z" />
    <path d="M8 10h4M8 13h4" />
  </Trazo>
);

const IconoMicrofono = (p: SVGProps<SVGSVGElement>) => (
  <Trazo {...p}>
    <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
    <path d="M4.5 9.5a5.5 5.5 0 0011 0" />
    <path d="M10 15v2.5" />
  </Trazo>
);

const IconoVarita = (p: SVGProps<SVGSVGElement>) => (
  <Trazo {...p}>
    <path d="M4 16l8.5-8.5" />
    <path d="M11 5l1.5-1.5M15 9l1.5-1.5M14 3v2M17 6h-2" />
    <circle cx="13.5" cy="6.5" r="1.5" />
  </Trazo>
);

const IconoSalir = (p: SVGProps<SVGSVGElement>) => (
  <Trazo {...p}>
    <path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8" />
    <path d="M13 13.5L16.5 10 13 6.5" />
    <path d="M16.5 10H7" />
  </Trazo>
);

const IconoLuna = (p: SVGProps<SVGSVGElement>) => (
  <Trazo {...p}>
    <path d="M16.5 11.7A7 7 0 018.3 3.5a7 7 0 108.2 8.2z" />
  </Trazo>
);

const IconoPuntos = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="10" cy="5" r="1.4" />
    <circle cx="10" cy="10" r="1.4" />
    <circle cx="10" cy="15" r="1.4" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Navegacion                                                          */
/* ------------------------------------------------------------------ */

interface Enlace {
  label: string;
  Icono: (p: SVGProps<SVGSVGElement>) => React.ReactElement;
  /** Sin href: la seccion aun no existe y se muestra como "Pronto". */
  href?: string;
}

/*
  Agrupado como esta organizado el trabajo de grado: lo documental, el
  experimento y el producto (objetivo especifico 3). El recomendador se deja
  visible aunque no exista todavia, porque es el entregable central.
*/
const SECCIONES: { titulo: string; enlaces: Enlace[] }[] = [
  {
    titulo: "Proyecto",
    enlaces: [{ href: "/equipo", label: "Documentos", Icono: IconoDocumento }],
  },
  {
    titulo: "Experimento",
    enlaces: [{ href: "/equipo/dashboard", label: "Entrevistas", Icono: IconoMicrofono }],
  },
  { titulo: "Producto", enlaces: [{ label: "Recomendador", Icono: IconoVarita }] },
];

function Barra({ valor, meta }: { valor: number | null; meta: number }) {
  const pct = valor === null ? 0 : Math.min(100, Math.round((valor / meta) * 100));
  return (
    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Tarjeta de estado: avance del experimento y la ultima asesoria. */
function TarjetaEstado({ estado }: { estado: EstadoProyecto }) {
  const filas = [
    { label: "Participantes", valor: estado.participantes, meta: META_PARTICIPANTES },
    { label: "Entrevistas", valor: estado.entrevistas, meta: META_ENTREVISTAS },
  ];
  return (
    <div className="mx-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
        Estado del experimento
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {filas.map((f) => (
          <div key={f.label}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-white/60">{f.label}</span>
              <span className="font-semibold tabular-nums text-white">
                {f.valor ?? "—"}
                <span className="font-normal text-white/40"> / {f.meta}</span>
              </span>
            </div>
            <Barra valor={f.valor} meta={f.meta} />
          </div>
        ))}
      </div>
      <div className="mt-3.5 border-t border-white/[0.06] pt-3 text-xs">
        <span className="text-white/40">Última asesoría</span>
        <p className="mt-0.5 font-medium text-white/80">
          {estado.ultimaAsesoria ? formatFechaFlexible(estado.ultimaAsesoria) : "Sin registrar"}
        </p>
      </div>
    </div>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/**
 * Tarjeta de la cuenta. Modo oscuro y cerrar sesion viven en su menu: son
 * acciones de una vez por sesion y no necesitan ocupar la barra todo el tiempo.
 */
function TarjetaUsuario({
  nombre,
  correo,
  contraida,
  onCerrarSesion,
}: {
  nombre: string;
  correo: string | null;
  contraida: boolean;
  onCerrarSesion: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const tema = useSyncExternalStore(suscribirTema, leerTema, leerTemaServidor);
  const oscuro = tema === "dark";

  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
      {iniciales(nombre)}
    </span>
  );

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-label={`Cuenta de ${nombre}`}
        aria-expanded={abierto}
        title={contraida ? nombre : undefined}
        className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
          contraida ? "justify-center" : ""
        } ${abierto ? "bg-white/[0.06]" : ""}`}
      >
        {avatar}
        {!contraida && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{nombre}</span>
              <span className="block truncate text-[11px] text-white/45">
                {correo ?? "Equipo del trabajo de grado"}
              </span>
            </span>
            <IconoPuntos className="h-4 w-4 shrink-0 text-white/40" />
          </>
        )}
      </button>

      {abierto && (
        <div
          role="menu"
          className={`absolute z-50 w-56 rounded-xl border border-white/[0.08] bg-[#1d1c22] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${
            contraida ? "bottom-0 left-full ml-3" : "bottom-full left-0 mb-2"
          }`}
        >
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={oscuro}
            onClick={alternarTema}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <IconoLuna className="h-4 w-4" />
            <span className="flex-1 text-left">Modo oscuro</span>
            <span
              aria-hidden
              className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                oscuro ? "bg-accent" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left] duration-200 ${
                  oscuro ? "left-[14px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
          <div className="my-1 h-px bg-white/[0.08]" />
          <button
            type="button"
            role="menuitem"
            onClick={onCerrarSesion}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <IconoSalir className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

/** Contenido compartido por la barra fija de escritorio y el cajón móvil. */
function Contenido({
  nombre,
  correo,
  estado,
  pathname,
  contraida,
  onCerrarSesion,
  onNavegar,
  onAlternar,
}: {
  nombre: string;
  correo: string | null;
  estado: EstadoProyecto;
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
        className={`flex items-center gap-3 px-4 pb-2 pt-4 ${contraida ? "justify-center px-0" : ""}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
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
            <Trazo className="h-4 w-4">
              <path d="M12 5l-4 5 4 5" />
            </Trazo>
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
            <Trazo className="h-4 w-4">
              <path d="M8 5l4 5-4 5" />
            </Trazo>
          </button>
        </div>
      )}

      {/* Enlaces por sección */}
      <nav className="mt-3 flex flex-col gap-4 px-3">
        {SECCIONES.map((seccion) => (
          <div key={seccion.titulo}>
            {contraida ? (
              <div className="mx-auto mb-1.5 h-px w-6 bg-white/[0.08]" aria-hidden />
            ) : (
              <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                {seccion.titulo}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {seccion.enlaces.map(({ href, label, Icono }) => {
                const active = href !== undefined && pathname === href;
                const base = `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  contraida ? "justify-center px-0" : ""
                }`;
                const contenido = (
                  <>
                    {/* Indicador del enlace activo. */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                      />
                    )}
                    <Icono
                      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-accent" : ""}`}
                    />
                    {!contraida && <span className="flex-1 truncate">{label}</span>}
                    {!contraida && !href && (
                      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                        Pronto
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={onNavegar}
                        aria-current={active ? "page" : undefined}
                        title={contraida ? label : undefined}
                        className={`${base} ${
                          active
                            ? "bg-white/[0.07] text-white"
                            : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {contenido}
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        title={contraida ? `${label} (pronto)` : "En construcción"}
                        className={`${base} cursor-default text-white/30`}
                      >
                        {contenido}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* El estado ocupa el espacio libre, pegado abajo y sobre la cuenta. */}
      <div className="flex-1" />
      {!contraida && <TarjetaEstado estado={estado} />}

      <div className={`p-3 ${contraida ? "" : "pt-3"}`}>
        <TarjetaUsuario
          nombre={nombre}
          correo={correo}
          contraida={contraida}
          onCerrarSesion={onCerrarSesion}
        />
      </div>
    </div>
  );
}

export function EquipoNav({
  nombre,
  correo,
  estado,
}: {
  nombre: string;
  correo: string | null;
  estado: EstadoProyecto;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const contraida = useSyncExternalStore(suscribir, leerContraida, leerContraidaServidor);

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

  const props = { nombre, correo, estado, pathname, onCerrarSesion: handleLogout };

  return (
    <>
      {/*
        Escritorio: panel flotante con margen, para que el fondo de la pagina
        lo enmarque en vez de que la barra vaya pegada al borde. overflow
        visible para que el menu de la cuenta pueda salir del panel contraido.
      */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 p-3 transition-[width] duration-200 lg:block ${
          contraida ? "w-[84px]" : "w-[272px]"
        }`}
      >
        <div className="h-full rounded-2xl border border-white/[0.06] bg-sidebar shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <Contenido
            {...props}
            contraida={contraida}
            onNavegar={() => setAbierto(false)}
            onAlternar={alternarContraida}
          />
        </div>
      </aside>

      {/* Móvil: barra superior con botón de menú. */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-on-accent">
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
          <Trazo className="h-5 w-5">
            <path d="M3 6h14M3 10h14M3 14h14" />
          </Trazo>
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
          <div className="absolute inset-y-0 left-0 w-[272px] p-3">
            <div className="h-full rounded-2xl bg-sidebar shadow-xl">
              <Contenido {...props} contraida={false} onNavegar={() => setAbierto(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
