"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Ship, Lock, TrendingUp } from "lucide-react";
import { Section, Reveal, Eyebrow, StatStrip } from "./shared";
import { useLanguage } from "@/components/i18n/use-language";
import {
  formatDuration,
  formatKm,
  greatCircleKm,
  SHIP_MODEL,
  shipHoursForPath,
  suborbitalProfile,
} from "@/lib/logistics";
import {
  WORLD_LAND_PATH,
  WORLD_BORDER_PATH,
  projectEquirectangular as proj,
} from "@/lib/world-map-2d";
import type { GeoPoint } from "@/types/network";

// posiciones fijas de los chokepoints (el contenido se traduce por índice)
const CHOKE_POS = [
  { lat: 20, lon: 38 },
  { lat: 9, lon: -79.9 },
  { lat: 30, lon: 32.5 },
  { lat: 50, lon: 60 },
];

/** Derrota marítima Shanghái → Róterdam por el Cabo de Buena Esperanza. */
const SHIP_WAYPOINTS: GeoPoint[] = [
  { lat: 31, lon: 121 },
  { lat: 6, lon: 104 },
  { lat: -5, lon: 95 },
  { lat: -34, lon: 25 },
  { lat: -20, lon: 5 },
  { lat: 20, lon: -15 },
  { lat: 43, lon: -9 },
  { lat: 51, lon: 4 },
];

const ORIGIN = SHIP_WAYPOINTS[0];
const DESTINATION = SHIP_WAYPOINTS[SHIP_WAYPOINTS.length - 1];

/**
 * Longitud real de la derrota: suma de círculos máximos entre derrotas
 * intermedias, no la distancia directa. Es lo que convierte 9 000 km de
 * separación en 24 000 km de navegación.
 */
const SHIP_PATH_KM = SHIP_WAYPOINTS.reduce(
  (total, point, i) =>
    i === 0 ? 0 : total + greatCircleKm(SHIP_WAYPOINTS[i - 1], point),
  0,
);

const DIRECT_KM = greatCircleKm(ORIGIN, DESTINATION);
const SHIP_HOURS = shipHoursForPath(SHIP_PATH_KM);
const PULSAR = suborbitalProfile(DIRECT_KM);
const DETOUR_RATIO = SHIP_PATH_KM / DIRECT_KM;

/**
 * Escala comprimida de la animación. La relación real entre 36 días y 43 min es
 * de ~1 200:1 — ilegible en pantalla. Se comprime a 11:1 conservando el orden
 * de magnitud percibido: el barco tarda una eternidad, el cohete cruza de un
 * plumazo.
 */
const SHIP_ANIMATION_SECONDS = 26;
const PULSAR_ANIMATION_SECONDS = 2.4;

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
    statLabels: {
      ship: "Shanghái → Róterdam por el Cabo",
      detour: "más millas que en recto",
      choke: "Mar Rojo · Panamá · Suez",
      pulsar: "el mismo trayecto, suborbital",
    },
    chokeValue: "3 cuellos",
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
    legend: {
      ship: "Ruta marítima",
      choke: "Cuellos de botella",
      restricted: "Espacio restringido",
      arc: "Arco Pulsar",
    },
    scaleNote: "Animación en escala comprimida (11:1); las cifras son reales.",
    assumptions: `Portacontenedor a ${SHIP_MODEL.knots} nudos · ${SHIP_MODEL.portDwellHours} h en terminal · apogeo del arco ${Math.round(PULSAR.apogeeKm)} km`,
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
    statLabels: {
      ship: "Shanghai → Rotterdam via the Cape",
      detour: "more miles than a straight line",
      choke: "Red Sea · Panama · Suez",
      pulsar: "same trip, suborbital",
    },
    chokeValue: "3 chokepoints",
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
    legend: {
      ship: "Maritime route",
      choke: "Bottlenecks",
      restricted: "Restricted airspace",
      arc: "Pulsar arc",
    },
    scaleNote: "Animation on a compressed 11:1 scale; the figures are real.",
    assumptions: `Container ship at ${SHIP_MODEL.knots} kn · ${SHIP_MODEL.portDwellHours} h in terminal · arc apogee ${Math.round(PULSAR.apogeeKm)} km`,
  },
} as const;

export function Problem() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [active, setActive] = useState<number | null>(null);

  const { shipPath, arcPath } = useMemo(() => {
    const pts = SHIP_WAYPOINTS.map((p) => proj(p.lat, p.lon));
    const from = pts[0];
    const to = pts[pts.length - 1];
    return {
      shipPath: pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
        .join(" "),
      arcPath: `M${from.x} ${from.y} Q 500 -40 ${to.x} ${to.y}`,
    };
  }, []);

  const stats = [
    {
      value: formatDuration(SHIP_HOURS, lang),
      label: c.statLabels.ship,
    },
    {
      value: `${DETOUR_RATIO.toFixed(1)}×`,
      label: c.statLabels.detour,
    },
    { value: c.chokeValue, label: c.statLabels.choke },
    {
      value: formatDuration(PULSAR.flightMinutes / 60, lang),
      label: c.statLabels.pulsar,
    },
  ];

  return (
    <Section id="problema" className="overflow-hidden border-t border-border">
      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-center">
        <Reveal blur>
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
            <StatStrip items={stats} columns={2} />
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-space-500">
            {c.assumptions}
          </p>
        </Reveal>

        <Reveal delay={0.1} direction="left" distance={44} scaleFrom={0.97}>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-space-900/60 p-4 backdrop-blur">
            <svg viewBox="0 0 1000 500" className="w-full">
              <defs>
                <radialGradient id="pulsar-trail">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>
              </defs>

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

              {/* Derrota marítima: se dibuja lenta, como el propio viaje. */}
              <motion.path
                d={shipPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2.2}
                strokeDasharray="7 6"
                opacity={0.85}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 2.6, ease: "easeInOut" }}
              />
              <circle r={5} fill="#f87171">
                <animateMotion
                  dur={`${SHIP_ANIMATION_SECONDS}s`}
                  repeatCount="indefinite"
                  path={shipPath}
                />
              </circle>
              <text
                x={proj(SHIP_WAYPOINTS[3].lat, SHIP_WAYPOINTS[3].lon).x}
                y={proj(SHIP_WAYPOINTS[3].lat, SHIP_WAYPOINTS[3].lon).y + 26}
                fill="#8b96b3"
                fontSize="16"
                fontFamily="Space Grotesk"
              >
                {formatDuration(SHIP_HOURS, lang)} ·{" "}
                {formatKm(SHIP_PATH_KM, lang)}
              </text>

              {/* Arco Pulsar: mismo par de puertos, un orden de magnitud menos. */}
              <motion.path
                d={arcPath}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2.4}
                opacity={0.9}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              />
              <circle r={16} fill="url(#pulsar-trail)">
                <animateMotion
                  dur={`${PULSAR_ANIMATION_SECONDS}s`}
                  repeatCount="indefinite"
                  path={arcPath}
                />
              </circle>
              <circle r={4.5} fill="#e0f2fe">
                <animateMotion
                  dur={`${PULSAR_ANIMATION_SECONDS}s`}
                  repeatCount="indefinite"
                  path={arcPath}
                />
              </circle>
              <text
                x={500}
                y={44}
                textAnchor="middle"
                fill="#7dd3fc"
                fontSize="16"
                fontFamily="Space Grotesk"
              >
                {formatDuration(PULSAR.flightMinutes / 60, lang)} ·{" "}
                {formatKm(DIRECT_KM, lang)}
              </text>

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
                        begin={`${i * 0.5}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx={p.x} cy={p.y} r={5} fill="#f43f5e" />
                  </g>
                );
              })}
            </svg>

            {active !== null && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 top-4 w-60 rounded-xl border border-danger/40 bg-space-950/95 p-4 shadow-xl"
              >
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
              </motion.div>
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
            <p className="mt-3 font-mono text-[11px] text-space-500">
              {c.scaleNote}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
