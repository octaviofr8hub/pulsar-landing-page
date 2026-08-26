"use client";

import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { StatStrip } from "./shared";
import { ScrollFade } from "./motion";
import { useLanguage } from "@/components/i18n/use-language";
import { useIsMobile } from "@/components/viewport/use-is-mobile";

const COPY = {
  es: {
    h1: [
      { lead: "Cualquier punto de la Tierra en ", accent: "90 minutos." },
      { lead: "La Luna en ", accent: "días." },
      { lead: "Marte, cuando estés ", accent: "listo." },
    ],
    subtitle: "Pulsar: la logística de la civilización multiplanetaria.",
    ctaPrimary: "Reserva capacidad",
    ctaSecondary: "Mira cómo funciona",
    stats: [
      { label: "Operación", value: "24/7" },
      { label: "Entrega suborbital", value: "≤ 90 min" },
      { label: "Fiabilidad", value: "99.9%" },
      { label: "Capacidad flexible", value: "Bajo demanda" },
    ],
    globeHint: "Arrastra para rotar · usa + / − para acercar",
  },
  en: {
    h1: [
      { lead: "Anywhere on Earth in ", accent: "90 minutes." },
      { lead: "The Moon in ", accent: "days." },
      { lead: "Mars, when you're ", accent: "ready." },
    ],
    subtitle: "Pulsar: logistics for a multiplanetary civilization.",
    ctaPrimary: "Book capacity",
    ctaSecondary: "See how it works",
    stats: [
      { label: "Operation", value: "24/7" },
      { label: "Suborbital delivery", value: "≤ 90 min" },
      { label: "Reliability", value: "99.9%" },
      { label: "Flexible capacity", value: "On demand" },
    ],
    globeHint: "Drag to rotate · use + / − to zoom",
  },
} as const;

export function Hero() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  // Sólo para decidir qué se monta encima del globo: en un teléfono la pista de
  // arrastre cae sobre la tira de cifras y los botones de zoom chocan con el
  // panel de lanzamientos. El pellizco para acercar sigue disponible.
  const isMobile = useIsMobile();

  return (
    <section
      id="top"
      // `svh` en móvil: `100vh` se pelea con la barra del navegador.
      className="relative h-svh min-h-[640px] overflow-hidden md:h-screen"
    >
      {/* Globo full-bleed interactivo: la Tierra es la vista por defecto; se
          arrastra y se hace zoom con los botones, sin secuestrar el scroll.
          Luna y Marte cierran el encuadre a la derecha — los tres destinos del
          titular, en el orden en que los abre la red. */}
      <div className="absolute inset-0">
        <GlobeCanvas
          mode="orbit"
          textured
          interactive
          autoSpin
          spinSpeed={0.045}
          cameraDistance={5.2}
          minDistance={3.2}
          maxDistance={9}
          showMoon
          showMars
          showStars
          showZoomButtons
          zoomButtonsClassName="top-24 hidden md:flex"
          showHint={!isMobile}
          hintLabel={c.globeHint}
        />
      </div>

      {/* Scrims en gradiente (sin bordes duros): dan legibilidad al texto. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/55 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent" />

      {/* El texto se despide subiendo mientras el globo se queda: el scroll
          separa las dos capas en vez de arrastrarlas juntas. */}
      <ScrollFade className="pointer-events-none relative mx-auto flex h-full max-w-[1600px] flex-col justify-center px-6 md:px-10 lg:px-14">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* El cuerpo va en clases y no en `style`: un `style` inline gana
              siempre a Tailwind y el titular no podría encoger en móvil. */}
          <h1
            className="text-[1.9rem] text-foreground md:text-[clamp(2.6rem,5.4vw,4.4rem)]"
            style={{
              fontFamily: "var(--font-display)",
              lineHeight: 1.04,
              fontWeight: 600,
            }}
          >
            {c.h1.map((ln, idx) => (
              <span key={idx}>
                {ln.lead}
                <span className="text-pulse-cyan">{ln.accent}</span>
                {idx < c.h1.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-md text-[15px] text-muted-foreground md:mt-6 md:text-[17px]">
            {c.subtitle}
          </p>
          <div className="pointer-events-auto mt-8 flex flex-col gap-3 md:flex-row md:flex-wrap">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90 md:w-auto"
            >
              <a href="#cta">
                {c.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-border bg-white/5 text-foreground hover:bg-white/10 md:w-auto"
            >
              <a href="#viaje">
                <Play className="mr-1 h-4 w-4" /> {c.ctaSecondary}
              </a>
            </Button>
          </div>
        </motion.div>

        {/* En móvil la tira va en el flujo, debajo de los botones: en absoluto
            se solapaba con ellos. De `md` para arriba vuelve a anclarse abajo. */}
        <div className="pointer-events-auto mt-8 md:absolute md:inset-x-10 md:bottom-8 md:mx-auto md:mt-0 md:max-w-[1600px] lg:inset-x-14">
          <StatStrip items={[...c.stats]} />
        </div>
      </ScrollFade>
    </section>
  );
}
