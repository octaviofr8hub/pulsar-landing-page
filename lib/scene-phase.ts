import type { ScenePhase } from "@/types/landing";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Mapea el progreso global de scroll (0..1 a lo largo de las 4 secciones)
 * a las fases de la escena 3D. Tops de sección: hero 0, visión 1/3,
 * logística 2/3, cta 1.
 */
export function computeScenePhase(progress: number): ScenePhase {
  const p = clamp(progress, 0, 1);

  const xray = smoothstep(0.24, 0.36, p) * (1 - smoothstep(0.74, 0.86, p));
  const thrust = smoothstep(0.55, 0.68, p) * (1 - smoothstep(0.82, 0.94, p));
  const landing = smoothstep(0.82, 0.96, p);

  const shiftX =
    1.35 * smoothstep(0.2, 0.36, p) -
    2.7 * smoothstep(0.53, 0.68, p) +
    1.35 * smoothstep(0.8, 0.94, p);

  const altitude =
    0.9 * smoothstep(0.58, 0.72, p) - 2.0 * smoothstep(0.8, 0.97, p);

  const tilt = 0.26 * (1 - smoothstep(0.5, 0.62, p));

  return { xray, thrust, landing, shiftX, altitude, tilt };
}

/**
 * Escala uniforme de la escena según el ancho visible del viewport 3D,
 * para que el cohete no se salga de cuadro en pantallas angostas.
 */
export function computeViewportScale(viewportWidth: number): number {
  return clamp(viewportWidth / 9, 0.55, 1);
}
