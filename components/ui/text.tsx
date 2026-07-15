import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs leading-relaxed",
      sm: "text-sm leading-relaxed",
      base: "text-base leading-relaxed",
      lg: "text-lg leading-relaxed md:text-xl",
    },
    tone: {
      primary: "text-white",
      secondary: "text-space-400",
      muted: "text-space-500",
      accent: "text-brand-400",
    },
  },
  defaultVariants: {
    size: "base",
    tone: "secondary",
  },
});

type TextTag = "p" | "span";

export interface TextProps extends VariantProps<typeof textVariants> {
  as?: TextTag;
  className?: string;
  children: ReactNode;
}

export function Text({
  as: Tag = "p",
  size,
  tone,
  className,
  children,
}: TextProps) {
  return (
    <Tag className={cn(textVariants({ size, tone }), className)}>
      {children}
    </Tag>
  );
}
