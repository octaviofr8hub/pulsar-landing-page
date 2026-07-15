"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";

import { PillarRow } from "./pillar-row";
import { VALUE_PILLARS } from "./pillars";

export function CtaSection() {
  const reducedMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="cta"
      className="relative flex min-h-screen items-center px-6 py-24 md:px-16 lg:px-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <MonoLabel tone="accent">Únete a la red</MonoLabel>
            <Heading as="h2" level={2} className="mt-5 max-w-md">
              La infraestructura logística del mañana, disponible hoy
            </Heading>
            <Text size="lg" className="mt-6 max-w-md">
              Cuatro corredores activos, ventanas de lanzamiento cada pocas
              horas y una sola factura de origen a destino.
            </Text>
            <Button size="lg" type="button" className="mt-10">
              Transformar mi cadena de suministro
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          >
            <MonoLabel className="mb-5 block">Qué nos distingue</MonoLabel>
            <div className="border-b border-space-800">
              {VALUE_PILLARS.map((pillar, index) => (
                <PillarRow
                  key={pillar.title}
                  pillar={pillar}
                  index={index}
                  open={openIndex === index}
                  onToggle={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                />
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-space-800 pt-8 md:flex-row md:items-center md:justify-between">
          <MonoLabel>
            Confianza · Velocidad · Reutilizable · Conectamos el mundo
          </MonoLabel>
          <Text size="xs" tone="muted" className="max-w-md md:text-right">
            *Tiempos de entrega estimados, sujetos a condiciones operativas y
            regulatorias de cada ruta.
          </Text>
        </div>
      </div>
    </section>
  );
}
