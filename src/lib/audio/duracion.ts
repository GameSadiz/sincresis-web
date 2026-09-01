/**
 * Lee la duracion del audio sin subirlo: el navegador solo carga los
 * metadatos del archivo. Devuelve null si el formato no se puede leer,
 * en cuyo caso la entrevista se guarda sin duracion.
 */
export function leerDuracionSegundos(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";

    const finish = (valor: number | null) => {
      URL.revokeObjectURL(url);
      resolve(valor);
    };

    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}
