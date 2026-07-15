"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export function VisionSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="vision"
      className="relative flex min-h-screen items-center px-6 md:px-16 lg:px-24"
    >
      <motion.div
        className="glass-panel max-w-xl rounded-3xl border border-space-800 p-8 md:p-10"
        initial={{ opacity: 0, x: reducedMotion ? 0 : -48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Text as="span" size="sm" tone="accent" className="tracking-[0.3em]">
          Visión IA
        </Text>
        <Heading as="h2" level={2} className="mt-4">
          Experiencia de compra inteligente
        </Heading>
        <Text size="lg" className="mt-5">
          La IA optimiza el espacio hasta un 87% de eficiencia volumétrica.
          Datos exactos para las mejores decisiones logísticas: menor costo,
          mayor eficiencia.
        </Text>
        <div className="mt-8 flex items-baseline gap-3">
          <span className="font-display text-5xl font-semibold text-brand-400 md:text-6xl">
            87%
          </span>
          <Text as="span" size="sm">
            de eficiencia volumétrica*
          </Text>
        </div>
        <Text size="xs" tone="muted" className="mt-6">
          *Promedio estimado según simulaciones internas de consolidación de
          carga.
        </Text>
      </motion.div>
    </section>
  );
}
