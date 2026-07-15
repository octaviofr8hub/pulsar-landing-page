"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import { PillarCard } from "./pillar-card";
import { VALUE_PILLARS } from "./pillars";

export function CtaSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="cta"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <Text as="span" size="sm" tone="accent" className="tracking-[0.3em]">
          Únete a la red
        </Text>
        <Heading as="h2" level={2} className="mx-auto mt-4 max-w-3xl">
          La infraestructura logística del mañana, disponible hoy
        </Heading>
      </motion.div>
      <div className="mt-14 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_PILLARS.map((pillar, index) => (
          <PillarCard key={pillar.title} pillar={pillar} index={index} />
        ))}
      </div>
      <motion.div
        className="mt-14"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <Button size="lg" type="button">
          Transformar mi cadena de suministro
        </Button>
      </motion.div>
      <Text size="xs" tone="muted" className="mt-16 max-w-xl">
        *Tiempos de entrega estimados, sujetos a condiciones operativas y
        regulatorias de cada ruta.
      </Text>
      <Text size="xs" tone="muted" className="mt-3">
        Confianza · Velocidad · Reutilizable · Conectamos el mundo
      </Text>
    </section>
  );
}
