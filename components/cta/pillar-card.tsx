"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

import type { PillarItem } from "./pillars";

export interface PillarCardProps {
  pillar: PillarItem;
  index: number;
}

export function PillarCard({ pillar, index }: PillarCardProps) {
  const reducedMotion = useReducedMotion();
  const Icon = pillar.icon;

  return (
    <motion.article
      className="glass-panel rounded-2xl border border-space-800 p-6 text-left transition-colors duration-300 hover:border-brand-500/50"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: index * 0.09, ease: "easeOut" }}
    >
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <Heading as="h3" level={3} className="mt-4">
        {pillar.title}
      </Heading>
      <Text size="sm" className="mt-2">
        {pillar.description}
      </Text>
    </motion.article>
  );
}
