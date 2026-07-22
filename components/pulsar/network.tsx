"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Waves,
  Navigation,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { GlobeCanvas, buildSingleRoute } from "@/components/globe/globe-canvas";
import type { GlobeHub } from "@/components/globe/types";

const NODES = [
  {
    name: "Manzanillo",
    country: "México",
    lat: 19,
    lon: -104.3,
    corridor: "MZO ↔ Asia",
    cap: "30–100 t",
    nearshore: true,
  },
  {
    name: "Long Beach",
    country: "EE. UU.",
    lat: 33.7,
    lon: -118.2,
    corridor: "LGB ↔ Transpacífico",
    cap: "30–100 t",
  },
  {
    name: "Róterdam",
    country: "Países Bajos",
    lat: 51.9,
    lon: 4.1,
    corridor: "RTM ↔ Atlántico",
    cap: "10–50 t",
  },
  {
    name: "Singapur",
    country: "Singapur",
    lat: 1.3,
    lon: 103.8,
    corridor: "SIN ↔ Índico",
    cap: "10–50 t",
  },
  {
    name: "Veracruz",
    country: "México",
    lat: 19.2,
    lon: -96.1,
    corridor: "VER ↔ Golfo",
    cap: "3–30 t",
    nearshore: true,
  },
];

// arcos que conectan los hubs de la red
const NODE_ARCS: [string, string][] = [
  ["Manzanillo", "Singapur"],
  ["Long Beach", "Róterdam"],
  ["Veracruz", "Róterdam"],
  ["Manzanillo", "Long Beach"],
];

export function Network() {
  const [activeId, setActiveId] = useState(NODES[0].name);
  const node = NODES.find((n) => n.name === activeId) ?? NODES[0];

  const hubs = useMemo<GlobeHub[]>(
    () =>
      NODES.map((n) => ({
        id: n.name,
        name: n.name,
        coords: { lat: n.lat, lon: n.lon },
        nearshore: n.nearshore,
      })),
    [],
  );

  const routes = useMemo(() => {
    const byName = new Map(NODES.map((n) => [n.name, n]));
    return NODE_ARCS.map(([a, b]) => {
      const from = byName.get(a)!;
      const to = byName.get(b)!;
      return buildSingleRoute(
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      );
    });
  }, []);

  return (
    <Section id="red" className="border-t border-border">
      <Reveal>
        <Eyebrow>La red</Eyebrow>
        <h2
          className="mt-5 text-foreground"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem,3.5vw,3rem)",
            lineHeight: 1.08,
            fontWeight: 600,
          }}
        >
          Puertos espaciales frente
          <br />a los <span className="text-pulse-cyan">grandes hubs.</span>
        </h2>
        <p className="mt-5 max-w-xl text-[16px] text-muted-foreground">
          Lo mejor de dos mundos: la infraestructura de los grandes puertos y la
          libertad del mar abierto. Sin ruido sobre ciudades, sin sobrevolar a
          nadie.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,360px)] lg:items-center">
        <Reveal>
          <div className="relative h-[440px] overflow-hidden rounded-2xl border border-border bg-space-900/40 sm:h-[520px]">
            <GlobeCanvas
              interactive
              hubs={hubs}
              activeHubId={activeId}
              onSelectHub={setActiveId}
              focusHubId={activeId}
              routes={routes}
              autoSpin
              spinSpeed={0.03}
              cameraDistance={6}
              minDistance={3.6}
              maxDistance={10}
              showHint
              showZoomButtons
            />
          </div>
          <div className="mt-3 flex gap-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pulse-cyan" /> Hub
              nearshoring MX
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pulse-glow" />{" "}
              Plataforma marítima
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-2xl border border-pulse-blue/30 bg-gradient-to-br from-space-800 to-space-950 p-6"
          >
            {/* stylized semi-submersible render */}
            <div className="relative flex h-40 items-end justify-center rounded-xl bg-space-950/60">
              <div className="absolute inset-x-0 bottom-8 h-8 bg-gradient-to-t from-pulse-blue/20 to-transparent" />
              <Waves className="absolute bottom-6 left-6 h-6 w-6 text-pulse-blue/50" />
              <div className="relative mb-8 flex flex-col items-center">
                <div className="h-16 w-4 rounded-t-full bg-gradient-to-t from-slate-500 to-slate-200" />
                <div className="h-3 w-16 rounded bg-slate-600" />
                <div className="mt-1 h-2 w-24 rounded bg-slate-700" />
              </div>
              {node.nearshore && (
                <span className="absolute right-3 top-3 rounded-full bg-pulse-cyan/20 px-2 py-0.5 text-[11px] text-pulse-cyan">
                  Nearshoring
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2 text-pulse-cyan">
              <MapPin className="h-4 w-4" />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.3rem",
                  fontWeight: 600,
                }}
              >
                {node.name}
              </span>
            </div>
            <div className="text-[13px] text-muted-foreground">
              {node.country}
            </div>

            <div className="mt-5 space-y-3 text-[14px]">
              <Row icon={Navigation} label="Corredor" value={node.corridor} />
              <Row icon={Gauge} label="Capacidad" value={node.cap} />
              <Row
                icon={Waves}
                label="Plataforma"
                value="Semisumergible · 30–60 km mar adentro"
              />
            </div>
          </motion.div>
        </Reveal>
      </div>
    </Section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-pulse-blue" />
        {label}
      </span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
