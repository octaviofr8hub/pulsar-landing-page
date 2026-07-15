import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const wordmarkVariants = cva("wordmark-glow font-display font-bold text-white", {
  variants: {
    size: {
      // El margen negativo compensa el tracking sobrante tras la última letra,
      // que de lo contrario descentra el wordmark.
      sm: "text-lg tracking-[0.32em] -me-[0.32em] md:text-xl",
      lg: "text-3xl tracking-[0.26em] -me-[0.26em] md:text-4xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

type WordmarkTag = "span" | "div";

export interface WordmarkProps extends VariantProps<typeof wordmarkVariants> {
  as?: WordmarkTag;
  className?: string;
}

/**
 * Logotipo de la marca. Las letras van literales en el JSX (no `uppercase` por
 * CSS) porque el wordmark es un asset de marca, no texto en mayúsculas.
 */
export function Wordmark({ as: Tag = "span", size, className }: WordmarkProps) {
  return (
    <Tag className={cn(wordmarkVariants({ size }), className)}>PULSAR</Tag>
  );
}
