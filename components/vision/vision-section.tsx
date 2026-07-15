"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Heading } from "@/components/ui/heading";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";

export function VisionSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="vision"
      className="relative flex min-h-screen items-center px-6 md:px-16 lg:px-24"
    >
      {/* Scrim en vez de card: sostiene el contraste del texto sobre la escena
          3D sin encerrarlo en una caja de vidrio. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-space-950 via-space-950/85 to-transparent md:w-2/3"
        aria-hidden="true"
      />
      <motion.div
        className="relative max-w-xl"
        initial={{ opacity: 0, x: reducedMotion ? 0 : -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <MonoLabel tone="accent">Visión IA</MonoLabel>
        <Heading as="h2" level={2} className="mt-5">
          Experiencia de compra inteligente
        </Heading>
        <Text size="lg" className="mt-6 max-w-lg">
          La IA optimiza el espacio hasta un 87% de eficiencia volumétrica.
          Datos exactos para las mejores decisiones logísticas: menor costo,
          mayor eficiencia.
        </Text>

        <div className="mt-12 border-t border-space-800 pt-8">
          <MonoLabel>Eficiencia volumétrica</MonoLabel>
          <div className="mt-3 flex items-baseline gap-4">
            <span className="font-display text-6xl font-semibold tracking-tight text-white md:text-7xl">
              87%
            </span>
            <Text as="span" size="sm" className="max-w-[12rem]">
              promedio por lanzamiento consolidado*
            </Text>
          </div>
        </div>

        <Text size="xs" tone="muted" className="mt-8">
          *Promedio estimado según simulaciones internas de consolidación de
          carga.
        </Text>
      </motion.div>
    </section>
  );
}
