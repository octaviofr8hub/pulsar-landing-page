"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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

const COPY = {
  es: {
    eyebrow: "Cómo funciona",
    titleLead: "El viaje de tu ",
    titleAccent: "paquete",
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

export function Journey() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [active, setActive] = useState(2);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    cardsRef.current[active]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  const go = (dir: number) =>
    setActive((v) => Math.min(c.steps.length - 1, Math.max(0, v + dir)));

  return (
    <Section id="viaje" className="border-t border-border">
      <Reveal>
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h2
              className="mt-5 max-w-2xl text-foreground"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem,3.5vw,3rem)",
                lineHeight: 1.08,
                fontWeight: 600,
              }}
            >
              {c.titleLead}
              <span className="text-pulse-cyan">{c.titleAccent}</span>
            </h2>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex gap-1.5">
              {c.steps.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    idx === active ? "bg-pulse-cyan" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label={c.prev}
              onClick={() => go(-1)}
              disabled={active === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={c.next}
              onClick={() => go(1)}
              disabled={active === c.steps.length - 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Reveal>

      {/* deck de tarjetas */}
      <Reveal delay={0.1}>
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {c.steps.map((step, i) => (
            <StepCard
              key={i}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              index={i}
              title={step.title}
              desc={step.desc}
              image={STEP_IMAGES[i]}
              pending={c.pending}
              active={i === active}
              onSelect={() => setActive(i)}
            />
          ))}
        </div>
      </Reveal>

      {/* stepper numerado */}
      <Reveal delay={0.15}>
        <div className="relative mt-8">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <div className="relative flex justify-between">
            {c.steps.map((_, idx) => {
              const done = idx <= active;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActive(idx)}
                  aria-label={`${idx + 1}`}
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pulse-blue/40 text-pulse-cyan">
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

interface StepCardProps {
  index: number;
  title: string;
  desc: string;
  image: string;
  pending: string;
  active: boolean;
  onSelect: () => void;
  ref?: Ref<HTMLButtonElement>;
}

function StepCard({
  index,
  title,
  desc,
  image,
  pending,
  active,
  onSelect,
  ref,
}: StepCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      animate={{
        borderColor: active ? "rgba(56,189,248,0.6)" : "rgba(120,145,200,0.14)",
        y: active ? -4 : 0,
      }}
      className="group relative flex w-[240px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-space-800/80 to-space-950 text-left"
      style={{ boxShadow: active ? "0 0 32px var(--brand-glow)" : "none" }}
    >
      <div className="p-5">
        <div
          className="text-foreground"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          <span
            className={active ? "text-pulse-cyan" : "text-muted-foreground"}
          >
            {index + 1}.
          </span>{" "}
          {title}
        </div>
        <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
          {desc}
        </p>
      </div>

      <div className="relative mt-auto aspect-[3/4] w-full overflow-hidden">
        {/* placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-space-900 to-space-950">
          <div className="hud-grid absolute inset-0 opacity-50" aria-hidden />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <ImageIcon
              className={`h-5 w-5 ${active ? "text-pulse-cyan" : "text-space-600"}`}
            />
            <span className="font-mono text-[11px] text-space-500">
              {pending}
            </span>
          </div>
        </div>
        {/* imagen real optimizada por next/image: reescala a WebP ligero
            servido al tamaño de la tarjeta, aunque el archivo original pese MB. */}
        {!failed && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 60vw, 240px"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`object-cover transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950/70 to-transparent" />
      </div>
    </motion.button>
  );
}
