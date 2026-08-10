"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
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

/** Relación nativa de las imágenes (1000×545): el marco se adapta a ellas y no
 *  al revés, así ninguna fase se ve recortada por arriba o por abajo. */
const MEDIA_ASPECT = "aspect-[1000/545]";

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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction >= 0 ? "-40%" : "40%",
    opacity: 0,
  }),
};

export function Journey() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const reducedMotion = useReducedMotion();
  const total = c.steps.length;

  // `direction` decide desde qué lado entra la fase siguiente.
  const [[active, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) =>
      setSlide(([current]) => [
        (next + total) % total,
        next > current ? 1 : -1,
      ]),
    [total],
  );

  const step = useCallback(
    (delta: number) =>
      setSlide(([current]) => [(current + delta + total) % total, delta]),
    [total],
  );

  // Avance automático: se detiene al pasar el puntero o al enfocar el carrusel.
  useEffect(() => {
    if (paused || reducedMotion) return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, reducedMotion, step]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const throw_ = info.offset.x + info.velocity.x * 0.2;
    if (throw_ < -80) step(1);
    else if (throw_ > 80) step(-1);
  };

  const current = c.steps[active];

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

      {/* Una fase a la vez: el marco tiene la proporción nativa de la imagen y
          las diapositivas se desplazan dentro de él. */}
      <Reveal delay={0.1} scaleFrom={0.96} distance={40}>
        <div
          className={`relative mt-10 w-full overflow-hidden rounded-2xl border border-border bg-space-900 ${MEDIA_ASPECT}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: {
                  duration: reducedMotion ? 0 : 0.6,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: reducedMotion ? 0 : 0.4 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <StepMedia
                src={STEP_IMAGES[active]}
                alt={current.title}
                pending={c.pending}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/35 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950/80 via-transparent to-transparent" />

              <motion.div
                key={`copy-${active}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="absolute inset-x-0 bottom-0 p-6 md:p-10"
              >
                <span className="font-mono text-[11px] tracking-[0.18em] text-pulse-cyan">
                  {c.phase} {String(active + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-[26px] leading-tight text-foreground md:text-[34px]">
                  {current.title}
                </h3>
                <p className="mt-2 max-w-md text-[14px] text-space-300 md:text-[16px]">
                  {current.desc}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Barra de avance del autoplay */}
          {!reducedMotion && (
            <motion.div
              key={`bar-${active}-${paused}`}
              className="absolute inset-x-0 top-0 h-0.5 origin-left bg-pulse-cyan/70"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: paused ? 0 : 1 }}
              transition={{
                duration: paused ? 0 : AUTOPLAY_MS / 1000,
                ease: "linear",
              }}
            />
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
