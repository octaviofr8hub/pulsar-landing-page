"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { StatStrip } from "./shared";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // as the hero scrolls up, increase zoom-out toward 1
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
        {/* globe layer */}
        <div className="absolute inset-0 md:left-[28%]">
          <GlobeCanvas
            mode="hero"
            showMoon
            showMars
            zoomProgress={zoom}
            autoSpin
            spinSpeed={0.06}
            showHint
            hintLabel="Arrastra para rotar · haz scroll para viajar"
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
              Cualquier punto de la Tierra en{" "}
              <span className="text-pulse-cyan">90 minutos.</span>
              <br />
              La Luna en <span className="text-pulse-cyan">días.</span>
              <br />
              Marte, cuando estés{" "}
              <span className="text-pulse-cyan">listo.</span>
            </h1>
            <p className="mt-6 max-w-md text-[17px] text-muted-foreground">
              Pulsar: la logística de la civilización multiplanetaria.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
              >
                <a href="#cta">
                  Reserva capacidad <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
              >
                <a href="#viaje">
                  <Play className="mr-1 h-4 w-4" /> Mira cómo funciona
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-auto absolute inset-x-6 bottom-8 mx-auto max-w-7xl"
            animate={{ opacity: 1 - zoom * 2 }}
          >
            <StatStrip
              items={[
                { label: "Operación", value: "24/7" },
                { label: "Entrega suborbital", value: "≤ 90 min" },
                { label: "Fiabilidad", value: "99.9%" },
                { label: "Capacidad flexible", value: "Bajo demanda" },
              ]}
            />
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] uppercase tracking-widest text-muted-foreground"
          animate={{ opacity: 1 - zoom * 3 }}
        >
          Haz scroll para salir de órbita ↓
        </motion.div>
      </div>
    </div>
  );
}
