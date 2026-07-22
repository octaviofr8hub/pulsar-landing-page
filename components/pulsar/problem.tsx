"use client";

import { useState } from "react";
import { AlertTriangle, Ship, Lock, TrendingUp } from "lucide-react";
import { Section, Reveal, Eyebrow, StatStrip } from "./shared";
import { GlobeCanvas } from "@/components/globe/globe-canvas";
import {
  WORLD_LAND_PATH,
  WORLD_BORDER_PATH,
  projectEquirectangular as proj,
} from "@/lib/world-map-2d";

const CHOKES = [
  {
    name: "Mar Rojo",
    lat: 20,
    lon: 38,
    cost: "+$1.2M / envío",
    detail: "Rutas desviadas por seguridad",
    risk: "Crítico",
  },
  {
    name: "Canal de Panamá",
    lat: 9,
    lon: -79.9,
    cost: "+21 días de espera",
    detail: "Sequía y cupos limitados",
    risk: "Alto",
  },
  {
    name: "Canal de Suez",
    lat: 30,
    lon: 32.5,
    cost: "$400M / día bloqueado",
    detail: "Punto único de fallo",
    risk: "Alto",
  },
  {
    name: "Espacio aéreo cerrado",
    lat: 50,
    lon: 60,
    cost: "+3.5 h de vuelo",
    detail: "Sobrevuelos vetados",
    risk: "Medio",
  },
];

// a rough shipping route Asia -> Europe via Cape of Good Hope
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

export function Problem() {
  const [active, setActive] = useState<number | null>(null);
  const routePath = SHIP_ROUTE.map(
    (p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`,
  ).join(" ");

  return (
    <Section id="problema" className="overflow-hidden border-t border-border">
      {/* planeta ambiental en la esquina, como fondo */}
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
          <Eyebrow>El problema</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            La velocidad tiene <span className="text-pulse-cyan">techo.</span>
            <br />
            La geopolítica cobra <span className="text-danger">peaje.</span>
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground">
            El comercio lleva 50 años sin acelerar: los aviones no pueden volar
            más rápido y las rutas cruzan estrechos que otros pueden cerrar.
            <span className="text-foreground">
              {" "}
              El espacio no tiene estrechos.
            </span>
          </p>
          <div className="mt-8">
            <StatStrip
              items={[
                { label: "Desvío marítimo", value: "35 días" },
                { label: "Mar Rojo · Panamá", value: "Cuellos" },
                { label: "Cierres y fronteras", value: "Restringido" },
                { label: "de estancamiento", value: "50 años" },
              ]}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-space-900/60 p-4 backdrop-blur">
            <svg viewBox="0 0 1000 500" className="w-full">
              {/* continentes reales */}
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

              {/* ship route (problem, dashed) */}
              <path
                d={routePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2.2}
                strokeDasharray="7 6"
                opacity={0.85}
              />
              {/* animated ship */}
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
                35 días
              </text>

              {/* pulsar arc over the sea (solution preview) */}
              <path
                d={`M${proj(31, 121).x} ${proj(31, 121).y} Q 500 -40 ${proj(51, 4).x} ${proj(51, 4).y}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2.4}
                opacity={0.9}
              />

              {/* chokepoints */}
              {CHOKES.map((c, i) => {
                const p = proj(c.lat, c.lon);
                return (
                  <g
                    key={c.name}
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
                    {CHOKES[active].name}
                  </span>
                </div>
                <div className="mt-2 text-[13px] text-muted-foreground">
                  {CHOKES[active].detail}
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-muted-foreground">Coste</span>
                  <span className="text-foreground">{CHOKES[active].cost}</span>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] text-muted-foreground sm:grid-cols-4">
              <span className="flex items-center gap-1.5">
                <Ship className="h-3.5 w-3.5 text-danger" /> Ruta marítima
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber" /> Cuellos de
                botella
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Espacio
                restringido
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-pulse-cyan" /> Arco
                Pulsar
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
