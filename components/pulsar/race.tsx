"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Ship,
  Plane,
  Rocket,
  ArrowRight,
  Ban,
  Globe2,
  Timer,
} from "lucide-react";
import { Section, Reveal, Eyebrow, StatStrip } from "./shared";
import { Button } from "./ui/button";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { ORBITAL_ROUTES } from "@/components/network/routes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const CITIES = [
  "Long Beach",
  "Manzanillo",
  "Singapur",
  "Shanghai",
  "Yokohama",
  "Tokyo",
  "Rotterdam",
  "Hamburg",
  "New York",
  "Veracruz",
];

// relative durations for the animated bars (fraction of track filled = speed)
const MODES = [
  {
    key: "ship",
    label: "Barco",
    icon: Ship,
    time: "35 días",
    door: "35 días",
    color: "#f43f5e",
    speed: 0.12,
  },
  {
    key: "plane",
    label: "Avión",
    icon: Plane,
    time: "48 h",
    door: "48 h",
    color: "#f59e0b",
    speed: 0.45,
  },
  {
    key: "pulsar",
    label: "Pulsar",
    icon: Rocket,
    time: "90 min",
    door: "8–16 h puerta a puerta",
    color: "#38bdf8",
    speed: 1,
  },
];

export function Race() {
  const [from, setFrom] = useState("Long Beach");
  const [to, setTo] = useState("Singapur");
  const [runKey, setRunKey] = useState(0);

  return (
    <Section id="solucion" className="overflow-hidden border-t border-border">
      {/* planeta de fondo con arcos suborbitales (referencia imagen 2) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[640px] translate-y-[36%] opacity-70">
        <GlobeCanvas
          quality="low"
          autoSpin
          spinSpeed={0.05}
          routes={ORBITAL_ROUTES}
          dpr={[1, 1.5]}
          cameraDistance={5.2}
          lightsPointScale={5}
          tilt={[0.35, 0, 0.14]}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-space-950 via-space-950/50 to-transparent" />

      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-center">
        <Reveal>
          <Eyebrow>La solución</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            De días a horas no es una mejora:
            <br />
            es un <span className="text-pulse-cyan">cambio de categoría.</span>
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground">
            Elige cualquier ruta y compara tres realidades logísticas: barco,
            avión y Pulsar. Inmune a canales, huelgas y fronteras.
          </p>
          <div className="mt-8">
            <StatStrip
              items={[
                { label: "vuelo suborbital", value: "90 min" },
                { label: "puerta a puerta", value: "8–16 h" },
                { label: "sin Panamá ni Mar Rojo", value: "Sin estrechos" },
                { label: "fuera de rutas soberanas", value: "Sin fronteras" },
              ]}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-space-900/60 p-6 backdrop-blur">
            <div className="flex flex-wrap items-end gap-3">
              <CitySelect
                label="Origen"
                value={from}
                onChange={setFrom}
                exclude={to}
              />
              <ArrowRight className="mb-2.5 h-5 w-5 text-muted-foreground" />
              <CitySelect
                label="Destino"
                value={to}
                onChange={setTo}
                exclude={from}
              />
              <Button
                onClick={() => setRunKey((k) => k + 1)}
                className="mb-0.5 rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
              >
                <Timer className="mr-1 h-4 w-4" /> Simular ruta
              </Button>
            </div>

            <div className="mt-8 space-y-5">
              {MODES.map((m) => {
                const Icon = m.icon;
                const hero = m.key === "pulsar";
                return (
                  <div
                    key={m.key}
                    className={`rounded-xl border p-4 ${hero ? "border-pulse-blue/50 bg-pulse-blue/10" : "border-border bg-space-950/40"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-5 w-5" style={{ color: m.color }} />
                        <span className="text-foreground">{m.label}</span>
                        {hero && (
                          <span className="rounded-full bg-pulse-cyan/20 px-2 py-0.5 text-[11px] text-pulse-cyan">
                            suborbital
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            color: m.color,
                          }}
                        >
                          {m.time}
                        </div>
                        <div className="text-[12px] text-muted-foreground">
                          {m.door}
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        key={`${runKey}-${m.key}`}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: m.color }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${m.speed * 100}%` }}
                        transition={{
                          duration: 2 / m.speed,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5 text-pulse-cyan" /> Sin estrechos
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-pulse-cyan" /> Sobre el mar
              </span>
              <span className="flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5 text-pulse-cyan" /> Sobre espacio
                soberano
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function CitySelect({
  label,
  value,
  onChange,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  exclude: string;
}) {
  return (
    <div className="min-w-[150px] flex-1">
      <div className="mb-1.5 text-[12px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="border-border bg-space-950/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CITIES.filter((c) => c !== exclude).map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
