"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SceneFallback } from "@/components/scene/scene-fallback";
import { Heading } from "@/components/ui/heading";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";

import { RoutePanel } from "./route-panel";
import { ORBITAL_ROUTES } from "./routes";

const NetworkCanvas = dynamic(
  () => import("./network-canvas").then((mod) => mod.NetworkCanvas),
  { ssr: false, loading: () => <SceneFallback /> },
);

/** Un minuto de ETA por cada 4s reales: el contador se mueve, sin marear. */
const ETA_TICK_MS = 4000;

const numberFormat = new Intl.NumberFormat("es-MX");

function initialEtas(): Record<string, number> {
  return Object.fromEntries(
    ORBITAL_ROUTES.map((route) => [route.id, route.etaMinutes]),
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
}

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div>
      <dt>
        <MonoLabel>{label}</MonoLabel>
      </dt>
      <dd className="mt-2 font-display text-3xl font-semibold text-white">
        {value}
      </dd>
    </div>
  );
}

export function NetworkSection() {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.2 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etas, setEtas] = useState<Record<string, number>>(initialEtas);

  // Hover manda sobre la selección: permite mirar otra ruta sin perder la fija.
  const activeId = hoveredId ?? selectedId;

  // El estado inicial es estático para que el HTML del servidor coincida con
  // el del cliente; el contador solo arranca tras hidratar y estar a la vista.
  useEffect(() => {
    if (!inView) {
      return;
    }
    const timer = setInterval(() => {
      setEtas((previous) =>
        Object.fromEntries(
          ORBITAL_ROUTES.map((route) => {
            const next = (previous[route.id] ?? route.etaMinutes) - 1;
            return [route.id, next > 0 ? next : route.etaMinutes];
          }),
        ),
      );
    }, ETA_TICK_MS);
    return () => clearInterval(timer);
  }, [inView]);

  const clearHover = useCallback(() => setHoveredId(null), []);
  const toggleSelected = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const summary = useMemo(() => {
    const cargo = ORBITAL_ROUTES.reduce((total, r) => total + r.cargoKg, 0);
    const efficiency =
      ORBITAL_ROUTES.reduce((total, r) => total + r.efficiency, 0) /
      ORBITAL_ROUTES.length;
    return {
      routes: ORBITAL_ROUTES.length,
      cargo,
      efficiency: Math.round(efficiency),
    };
  }, []);

  const leftRoutes = ORBITAL_ROUTES.slice(0, 2);
  const rightRoutes = ORBITAL_ROUTES.slice(2);

  return (
    <section
      ref={sectionRef}
      id="network"
      className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-transparent via-space-950 to-transparent px-6 py-24"
    >
      <motion.div
        className="w-full max-w-7xl"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-6 border-b border-space-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <MonoLabel tone="accent">Red Global</MonoLabel>
            <Heading as="h2" level={2} className="mt-4 max-w-xl">
              Carga orbital en tránsito, ahora mismo
            </Heading>
          </div>
          <Text size="sm" className="max-w-sm md:text-right">
            Arrastra el planeta para girarlo. Click en un cohete o en un panel
            para fijar su trayectoria.
          </Text>
        </div>
      </motion.div>

      <div className="mt-10 grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
        <div
          className="order-first h-[320px] w-full sm:h-[440px] lg:order-none lg:col-start-2 lg:h-[580px]"
          aria-hidden="true"
        >
          <NetworkCanvas
            activeRouteId={activeId}
            selectedRouteId={selectedId}
            onHover={setHoveredId}
            onSelect={toggleSelected}
            reducedMotion={reducedMotion}
            inView={inView}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-start-1 lg:row-start-1 lg:grid-cols-1">
          {leftRoutes.map((route, index) => (
            <RoutePanel
              key={route.id}
              route={route}
              index={index}
              etaMinutes={etas[route.id] ?? route.etaMinutes}
              active={activeId === route.id}
              selected={selectedId === route.id}
              onActivate={() => setHoveredId(route.id)}
              onDeactivate={clearHover}
              onSelect={() => toggleSelected(route.id)}
            />
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-start-3 lg:row-start-1 lg:grid-cols-1">
          {rightRoutes.map((route, index) => (
            <RoutePanel
              key={route.id}
              route={route}
              index={index + 2}
              etaMinutes={etas[route.id] ?? route.etaMinutes}
              active={activeId === route.id}
              selected={selectedId === route.id}
              onActivate={() => setHoveredId(route.id)}
              onDeactivate={clearHover}
              onSelect={() => toggleSelected(route.id)}
            />
          ))}
        </div>
      </div>

      <dl className="mt-14 grid w-full max-w-7xl grid-cols-2 gap-8 border-t border-space-800 pt-8 md:grid-cols-3">
        <SummaryStat label="Rutas activas" value={String(summary.routes)} />
        <SummaryStat
          label="Carga en tránsito"
          value={`${numberFormat.format(summary.cargo)} kg`}
        />
        <SummaryStat
          label="Eficiencia media"
          value={`${summary.efficiency}%`}
        />
      </dl>
    </section>
  );
}
