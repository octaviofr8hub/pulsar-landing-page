"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MonoLabel } from "@/components/ui/mono-label";
import { Wordmark } from "@/components/ui/wordmark";

import { NAV_SECTIONS } from "./sections";

export function SiteNav() {
  const reducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(NAV_SECTIONS[0].id);
  const ratiosRef = useRef(new Map<string, number>());

  // El scroll suave lo da `scroll-behavior` en globals.css, que ya respeta
  // prefers-reduced-motion. Aquí solo se resuelve qué sección va resaltada.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratiosRef.current.set(
            entry.target.id,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratiosRef.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best) {
          setActiveId(best);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const section of NAV_SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, []);

  return (
    <motion.header
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      initial={{ opacity: 0, y: reducedMotion ? 0 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
    >
      <nav
        aria-label="Principal"
        className="flex items-center gap-2 rounded-full border border-space-800 bg-space-900/70 p-1.5 pl-5 backdrop-blur-md"
      >
        <a
          href="#hero"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <Wordmark size="sm" />
          <span className="sr-only">Ir al inicio</span>
        </a>

        <ul className="mx-2 hidden items-center gap-0.5 lg:flex">
          {NAV_SECTIONS.map((section) => {
            const active = activeId === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active ? "true" : undefined}
                  className="relative block rounded-full px-3.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-activa"
                      className="absolute inset-0 rounded-full bg-space-800"
                      transition={{
                        duration: reducedMotion ? 0 : 0.3,
                        ease: "easeOut",
                      }}
                    />
                  )}
                  <MonoLabel
                    tone={active ? "primary" : "muted"}
                    className="relative"
                  >
                    {section.label}
                  </MonoLabel>
                </a>
              </li>
            );
          })}
        </ul>

        <Button size="default" asChild>
          <a href="#cta">Reservar</a>
        </Button>
      </nav>
    </motion.header>
  );
}
