export type Tema = "light" | "dark";

export const CLAVE_TEMA = "sincresis:tema";

/*
  El tema vive en el atributo data-theme del <html>, no en estado de React: el
  script del layout raiz lo aplica antes del primer pintado para que no haya
  un destello del tema equivocado. Este store solo lo lee y lo cambia, y se
  consume con useSyncExternalStore para no leer localStorage dentro de un
  efecto (provocaria un render en cascada y un parpadeo del interruptor).
*/
let cache: Tema | null = null;
const oyentes = new Set<() => void>();

function temaGuardado(): Tema | null {
  try {
    const valor = window.localStorage.getItem(CLAVE_TEMA);
    return valor === "dark" || valor === "light" ? valor : null;
  } catch {
    return null;
  }
}

/*
  La eleccion guardada es la fuente de verdad. En produccion se vio el atributo
  data-theme desaparecer del <html> despues de cargar (con "light" guardado):
  el CSS volvia a seguir al sistema y el interruptor quedaba diciendo otra
  cosa. Esto lo vuelve a poner cada vez que falta o no coincide.
*/
function sincronizarAtributo() {
  const guardado = temaGuardado();
  const raiz = document.documentElement;
  if (guardado && raiz.dataset.theme !== guardado) raiz.dataset.theme = guardado;
}

function temaDelDocumento(): Tema {
  sincronizarAtributo();
  const declarado = document.documentElement.dataset.theme;
  if (declarado === "dark" || declarado === "light") return declarado;
  // Sin eleccion explicita manda el sistema, igual que en el CSS.
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function leerTema(): Tema {
  if (cache === null) cache = temaDelDocumento();
  return cache;
}

/** En el servidor no hay documento ni preferencia: se asume claro. */
export function leerTemaServidor(): Tema {
  return "light";
}

export function suscribirTema(alCambiar: () => void) {
  oyentes.add(alCambiar);

  // Si el usuario no ha elegido nada, seguir los cambios del sistema en vivo.
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  function desdeElSistema() {
    if (document.documentElement.dataset.theme) return;
    cache = null;
    alCambiar();
  }

  // Cambio hecho en otra pestaña.
  function desdeOtraPestana(e: StorageEvent) {
    if (e.key !== CLAVE_TEMA) return;
    const valor = e.newValue;
    if (valor === "dark" || valor === "light") {
      document.documentElement.dataset.theme = valor;
    }
    cache = null;
    alCambiar();
  }

  // Si algo quita o cambia data-theme, se restaura la eleccion guardada.
  const vigilante = new MutationObserver(() => {
    const antes = document.documentElement.dataset.theme;
    sincronizarAtributo();
    if (document.documentElement.dataset.theme !== antes) {
      cache = null;
      alCambiar();
    }
  });
  vigilante.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  consulta.addEventListener("change", desdeElSistema);
  window.addEventListener("storage", desdeOtraPestana);

  return () => {
    vigilante.disconnect();
    oyentes.delete(alCambiar);
    consulta.removeEventListener("change", desdeElSistema);
    window.removeEventListener("storage", desdeOtraPestana);
  };
}

export function alternarTema() {
  const siguiente: Tema = leerTema() === "dark" ? "light" : "dark";
  cache = siguiente;
  document.documentElement.dataset.theme = siguiente;
  try {
    window.localStorage.setItem(CLAVE_TEMA, siguiente);
  } catch {
    // Modo privado o almacenamiento bloqueado: se pierde al recargar, nada mas.
  }
  oyentes.forEach((avisar) => avisar());
}
