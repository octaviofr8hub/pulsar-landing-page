import type { ScenePhase } from "@/types/landing";

/** Secciones de 100vh apiladas en app/page.tsx, en orden de scroll. */
const SECTION_COUNT = 5;

/** Índice de la última sección: el scroll llega a 1 exactamente aquí. */
const LAST_SECTION = SECTION_COUNT - 1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Traduce una posición en "unidades de sección" (0 = tope del hero, 1 = tope de
 * visión, …) al progreso global de scroll 0..1. Mantener la coreografía en
 * estas unidades es lo que evita que agregar una sección la desincronice:
 * cada beat sigue cayendo donde debe, no donde caía en la escala anterior.
 */
function atSection(unit: number): number {
  return unit / LAST_SECTION;
}

/**
 * Mapea el progreso global de scroll a las fases de la escena 3D. La narrativa
 * es: el cohete se muestra en el hero, se abre en rayos X en visión, enciende
 * motores y cruza durante logística y la red orbital, y aterriza al llegar a la
 * última sección.
 */
export function computeScenePhase(progress: number): ScenePhase {
  const p = clamp(progress, 0, 1);

  const xray =
    smoothstep(atSection(0.72), atSection(1.08), p) *
    (1 -
      smoothstep(
        atSection(LAST_SECTION - 0.78),
        atSection(LAST_SECTION - 0.42),
        p,
      ));

  const thrust =
    smoothstep(atSection(1.65), atSection(2.04), p) *
    (1 -
      smoothstep(
        atSection(LAST_SECTION - 0.54),
        atSection(LAST_SECTION - 0.18),
        p,
      ));

  const landing = smoothstep(
    atSection(LAST_SECTION - 0.54),
    atSection(LAST_SECTION - 0.12),
    p,
  );

  const shiftX =
    1.35 * smoothstep(atSection(0.6), atSection(1.08), p) -
    2.7 * smoothstep(atSection(1.59), atSection(2.04), p) +
    1.35 *
      smoothstep(
        atSection(LAST_SECTION - 0.6),
        atSection(LAST_SECTION - 0.18),
        p,
      );

  const altitude =
    0.9 * smoothstep(atSection(1.74), atSection(2.16), p) -
    2.0 *
      smoothstep(
        atSection(LAST_SECTION - 0.6),
        atSection(LAST_SECTION - 0.09),
        p,
      );

  const tilt = 0.26 * (1 - smoothstep(atSection(1.5), atSection(1.86), p));

  return { xray, thrust, landing, shiftX, altitude, tilt };
}

/**
 * Escala uniforme de la escena según el ancho visible del viewport 3D,
 * para que el cohete no se salga de cuadro en pantallas angostas.
 */
export function computeViewportScale(viewportWidth: number): number {
  return clamp(viewportWidth / 9, 0.55, 1);
}
