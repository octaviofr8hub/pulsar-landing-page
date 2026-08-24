import { cn } from "@/lib/utils";
import type { CountryCode } from "@/types/network";

/**
 * Banderas de los países de la red, dibujadas en SVG.
 *
 * Son el **único** sitio del proyecto donde entran colores fuera de la escala
 * `brand-*` / `space-*`: son colores nacionales, no decisiones de marca, y por
 * eso van aquí encerrados y no sueltos por los componentes. Tampoco se usan
 * emoji (🇲🇽): en Windows no hay glifos de bandera y se ven dos letras sueltas.
 *
 * Sin estado ni datos: primitiva de `components/ui/`.
 */

export type { CountryCode };

/** Nombre del país en cada idioma, para el texto alternativo. */
export const COUNTRY_NAMES: Record<CountryCode, { es: string; en: string }> = {
  mx: { es: "México", en: "Mexico" },
  us: { es: "Estados Unidos", en: "United States" },
  nl: { es: "Países Bajos", en: "Netherlands" },
  sg: { es: "Singapur", en: "Singapore" },
  jp: { es: "Japón", en: "Japan" },
  cn: { es: "China", en: "China" },
  de: { es: "Alemania", en: "Germany" },
};

/** Estrella de cinco puntas centrada en (cx, cy). */
function star(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    points.push(
      `${(cx + Math.cos(outer) * radius).toFixed(2)},${(cy + Math.sin(outer) * radius).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

/** Lienzo de 18 × 12: la proporción 3:2 que usan casi todas estas banderas. */
const FLAGS: Record<CountryCode, React.ReactNode> = {
  mx: (
    <>
      <rect width="6" height="12" fill="#006847" />
      <rect x="6" width="6" height="12" fill="#ffffff" />
      <rect x="12" width="6" height="12" fill="#ce1126" />
      <circle cx="9" cy="6" r="1.5" fill="#8c6239" />
    </>
  ),
  us: (
    <>
      <rect width="18" height="12" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((y) => (
        <rect
          key={y}
          y={y * (12 / 13)}
          width="18"
          height={12 / 13}
          fill="#ffffff"
        />
      ))}
      <rect width="8" height={(12 / 13) * 7} fill="#3c3b6e" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}:${col}`}
            cx={1.2 + col * 2}
            cy={1 + row * 1.8}
            r="0.35"
            fill="#ffffff"
          />
        )),
      )}
    </>
  ),
  nl: (
    <>
      <rect width="18" height="4" fill="#ae1c28" />
      <rect y="4" width="18" height="4" fill="#ffffff" />
      <rect y="8" width="18" height="4" fill="#21468b" />
    </>
  ),
  sg: (
    <>
      <rect width="18" height="6" fill="#ed2939" />
      <rect y="6" width="18" height="6" fill="#ffffff" />
      <circle cx="4" cy="3" r="2.2" fill="#ffffff" />
      <circle cx="5.2" cy="3" r="2.2" fill="#ed2939" />
      {[
        [7.4, 1.6],
        [8.8, 2.7],
        [8.3, 4.3],
        [6.5, 4.3],
        [6, 2.7],
      ].map(([cx, cy]) => (
        <circle key={`${cx}`} cx={cx} cy={cy} r="0.4" fill="#ffffff" />
      ))}
    </>
  ),
  jp: (
    <>
      <rect width="18" height="12" fill="#ffffff" />
      <circle cx="9" cy="6" r="3.4" fill="#bc002d" />
    </>
  ),
  cn: (
    <>
      <rect width="18" height="12" fill="#de2910" />
      <polygon points={star(4, 3.6, 2)} fill="#ffde00" />
      {[
        [7.6, 1.4],
        [9, 2.8],
        [9, 4.8],
        [7.6, 6],
      ].map(([cx, cy]) => (
        <polygon
          key={`${cx}:${cy}`}
          points={star(cx, cy, 0.7)}
          fill="#ffde00"
        />
      ))}
    </>
  ),
  de: (
    <>
      <rect width="18" height="4" fill="#000000" />
      <rect y="4" width="18" height="4" fill="#dd0000" />
      <rect y="8" width="18" height="4" fill="#ffce00" />
    </>
  ),
};

export interface FlagProps {
  country: CountryCode;
  /** Nombre del país; si se pasa, la bandera deja de ser decorativa. */
  title?: string;
  className?: string;
}

/**
 * Bandera de 18 × 12 con el canto redondeado y una línea hairline, para que no
 * flote sobre el fondo oscuro. Va junto al nombre del puerto, así que por
 * defecto es decorativa y no la lee el lector de pantalla.
 */
export function Flag({ country, title, className }: FlagProps) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={cn(
        "h-[11px] w-[17px] shrink-0 rounded-[2px] ring-1 ring-white/20",
        className,
      )}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {FLAGS[country]}
    </svg>
  );
}
