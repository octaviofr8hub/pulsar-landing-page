"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * Gramática de scroll de la landing.
 *
 * Una sola curva y una sola distancia para toda la página: lo que cambia de una
 * sección a otra es *qué* se mueve, no cómo. Todo respeta
 * `prefers-reduced-motion`: con él activo los componentes siguen montando y
 * mostrando su contenido, sólo que sin desplazamiento.
 */
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.7;

/** Margen de disparo: la entrada empieza antes de que el bloque llegue al centro. */
const VIEWPORT = { once: true, margin: "-15% 0px -10% 0px" } as const;

type Direction = "up" | "down" | "left" | "right";

function offsetFor(direction: Direction, distance: number) {
  switch (direction) {
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return { y: distance };
  }
}

export interface RevealProps {
  children: ReactNode;
  /** Retardo en segundos: escalona bloques hermanos. */
  delay?: number;
  className?: string;
  direction?: Direction;
  distance?: number;
  /** Desenfoque de entrada. Sólo para texto: en imágenes grandes cuesta caro. */
  blur?: boolean;
  /** Entra creciendo desde este factor (1 = sin escala). */
  scaleFrom?: number;
}

/** Entrada estándar de un bloque al aparecer en pantalla. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
  distance = 24,
  blur = false,
  scaleFrom = 1,
}: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduced
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: scaleFrom,
              filter: blur ? "blur(6px)" : "blur(0px)",
              ...offsetFor(direction, distance),
            }
      }
      whileInView={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }
      }
      viewport={VIEWPORT}
      transition={{ duration: reduced ? 0.3 : DURATION, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants = (gap: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Separación entre hijos, en segundos. */
  gap?: number;
  delay?: number;
}

/**
 * Contenedor que entra en cascada. Lleva el `className` del layout (grid, flex),
 * así que sustituye al `div` que ya estuviera ahí en vez de envolverlo.
 */
export function Stagger({
  children,
  className = "",
  gap = 0.09,
  delay = 0,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={containerVariants(gap, delay)}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  distance?: number;
}

/** Cada hijo de `Stagger`. Sin él, la cascada no tiene a quién escalonar. */
export function StaggerItem({
  children,
  className = "",
  direction = "up",
  distance = 22,
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced
          ? { opacity: 0 }
          : { opacity: 0, ...offsetFor(direction, distance) },
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: reduced ? 0.3 : DURATION, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /**
   * Recorrido total en px a lo largo del paso por pantalla. Positivo = el bloque
   * va más lento que la página (se queda atrás); negativo = se adelanta.
   */
  distance?: number;
}

/**
 * Paralaje ligado al scroll. El elemento recorre `distance` px mientras cruza el
 * viewport, amortiguado con un muelle para que no se sienta pegado al píxel.
 *
 * Quien lo use debe dejar holgura (un contenedor con `overflow-hidden` y el hijo
 * sobredimensionado), o el desplazamiento destapará los bordes.
 */
export function Parallax({
  children,
  className = "",
  distance = 60,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, { stiffness: 140, damping: 30, mass: 0.35 });

  return (
    <motion.div ref={ref} className={className} style={{ y: reduced ? 0 : y }}>
      {children}
    </motion.div>
  );
}

export interface ScrollFadeProps {
  children: ReactNode;
  className?: string;
  /** Cuánto sube el bloque mientras se desvanece. */
  lift?: number;
}

/**
 * Salida ligada al scroll: el bloque se despide subiendo y difuminándose
 * conforme su sección abandona la pantalla. Para el hero, donde el contenido
 * flota sobre una escena 3D que se queda.
 */
export function ScrollFade({
  children,
  className = "",
  lift = 90,
}: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -lift]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduced ? undefined : { y, opacity }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Línea de progreso de lectura de toda la página. Vive en la navbar: es el único
 * elemento fijo, y ahí hace de subrayado del borde inferior.
 */
export function ScrollProgress({ className = "" }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className={`h-px origin-left bg-gradient-to-r from-pulse-blue via-pulse-cyan to-pulse-blue ${className}`}
    />
  );
}
