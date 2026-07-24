"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Anchor,
  ArrowRight,
  Ban,
  BarChart3,
  Boxes,
  Clock,
  Layers,
  Mouse,
  Network as NetworkIcon,
  Plus,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Reveal, Eyebrow } from "./shared";
import { Button } from "./ui/button";
import { GlobeCanvas, buildSingleRoute } from "@/components/globe/globe-canvas";
import type { GlobeHub } from "@/components/globe/types";
import { useLanguage } from "@/components/i18n/use-language";

type CorridorKey = "pacific" | "atlantic" | "indian";

const NODES: {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nearshore?: boolean;
  corridor: CorridorKey;
}[] = [
  {
    id: "manzanillo",
    name: "Manzanillo",
    lat: 19.05,
    lon: -104.31,
    nearshore: true,
    corridor: "pacific",
  },
  {
    id: "long-beach",
    name: "Long Beach",
    lat: 33.75,
    lon: -118.19,
    corridor: "pacific",
  },
  {
    id: "roterdam",
    name: "Róterdam",
    lat: 51.95,
    lon: 4.14,
    corridor: "atlantic",
  },
  {
    id: "singapur",
    name: "Singapur",
    lat: 1.29,
    lon: 103.85,
    corridor: "indian",
  },
  {
    id: "veracruz",
    name: "Veracruz",
    lat: 19.17,
    lon: -96.13,
    nearshore: true,
    corridor: "atlantic",
  },
];

const NODE_ARCS: [string, string][] = [
  ["manzanillo", "singapur"],
  ["long-beach", "roterdam"],
  ["veracruz", "roterdam"],
  ["manzanillo", "long-beach"],
];

const FEATURE_ICONS: LucideIcon[] = [Anchor, Layers, Ban, NetworkIcon];
const MINI_ICONS: LucideIcon[] = [Clock, Zap, BarChart3];
const BOTTOM_ICONS: LucideIcon[] = [Boxes, ShieldCheck, Clock];

const COPY = {
  es: {
    eyebrow: "La red",
    titleLead: "Puertos espaciales frente a los ",
    titleAccent: "grandes hubs.",
    para1:
      "Lo mejor de dos mundos: la infraestructura de los grandes puertos y la libertad del mar abierto. Sin ruido sobre ciudades, sin sobrevolar a nadie.",
    para2:
      "Pulsar conecta corredores marítimos y plataformas offshore para habilitar lanzamientos limpios, discretos y escalables.",
    btnExplore: "Explorar nodos",
    btnCorridors: "Ver corredores",
    dragHint: "Arrastra para rotar el globo",
    corridors: {
      pacific: "Corredor Pacífico",
      atlantic: "Corredor Atlántico",
      indian: "Corredor Índico",
    },
    nodeSelected: "Nodo seleccionado",
    status: "Operativo",
    features: [
      { title: "Acceso marítimo", detail: "Aguas profundas todo el año" },
      { title: "Operación offshore", detail: "Plataforma semisumergible" },
      {
        title: "Sin sobrevuelo urbano",
        detail: "Rutas 100% sobre mar abierto",
      },
      {
        title: "Integración portuaria",
        detail: "Conectividad logística inmediata",
      },
    ],
    miniStats: [
      { label: "Disponibilidad", value: "Alta", sub: "24/7" },
      { label: "Ventanas de salida", value: "Frecuentes", sub: "Diarias" },
      { label: "Capacidad estimada", value: "Alta", sub: "Multi-misión" },
    ],
    verDetalles: "Ver detalles del nodo",
    todosLosHubs: "Todos los hubs",
    bottomStats: [
      { label: "Red de nodos", value: "5", sub: "plataformas activas" },
      { label: "Cobertura global", value: "3", sub: "corredores oceánicos" },
      { label: "Disponibilidad", value: "Alta", sub: "operación 24/7" },
    ],
    pending: "Imagen pendiente",
  },
  en: {
    eyebrow: "The network",
    titleLead: "Spaceports over the ",
    titleAccent: "big hubs.",
    para1:
      "The best of both worlds: the infrastructure of major ports and the freedom of the open sea. No noise over cities, no overflying anyone.",
    para2:
      "Pulsar connects maritime corridors and offshore platforms to enable clean, discreet and scalable launches.",
    btnExplore: "Explore nodes",
    btnCorridors: "View corridors",
    dragHint: "Drag to rotate the globe",
    corridors: {
      pacific: "Pacific Corridor",
      atlantic: "Atlantic Corridor",
      indian: "Indian Corridor",
    },
    nodeSelected: "Selected node",
    status: "Operational",
    features: [
      { title: "Maritime access", detail: "Deep water year-round" },
      { title: "Offshore operation", detail: "Semi-submersible platform" },
      { title: "No urban overflight", detail: "Routes 100% over open sea" },
      { title: "Port integration", detail: "Immediate logistics connectivity" },
    ],
    miniStats: [
      { label: "Availability", value: "High", sub: "24/7" },
      { label: "Departure windows", value: "Frequent", sub: "Daily" },
      { label: "Estimated capacity", value: "High", sub: "Multi-mission" },
    ],
    verDetalles: "View node details",
    todosLosHubs: "All hubs",
    bottomStats: [
      { label: "Node network", value: "5", sub: "active platforms" },
      { label: "Global coverage", value: "3", sub: "ocean corridors" },
      { label: "Availability", value: "High", sub: "24/7 operation" },
    ],
    pending: "Image pending",
  },
} as const;

export function Network() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [activeId, setActiveId] = useState(NODES[0].id);
  const node = NODES.find((n) => n.id === activeId) ?? NODES[0];

  const hubs = useMemo<GlobeHub[]>(
    () =>
      NODES.map((n) => ({
        id: n.id,
        name: n.name,
        coords: { lat: n.lat, lon: n.lon },
        nearshore: n.nearshore,
      })),
    [],
  );

  const routes = useMemo(() => {
    const byId = new Map(NODES.map((n) => [n.id, n]));
    return NODE_ARCS.map(([a, b]) => {
      const from = byId.get(a)!;
      const to = byId.get(b)!;
      return buildSingleRoute(
        { lat: from.lat, lon: from.lon },
        { lat: to.lat, lon: to.lon },
      );
    });
  }, []);

  return (
    <section
      id="red"
      className="relative overflow-hidden border-t border-border"
    >
      {/* globo de fondo, grande y centrado — interactivo */}
      <div className="absolute inset-0">
        <GlobeCanvas
          interactive
          textured
          hubs={hubs}
          activeHubId={activeId}
          onSelectHub={setActiveId}
          focusHubId={activeId}
          routes={routes}
          autoSpin
          spinSpeed={0.03}
          cameraDistance={5.4}
          minDistance={3.4}
          maxDistance={10}
        />
      </div>
      {/* scrims: oscurecen los bordes (texto/paneles), dejan ver el globo al centro */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950 via-transparent to-space-950" />
      <div className="pointer-events-none absolute inset-0 bg-space-950/45 lg:bg-transparent" />

      {/* contenido flotando sobre el globo */}
      <div className="pointer-events-none relative mx-auto grid min-h-[720px] max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)_340px] lg:items-start">
        {/* columna de texto */}
        <Reveal className="pointer-events-none">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.9rem,3vw,2.7rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            {c.titleLead}
            <span className="text-pulse-cyan">{c.titleAccent}</span>
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground">{c.para1}</p>
          <p className="mt-4 text-[14px] text-muted-foreground/80">{c.para2}</p>
          <div className="pointer-events-auto mt-7 flex flex-wrap gap-3">
            <Button className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90">
              {c.btnExplore} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
            >
              <Plus className="mr-1 h-4 w-4" /> {c.btnCorridors}
            </Button>
          </div>
          <div className="mt-8 space-y-4">
            {c.bottomStats.map((s, i) => {
              const Icon = BOTTOM_ICONS[i];
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-pulse-blue">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-[12px] text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-foreground"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                        }}
                      >
                        {s.value}
                      </span>
                      <span className="text-[12px] text-muted-foreground">
                        {s.sub}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* columna central: el globo del fondo se ve a través */}
        <div aria-hidden className="hidden lg:block" />

        {/* panel de nodo + lista de hubs */}
        <Reveal delay={0.1} className="pointer-events-auto">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-border bg-space-900/60 p-5"
          >
            <div className="text-[12px] text-muted-foreground">
              {c.nodeSelected}
            </div>
            <div className="mt-1 text-[13px] text-pulse-cyan">
              {c.corridors[node.corridor]}
            </div>
            <div
              className="text-foreground"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              {node.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[13px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {c.status}
            </div>

            <NodeImage pending={c.pending} />

            <div className="mt-4 space-y-3">
              {c.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-pulse-blue/30 text-pulse-cyan">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <div className="text-[13px] text-foreground">
                        {f.title}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        {f.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
              {c.miniStats.map((s, i) => {
                const Icon = MINI_ICONS[i];
                return (
                  <div key={s.label}>
                    <Icon className="h-3.5 w-3.5 text-pulse-blue" />
                    <div className="mt-1.5 text-[11px] text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-[14px] text-foreground">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.sub}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              className="mt-5 w-full rounded-full border-pulse-blue/40 bg-pulse-blue/5 text-foreground hover:bg-pulse-blue/15"
            >
              {c.verDetalles} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>

          <div className="mt-4 rounded-2xl border border-border bg-space-900/40 p-4">
            <div className="text-[12px] text-muted-foreground">
              {c.todosLosHubs}
            </div>
            <div className="mt-3 space-y-1">
              {NODES.map((n) => {
                const on = n.id === activeId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setActiveId(n.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${on ? "border border-pulse-blue/40 bg-pulse-blue/15" : "border border-transparent hover:bg-white/5"}`}
                  >
                    <Anchor
                      className={`h-4 w-4 shrink-0 ${n.nearshore ? "text-pulse-cyan" : "text-pulse-blue"}`}
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] text-foreground">
                        {n.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {c.corridors[n.corridor]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>

      {/* hint de interacción */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
        <Mouse className="h-4 w-4" /> {c.dragHint}
      </div>
    </section>
  );
}

function NodeImage({ pending }: { pending: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative mt-4 h-32 overflow-hidden rounded-xl border border-border bg-space-950/60">
      <div className="absolute inset-0 flex items-center justify-center">
        {failed ? (
          <div className="flex flex-col items-center gap-1.5">
            <Anchor className="h-5 w-5 text-space-600" />
            <span className="font-mono text-[10px] text-space-500">
              {pending}
            </span>
          </div>
        ) : null}
      </div>
      {!failed && (
        <Image
          src="/network/platform.jpg"
          alt=""
          fill
          sizes="300px"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/60 to-transparent" />
    </div>
  );
}
