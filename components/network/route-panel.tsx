"use client";

import { motion, useReducedMotion } from "framer-motion";

import { MonoLabel } from "@/components/ui/mono-label";
import { cn } from "@/lib/utils";
import type { OrbitalRoute } from "@/types/network";

function formatEta(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

const numberFormat = new Intl.NumberFormat("es-MX");

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <span className="block">
      <MonoLabel className="block">{label}</MonoLabel>
      <span className="mt-1.5 block font-mono text-sm text-white">{value}</span>
    </span>
  );
}

export interface RoutePanelProps {
  route: OrbitalRoute;
  etaMinutes: number;
  /** Resaltada: por hover del puntero o porque está seleccionada */
  active: boolean;
  /** Fijada con click — sobrevive a que el puntero se vaya */
  selected: boolean;
  index: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onSelect: () => void;
}

/**
 * Telemetría de una ruta. Sin caja ni glass: una regla vertical que se enciende
 * marca el estado. Hover resalta, click fija — y el mismo botón sirve con
 * teclado, que es la única vía accesible a la escena 3D.
 */
export function RoutePanel({
  route,
  etaMinutes,
  active,
  selected,
  index,
  onActivate,
  onDeactivate,
  onSelect,
}: RoutePanelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      className={cn(
        "w-full border-l-2 py-4 pl-5 pr-2 text-left transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-space-950",
        selected
          ? "border-brand-500 bg-brand-500/[0.07]"
          : active
            ? "border-brand-400/70"
            : "border-space-800 hover:border-space-600",
      )}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-display text-base tracking-tight text-white">
          {route.from.city}
          <span className="mx-2 text-brand-400" aria-hidden="true">
            →
          </span>
          {route.to.city}
        </span>
      </span>

      <MonoLabel
        tone={selected || active ? "accent" : "muted"}
        className="mt-2 block"
      >
        {route.status}
      </MonoLabel>

      <span className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="ETA" value={formatEta(etaMinutes)} />
        <Metric
          label="Carga"
          value={`${numberFormat.format(route.cargoKg)} kg`}
        />
        <Metric label="Eficiencia" value={`${route.efficiency}%`} />
      </span>
    </motion.button>
  );
}
