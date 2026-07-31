"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Estrella de cuatro puntas de lados cóncavos. Cada tramo es una curva
 * cuadrática cuyo punto de control es el centro exacto del lienzo: eso estrecha
 * la cintura al 35 % del radio y deja las puntas afiladas — la silueta de
 * destello que pide la marca.
 */
const STAR_PATH =
  "M 50 2 Q 50 50 98 50 Q 50 50 50 98 Q 50 50 2 50 Q 50 50 50 2 Z";

const markVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-14 w-14",
      xl: "h-20 w-20",
    },
  },
  defaultVariants: { size: "sm" },
});

export interface PulsarMarkProps extends VariantProps<typeof markVariants> {
  className?: string;
  /** Desactiva el latido del halo (listados densos, favicons estáticos). */
  still?: boolean;
}

/**
 * Isotipo de Pulsar. Cuatro capas apiladas hacen el brillo: halo radial que
 * late, copia desenfocada de la estrella (bloom), la estrella nítida con
 * degradado de núcleo caliente a azul de marca, y un punto blanco central.
 * El `drop-shadow` remata el halo fuera del propio SVG.
 */
export function PulsarMark({
  size,
  className,
  still = false,
}: PulsarMarkProps) {
  // Los degradados viven en <defs> y necesitan id único: el logo sale dos veces
  // por página (navbar y footer) y los ids repetidos se pisan entre sí.
  const uid = useId().replace(/:/g, "");
  const core = `pulsar-core-${uid}`;
  const halo = `pulsar-halo-${uid}`;
  const bloom = `pulsar-bloom-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Pulsar"
      className={cn(
        markVariants({ size }),
        // Dos sombras: uno ciñe el contorno, otra derrama el halo lejos.
        "[filter:drop-shadow(0_0_6px_var(--pulse-cyan))_drop-shadow(0_0_22px_var(--brand-glow))]",
        className,
      )}
    >
      <defs>
        {/* Núcleo desplazado arriba-izquierda: da volumen, como una fuente de luz. */}
        <radialGradient id={core} cx="42%" cy="36%" r="72%">
          <stop offset="0%" className="[stop-color:var(--brand-50)]" />
          <stop offset="22%" className="[stop-color:var(--brand-200)]" />
          <stop offset="48%" className="[stop-color:var(--pulse-cyan)]" />
          <stop offset="76%" className="[stop-color:var(--pulse-blue)]" />
          <stop offset="100%" className="[stop-color:var(--brand-600)]" />
        </radialGradient>

        <radialGradient id={halo}>
          <stop
            offset="0%"
            className="[stop-color:var(--brand-200)]"
            stopOpacity="0.85"
          />
          <stop
            offset="30%"
            className="[stop-color:var(--pulse-glow)]"
            stopOpacity="0.4"
          />
          <stop
            offset="65%"
            className="[stop-color:var(--pulse-blue)]"
            stopOpacity="0.14"
          />
          <stop
            offset="100%"
            className="[stop-color:var(--pulse-blue)]"
            stopOpacity="0"
          />
        </radialGradient>

        <filter id={bloom} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <circle
        cx="50"
        cy="50"
        r="49"
        fill={`url(#${halo})`}
        className={still ? undefined : "pulsar-beat"}
      />

      <path d={STAR_PATH} fill={`url(#${core})`} filter={`url(#${bloom})`} />

      <path d={STAR_PATH} fill={`url(#${core})`} />

      {/* Punto blanco: el destello especular que hace que “resalte”. */}
      <circle
        cx="50"
        cy="50"
        r="6"
        className="[fill:var(--brand-50)]"
        filter={`url(#${bloom})`}
      />
    </svg>
  );
}

const logoTextVariants = cva("font-display font-semibold text-white", {
  variants: {
    size: {
      sm: "text-[19px]",
      md: "text-[22px]",
      lg: "text-[30px]",
      xl: "text-[42px]",
    },
  },
  defaultVariants: { size: "sm" },
});

export interface PulsarLogoProps extends VariantProps<typeof markVariants> {
  className?: string;
  still?: boolean;
}

/** Isotipo + logotipo. Es el bloque que va en navbar, footer y cabeceras. */
export function PulsarLogo({ size, className, still }: PulsarLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <PulsarMark size={size} still={still} />
      <span className={logoTextVariants({ size })}>Pulsar</span>
    </span>
  );
}
