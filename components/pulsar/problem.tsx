"use client";

import { useState } from "react";
import { AlertTriangle, Ship, Lock, TrendingUp } from "lucide-react";
import { Section, Reveal, Eyebrow, StatStrip } from "./shared";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import { useLanguage } from "@/components/i18n/use-language";
import {
  WORLD_LAND_PATH,
  WORLD_BORDER_PATH,
  projectEquirectangular as proj,
} from "@/lib/world-map-2d";

// posiciones fijas de los chokepoints (el contenido se traduce por índice)
const CHOKE_POS = [
  { lat: 20, lon: 38 },
  { lat: 9, lon: -79.9 },
  { lat: 30, lon: 32.5 },
  { lat: 50, lon: 60 },
];

// ruta marítima aproximada Asia -> Europa por el Cabo de Buena Esperanza
const SHIP_ROUTE = [
  proj(31, 121),
  proj(6, 104),
  proj(-5, 95),
  proj(-34, 25),
  proj(-20, 5),
  proj(20, -15),
  proj(43, -9),
  proj(51, 4),
];

const COPY = {
  es: {
    eyebrow: "El problema",
    h2: [
      { lead: "La velocidad tiene ", accent: "techo.", tone: "cyan" },
      { lead: "La geopolítica cobra ", accent: "peaje.", tone: "danger" },
    ],
    para1:
      "El comercio lleva 50 años sin acelerar: los aviones no pueden volar más rápido y las rutas cruzan estrechos que otros pueden cerrar.",
    para2: " El espacio no tiene estrechos.",
    stats: [
      { label: "Desvío marítimo", value: "35 días" },
      { label: "Mar Rojo · Panamá", value: "Cuellos" },
      { label: "Cierres y fronteras", value: "Restringido" },
      { label: "de estancamiento", value: "50 años" },
    ],
    chokes: [
      {
        name: "Mar Rojo",
        detail: "Rutas desviadas por seguridad",
        cost: "+$1.2M / envío",
      },
      {
        name: "Canal de Panamá",
        detail: "Sequía y cupos limitados",
        cost: "+21 días de espera",
      },
      {
        name: "Canal de Suez",
        detail: "Punto único de fallo",
        cost: "$400M / día bloqueado",
      },
      {
        name: "Espacio aéreo cerrado",
        detail: "Sobrevuelos vetados",
        cost: "+3.5 h de vuelo",
      },
    ],
    costLabel: "Coste",
    shipLabel: "35 días",
    legend: {
      ship: "Ruta marítima",
      choke: "Cuellos de botella",
      restricted: "Espacio restringido",
      arc: "Arco Pulsar",
    },
  },
  en: {
    eyebrow: "The problem",
    h2: [
      { lead: "Speed has a ", accent: "ceiling.", tone: "cyan" },
      { lead: "Geopolitics charges a ", accent: "toll.", tone: "danger" },
    ],
    para1:
      "Trade hasn't sped up in 50 years: planes can't fly faster and routes cross straits others can close.",
    para2: " Space has no straits.",
    stats: [
      { label: "Maritime detour", value: "35 days" },
      { label: "Red Sea · Panama", value: "Chokepoints" },
      { label: "Closures & borders", value: "Restricted" },
      { label: "of stagnation", value: "50 years" },
    ],
    chokes: [
      {
        name: "Red Sea",
        detail: "Routes diverted for security",
        cost: "+$1.2M / shipment",
      },
      {
        name: "Panama Canal",
        detail: "Drought and limited slots",
        cost: "+21 days waiting",
      },
      {
        name: "Suez Canal",
        detail: "Single point of failure",
        cost: "$400M / day blocked",
      },
      {
        name: "Closed airspace",
        detail: "Overflights vetoed",
        cost: "+3.5 h flight",
      },
    ],
    costLabel: "Cost",
    shipLabel: "35 days",
    legend: {
      ship: "Maritime route",
      choke: "Bottlenecks",
      restricted: "Restricted airspace",
      arc: "Pulsar arc",
    },
  },
} as const;

export function Problem() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [active, setActive] = useState<number | null>(null);
  const routePath = SHIP_ROUTE.map(
    (p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`,
  ).join(" ");

  return (
    <Section id="problema" className="overflow-hidden border-t border-border">
      <div className="pointer-events-none absolute -bottom-48 -right-40 h-[620px] w-[620px] opacity-40">
        <GlobeCanvas
          quality="low"
          autoSpin
          spinSpeed={0.04}
          dpr={[1, 1.5]}
          lightsPointScale={5}
          cameraDistance={5.4}
        />
      </div>

      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-center">
        <Reveal>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            {c.h2.map((ln, idx) => (
              <span key={idx}>
                {ln.lead}
                <span
                  className={
                    ln.tone === "danger" ? "text-danger" : "text-pulse-cyan"
                  }
                >
                  {ln.accent}
                </span>
                {idx < c.h2.length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground">
            {c.para1}
            <span className="text-foreground">{c.para2}</span>
          </p>
          <div className="mt-8">
            <StatStrip items={[...c.stats]} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-space-900/60 p-4 backdrop-blur">
            <svg viewBox="0 0 1000 500" className="w-full">
              <path
                d={WORLD_LAND_PATH}
                fillRule="evenodd"
                fill="rgba(96,165,250,0.10)"
              />
              <path
                d={WORLD_BORDER_PATH}
                fill="none"
                stroke="rgba(96,165,250,0.22)"
                strokeWidth={0.6}
              />

              <path
                d={routePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2.2}
                strokeDasharray="7 6"
                opacity={0.85}
              />
              <circle r={5} fill="#f87171">
                <animateMotion
                  dur="9s"
                  repeatCount="indefinite"
                  path={routePath}
                />
              </circle>
              <text
                x={SHIP_ROUTE[3].x}
                y={SHIP_ROUTE[3].y + 24}
                fill="#8b96b3"
                fontSize="16"
                fontFamily="Space Grotesk"
              >
                {c.shipLabel}
              </text>

              <path
                d={`M${proj(31, 121).x} ${proj(31, 121).y} Q 500 -40 ${proj(51, 4).x} ${proj(51, 4).y}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2.4}
                opacity={0.9}
              />

              {CHOKE_POS.map((pos, i) => {
                const p = proj(pos.lat, pos.lon);
                return (
                  <g
                    key={i}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active === i ? 16 : 10}
                      fill="rgba(244,63,94,0.18)"
                    >
                      <animate
                        attributeName="r"
                        values="9;16;9"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={p.x} cy={p.y} r={5} fill="#f43f5e" />
                  </g>
                );
              })}
            </svg>

            {active !== null && (
              <div className="absolute left-4 top-4 w-60 rounded-xl border border-danger/40 bg-space-950/95 p-4 shadow-xl">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-4 w-4" />
                  <span style={{ fontFamily: "var(--font-display)" }}>
                    {c.chokes[active].name}
                  </span>
                </div>
                <div className="mt-2 text-[13px] text-muted-foreground">
                  {c.chokes[active].detail}
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">{c.costLabel}</span>
                  <span className="text-foreground">
                    {c.chokes[active].cost}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-muted-foreground sm:grid-cols-4">
              <span className="flex items-center gap-1.5">
                <Ship className="h-3.5 w-3.5 text-danger" /> {c.legend.ship}
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber" />{" "}
                {c.legend.choke}
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                {c.legend.restricted}
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-pulse-cyan" />{" "}
                {c.legend.arc}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
