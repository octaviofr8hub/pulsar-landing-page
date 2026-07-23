"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { StatStrip } from "./shared";
import { useLanguage } from "@/components/i18n/use-language";

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
    scrollHint: "Haz scroll para salir de órbita ↓",
    globeHint: "Arrastra para rotar · haz scroll para viajar",
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
    scrollHint: "Scroll to leave orbit ↓",
    globeHint: "Drag to rotate · scroll to travel",
  },
} as const;

export function Hero() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / (rect.height - vh)));
      setZoom(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id="top" ref={ref} className="relative min-h-[210vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 md:left-[28%]">
          <GlobeCanvas
            mode="hero"
            showMoon
            showMars
            zoomProgress={zoom}
            autoSpin
            spinSpeed={0.06}
            showHint
            hintLabel={c.globeHint}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/70 to-transparent" />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1 - zoom * 1.4, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-foreground"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem,5vw,4rem)",
                lineHeight: 1.05,
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
            <p className="mt-6 max-w-md text-[17px] text-muted-foreground">
              {c.subtitle}
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
              >
                <a href="#cta">
                  {c.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
              >
                <a href="#viaje">
                  <Play className="mr-1 h-4 w-4" /> {c.ctaSecondary}
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-auto absolute inset-x-6 bottom-8 mx-auto max-w-7xl"
            animate={{ opacity: 1 - zoom * 2 }}
          >
            <StatStrip items={[...c.stats]} />
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] uppercase tracking-widest text-muted-foreground"
          animate={{ opacity: 1 - zoom * 3 }}
        >
          {c.scrollHint}
        </motion.div>
      </div>
    </div>
  );
}
