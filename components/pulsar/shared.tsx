"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

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
      className={`relative mx-auto w-full max-w-7xl px-6 py-24 md:py-32 ${className}`}
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
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-space-900/60 backdrop-blur md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="px-5 py-4">
          <div
            className="text-pulse-cyan"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {it.value}
          </div>
          <div className="text-[13px] text-muted-foreground">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
