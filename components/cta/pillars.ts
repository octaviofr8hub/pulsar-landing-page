import { Eye, ShieldCheck, Target, Zap, type LucideIcon } from "lucide-react";

import type { ValuePillar } from "@/types/landing";

export interface PillarItem extends ValuePillar {
  icon: LucideIcon;
}

export const VALUE_PILLARS: readonly PillarItem[] = [
  {
    title: "Rápido",
    description:
      "Horas, no semanas. Tiempos de entrega drásticamente reducidos.",
    icon: Zap,
  },
  {
    title: "Preciso",
    description:
      "Datos exactos validados con IA para las mejores decisiones logísticas.",
    icon: Target,
  },
  {
    title: "Transparente",
    description:
      "Precios 100% claros desde el primer momento y tracking en tiempo real.",
    icon: Eye,
  },
  {
    title: "Confiable",
    description:
      "Seguridad de grado espacial en cada etapa de la cadena de suministro.",
    icon: ShieldCheck,
  },
];
