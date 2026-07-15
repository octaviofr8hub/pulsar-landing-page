"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { SplitText } from "@/components/ui/split-text";
import { Text } from "@/components/ui/text";
import { Wordmark } from "@/components/ui/wordmark";

export function HeroSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
      >
        <Wordmark size="lg" />
        <Text
          as="span"
          size="sm"
          tone="accent"
          className="mt-3 tracking-[0.35em]"
        >
          Space Freight Forwarder
        </Text>
      </motion.div>
      <Heading as="h1" level={1} className="mt-6 max-w-4xl">
        <SplitText
          text="El futuro de la logística global, impulsado por IA"
          delay={0.35}
        />
      </Heading>
      <motion.div
        initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.05, ease: "easeOut" }}
      >
        <Text size="lg" className="mt-6 max-w-2xl">
          De New York a Tokyo en horas, no semanas. Carga de alto valor sobre
          una red de cohetes reutilizables.
        </Text>
      </motion.div>
      <motion.div
        className="mt-10 flex flex-col gap-4 sm:flex-row"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 1.3, ease: "easeOut" }}
      >
        <Button size="lg" asChild>
          <a href="#cta">Reservar espacio</a>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <a href="#vision">Ver cómo funciona</a>
        </Button>
      </motion.div>
      <motion.div
        className="absolute bottom-8"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-6 text-space-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
