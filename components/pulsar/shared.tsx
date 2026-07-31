"use client";

import { animate, motion, useInView, useMotionValue } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-pulse-blue/30 bg-pulse-blue/10 px-3 py-1 text-pulse-cyan">
      <span className="h-1.5 w-1.5 rounded-full bg-pulse-cyan animate-pulse" />
      <span className="text-[13px] tracking-wide uppercase">{children}</span>
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-[1600px] px-6 py-24 md:px-10 md:py-32 lg:px-14 ${className}`}
    >
      {children}
    </section>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StatStrip({
  items,
  /** 4 para anchos completos; 2 cuando la tira vive en una columna estrecha. */
  columns = 4,
}: {
  items: { label: string; value: string }[];
  columns?: 2 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-2 divide-x divide-y divide-border rounded-xl border border-border bg-space-900/60 backdrop-blur ${
        columns === 4 ? "md:grid-cols-4 md:divide-y-0" : ""
      }`}
    >
      {items.map((it) => (
        <div key={it.label} className="px-5 py-4">
          <div className="font-display text-pulse-cyan">{it.value}</div>
          <div className="text-[13px] leading-snug text-muted-foreground">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface IconStat {
  icon: LucideIcon;
  value: string;
  unit?: string;
  label: string;
}

/**
 * Tira de cifras con icono circular. El separador es un hairline de 1 px hecho
 * con `gap-px` sobre el color del borde — sin cajas que rodeen cada dato.
 */
export function IconStatStrip({
  items,
  className = "",
}: {
  items: IconStat[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div
            key={it.label}
            className="flex items-center gap-4 bg-space-900/85 px-5 py-5 backdrop-blur"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pulse-blue/40 text-pulse-cyan">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[19px] leading-none text-foreground">
                {it.value}
                {it.unit && (
                  <span className="ml-1 font-mono text-[12px] tracking-wide text-muted-foreground">
                    {it.unit}
                  </span>
                )}
              </div>
              <div className="mt-1.5 truncate text-[13px] text-muted-foreground">
                {it.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Cifra que cuenta hasta su valor al entrar en pantalla y vuelve a animarse
 * cuando el valor cambia (por ejemplo, al elegir otra ruta).
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 1.1,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, motionValue]);

  return <span ref={ref}>{display}</span>;
}
