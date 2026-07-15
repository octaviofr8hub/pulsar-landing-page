"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { ValuePillar } from "@/types/landing";

export interface PillarRowProps {
  pillar: ValuePillar;
  index: number;
  open: boolean;
  onToggle: () => void;
}

/**
 * Un pilar como fila editorial: número, título y regla hairline. Sin caja, sin
 * glass y sin chip de icono — el peso lo carga la tipografía. Al abrirse
 * revela el detalle largo.
 */
export function PillarRow({ pillar, index, open, onToggle }: PillarRowProps) {
  const reducedMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");
  const buttonId = `pilar-${number}`;
  const panelId = `pilar-${number}-detalle`;

  return (
    <div className="border-t border-space-800">
      <div className="grid grid-cols-[2.5rem_1fr] gap-4 py-7 md:gap-8">
        <MonoLabel tone={open ? "accent" : "muted"} className="pt-2">
          /{number}
        </MonoLabel>

        <div>
          <h3>
            <button
              id={buttonId}
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={panelId}
              className="group flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 focus-visible:ring-offset-space-950"
            >
              <span
                className={cn(
                  "font-display text-xl font-medium tracking-tight transition-colors duration-200 md:text-2xl",
                  open ? "text-white" : "text-space-100 group-hover:text-white",
                )}
              >
                {pillar.title}
              </span>
              <Plus
                className={cn(
                  "size-4 shrink-0 transition-transform duration-300",
                  open
                    ? "rotate-45 text-brand-400"
                    : "text-space-500 group-hover:text-space-300",
                )}
                aria-hidden="true"
              />
            </button>
          </h3>

          <Text size="sm" className="mt-2 max-w-lg">
            {pillar.description}
          </Text>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="detalle"
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.3,
                  ease: "easeOut",
                }}
              >
                <Text
                  size="sm"
                  tone="muted"
                  className="mt-4 max-w-lg border-l border-brand-500/40 pl-4"
                >
                  {pillar.detail}
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
