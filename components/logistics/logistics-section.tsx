"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Rocket } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

const ROUTES = [
  { from: "New York", to: "Tokyo" },
  { from: "New York", to: "Shanghai" },
] as const;

export function LogisticsSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="logistics"
      className="relative flex min-h-screen items-center justify-end px-6 md:px-16 lg:px-24"
    >
      <motion.div
        className="glass-panel max-w-xl rounded-3xl border border-space-800 p-8 text-left md:p-10 md:text-right"
        initial={{ opacity: 0, x: reducedMotion ? 0 : 48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Text as="span" size="sm" tone="accent" className="tracking-[0.3em]">
          Logística Global
        </Text>
        <Heading as="h2" level={2} className="mt-4">
          De New York a Tokyo
        </Heading>
        <Text size="lg" className="mt-5">
          Red logística rápida, segura y sin fricciones. En horas, no en
          semanas. Monitoreo en tiempo real durante todo el tránsito orbital.
        </Text>
        <div className="mt-8 flex flex-wrap gap-3 md:justify-end">
          {ROUTES.map((route) => (
            <span
              key={`${route.from}-${route.to}`}
              className="inline-flex items-center gap-2 rounded-full border border-space-700 bg-space-900/40 px-4 py-2 text-sm text-space-200"
            >
              {route.from}
              <Rocket className="size-4 text-brand-400" aria-hidden="true" />
              {route.to}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
