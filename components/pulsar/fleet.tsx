"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Box,
  Check,
  Clock,
  Gauge,
  Network,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useLanguage } from "@/components/i18n/use-language";

const FLEET_IMAGES = [
  "/fleet/capsule.jpg",
  "/fleet/medium.jpg",
  "/fleet/heavy.jpg",
];

// masa representativa al hacer clic en cada clase (t)
const CLASS_MASS = [0.5, 6.5, 60];

const COPY = {
  es: {
    eyebrow: "La flota",
    titleLead: "Agnósticos",
    titleAccent: "al vehículo.",
    para: "No fabricamos cohetes: contratamos los mejores. Cada kilo vuela en la unidad más eficiente, y tu carga nunca depende de un solo proveedor.",
    ctaPrimary: "Reserva capacidad",
    ctaSecondary: "Configura tu envío",
    autoRecLead: "Recomendación automática",
    autoRecTail: " según masa y urgencia.",
    classes: [
      { name: "Cápsula", range: "0,15 – 1 t", tag: "envíos críticos" },
      {
        name: "Clase media",
        range: "3 – 10 t",
        tag: "equilibrio coste-velocidad",
      },
      { name: "Clase pesada", range: "30 – 100 t", tag: "volumen industrial" },
    ],
    massLabel: "Masa de la carga",
    urgencyLabel: "Urgencia",
    flexible: "Flexible",
    critical: "Crítica",
    recVehicle: "Vehículo recomendado",
    recCargo: "Carga estimada",
    recSla: "SLA objetivo",
    recProvider: "Proveedor óptimo",
    providerValue: "red multioperador",
    sla: {
      critical: "entrega crítica",
      accelerated: "entrega acelerada",
      flexible: "entrega flexible",
    },
    noDep: "Sin dependencia de un solo proveedor",
    pending: "Imagen pendiente",
    stats: [
      { value: "3 clases", sub: "de capacidad" },
      { value: "0,15–100 t", sub: "rango operable" },
      { value: "Multioperador", sub: "sin proveedor único" },
      { value: "Optimización", sub: "por masa y urgencia" },
    ],
  },
  en: {
    eyebrow: "The fleet",
    titleLead: "Agnostic to the",
    titleAccent: "vehicle.",
    para: "We don't build rockets: we contract the best. Every kilo flies on the most efficient unit, and your cargo never depends on a single provider.",
    ctaPrimary: "Book capacity",
    ctaSecondary: "Configure your shipment",
    autoRecLead: "Automatic recommendation",
    autoRecTail: " based on mass and urgency.",
    classes: [
      { name: "Capsule", range: "0.15 – 1 t", tag: "critical shipments" },
      { name: "Medium class", range: "3 – 10 t", tag: "cost-speed balance" },
      { name: "Heavy class", range: "30 – 100 t", tag: "industrial volume" },
    ],
    massLabel: "Cargo mass",
    urgencyLabel: "Urgency",
    flexible: "Flexible",
    critical: "Critical",
    recVehicle: "Recommended vehicle",
    recCargo: "Estimated load",
    recSla: "Target SLA",
    recProvider: "Optimal provider",
    providerValue: "multi-operator network",
    sla: {
      critical: "critical delivery",
      accelerated: "accelerated delivery",
      flexible: "flexible delivery",
    },
    noDep: "No dependence on a single provider",
    pending: "Image pending",
    stats: [
      { value: "3 classes", sub: "of capacity" },
      { value: "0.15–100 t", sub: "operable range" },
      { value: "Multi-operator", sub: "no single provider" },
      { value: "Optimization", sub: "by mass and urgency" },
    ],
  },
} as const;

const STAT_ICONS: LucideIcon[] = [Rocket, Weight, Network, Target];

export function Fleet() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [mass, setMass] = useState(6.5);
  const [urgency, setUrgency] = useState(70);

  const recommended = mass <= 1 ? 0 : mass <= 10 ? 1 : 2;
  const massText =
    (Math.round(mass * 10) / 10)
      .toFixed(1)
      .replace(".", lang === "es" ? "," : ".") + " t";
  const slaValue =
    urgency > 66
      ? c.sla.critical
      : urgency > 33
        ? c.sla.accelerated
        : c.sla.flexible;

  return (
    <Section id="flota" className="border-t border-border">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
        {/* columna de texto */}
        <Reveal>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem,3.4vw,3.2rem)",
              lineHeight: 1.05,
              fontWeight: 600,
            }}
          >
            {c.titleLead}
            <br />
            <span className="text-pulse-blue">{c.titleAccent}</span>
          </h2>
          <p className="mt-5 max-w-md text-[16px] text-muted-foreground">
            {c.para}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
            >
              <a href="#cta">
                {c.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
            >
              <a href="#plataforma">
                {c.ctaSecondary} <Settings2 className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-[14px]">
            <Sparkles className="h-4 w-4 text-pulse-cyan" />
            <span>
              <span className="text-pulse-cyan">{c.autoRecLead}</span>
              <span className="text-muted-foreground">{c.autoRecTail}</span>
            </span>
          </p>
        </Reveal>

        {/* tarjetas + panel */}
        <Reveal delay={0.1}>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.classes.map((cls, i) => (
              <FleetCard
                key={cls.name}
                index={i}
                name={cls.name}
                range={cls.range}
                tag={cls.tag}
                image={FLEET_IMAGES[i]}
                pending={c.pending}
                selected={i === recommended}
                onSelect={() => setMass(CLASS_MASS[i])}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-space-900/50 p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <SliderRow
                  label={c.massLabel}
                  left="0,15 t"
                  right="100 t"
                  value={mass}
                  min={0.15}
                  max={100}
                  step={0.05}
                  onChange={(v) => setMass(Number(v.toFixed(2)))}
                />
                <SliderRow
                  label={c.urgencyLabel}
                  left={c.flexible}
                  right={c.critical}
                  value={urgency}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setUrgency}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-2.5 rounded-xl border border-pulse-blue/25 bg-pulse-blue/5 p-4">
                  <RecRow
                    icon={Box}
                    label={c.recVehicle}
                    value={c.classes[recommended].name}
                    accent
                  />
                  <RecRow icon={Gauge} label={c.recCargo} value={massText} />
                  <RecRow icon={Clock} label={c.recSla} value={slaValue} />
                  <RecRow
                    icon={Network}
                    label={c.recProvider}
                    value={c.providerValue}
                  />
                </div>
                <div className="flex items-center gap-2.5 sm:w-32 sm:flex-col sm:text-center">
                  <ShieldCheck className="h-6 w-6 shrink-0 text-pulse-blue" />
                  <span className="text-[12px] text-muted-foreground">
                    {c.noDep}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* franja de métricas */}
      <Reveal delay={0.15}>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-10 md:grid-cols-4">
          {c.stats.map((s, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div key={s.sub} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-pulse-cyan">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}

interface FleetCardProps {
  index: number;
  name: string;
  range: string;
  tag: string;
  image: string;
  pending: string;
  selected: boolean;
  onSelect: () => void;
}

function FleetCard({
  name,
  range,
  tag,
  image,
  selected,
  onSelect,
}: FleetCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border text-left transition-colors"
      style={{
        borderColor: selected
          ? "rgba(56,189,248,0.7)"
          : "rgba(120,145,200,0.14)",
        boxShadow: selected ? "0 0 32px var(--brand-glow)" : "none",
      }}
    >
      {/* placeholder */}
      <div className="absolute inset-0 bg-gradient-to-b from-space-800 to-space-950">
        <div className="hud-grid absolute inset-0 opacity-40" aria-hidden />
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="h-8 w-8 text-space-700" />
          </div>
        )}
      </div>
      {!failed && (
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 90vw, 30vw"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* scrim superior para el texto */}
      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-space-950/90 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
        <div>
          <div
            className="text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.3rem",
              fontWeight: 600,
            }}
          >
            {name}
          </div>
          <div
            className="text-pulse-blue"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            {range}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">{tag}</div>
        </div>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-pulse-blue bg-pulse-blue text-white" : "border-border bg-space-950/50"}`}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      </div>
    </button>
  );
}

function SliderRow({
  label,
  left,
  right,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  left: string;
  right: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <span className="w-16 shrink-0 text-[12px] text-muted-foreground">
          {left}
        </span>
        <Slider
          className="flex-1"
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(v) => onChange(v[0])}
        />
        <span className="w-14 shrink-0 text-right text-[12px] text-muted-foreground">
          {right}
        </span>
      </div>
    </div>
  );
}

function RecRow({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <Icon className="h-4 w-4 shrink-0 text-pulse-cyan" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={accent ? "text-pulse-blue" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}
