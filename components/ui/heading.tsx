import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const headingVariants = cva(
  "font-display tracking-tight text-balance text-white",
  {
    variants: {
      level: {
        1: "text-4xl font-semibold leading-[1.05] md:text-6xl lg:text-7xl",
        2: "text-3xl font-semibold leading-tight md:text-5xl",
        3: "text-lg font-medium leading-snug md:text-xl",
      },
    },
    defaultVariants: {
      level: 2,
    },
  },
);

type HeadingTag = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps extends VariantProps<typeof headingVariants> {
  as?: HeadingTag;
  id?: string;
  className?: string;
  children: ReactNode;
}

export function Heading({
  as: Tag = "h2",
  level,
  id,
  className,
  children,
}: HeadingProps) {
  return (
    <Tag id={id} className={cn(headingVariants({ level }), className)}>
      {children}
    </Tag>
  );
}
