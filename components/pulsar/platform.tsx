"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Bell,
  Check,
  CircleDot,
  Clock,
  Filter,
  Play,
  Plane,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { QuoteBox } from "./quote-box";
import { GlobeCanvas, buildSingleRoute } from "@/components/globe/globe-canvas";
import type { GlobeHub } from "@/components/globe/types";
import { useLanguage } from "@/components/i18n/use-language";

const PORTS = [
  { value: "lgb", label: "Long Beach, USA (LGB)", lat: 33.75, lon: -118.19 },
  { value: "sin", label: "Singapur (SIN)", lat: 1.29, lon: 103.85 },
  { value: "zlo", label: "Manzanillo (ZLO)", lat: 19.05, lon: -104.31 },
  { value: "rtm", label: "Róterdam (RTM)", lat: 51.95, lon: 4.14 },
];

const MISSION_HUBS: GlobeHub[] = [
  { id: "lgb", name: "Long Beach", coords: { lat: 33.75, lon: -118.19 } },
  {
    id: "zlo",
    name: "Manzanillo",
    coords: { lat: 19.05, lon: -104.31 },
    nearshore: true,
  },
  { id: "sin", name: "Singapur", coords: { lat: 1.29, lon: 103.85 } },
];

const SCORE_ICONS = [ShieldCheck, TrendingDown, ShieldCheck, TrendingUp];

const ALERT_TONE: Record<string, string> = {
  warn: "bg-amber",
  good: "bg-pulse-cyan",
};

const ACTIVITY_TONE: Record<string, string> = {
  flight: "text-pulse-cyan",
  loading: "text-amber",
  scheduled: "text-pulse-blue",
  done: "text-emerald-400",
  prep: "text-muted-foreground",
};

const COPY = {
  es: {
    eyebrow: "Plataforma Pulsar",
    h2Lead: "Reservar un cohete tan fácil como ",
    h2Accent: "pedir un courier.",
    para: "Cotización en segundos, visibilidad total con IA y gestión por excepción.",
    demo: "Prueba la demo interactiva",
    guided: "Ver recorrido guiado",
    quoter: "Cotizador",
    quoterSub: "Simula tu envío y obtén precio en segundos.",
    advanced: "Modo avanzado",
    dims: "Dimensiones",
    length: "Largo",
    width: "Ancho",
    height: "Alto",
    mass: "Masa",
    volumetric: "Volumétrico",
    route: "Ruta",
    urgency: "Urgencia",
    urgencySteps: ["Estándar", "Prioritario", "Expedito"],
    cargo: "Carga",
    cargoSteps: ["Liviana", "Media", "Pesada"],
    services: "Servicios",
    svc: ["Seguro", "Monitoreo IA", "Embalaje"],
    result: "Resultado",
    optimal: "ÓPTIMA",
    transitLabel: "Tiempo de tránsito estimado",
    suborbital: "Suborbital",
    priceLabel: "Precio estimado (Zayren)",
    book: "Reservar capacidad",
    lockPrice: "Bloquea tu precio por 15 minutos",
    tower: "Torre de Control",
    tabOverview: "Vista general",
    filters: "Filtros",
    scores: [
      {
        label: "Readiness",
        value: "96",
        qual: "Excelente",
        trend: "↑ 4 pts",
        good: true,
      },
      {
        label: "Risk",
        value: "23",
        qual: "Bajo",
        trend: "↓ 7 pts",
        good: true,
      },
      {
        label: "Health",
        value: "98",
        qual: "Excelente",
        trend: "↑ 2 pts",
        good: true,
      },
      {
        label: "On-Time Performance",
        value: "99.2%",
        qual: "Excelente",
        trend: "↑ 1.1%",
        good: true,
      },
    ],
    activeMissions: "Misiones activas",
    dragHint: "Arrastra · zoom",
    legend: ["En vuelo", "Programado", "En carga"],
    alertsTitle: "Alertas",
    seeAll: "Ver todas",
    alerts: [
      {
        text: "Viento lateral alto en LZ-2",
        meta: "LZ-2 · 12:45 UTC",
        tone: "warn",
      },
      {
        text: "Demora en ventana de lanzamiento",
        meta: "Misión PLS-247 · 11:32 UTC",
        tone: "warn",
      },
      {
        text: "Carga crítica completada",
        meta: "Misión PLS-246 · 10:15 UTC",
        tone: "good",
      },
    ],
    activityTitle: "Actividad en tiempo real",
    seeAllShort: "Ver todo",
    activity: [
      {
        id: "PLS-247",
        status: "En vuelo",
        meta: "T+ 00:03:24",
        tone: "flight",
      },
      { id: "PLS-246", status: "En carga", meta: "12%", tone: "loading" },
      {
        id: "PLS-245",
        status: "Programado",
        meta: "21 May, 09:15",
        tone: "scheduled",
      },
      {
        id: "PLS-244",
        status: "Entregado",
        meta: "20 May, 18:42",
        tone: "done",
      },
      {
        id: "PLS-243",
        status: "En preparación",
        meta: "20 May, 07:30",
        tone: "prep",
      },
    ],
  },
  en: {
    eyebrow: "Pulsar Platform",
    h2Lead: "Booking a rocket as easy as ",
    h2Accent: "ordering a courier.",
    para: "Quote in seconds, full AI visibility and management by exception.",
    demo: "Try the interactive demo",
    guided: "Watch the guided tour",
    quoter: "Quoter",
    quoterSub: "Simulate your shipment and get a price in seconds.",
    advanced: "Advanced mode",
    dims: "Dimensions",
    length: "Length",
    width: "Width",
    height: "Height",
    mass: "Mass",
    volumetric: "Volumetric",
    route: "Route",
    urgency: "Urgency",
    urgencySteps: ["Standard", "Priority", "Expedited"],
    cargo: "Load",
    cargoSteps: ["Light", "Medium", "Heavy"],
    services: "Services",
    svc: ["Insurance", "AI monitoring", "Packaging"],
    result: "Result",
    optimal: "OPTIMAL",
    transitLabel: "Estimated transit time",
    suborbital: "Suborbital",
    priceLabel: "Estimated price (Zayren)",
    book: "Book capacity",
    lockPrice: "Lock your price for 15 minutes",
    tower: "Control Tower",
    tabOverview: "Overview",
    filters: "Filters",
    scores: [
      {
        label: "Readiness",
        value: "96",
        qual: "Excellent",
        trend: "↑ 4 pts",
        good: true,
      },
      { label: "Risk", value: "23", qual: "Low", trend: "↓ 7 pts", good: true },
      {
        label: "Health",
        value: "98",
        qual: "Excellent",
        trend: "↑ 2 pts",
        good: true,
      },
      {
        label: "On-Time Performance",
        value: "99.2%",
        qual: "Excellent",
        trend: "↑ 1.1%",
        good: true,
      },
    ],
    activeMissions: "Active missions",
    dragHint: "Drag · zoom",
    legend: ["In flight", "Scheduled", "Loading"],
    alertsTitle: "Alerts",
    seeAll: "See all",
    alerts: [
      {
        text: "High crosswind at LZ-2",
        meta: "LZ-2 · 12:45 UTC",
        tone: "warn",
      },
      {
        text: "Launch window delay",
        meta: "Mission PLS-247 · 11:32 UTC",
        tone: "warn",
      },
      {
        text: "Critical cargo completed",
        meta: "Mission PLS-246 · 10:15 UTC",
        tone: "good",
      },
    ],
    activityTitle: "Real-time activity",
    seeAllShort: "See all",
    activity: [
      {
        id: "PLS-247",
        status: "In flight",
        meta: "T+ 00:03:24",
        tone: "flight",
      },
      { id: "PLS-246", status: "Loading", meta: "12%", tone: "loading" },
      {
        id: "PLS-245",
        status: "Scheduled",
        meta: "May 21, 09:15",
        tone: "scheduled",
      },
      {
        id: "PLS-244",
        status: "Delivered",
        meta: "May 20, 18:42",
        tone: "done",
      },
      { id: "PLS-243", status: "In prep", meta: "May 20, 07:30", tone: "prep" },
    ],
  },
} as const;

export function Platform() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [origin, setOrigin] = useState("lgb");
  const [dest, setDest] = useState("sin");
  const [urgency, setUrgency] = useState(2);
  const [cargo, setCargo] = useState(1);
  const [services, setServices] = useState<Set<number>>(new Set([0, 1]));
  const [advanced, setAdvanced] = useState(true);

  const price = useMemo(() => {
    const base = 2100 + cargo * 260 + urgency * 420 + services.size * 90;
    return base.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [cargo, urgency, services]);

  const transit = ["58 min", "52 min", "46 min"][urgency];

  const swap = () => {
    setOrigin(dest);
    setDest(origin);
  };
  const toggleService = (i: number) =>
    setServices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const routes = useMemo(
    () => [
      buildSingleRoute(MISSION_HUBS[0].coords, MISSION_HUBS[2].coords),
      buildSingleRoute(MISSION_HUBS[1].coords, MISSION_HUBS[2].coords),
    ],
    [],
  );

  return (
    <Section id="plataforma" className="border-t border-border">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr] xl:grid-cols-[minmax(0,280px)_1fr_minmax(0,260px)]">
        {/* columna de título */}
        <Reveal>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3vw,2.8rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            {c.h2Lead}
            <span className="text-pulse-cyan">{c.h2Accent}</span>
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground">{c.para}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90">
              {c.demo}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
            >
              <Play className="mr-1 h-4 w-4" /> {c.guided}
            </Button>
          </div>
        </Reveal>

        {/* cotizador */}
        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-border bg-space-900/60 p-6 backdrop-blur">
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="text-foreground"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                  }}
                >
                  {c.quoter}
                </div>
                <div className="text-[13px] text-muted-foreground">
                  {c.quoterSub}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdvanced((v) => !v)}
                className="flex items-center gap-2 text-[12px] text-muted-foreground"
              >
                {c.advanced}
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors ${advanced ? "bg-pulse-blue" : "bg-white/15"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${advanced ? "left-4" : "left-0.5"}`}
                  />
                </span>
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* caja 3D + dimensiones */}
              <div>
                <div className="relative h-52 rounded-xl border border-border bg-space-950/50">
                  <QuoteBox />
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-space-950/40 px-3 py-2 text-[12px]">
                  <span className="text-muted-foreground">{c.volumetric}</span>
                  <span className="text-foreground">0.58 m³</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  {[
                    [c.length, "120 cm"],
                    [c.width, "80 cm"],
                    [c.height, "60 cm"],
                    [c.mass, "250 kg"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-border bg-space-950/40 px-3 py-2"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* controles */}
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-[13px] text-muted-foreground">
                    {c.route}
                  </div>
                  <div className="space-y-1.5">
                    <RouteSelect
                      value={origin}
                      onChange={setOrigin}
                      exclude={dest}
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={swap}
                        aria-label="swap"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-space-950 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <RouteSelect
                      value={dest}
                      onChange={setDest}
                      exclude={origin}
                    />
                  </div>
                </div>

                <StepSlider
                  label={c.urgency}
                  steps={[...c.urgencySteps]}
                  value={urgency}
                  onChange={setUrgency}
                />
                <StepSlider
                  label={c.cargo}
                  steps={[...c.cargoSteps]}
                  value={cargo}
                  onChange={setCargo}
                />

                <div>
                  <div className="mb-2 text-[13px] text-muted-foreground">
                    {c.services}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.svc.map((s, i) => {
                      const on = services.has(i);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleService(i)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${on ? "border-pulse-blue bg-pulse-blue/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${on ? "border-pulse-cyan bg-pulse-cyan/20" : "border-border"}`}
                          >
                            {on && (
                              <Check className="h-3 w-3 text-pulse-cyan" />
                            )}
                          </span>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* resultado */}
        <Reveal delay={0.1} className="xl:col-start-3">
          <div className="flex h-full flex-col rounded-2xl border border-pulse-blue/30 bg-gradient-to-b from-space-800 to-space-950 p-6">
            <div className="flex items-center justify-between">
              <span
                className="text-foreground"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                {c.result}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">
                {c.optimal}
              </span>
            </div>

            <div className="mt-6 text-[13px] text-muted-foreground">
              {c.transitLabel}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-foreground"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.4rem",
                  fontWeight: 600,
                }}
              >
                {transit}
              </span>
              <span className="text-[13px] text-pulse-cyan">
                {c.suborbital}
              </span>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-[13px] text-muted-foreground">
              {c.priceLabel}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <motion.span
                key={price}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className="text-pulse-cyan"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.9rem",
                  fontWeight: 600,
                }}
              >
                {price}
              </motion.span>
              <span className="text-[14px] text-muted-foreground">ZYR</span>
              <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[12px] text-emerald-400">
                -4.2%
              </span>
            </div>

            <Button className="mt-6 w-full rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90">
              {c.book}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {c.lockPrice}
            </p>
          </div>
        </Reveal>
      </div>

      {/* torre de control */}
      <Reveal delay={0.1}>
        <div className="mt-6 rounded-2xl border border-border bg-space-900/60 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-blue/15 text-pulse-cyan">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <span
                className="text-foreground"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                {c.tower}
              </span>
              <span className="rounded-full bg-pulse-blue/15 px-3 py-1 text-[12px] text-pulse-cyan">
                {c.tabOverview}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px]">
                <Filter className="h-3.5 w-3.5" /> {c.filters}
              </span>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border">
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white">
                  3
                </span>
              </span>
            </div>
          </div>

          {/* scores */}
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {c.scores.map((s, i) => (
              <ScoreCard key={s.label} score={s} icon={SCORE_ICONS[i]} />
            ))}
          </div>

          {/* paneles */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
            {/* misiones activas + globo */}
            <div className="rounded-xl border border-border bg-space-950/50 p-4">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                {c.activeMissions}
                <span className="rounded bg-pulse-blue/15 px-1.5 text-[11px] text-pulse-cyan">
                  12
                </span>
              </div>
              <div className="relative mt-2 h-56 overflow-hidden rounded-lg">
                <GlobeCanvas
                  interactive
                  hubs={MISSION_HUBS}
                  onSelectHub={() => undefined}
                  showHubLabels
                  routes={routes}
                  autoSpin
                  spinSpeed={0.05}
                  quality="low"
                  cameraDistance={5.4}
                  minDistance={3.6}
                  maxDistance={9}
                  dpr={[1, 1.5]}
                  lightsPointScale={5}
                  showZoomButtons
                  showHint
                  hintLabel={c.dragHint}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {c.legend.map((l, i) => (
                  <span key={l} className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${["bg-emerald-400", "bg-pulse-blue", "bg-amber"][i]}`}
                    />
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* alertas */}
            <div className="rounded-xl border border-border bg-space-950/50 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-foreground">{c.alertsTitle}</span>
                <span className="text-[12px] text-pulse-cyan">{c.seeAll}</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {c.alerts.map((a) => (
                  <div key={a.text} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ALERT_TONE[a.tone]}`}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-foreground">
                        {a.text}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {a.meta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* actividad en tiempo real */}
            <div className="rounded-xl border border-border bg-space-950/50 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-foreground">{c.activityTitle}</span>
                <span className="text-[12px] text-pulse-cyan">
                  {c.seeAllShort}
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {c.activity.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    {a.tone === "flight" ? (
                      <Plane
                        className={`h-3.5 w-3.5 ${ACTIVITY_TONE[a.tone]}`}
                      />
                    ) : (
                      <CircleDot
                        className={`h-3.5 w-3.5 ${ACTIVITY_TONE[a.tone]}`}
                      />
                    )}
                    <span className="w-14 text-[12px] text-foreground">
                      {a.id}
                    </span>
                    <span className="flex-1 text-[12px] text-muted-foreground">
                      {a.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {a.meta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function RouteSelect({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border-border bg-space-950/60 text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PORTS.filter((p) => p.value !== exclude).map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StepSlider({
  label,
  steps,
  value,
  onChange,
}: {
  label: string;
  steps: string[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-pulse-cyan">{steps[value]}</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={steps.length - 1}
        step={1}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        {steps.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({
  score,
  icon: Icon,
}: {
  score: {
    label: string;
    value: string;
    qual: string;
    trend: string;
    good: boolean;
  };
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-xl border border-border bg-space-950/50 p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-pulse-blue" />
        <span
          className={`text-[11px] ${score.good ? "text-emerald-400" : "text-danger"}`}
        >
          {score.trend}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="text-foreground"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.7rem",
            fontWeight: 600,
          }}
        >
          {score.value}
        </span>
        <span className="text-[12px] text-emerald-400">{score.qual}</span>
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">
        {score.label}
      </div>
    </div>
  );
}
