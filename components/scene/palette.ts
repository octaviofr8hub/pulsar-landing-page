import { useMemo } from "react";

const TOKEN_FALLBACKS = {
  "--brand-300": "#93c5fd",
  "--brand-400": "#60a5fa",
  "--brand-500": "#3b82f6",
  "--space-200": "#c7d6ff",
  "--space-700": "#2a3360",
  "--space-800": "#1a2040",
} as const;

export type BrandToken = keyof typeof TOKEN_FALLBACKS;

/**
 * Lee un token de marca definido en app/globals.css. Los materiales WebGL no
 * pueden usar clases Tailwind, así que este es el único punto de la escena
 * donde se resuelven colores — siempre desde las variables CSS de la marca.
 */
export function readBrandToken(token: BrandToken): string {
  if (typeof window === "undefined") {
    return TOKEN_FALLBACKS[token];
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || TOKEN_FALLBACKS[token];
}

export interface ScenePalette {
  hull: string;
  panel: string;
  dark: string;
  accent: string;
  glow: string;
  flame: string;
}

export function useScenePalette(): ScenePalette {
  return useMemo(
    () => ({
      hull: readBrandToken("--space-200"),
      panel: readBrandToken("--space-700"),
      dark: readBrandToken("--space-800"),
      accent: readBrandToken("--brand-500"),
      glow: readBrandToken("--brand-400"),
      flame: readBrandToken("--brand-300"),
    }),
    [],
  );
}
