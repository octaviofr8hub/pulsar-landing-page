/**
 * Ascenso pilotable — la segunda mitad del minijuego de la cofia.
 *
 * Una vez estibada la carga, el jugador deja de acomodar palés y pasa a llevar
 * el cohete: el lanzador sube solo (empuje) y él corrige la deriva lateral para
 * cruzar las puertas de guiado. Todo lo que hay aquí es aritmética pura, sin
 * three.js ni React: la escena sólo lo dibuja.
 *
 * Las cifras que se enseñan (altitud, velocidad) no son inventadas: salen del
 * perfil suborbital real de la ruta cotizada — `suborbitalProfile()` en
 * `lib/logistics.ts` da apogeo y velocidad de corte de motores — comprimido a
 * los segundos que dura la jugada.
 */

/** Segundos de reloj que dura el ascenso jugable. */
export const ASCENT_SECONDS = 15;
/** Puertas de guiado repartidas por el corredor de subida. */
export const GATE_COUNT = 6;
/** Radio útil de una puerta, en unidades de escena. */
export const GATE_RADIUS = 1.25;
/** Desviación lateral máxima del corredor, en unidades de escena. */
export const CORRIDOR_HALF = 3.6;

/** Rigidez del control de actitud: cuánto tira hacia la posición pedida. */
const STEER_STIFFNESS = 26;
/** Amortiguación de los propulsores de control. */
const STEER_DAMPING = 6.5;
/** Velocidad lateral máxima, para que no se pueda cruzar el corredor de un tirón. */
const MAX_LATERAL = 7;
/** Paso fijo de la simulación, en segundos. */
const FIXED_STEP = 1 / 60;

export interface AscentState {
  /** Segundos desde el inicio del ascenso. */
  t: number;
  /** Desviación lateral respecto al eje del corredor. */
  x: number;
  z: number;
  vx: number;
  vz: number;
  /** Índice de la próxima puerta por cruzar. */
  gate: number;
  passed: number;
  missed: number;
  /** Resultado de cada puerta ya evaluada, en orden. */
  results: boolean[];
  done: boolean;
}

export interface SteerTarget {
  x: number;
  z: number;
}

export function createAscent(): AscentState {
  return {
    t: 0,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    gate: 0,
    passed: 0,
    missed: 0,
    results: [],
    done: false,
  };
}

/**
 * Posición de una puerta en el corredor. Determinista a propósito: la misma
 * trayectoria en cada partida, así el jugador puede mejorar su guiado.
 */
export function gatePosition(index: number): { x: number; z: number } {
  const reach = CORRIDOR_HALF - GATE_RADIUS * 0.5;
  return {
    x: Math.sin(index * 1.87 + 0.6) * reach,
    z: Math.cos(index * 2.31 + 1.1) * reach * 0.65,
  };
}

/** Fracción del ascenso a la que aparece cada puerta. */
export function gateProgress(index: number): number {
  return (index + 1) / (GATE_COUNT + 1);
}

/** Fracción de ascenso completada, de 0 (plataforma) a 1 (corte de motores). */
export function ascentProgress(state: AscentState): number {
  return Math.min(1, state.t / ASCENT_SECONDS);
}

/**
 * Altitud a partir del apogeo de la ruta. Aceleración constante hasta el corte
 * de motores → la altura va con el cuadrado del tiempo, no lineal.
 */
export function altitudeKm(progress: number, apogeeKm: number): number {
  return apogeeKm * progress * progress;
}

/** Velocidad instantánea: lineal con el tiempo bajo aceleración constante. */
export function speedKms(progress: number, burnoutSpeedKms: number): number {
  return burnoutSpeedKms * progress;
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * Un paso fijo de simulación: muelle amortiguado hacia la posición pedida (el
 * mando no teletransporta el cohete, lo empuja) y evaluación de las puertas
 * cruzadas.
 */
function integrate(
  state: AscentState,
  target: SteerTarget,
  step: number,
): AscentState {
  const ax = (target.x - state.x) * STEER_STIFFNESS - state.vx * STEER_DAMPING;
  const az = (target.z - state.z) * STEER_STIFFNESS - state.vz * STEER_DAMPING;

  let vx = clamp(state.vx + ax * step, MAX_LATERAL);
  let vz = clamp(state.vz + az * step, MAX_LATERAL);
  let x = state.x + vx * step;
  let z = state.z + vz * step;

  // Pared del corredor: el cohete no puede salirse del cono de vuelo.
  if (Math.abs(x) > CORRIDOR_HALF) {
    x = clamp(x, CORRIDOR_HALF);
    vx = 0;
  }
  if (Math.abs(z) > CORRIDOR_HALF) {
    z = clamp(z, CORRIDOR_HALF);
    vz = 0;
  }

  const t = state.t + step;
  const after = t / ASCENT_SECONDS;

  let { gate, passed, missed } = state;
  let results = state.results;

  // El paso es de 1/60 s y las puertas van muy separadas: como mucho se cruza
  // una por paso, así que no hace falta interpolar dentro del tramo.
  while (gate < GATE_COUNT && gateProgress(gate) <= after) {
    const center = gatePosition(gate);
    const hit = Math.hypot(x - center.x, z - center.z) <= GATE_RADIUS;
    results = [...results, hit];
    if (hit) passed += 1;
    else missed += 1;
    gate += 1;
  }

  return {
    t,
    x,
    z,
    vx,
    vz,
    gate,
    passed,
    missed,
    results,
    done: t >= ASCENT_SECONDS,
  };
}

/**
 * Avanza el ascenso el tiempo real transcurrido, en pasos fijos.
 *
 * Integrar el fotograma entero de una vez ataba el ascenso a los fps: en un
 * equipo lento —o con la escena renderizando por software— la subida se
 * arrastraba y el muelle del control se disparaba. Con subpasos, el reloj del
 * juego es el del usuario. El total se acota para que volver a una pestaña en
 * segundo plano no teletransporte la misión.
 */
export function stepAscent(
  state: AscentState,
  target: SteerTarget,
  delta: number,
): AscentState {
  if (state.done) return state;

  let next = state;
  let remaining = Math.min(delta, 0.25);
  while (remaining > 0 && !next.done) {
    const step = Math.min(FIXED_STEP, remaining);
    next = integrate(next, target, step);
    remaining -= step;
  }
  return next;
}

/** Precisión de guiado en tanto por uno: puertas cruzadas sobre las evaluadas. */
export function guidanceScore(state: AscentState): number {
  return state.results.length === 0 ? 1 : state.passed / state.results.length;
}
