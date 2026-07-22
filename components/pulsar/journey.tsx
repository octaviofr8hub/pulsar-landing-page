"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Smartphone,
  PackageCheck,
  Ship,
  Droplets,
  Flame,
  Anchor,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Button } from "./ui/button";

const PHASES = [
  {
    icon: Smartphone,
    title: "Reserva",
    desc: "Reservas el envío desde el móvil en segundos. Cotización dinámica y manifiesto digital.",
  },
  {
    icon: PackageCheck,
    title: "Preparación",
    desc: "Integración horizontal: el cohete se carga en el hangar del puerto, ya en tierra firme.",
  },
  {
    icon: Ship,
    title: "Salida al mar",
    desc: "Un buque semisumergible lleva el vehículo 30–60 km mar adentro, lejos de las ciudades.",
  },
  {
    icon: Droplets,
    title: "Carga de propelente",
    desc: "El propelente se carga solo en el mar. Cero riesgo sobre poblaciones.",
  },
  {
    icon: Flame,
    title: "Lanzamiento y reentrada",
    desc: "Vuelo suborbital sobre el océano y reentrada precisa en la plataforma destino.",
  },
  {
    icon: Anchor,
    title: "Última milla",
    desc: "Barcaza rápida a puerto, aduana ya liberada en vuelo y entrega a domicilio.",
  },
];

export function Journey() {
  const [i, setI] = useState(0);
  const phase = PHASES[i];
  const Icon = phase.icon;

  return (
    <Section id="viaje" className="border-t border-border">
      <Reveal>
        <Eyebrow>Cómo funciona</Eyebrow>
        <h2
          className="mt-5 max-w-2xl text-foreground"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem,3.5vw,3rem)",
            lineHeight: 1.08,
            fontWeight: 600,
          }}
        >
          El viaje de tu <span className="text-pulse-cyan">paquete</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] text-muted-foreground">
          La mercancía se carga en tierra; el propelente, en el mar. Tú entregas
          y recibes: todo lo demás es invisible, como debe ser.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,360px)] lg:items-center">
          {/* the card deck */}
          <div className="relative h-80">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={i}
                className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-pulse-blue/30 bg-gradient-to-br from-space-800 to-space-950 p-8"
                initial={{ opacity: 0, x: 60, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -60, rotate: -2 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pulse-blue/20 blur-3xl" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-widest text-pulse-cyan">
                    Fase {i + 1} / {PHASES.length}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-pulse-blue/15 text-pulse-cyan">
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
                <div>
                  <h3
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {phase.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[16px] text-muted-foreground">
                    {phase.desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div>
            {/* progress dots */}
            <div className="flex gap-2">
              {PHASES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= i ? "bg-pulse-cyan" : "bg-white/10"}`}
                  aria-label={`Ir a fase ${idx + 1}`}
                />
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-border bg-white/5"
                onClick={() => setI((v) => Math.max(0, v - 1))}
                disabled={i === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                className="flex-1 rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
                onClick={() => setI((v) => Math.min(PHASES.length - 1, v + 1))}
                disabled={i === PHASES.length - 1}
              >
                Siguiente fase <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-pulse-blue/30 bg-pulse-blue/10 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pulse-cyan" />
              <p className="text-[13px] text-muted-foreground">
                <span className="text-foreground">
                  Despacho aduanero 100 % digital
                </span>{" "}
                mientras el cohete vuela: la carga aterriza ya liberada.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
