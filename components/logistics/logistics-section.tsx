"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Heading } from "@/components/ui/heading";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";

const ROUTES = [
  { from: "New York", to: "Tokyo", eta: "6h 32m" },
  { from: "New York", to: "Shanghai", eta: "7h 05m" },
] as const;

export function LogisticsSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="logistics"
      className="relative flex min-h-screen items-center justify-end px-6 md:px-16 lg:px-24"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l from-space-950 via-space-950/85 to-transparent md:w-2/3"
        aria-hidden="true"
      />
      <motion.div
        className="relative max-w-xl text-left md:text-right"
        initial={{ opacity: 0, x: reducedMotion ? 0 : 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <MonoLabel tone="accent">Logística Global</MonoLabel>
        <Heading as="h2" level={2} className="mt-5">
          De New York a Tokyo
        </Heading>
        <Text size="lg" className="mt-6 md:ml-auto md:max-w-lg">
          Red logística rápida, segura y sin fricciones. En horas, no en
          semanas. Monitoreo en tiempo real durante todo el tránsito orbital.
        </Text>

        <div className="mt-12 border-t border-space-800">
          {ROUTES.map((route) => (
            <div
              key={`${route.from}-${route.to}`}
              className="flex items-baseline justify-between gap-6 border-b border-space-800 py-5"
            >
              <span className="font-display text-lg tracking-tight text-white">
                {route.from}
                <span className="mx-3 text-brand-400" aria-hidden="true">
                  →
                </span>
                {route.to}
              </span>
              <span className="font-mono text-sm text-space-300">
                {route.eta}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
