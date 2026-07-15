"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.65em", rotateX: -75, filter: "blur(12px)" },
  visible: { opacity: 1, y: "0em", rotateX: 0, filter: "blur(0px)" },
};

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

/**
 * Reveal palabra por palabra estilo ReactBits (blur + rotación 3D + spring),
 * implementado con Framer Motion para no sumar dependencias.
 */
export function SplitText({
  text,
  className,
  delay = 0.2,
  stagger = 0.055,
}: SplitTextProps) {
  const words = useMemo(() => text.split(" "), [text]);
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("inline-block [perspective:800px]", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          className="inline-block will-change-transform"
          initial="hidden"
          animate="visible"
          variants={wordVariants}
          transition={{
            delay: delay + index * stagger,
            type: "spring",
            damping: 24,
            stiffness: 150,
          }}
        >
          {index < words.length - 1 ? word + " " : word}
        </motion.span>
      ))}
    </span>
  );
}
