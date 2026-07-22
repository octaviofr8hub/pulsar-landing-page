import { cva } from "class-variance-authority";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { MonoLabel } from "@/components/ui/mono-label";
import { cn } from "@/lib/utils";
import type { MediaRatio } from "@/types/media";

/** Proporción → clase aspect-* de Tailwind. */
const ratioClass: Record<MediaRatio, string> = {
  square: "aspect-square",
  "portrait-3-4": "aspect-[3/4]",
  "portrait-2-3": "aspect-[2/3]",
  "landscape-4-3": "aspect-[4/3]",
  "landscape-16-10": "aspect-[16/10]",
  "video-16-9": "aspect-video",
  "wide-21-9": "aspect-[21/9]",
};

const frameVariants = cva(
  "group relative isolate block overflow-hidden rounded-xl border transition-colors duration-300",
  {
    variants: {
      active: {
        true: "border-brand-500 shadow-glow",
        false: "border-space-800 hover:border-space-600",
      },
    },
    defaultVariants: { active: false },
  },
);

export interface MediaFrameProps {
  ratio: MediaRatio;
  /** Marco destacado/seleccionado (borde con glow de marca) */
  active?: boolean;
  /** Etiqueta corta mostrada en el placeholder (p. ej. "03 · Salida al mar") */
  label: string;
  /** Dimensión recomendada, p. ej. "1200 × 1600" */
  spec?: string;
  /** Ruta de la imagen final. Si no se pasa, se muestra el placeholder. */
  src?: string;
  alt?: string;
  /** Atributo `sizes` para el srcset responsivo cuando hay imagen. */
  sizes?: string;
  /** Precarga la imagen (Next.js 16 — reemplaza al deprecado `priority`). */
  preload?: boolean;
  className?: string;
}

/** Esquinas tipo HUD que enmarcan el contenido (estética videojuego). */
function CornerBrackets({ active }: { active: boolean }) {
  const tone = active
    ? "border-brand-400"
    : "border-space-600 group-hover:border-brand-500";
  const base =
    "pointer-events-none absolute size-4 transition-colors duration-300";
  return (
    <div aria-hidden="true">
      <span className={cn(base, "left-2 top-2 border-l border-t", tone)} />
      <span className={cn(base, "right-2 top-2 border-r border-t", tone)} />
      <span className={cn(base, "bottom-2 left-2 border-b border-l", tone)} />
      <span className={cn(base, "bottom-2 right-2 border-b border-r", tone)} />
    </div>
  );
}

/**
 * Marco de imagen del sistema Pulsar — el "marco" donde vive una imagen
 * generada con IA. Sin imagen (`src`) muestra un placeholder HUD con su
 * etiqueta y dimensión; con imagen renderiza `next/image` a pantalla completa
 * del contenedor.
 */
export function MediaFrame({
  ratio,
  label,
  spec,
  src,
  alt,
  sizes = "100vw",
  preload,
  active = false,
  className,
}: MediaFrameProps) {
  return (
    <div
      className={cn(frameVariants({ active }), ratioClass[ratio], className)}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-space-900 to-space-950">
          <div
            className="hud-grid absolute inset-0 opacity-60"
            aria-hidden="true"
          />
          <div
            className="absolute left-1/2 top-1/2 size-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/5 blur-2xl"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon
              className={cn(
                "size-6",
                active ? "text-brand-400" : "text-space-600",
              )}
              aria-hidden="true"
            />
            <MonoLabel tone={active ? "accent" : "secondary"} size="sm">
              {label}
            </MonoLabel>
            {spec ? (
              <span className="font-mono text-xs text-space-500">{spec}</span>
            ) : null}
          </div>
        </div>
      )}
      {active ? (
        <MonoLabel
          tone="accent"
          className="absolute right-3 top-3 rounded-full border border-brand-500/60 bg-space-950/70 px-2 py-1"
        >
          Activo
        </MonoLabel>
      ) : null}
      <CornerBrackets active={active} />
    </div>
  );
}
