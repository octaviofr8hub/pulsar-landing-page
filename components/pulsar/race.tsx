"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  DoorOpen,
  Flag,
  Globe2,
  Plane,
  Rocket,
  Ship,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Section, Reveal, Eyebrow, IconStatStrip } from "./shared";
import { Parallax } from "./motion";
import { Button } from "./ui/button";
import { GlobeCanvas, buildSingleRoute } from "@/components/globe/globe-canvas";
import type { GlobeHub, HorizonFraming } from "@/components/globe/types";
import { useLanguage } from "@/components/i18n/use-language";
import {
  AIR_MODEL,
  airEstimate,
  formatDuration,
  formatKm,
  greatCircleKm,
  PULSAR_GROUND_HOURS,
  pulsarEstimate,
  SHIP_MODEL,
  shipEstimate,
} from "@/lib/logistics";
import { Flag as CountryFlag } from "@/components/ui/flag";
import { useIsMobile } from "@/components/viewport/use-is-mobile";
import { findPort, PORTS } from "./ports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type ModeKey = "ship" | "plane" | "pulsar";

const MODE_META: { key: ModeKey; icon: LucideIcon; color: string }[] = [
  { key: "ship", icon: Ship, color: "#f43f5e" },
  { key: "plane", icon: Plane, color: "#f59e0b" },
  { key: "pulsar", icon: Rocket, color: "#38bdf8" },
];

/**
 * La barra usa escala logarítmica de tiempo, no lineal: entre 27 días y 11 h
 * hay un factor 60, y en lineal el modo rápido sería un píxel. El más lento se
 * queda en el 15 % y el más rápido llena la barra.
 */
const SLOWEST_FILL = 0.15;

const COPY = {
  es: {
    eyebrow: "La solución",
    h2Lead: "De días a horas no es una mejora:",
    h2Accent: "es un cambio de categoría.",
    para: "Elige cualquier ruta y compara tres realidades logísticas: barco, avión y Pulsar.",
    paraStrong: " Inmune a canales, huelgas y fronteras.",
    ctaPrimary: "Reserva capacidad",
    ctaSecondary: "Simula tu ruta",
    pick: "Selecciona dos ciudades",
    swap: "Invertir origen y destino",
    modes: {
      ship: { label: "Barco", badge: "marítimo" },
      plane: { label: "Avión", badge: "aéreo" },
      pulsar: { label: "Pulsar", badge: "suborbital" },
    },
    doorSuffix: "puerta a puerta",
    flightSuffix: "de vuelo",
    arcTitle: "Ruta suborbital sobre el mar",
    arcSub: "Por encima del espacio aéreo soberano",
    stats: {
      flight: "vuelo suborbital",
      door: "puerta a puerta",
      straits: "sin Panamá ni mar Rojo",
      borders: "sobre el mar y fuera de rutas soberanas",
      straitsValue: "Sin estrechos",
      bordersValue: "Sin fronteras",
    },
    assumptions: (d: string) =>
      `${d} de círculo máximo · barco ${SHIP_MODEL.knots} kn ×${SHIP_MODEL.detour} de derrota + ${SHIP_MODEL.portDwellHours} h en terminal · avión ${AIR_MODEL.blockSpeedKmh} km/h + ${AIR_MODEL.groundHours} h en tierra · Pulsar: balística de mínima energía + ${PULSAR_GROUND_HOURS} h de cadena`,
    profile: (apogee: string, speed: string) =>
      `Apogeo ${apogee} km · corte de motores a ${speed} km/s`,
    logNote: "Barras en escala logarítmica de tiempo",
  },
  en: {
    eyebrow: "The solution",
    h2Lead: "From days to hours isn't an upgrade:",
    h2Accent: "it's a category shift.",
    para: "Pick any route and compare three logistics realities: ship, plane and Pulsar.",
    paraStrong: " Immune to canals, strikes and borders.",
    ctaPrimary: "Book capacity",
    ctaSecondary: "Simulate your route",
    pick: "Select two cities",
    swap: "Swap origin and destination",
    modes: {
      ship: { label: "Ship", badge: "maritime" },
      plane: { label: "Plane", badge: "air" },
      pulsar: { label: "Pulsar", badge: "suborbital" },
    },
    doorSuffix: "door to door",
    flightSuffix: "of flight",
    arcTitle: "Suborbital route over the sea",
    arcSub: "Above sovereign airspace",
    stats: {
      flight: "suborbital flight",
      door: "door to door",
      straits: "no Panama or Red Sea",
      borders: "over the sea, off sovereign routes",
      straitsValue: "No straits",
      bordersValue: "No borders",
    },
    assumptions: (d: string) =>
      `${d} great circle · ship ${SHIP_MODEL.knots} kn ×${SHIP_MODEL.detour} routing + ${SHIP_MODEL.portDwellHours} h in terminal · plane ${AIR_MODEL.blockSpeedKmh} km/h + ${AIR_MODEL.groundHours} h on the ground · Pulsar: minimum-energy ballistics + ${PULSAR_GROUND_HOURS} h chain`,
    profile: (apogee: string, speed: string) =>
      `Apogee ${apogee} km · engine cut-off at ${speed} km/s`,
    logNote: "Bars on a logarithmic time scale",
  },
} as const;

export function Race() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  // Sólo decide si se monta el canvas WebGL del planeta: en un teléfono es
  // adorno y la página ya acumula varios contextos. La maquetación es `md:`.
  const isMobile = useIsMobile();
  const [fromId, setFromId] = useState("long-beach");
  const [toId, setToId] = useState("singapur");
  const [runKey, setRunKey] = useState(0);

  const from = findPort(fromId);
  const to = findPort(toId);

  const model = useMemo(() => {
    const distanceKm = greatCircleKm(from.coords, to.coords);
    const ship = shipEstimate(distanceKm);
    const plane = airEstimate(distanceKm);
    const pulsar = pulsarEstimate(distanceKm);

    // Escala log entre el modo más rápido y el más lento del propio trayecto.
    const fastest = pulsar.doorHours;
    const slowest = ship.doorHours;
    const span = Math.log(slowest / fastest);
    const fillFor = (hours: number) =>
      span <= 0
        ? 1
        : 1 - (Math.log(hours / fastest) / span) * (1 - SLOWEST_FILL);

    return {
      distanceKm,
      route: buildSingleRoute(from.coords, to.coords),
      rows: [
        { key: "ship" as const, estimate: ship, fill: fillFor(ship.doorHours) },
        {
          key: "plane" as const,
          estimate: plane,
          fill: fillFor(plane.doorHours),
        },
        {
          key: "pulsar" as const,
          estimate: pulsar,
          fill: fillFor(pulsar.doorHours),
        },
      ],
      pulsar,
    };
  }, [from, to]);

  const hubs = useMemo<GlobeHub[]>(
    () => [
      { id: from.id, name: from.name[lang], coords: from.coords },
      { id: to.id, name: to.name[lang], coords: to.coords, nearshore: true },
    ],
    [from, to, lang],
  );

  const horizon = useMemo<HorizonFraming>(
    () => ({ route: { from: from.coords, to: to.coords } }),
    [from, to],
  );

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setRunKey((k) => k + 1);
  };

  return (
    <Section id="solucion" className="overflow-hidden border-t border-border">
      {/* z-10: el planeta de fondo sube por detrás de este bloque */}
      {/* min-w-0 en los hijos: sin él la rejilla se dimensiona por el
          min-content del panel (los selectores no parten palabras) y en móvil
          se sale del contenedor, que además recorta por `overflow-hidden`. */}
      <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start">
        <Reveal blur className="min-w-0">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 font-display text-[1.75rem] text-foreground md:text-[clamp(2rem,3.5vw,3rem)]"
            style={{
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            {c.h2Lead}
            <br />
            <span className="text-pulse-cyan">{c.h2Accent}</span>
          </h2>
          <p className="mt-5 text-[15px] text-muted-foreground md:text-[16px]">
            {c.para}
            <span className="text-foreground">{c.paraStrong}</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
            >
              <a href="#cta">
                {c.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setRunKey((k) => k + 1)}
              className="rounded-full border-border bg-white/5 text-foreground hover:bg-white/10"
            >
              <Rocket className="mr-1 h-4 w-4" /> {c.ctaSecondary}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1} direction="left" distance={44} className="min-w-0">
          <div className="rounded-2xl border border-border bg-space-900/60 p-4 backdrop-blur md:p-6">
            <p className="text-center font-mono text-[12px] tracking-wide text-muted-foreground">
              {c.pick}
            </p>

            {/* Los dos selectores no caben uno al lado del otro en un móvil:
                se apilan con el botón de intercambio en medio y a partir de
                `sm` vuelve la fila de siempre. */}
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <PortSelect
                value={fromId}
                onChange={(v) => {
                  setFromId(v);
                  setRunKey((k) => k + 1);
                }}
                exclude={toId}
                lang={lang}
              />
              <button
                type="button"
                onClick={swap}
                aria-label={c.swap}
                title={c.swap}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-border text-muted-foreground transition-colors hover:border-pulse-blue/60 hover:text-pulse-cyan"
              >
                <ArrowLeftRight className="h-4 w-4 rotate-90 sm:rotate-0" />
              </button>
              <PortSelect
                value={toId}
                onChange={(v) => {
                  setToId(v);
                  setRunKey((k) => k + 1);
                }}
                exclude={fromId}
                lang={lang}
              />
            </div>

            <div className="mt-6 space-y-3">
              {model.rows.map((row, index) => (
                <ModeRow
                  key={row.key}
                  runKey={runKey}
                  index={index}
                  meta={MODE_META.find((m) => m.key === row.key)!}
                  label={c.modes[row.key].label}
                  badge={c.modes[row.key].badge}
                  primary={
                    row.key === "pulsar"
                      ? `${Math.round(model.pulsar.profile.flightMinutes)} min`
                      : formatDuration(row.estimate.doorHours, lang)
                  }
                  secondary={
                    row.key === "pulsar"
                      ? `${formatDuration(row.estimate.doorHours, lang)} ${c.doorSuffix}`
                      : `${formatKm(row.estimate.pathKm, lang)} · ${c.doorSuffix}`
                  }
                  suffix={row.key === "pulsar" ? c.flightSuffix : undefined}
                  fill={row.fill}
                  highlight={row.key === "pulsar"}
                />
              ))}
            </div>

            <p className="mt-5 font-mono text-[11px] leading-relaxed text-space-500">
              {c.logNote} ·{" "}
              {c.profile(
                Math.round(model.pulsar.profile.apogeeKm).toString(),
                model.pulsar.profile.burnoutSpeedKms.toFixed(2),
              )}
            </p>
          </div>
        </Reveal>
      </div>

      {/* El planeta es el fondo de la sección: `horizon` deja su limbo arriba
          del todo, el arco lo cruza nivelado — origen a la izquierda, destino a
          la derecha — y la tira de cifras se apoya encima. El canvas sale a
          sangre del padding de la sección para que la curvatura llegue a los
          bordes de la ventana.
          En móvil no se monta: es un contexto WebGL entero para un fondo, y el
          mensaje del arco se cuenta en tipografía justo debajo. El `hidden`
          cubre además el instante previo a hidratar, para que la banda no
          reserve 400 px de hueco vacío en un teléfono. */}
      {!isMobile && (
        <div className="relative -mx-6 mt-6 hidden h-[400px] md:-mx-10 md:mt-8 md:block md:h-[520px] lg:-mx-14 lg:h-[560px] xl:h-[620px]">
          {/* El canvas arranca muy por encima de la banda: el planeta sube por
              detrás del panel y es el fondo de la sección, no una franja al
              pie. La ruta cae entera en la banda despejada. Los 40 px extra por
              abajo son la holgura que necesita el paralaje para no destapar el
              borde. */}
          <Parallax
            className="absolute inset-x-0 -bottom-10 -top-[185px] md:-top-[240px] lg:-top-[300px] xl:-top-[420px]"
            distance={34}
          >
            <GlobeCanvas
              mode="orbit"
              textured
              autoSpin={false}
              routes={[model.route]}
              hubs={hubs}
              onSelectHub={swap}
              horizon={horizon}
              sunDirection={[-0.55, 0.5, -0.85]}
              detailScale={0.55}
              cameraDistance={8}
              dpr={[1, 1.5]}
              showStars
            />
          </Parallax>

          {/* En escritorio, en el cielo por encima del apogeo. En móvil el arco
              sube casi hasta el borde y no cabe ahí: baja a la cara oscura del
              planeta, por debajo de la trayectoria. */}
          <motion.div
            key={`${fromId}-${toId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pointer-events-none absolute inset-x-0 top-[46%] z-10 text-center md:top-3"
          >
            <div className="font-display text-[15px] text-pulse-cyan md:text-[17px]">
              {c.arcTitle}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground md:text-[13px]">
              {c.arcSub}
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-space-950 to-transparent" />
        </div>
      )}

      {/* El mismo mensaje que corona el arco, sin planeta detrás: regla
          hairline y tipografía, nunca una caja. Sólo por debajo de `md`. */}
      <Reveal className="relative z-10 mt-10 border-t border-space-800 pt-5 md:hidden">
        <div className="font-display text-[15px] text-pulse-cyan">
          {c.arcTitle}
        </div>
        <div className="mt-1.5 text-[13px] text-muted-foreground">
          {c.arcSub}
        </div>
      </Reveal>

      <Reveal className="relative z-10">
        <IconStatStrip
          className="mt-8 md:-mt-4"
          items={[
            {
              icon: Clock,
              value: `${Math.round(model.pulsar.profile.flightMinutes)}`,
              unit: "MIN",
              label: c.stats.flight,
            },
            {
              icon: DoorOpen,
              value: formatDuration(model.pulsar.doorHours, lang),
              label: c.stats.door,
            },
            {
              icon: Waves,
              value: c.stats.straitsValue,
              label: c.stats.straits,
            },
            {
              icon: Globe2,
              value: c.stats.bordersValue,
              label: c.stats.borders,
            },
          ]}
        />
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-space-500">
          {c.assumptions(formatKm(model.distanceKm, lang))}
        </p>
      </Reveal>
    </Section>
  );
}

interface ModeRowProps {
  runKey: number;
  index: number;
  meta: { key: ModeKey; icon: LucideIcon; color: string };
  label: string;
  badge: string;
  primary: string;
  secondary: string;
  suffix?: string;
  fill: number;
  highlight: boolean;
}

/**
 * Una fila de la carrera. La barra avanza hasta su posición en escala
 * logarítmica y tarda en hacerlo lo que le corresponde: el barco recorre poco
 * y lento, el cohete llega a la bandera antes de que parpadees.
 */
function ModeRow({
  runKey,
  index,
  meta,
  label,
  badge,
  primary,
  secondary,
  suffix,
  fill,
  highlight,
}: ModeRowProps) {
  const Icon = meta.icon;
  // Cuanto menos avanza la barra, más despacio lo hace: 0.9 s → 4.2 s.
  const duration = 0.9 + (1 - fill) * 3.9;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        highlight
          ? "border-pulse-blue/50 bg-pulse-blue/10"
          : "border-border bg-space-950/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:h-10 sm:w-10"
            style={{ borderColor: `${meta.color}66`, color: meta.color }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="truncate text-[15px] text-foreground sm:text-[16px]">
            {label}
          </span>
        </div>
        {/* min-w-0 en vez de un `shrink-0` a secas: en un móvil las cifras
            deben poder repartirse el ancho con la etiqueta en vez de empujar
            la fila fuera de la tarjeta. Desde `sm` no encoge, como siempre. */}
        <div className="flex min-w-0 items-center gap-3 sm:shrink-0">
          <div className="min-w-0 text-right">
            <div className="font-display" style={{ color: meta.color }}>
              {primary}
              {suffix && (
                <span className="ml-1 text-[12px] text-muted-foreground">
                  {suffix}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">{secondary}</div>
          </div>
          <span
            className="hidden rounded-full px-2.5 py-0.5 text-[11px] sm:inline"
            style={{
              color: meta.color,
              backgroundColor: `${meta.color}1f`,
            }}
          >
            {badge}
          </span>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-2">
        <div className="relative h-px flex-1 bg-white/10">
          <motion.div
            key={`${runKey}-${meta.key}`}
            className="absolute inset-y-0 left-0"
            style={{ background: meta.color }}
            initial={{ width: "0%" }}
            animate={{ width: `${fill * 100}%` }}
            transition={{ duration, delay: index * 0.08, ease: "easeInOut" }}
          />
          <motion.span
            key={`dot-${runKey}-${meta.key}`}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: meta.color,
              boxShadow: `0 0 12px ${meta.color}`,
            }}
            initial={{ left: "0%" }}
            animate={{ left: `${fill * 100}%` }}
            transition={{ duration, delay: index * 0.08, ease: "easeInOut" }}
          />
        </div>
        <Flag
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: highlight ? meta.color : "var(--muted-foreground)" }}
        />
      </div>
    </div>
  );
}

function PortSelect({
  value,
  onChange,
  exclude,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude: string;
  lang: "es" | "en";
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      {/* En móvil ocupa el ancho completo de la columna apilada (`w-full` va en
          el propio primitivo); desde `sm` vuelve a repartirse la fila. */}
      <SelectTrigger className="min-w-0 border-border bg-space-950/60 sm:flex-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PORTS.filter((p) => p.id !== exclude).map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="flex items-center gap-2">
              <CountryFlag country={p.country} />
              {p.name[lang]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
