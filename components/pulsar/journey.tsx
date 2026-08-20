"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import {
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Button } from "./ui/button";
import { useReducedMotion } from "@/components/globe/hooks";
import { useLanguage } from "@/components/i18n/use-language";

/**
 * Rutas de las imágenes generadas con IA para cada fase. Deja el archivo en
 * `public/journey/` con este nombre y aparecerá automáticamente; mientras no
 * exista, la tarjeta muestra un placeholder. (Prompts en docs/image-prompts.md)
 */
const STEP_IMAGES = [
  "/journey/step-1.jpg",
  "/journey/step-2.jpg",
  "/journey/step-3.jpg",
  "/journey/step-4.jpg",
  "/journey/step-5.jpg",
  "/journey/step-6.jpg",
];

/**
 * Proporción de la tarjeta. En pantalla ancha es la nativa de las imágenes
 * (1000×545) y no se recorta nada; en el móvil se pone de pie, porque con el
 * apaisado la tarjeta queda tan baja que el titular y su línea se comen la foto.
 */
const CARD_ASPECT = "aspect-[4/5] sm:aspect-[1000/545]";

/**
 * Alto del escenario: el justo para la tarjeta del centro en cada tamaño —
 * ancho de la tarjeta partido por su proporción. Si el escenario fuese más
 * bajo, la tarjeta se saldría por arriba y por abajo.
 */
const STAGE_ASPECT = "aspect-[9/10] sm:aspect-[2/1] md:aspect-[2.5/1]";

const AUTOPLAY_MS = 7000;

const COPY = {
  es: {
    eyebrow: "Cómo funciona",
    titleLead: "El viaje de tu ",
    titleAccent: "paquete",
    phase: "Fase",
    steps: [
      { title: "Reserva", desc: "Reserva desde el móvil." },
      {
        title: "Preparación",
        desc: "Integración horizontal en el hangar del puerto.",
      },
      {
        title: "Salida al mar",
        desc: "Buque semisumergible, 30–60 km mar adentro.",
      },
      {
        title: "Carga y lanzamiento",
        desc: "El propelente se carga solo en el mar.",
      },
      {
        title: "Vuelo y llegada",
        desc: "Despacho aduanero 100 % digital mientras el cohete vuela.",
      },
      { title: "Última milla", desc: "Entrega final." },
    ],
    line1: "La mercancía se carga en tierra; el propelente, en el mar.",
    line2: "Tú entregas y recibes: todo lo demás es invisible, como debe ser.",
    note: "Despacho aduanero 100 % digital mientras el cohete vuela.",
    cta: "Ver el proceso",
    pending: "Imagen pendiente",
    prev: "Fase anterior",
    next: "Fase siguiente",
  },
  en: {
    eyebrow: "How it works",
    titleLead: "Your package's ",
    titleAccent: "journey",
    phase: "Phase",
    steps: [
      { title: "Booking", desc: "Book from your phone." },
      {
        title: "Preparation",
        desc: "Horizontal integration in the port hangar.",
      },
      {
        title: "Out to sea",
        desc: "Semi-submersible vessel, 30–60 km offshore.",
      },
      {
        title: "Fueling & launch",
        desc: "Propellant is loaded only at sea.",
      },
      {
        title: "Flight & arrival",
        desc: "100% digital customs clearance while the rocket flies.",
      },
      { title: "Last mile", desc: "Final delivery." },
    ],
    line1: "Cargo is loaded on land; propellant, at sea.",
    line2:
      "You hand off and receive: everything else is invisible, as it should be.",
    note: "100% digital customs clearance while the rocket flies.",
    cta: "See the process",
    pending: "Image pending",
    prev: "Previous phase",
    next: "Next phase",
  },
} as const;

/** Tarjetas que se ven a cada lado de la que manda. */
const SIDE_CARDS = 2;

/**
 * Sitio de cada tarjeta según su distancia a la del centro: cuanto más lejos,
 * más pequeña, más girada de perfil y más apagada. De ahí sale la profundidad
 * del carrusel — el recorrido se lee como una fila de fases que viene hacia ti.
 */
const SLOTS = [
  { x: 0, scale: 1, rotateY: 0, opacity: 1 },
  { x: 58, scale: 0.78, rotateY: 24, opacity: 0.78 },
  { x: 100, scale: 0.6, rotateY: 30, opacity: 0.3 },
] as const;

interface Slot {
  x: string;
  scale: number;
  rotateY: number;
  opacity: number;
  zIndex: number;
}

/**
 * Distancia con la vuelta dada: la fase 1 está a un paso de la 6, no a cinco.
 * Sin esto el carrusel daría un barrido entero al pasar del final al principio.
 */
function ringDistance(index: number, active: number, total: number): number {
  const raw = index - active;
  const wrapped = ((raw % total) + total) % total;
  return wrapped > total / 2 ? wrapped - total : wrapped;
}

function slotFor(distance: number): Slot {
  const depth = Math.min(Math.abs(distance), SLOTS.length - 1);
  const slot = SLOTS[depth];
  const side = Math.sign(distance);

  return {
    x: `${slot.x * side}%`,
    scale: slot.scale,
    // Las de la derecha enseñan su canto izquierdo y al revés: miran al centro.
    rotateY: slot.rotateY * side,
    opacity: slot.opacity,
    zIndex: SLOTS.length - depth,
  };
}

export function Journey() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const reducedMotion = useReducedMotion();
  const total = c.steps.length;

  /** La fase que manda; el resto se colocan respecto a ella. */
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => setActive(((next % total) + total) % total),
    [total],
  );

  const step = useCallback(
    (delta: number) =>
      setActive((current) => (current + delta + total) % total),
    [total],
  );

  // Avance automático: se detiene al pasar el puntero o al enfocar el carrusel.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, step]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Cuenta el impulso, no sólo lo que se ha arrastrado: un golpe corto y
    // rápido pasa de fase igual que un arrastre largo y lento.
    const throw_ = info.offset.x + info.velocity.x * 0.2;
    if (throw_ < -80) step(1);
    else if (throw_ > 80) step(-1);
  };

  const slide = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 190, damping: 28, mass: 0.9 };

  return (
    <Section id="viaje" className="border-t border-border">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2
              className="mt-5 max-w-2xl font-display text-foreground"
              style={{
                fontSize: "clamp(2rem,3.5vw,3rem)",
                lineHeight: 1.08,
                fontWeight: 600,
              }}
            >
              {c.titleLead}
              <span className="text-pulse-cyan">{c.titleAccent}</span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[13px] text-muted-foreground">
              <span className="text-pulse-cyan">
                {String(active + 1).padStart(2, "0")}
              </span>
              {" / "}
              {String(total).padStart(2, "0")}
            </span>
            <div className="flex gap-2">
              <NavButton label={c.prev} onClick={() => step(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </NavButton>
              <NavButton label={c.next} onClick={() => step(1)}>
                <ChevronRight className="h-4 w-4" />
              </NavButton>
            </div>
          </div>
        </div>
      </Reveal>

      {/* El carrusel: todas las fases están en el escenario a la vez y lo que
          cambia es su sitio en profundidad. Se arrastra, se hace clic en una
          lateral para traerla al frente y avanza solo mientras no lo toques. */}
      <Reveal delay={0.1} scaleFrom={0.96} distance={40}>
        <div
          className="relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <motion.div
            className={`carousel-fade relative w-full cursor-grab touch-pan-y overflow-hidden perspective-[1600px] active:cursor-grabbing ${STAGE_ASPECT}`}
            aria-roledescription="carousel"
            aria-label={c.eyebrow}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={handleDragEnd}
          >
            {c.steps.map((s, index) => {
              const distance = ringDistance(index, active, total);
              const isActive = distance === 0;
              const slot = slotFor(distance);
              const hidden = Math.abs(distance) > SIDE_CARDS;

              return (
                <div
                  key={index}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <motion.article
                    aria-hidden={hidden}
                    className={`pointer-events-auto relative w-[88%] overflow-hidden rounded-2xl border bg-space-900 shadow-[0_30px_80px_-40px_rgba(2,8,20,0.95)] backface-hidden md:w-[68%] ${CARD_ASPECT} ${
                      isActive ? "border-pulse-blue/45" : "border-border"
                    }`}
                    initial={false}
                    animate={{
                      ...slot,
                      opacity: hidden ? 0 : slot.opacity,
                    }}
                    transition={{
                      ...slide,
                      opacity: { duration: reducedMotion ? 0 : 0.45 },
                    }}
                  >
                    {/* Ken Burns sólo en la del frente: la imagen respira
                        durante la fase y se queda quieta en las laterales. */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ scale: isActive && !reducedMotion ? 1.06 : 1 }}
                      transition={{
                        duration: isActive ? AUTOPLAY_MS / 1000 : 0.6,
                        ease: "linear",
                      }}
                    >
                      <StepMedia
                        src={STEP_IMAGES[index]}
                        alt={s.title}
                        pending={c.pending}
                      />
                    </motion.div>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/35 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950/80 via-transparent to-transparent" />
                    {/* Velo de las laterales: hunde en el fondo lo que no toca. */}
                    <motion.div
                      className="pointer-events-none absolute inset-0 bg-space-950"
                      initial={false}
                      animate={{ opacity: isActive ? 0 : 0.3 }}
                      transition={{ duration: reducedMotion ? 0 : 0.45 }}
                    />

                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                      <span className="font-mono text-[11px] tracking-[0.18em] text-pulse-cyan">
                        {c.phase} {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-2 font-display text-[20px] leading-tight text-foreground md:text-[32px]">
                        {s.title}
                      </h3>
                      <motion.p
                        className="max-w-md text-[14px] text-space-300 md:text-[16px]"
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                          height: isActive ? "auto" : 0,
                          marginTop: isActive ? 8 : 0,
                        }}
                        transition={{ duration: reducedMotion ? 0 : 0.4 }}
                      >
                        {s.desc}
                      </motion.p>
                    </div>

                    {/* Las laterales son un botón entero: un clic las trae. */}
                    {!isActive && !hidden && (
                      <button
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`${c.phase} ${index + 1}: ${s.title}`}
                        className="absolute inset-0 cursor-pointer"
                      />
                    )}
                  </motion.article>
                </div>
              );
            })}
          </motion.div>

          {/* Cuenta atrás del avance automático, al pie de la tarjeta del frente */}
          {!reducedMotion && (
            <div className="mx-auto mt-4 h-0.5 w-[88%] overflow-hidden bg-border md:w-[68%]">
              <motion.div
                key={`bar-${active}-${paused}`}
                className="h-full origin-left bg-pulse-cyan/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: paused ? 0 : 1 }}
                transition={{
                  duration: paused ? 0 : AUTOPLAY_MS / 1000,
                  ease: "linear",
                }}
              />
            </div>
          )}

          <SideButton side="left" label={c.prev} onClick={() => step(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </SideButton>
          <SideButton side="right" label={c.next} onClick={() => step(1)}>
            <ChevronRight className="h-5 w-5" />
          </SideButton>
        </div>
      </Reveal>

      {/* stepper numerado */}
      <Reveal delay={0.15}>
        <div className="relative mt-8">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <motion.div
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-pulse-cyan/60"
            animate={{ width: `${(active / (total - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="relative flex justify-between">
            {c.steps.map((s, idx) => {
              const done = idx <= active;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goTo(idx)}
                  aria-label={`${c.phase} ${idx + 1}: ${s.title}`}
                  aria-current={idx === active}
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-space-950 text-[13px] transition-colors"
                  style={{
                    borderColor: done ? "var(--pulse-cyan)" : "var(--border)",
                    color: done
                      ? "var(--pulse-cyan)"
                      : "var(--muted-foreground)",
                    boxShadow:
                      idx === active
                        ? "0 0 0 4px rgba(56,189,248,0.15)"
                        : "none",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* barra de resumen */}
      <Reveal delay={0.2}>
        <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-border bg-space-900/60 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pulse-blue/40 text-pulse-cyan">
              <Box className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[17px] text-foreground">
                {c.line1}
                <br />
                {c.line2}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-pulse-cyan" />
                {c.note}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
          >
            <a href="#plataforma">
              {c.cta} <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </Reveal>
    </Section>
  );
}

function StepMedia({
  src,
  alt,
  pending,
}: {
  src: string;
  alt: string;
  pending: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-space-900 to-space-950">
        <div className="hud-grid absolute inset-0 opacity-50" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <ImageIcon className="h-5 w-5 text-pulse-cyan" />
          <span className="font-mono text-[11px] text-space-500">
            {pending}
          </span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 100vw, 1100px"
      onError={() => setFailed(true)}
      className="pointer-events-none select-none object-cover"
      draggable={false}
      priority={false}
    />
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-pulse-blue/60 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SideButton({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-space-950/60 text-space-200 backdrop-blur transition-colors hover:border-pulse-blue/60 hover:text-white md:flex ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {children}
    </button>
  );
}
