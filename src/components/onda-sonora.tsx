const BARRAS = 56;

/**
 * Altura de cada barra a partir de sinusoides superpuestas. Es determinista
 * a proposito: con Math.random el servidor y el cliente pintarian ondas
 * distintas y React reportaria un error de hidratacion.
 *
 * Por la misma razon los valores que salen de aqui se redondean antes de ir
 * al style: un float largo se serializa con distinta precision en el servidor
 * y en el cliente, y React lo trata como un desajuste de hidratacion.
 */
function altura(i: number) {
  const a = Math.sin(i * 0.55) * 0.3;
  const b = Math.sin(i * 0.23 + 1.2) * 0.22;
  const c = Math.sin(i * 1.1 + 0.4) * 0.1;
  return Math.min(1, Math.max(0.14, 0.5 + a + b + c));
}

interface OndaSonoraProps {
  className?: string;
  /** Color de las barras. Sobre el fondo fotografico se usa el ambar de la imagen. */
  barraClassName?: string;
}

export function OndaSonora({
  className = "",
  barraClassName = "bg-primary",
}: OndaSonoraProps) {
  return (
    <div aria-hidden className={`flex items-end gap-[3px] ${className}`}>
      {Array.from({ length: BARRAS }, (_, i) => {
        const h = altura(i);
        return (
          <span
            key={i}
            className={`flex-1 origin-bottom rounded-full motion-safe:animate-[onda_2.6s_ease-in-out_infinite] ${barraClassName}`}
            style={{
              height: `${(h * 100).toFixed(1)}%`,
              opacity: Number((0.22 + h * 0.5).toFixed(3)),
              animationDelay: `${(i * 0.055).toFixed(2)}s`,
            }}
          />
        );
      })}
    </div>
  );
}
