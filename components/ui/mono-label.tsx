import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const monoLabelVariants = cva("font-mono uppercase leading-none", {
  variants: {
    tone: {
      muted: "text-space-500",
      secondary: "text-space-400",
      accent: "text-brand-400",
      primary: "text-white",
    },
    size: {
      xs: "text-[0.6875rem] tracking-[0.18em]",
      sm: "text-xs tracking-[0.16em]",
    },
  },
  defaultVariants: {
    tone: "muted",
    size: "xs",
  },
});

export interface MonoLabelProps extends VariantProps<typeof monoLabelVariants> {
  className?: string;
  children: ReactNode;
}

/**
 * Microetiqueta del sistema editorial: numeración, encabezados de dato y
 * marcas de sección. Es el único lugar donde la marca aplica mayúsculas por
 * CSS — aquí sí forman parte del sistema tipográfico, no son un adorno suelto.
 */
export function MonoLabel({ tone, size, className, children }: MonoLabelProps) {
  return (
    <span className={cn(monoLabelVariants({ tone, size }), className)}>
      {children}
    </span>
  );
}
