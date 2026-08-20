/**
 * Aterrizaje vertical — el tercer acto del minijuego de la cofia.
 *
 * Tras el ascenso, el lanzador vuelve a casa: cae sobre la barcaza en medio del
 * mar y el jugador tiene que posarlo de pie. Hay dos cosas que llevar a la vez —
 * el gas, que frena la caída, y el mando de actitud, que inclina el cohete para
 * corregir la deriva. Inclinar es la única forma de moverse de lado, así que
 * pasarse de mando es exactamente lo que hace que se pierda: el cohete se tumba
 * y ya no hay quien lo enderece.
 *
 * Como en `lib/cargo-ascent.ts`, aquí no hay three.js ni React: sólo aritmética.
 * La escena dibuja el estado que devuelven estas funciones y el HUD enseña sus
 * cifras, que van en unidades reales (metros, m/s) — el render las divide por su
 * propia escala.
 */

/* ── Perfil de la aproximación final ─────────────────────────────────────── */

/** Altitud a la que el control pasa al piloto, en metros. */
export const APPROACH_ALTITUDE_M = 420;
/** Velocidad de descenso en esa entrega, en m/s. */
export const APPROACH_SPEED_MS = 32;
/** Gravedad al nivel del mar, en m/s². */
export const GRAVITY_MS2 = 9.81;
/** Aceleración que da el motor a tope de gas, en m/s². */
export const THRUST_MS2 = 27;
/** Segundos de motor a tope que quedan en el tanque. */
export const BURN_SECONDS = 16;
/** Autoridad lateral de los propulsores de gas frío, en m/s². */
export const RCS_MS2 = 2.2;
/**
 * Velocidad de subida a partir de la cual el control de vuelo recorta el gas,
 * en m/s. La aproximación final no es un despegue: sin este tope, mantener el
 * motor apretado mandaba el cohete a un kilómetro de altura y la misión se
 * perdía sin que el jugador entendiese qué había hecho mal. Frenar de más sigue
 * costando propelente —que es la penalización justa— pero no te echa del mapa.
 */
const CLIMB_LIMIT_MS = 0.8;
/** Margen en el que el gas pasa de todo a nada, en m/s. */
const CLIMB_FADE_MS = 2.2;

/* ── Límites del tren de aterrizaje ──────────────────────────────────────── */

/** Radio útil de la cubierta de la barcaza, en metros. */
export const PAD_RADIUS_M = 15;
/** Velocidad vertical máxima de contacto que aguantan las patas, en m/s. */
export const MAX_TOUCHDOWN_MS = 6;
/** Velocidad lateral máxima de contacto, en m/s. */
export const MAX_DRIFT_MS = 3.5;
/** Inclinación máxima de contacto, en radianes (≈ 8°). */
export const MAX_TILT_RAD = 0.14;
/** Inclinación a partir de la cual se pierde el control (≈ 22°). */
export const ABORT_TILT_RAD = 0.38;

/* ── Dinámica de actitud ─────────────────────────────────────────────────── */

/**
 * Inclinación que pide el mando a fondo, en radianes (≈ 9°).
 *
 * El mando **no** mueve el gimbal directamente: pide una actitud y el control de
 * vuelo la sostiene, como el fly-by-wire de un lanzador de verdad. Mandando par
 * al gimbal, el tope del mando pedía 28° —más que el ángulo de vuelco— y el
 * cohete se tumbaba sin que el jugador entendiese por qué. Con el mando de
 * actitud, pilotando no se llega al vuelco: el margen se pierde por quedarse sin
 * propelente, y la habilidad está en enderezarse antes de tocar (`MAX_TILT_RAD`
 * es menor que este tope, así que posarse con el mando a fondo vuelca).
 */
export const COMMAND_TILT_RAD = 0.16;
/** Par máximo del gimbal, en rad/s². */
const GIMBAL_TORQUE = 1.1;
/** Ganancia del lazo de actitud, en rad/s² por radián de error. */
const ATTITUDE_GAIN = 5;
/** Amortiguación del lazo de actitud. */
const ATTITUDE_DAMPING = 3.4;
/**
 * Autoridad de actitud con el motor apagado, en tanto por uno: el gimbal sólo
 * da par si hay llama, así que en caída libre quedan los propulsores de gas frío.
 */
const COAST_AUTHORITY = 0.45;
/** Lo que tarda el motor en subir de gas (1/s). */
const THROTTLE_RESPONSE = 7;
/** Paso fijo de la simulación, en segundos. */
const FIXED_STEP = 1 / 60;

/**
 * Entrada descentrada y con deriva: si no fuese así no habría nada que pilotar.
 * Determinista a propósito, como las puertas del ascenso — la misma
 * aproximación en cada intento, así el jugador puede mejorarla.
 */
const ENTRY = { x: 26, z: -17, vx: -1.6, vz: 2.2 } as const;

const RAD2DEG = 180 / Math.PI;

export type LandingVerdict =
  /** De pie, centrado y suave. */
  | "perfect"
  /** De pie y dentro de límites. */
  | "nominal"
  /** Llegó demasiado rápido. */
  | "hard"
  /** Fuera de la cubierta. */
  | "offpad"
  /** Tocó torcido o de lado: volcó. */
  | "tipped"
  /** Se pasó de inclinación en vuelo y ya no se recupera. */
  | "tumbled";

export interface LandingResult {
  verdict: LandingVerdict;
  ok: boolean;
  /** Velocidad vertical en el contacto, en m/s. */
  speed: number;
  /** Velocidad lateral en el contacto, en m/s. */
  drift: number;
  /** Distancia al centro de la cubierta, en metros. */
  offset: number;
  /** Inclinación en el contacto, en grados. */
  tiltDeg: number;
  /** Nota del aterrizaje, de 0 a 1. */
  score: number;
  /** Propelente que quedaba al tocar, de 0 a 1. */
  fuel: number;
  /** Lo hizo el piloto automático, no el jugador. */
  assisted: boolean;
}

export interface LandingState {
  /** Segundos desde la entrega del control. */
  t: number;
  /** Altura sobre la cubierta, en metros. */
  altitude: number;
  /** Velocidad vertical, negativa al bajar. */
  vy: number;
  /** Desviación respecto al centro de la cubierta, en metros. */
  x: number;
  z: number;
  vx: number;
  vz: number;
  /** Inclinación hacia cada eje: el empuje sale en esa dirección. */
  tiltX: number;
  tiltZ: number;
  rateX: number;
  rateZ: number;
  /** Gas efectivo, de 0 a 1. */
  throttle: number;
  /** Segundos de motor a tope que quedan. */
  fuel: number;
  /** Encendidas al pasar el mando al piloto automático. */
  assisted: boolean;
  result: LandingResult | null;
}

export interface LandingCommand {
  /** Mando de actitud, de −1 a 1 en cada eje. */
  x: number;
  z: number;
  /** Gas pedido. */
  burn: boolean;
}

export const IDLE_COMMAND: LandingCommand = { x: 0, z: 0, burn: false };

export function createLanding(): LandingState {
  return {
    t: 0,
    altitude: APPROACH_ALTITUDE_M,
    vy: -APPROACH_SPEED_MS,
    x: ENTRY.x,
    z: ENTRY.z,
    vx: ENTRY.vx,
    vz: ENTRY.vz,
    tiltX: 0,
    tiltZ: 0,
    rateX: 0,
    rateZ: 0,
    throttle: 0,
    fuel: BURN_SECONDS,
    assisted: false,
    result: null,
  };
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * Racha de viento sobre la cubierta. Determinista: no es azar, es el mar de esa
 * tarde. Sin ella el aterrizaje se resolvería una vez y siempre igual.
 */
function gust(t: number): { x: number; z: number } {
  return {
    x: Math.sin(t * 0.63 + 0.4) * 0.6 + Math.sin(t * 1.87) * 0.28,
    z: Math.cos(t * 0.51) * 0.55 + Math.sin(t * 1.33 + 1.2) * 0.24,
  };
}

/** Inclinación total respecto a la vertical, en radianes. */
export function tiltOf(state: LandingState): number {
  return Math.hypot(state.tiltX, state.tiltZ);
}

/** Distancia al centro de la cubierta, en metros. */
export function offsetOf(state: LandingState): number {
  return Math.hypot(state.x, state.z);
}

/** Velocidad lateral, en m/s. */
export function driftOf(state: LandingState): number {
  return Math.hypot(state.vx, state.vz);
}

/**
 * Distancia que necesita el cohete para detenerse a tope de gas.
 *
 * Es la cifra que decide la maniobra: mientras sea holgadamente menor que la
 * altitud se puede seguir cayendo; cuando se acerca, hay que encender. De aquí
 * sale el aviso de frenada del HUD — no es una alarma decorativa.
 */
export function stoppingDistanceM(state: LandingState): number {
  const decel = THRUST_MS2 - GRAVITY_MS2;
  return state.vy >= 0 ? 0 : (state.vy * state.vy) / (2 * decel);
}

/** Urgencia de la frenada, de 0 (sobra altura) a ≥1 (ya vas tarde). */
export function brakingUrgency(state: LandingState): number {
  if (state.altitude <= 0) return 1;
  return stoppingDistanceM(state) / state.altitude;
}

function evaluate(state: LandingState, assisted: boolean): LandingResult {
  const offset = offsetOf(state);
  const speed = Math.abs(state.vy);
  const drift = driftOf(state);
  const tiltDeg = tiltOf(state) * RAD2DEG;

  const failed = (verdict: LandingVerdict): LandingResult => ({
    verdict,
    ok: false,
    speed,
    drift,
    offset,
    tiltDeg,
    score: 0,
    fuel: state.fuel / BURN_SECONDS,
    assisted,
  });

  // El orden importa: un impacto a 90 m/s se cuenta como golpe aunque además
  // caiga fuera de la cubierta, que es lo que primero vería un piloto.
  if (speed > MAX_TOUCHDOWN_MS) return failed("hard");
  if (offset > PAD_RADIUS_M) return failed("offpad");
  if (tiltDeg > MAX_TILT_RAD * RAD2DEG || drift > MAX_DRIFT_MS) {
    return failed("tipped");
  }

  // Nota: lo que sobró en el **peor** de los cuatro límites. Promediarlos dejaba
  // pasar como impecable un aterrizaje al borde de la cubierta con tal de que
  // llegase suave; para que cuente, tiene que estar bien en todo.
  const margin = Math.min(
    1 - offset / PAD_RADIUS_M,
    1 - speed / MAX_TOUCHDOWN_MS,
    1 - tiltDeg / (MAX_TILT_RAD * RAD2DEG),
    1 - drift / MAX_DRIFT_MS,
  );

  return {
    verdict: margin > 0.62 ? "perfect" : "nominal",
    ok: true,
    speed,
    drift,
    offset,
    tiltDeg,
    score: 0.5 + 0.5 * margin,
    fuel: state.fuel / BURN_SECONDS,
    assisted,
  };
}

function integrate(
  state: LandingState,
  command: LandingCommand,
  step: number,
): LandingState {
  const cx = clamp(command.x, 1);
  const cz = clamp(command.z, 1);

  // El motor no arranca de golpe: el gas sube y baja con su propia constante, y
  // el control de vuelo lo recorta solo si el cohete empieza a subir.
  const climbing = Math.max(0, state.vy - CLIMB_LIMIT_MS) / CLIMB_FADE_MS;
  const wanted =
    command.burn && state.fuel > 0 ? Math.max(0, 1 - climbing) : 0;
  const throttle =
    state.throttle + (wanted - state.throttle) * Math.min(1, step * THROTTLE_RESPONSE);
  const fuel = Math.max(0, state.fuel - throttle * step);
  const accel = throttle * THRUST_MS2;

  // Actitud: el mando pide una inclinación y el lazo la sostiene. El par
  // disponible depende del motor —el gimbal sólo empuja si hay llama—, así que
  // quedarse sin propelente es quedarse casi sin control.
  const authority =
    GIMBAL_TORQUE * (COAST_AUTHORITY + (1 - COAST_AUTHORITY) * throttle);
  const torque = (want: number, tilt: number, rate: number) =>
    clamp((want - tilt) * ATTITUDE_GAIN - rate * ATTITUDE_DAMPING, authority);

  const rateX =
    state.rateX + torque(cx * COMMAND_TILT_RAD, state.tiltX, state.rateX) * step;
  const rateZ =
    state.rateZ + torque(cz * COMMAND_TILT_RAD, state.tiltZ, state.rateZ) * step;
  const tiltX = state.tiltX + rateX * step;
  const tiltZ = state.tiltZ + rateZ * step;
  const tilt = Math.hypot(tiltX, tiltZ);

  // Traslación: el grueso del empuje lateral sale de inclinar el cohete, así que
  // sólo se corrige de verdad con el motor encendido. Los propulsores de gas
  // frío dan un empujón menor pero siempre disponible.
  const wind = gust(state.t);
  const vx =
    state.vx + (accel * Math.sin(tiltX) + cx * RCS_MS2 + wind.x) * step;
  const vz =
    state.vz + (accel * Math.sin(tiltZ) + cz * RCS_MS2 + wind.z) * step;
  const vy = state.vy + (accel * Math.cos(tilt) - GRAVITY_MS2) * step;

  const next: LandingState = {
    ...state,
    t: state.t + step,
    altitude: state.altitude + vy * step,
    vy,
    x: state.x + vx * step,
    z: state.z + vz * step,
    vx,
    vz,
    tiltX,
    tiltZ,
    rateX,
    rateZ,
    throttle,
    fuel,
  };

  if (tilt > ABORT_TILT_RAD) {
    return {
      ...next,
      result: {
        verdict: "tumbled",
        ok: false,
        speed: Math.abs(vy),
        drift: Math.hypot(vx, vz),
        offset: Math.hypot(next.x, next.z),
        tiltDeg: tilt * RAD2DEG,
        score: 0,
        fuel: next.fuel / BURN_SECONDS,
        assisted: state.assisted,
      },
    };
  }

  if (next.altitude <= 0) {
    const touchdown = { ...next, altitude: 0 };
    return { ...touchdown, result: evaluate(touchdown, state.assisted) };
  }

  return next;
}

/**
 * Avanza el aterrizaje el tiempo real transcurrido, en subpasos fijos — misma
 * razón que en el ascenso: el reloj del juego tiene que ser el del usuario y no
 * el de la tarjeta gráfica.
 */
export function stepLanding(
  state: LandingState,
  command: LandingCommand,
  delta: number,
): LandingState {
  if (state.result) return state;

  let next = state;
  let remaining = Math.min(delta, 0.25);
  while (remaining > 0 && !next.result) {
    const step = Math.min(FIXED_STEP, remaining);
    next = integrate(next, command, step);
    remaining -= step;
  }
  return next;
}

/**
 * Piloto automático: el mismo mando que tiene el jugador, movido por un lazo de
 * control. Frena cuando la distancia de parada alcanza a la altitud y corrige la
 * posición pidiendo una inclinación proporcional al error y a la deriva.
 *
 * No es un botón de "ganar": es el que da el botón de asistencia, y el resumen
 * lo dice — un aterrizaje asistido puntúa como asistido.
 */
export function autopilotCommand(state: LandingState): LandingCommand {
  // Curva de frenada: la velocidad que se puede llevar a cada altura para
  // llegar a cero con margen. Es la misma raíz de la distancia de parada, con un
  // coeficiente por debajo de 1 para no apurar el gas al máximo.
  const decel = THRUST_MS2 - GRAVITY_MS2;
  const targetRate = -Math.min(
    APPROACH_SPEED_MS,
    Math.max(2.2, 0.55 * Math.sqrt(2 * decel * Math.max(0, state.altitude - 6))),
  );
  const burn = state.vy < targetRate;

  // Inclinación pedida por el guiado, acotada muy por debajo del límite de vuelco.
  // En los últimos metros, ya centrado, deja de perseguir el centro y sólo mata
  // la deriva: una toma torcida penaliza más que un par de metros de desvío.
  const settling = state.altitude < 16 && offsetOf(state) < 5;
  const want = (offset: number, rate: number) =>
    settling
      ? clamp(-rate * 0.3, 0.05)
      : clamp(-(offset * 0.028 + rate * 0.22), 0.11);
  const wantX = want(state.x, state.vx);
  const wantZ = want(state.z, state.vz);

  // El mando ya es de actitud: basta con pedir esa inclinación en fracción del
  // tope. El lazo de `integrate` se encarga de sostenerla.
  return {
    x: clamp(wantX / COMMAND_TILT_RAD, 1),
    z: clamp(wantZ / COMMAND_TILT_RAD, 1),
    burn,
  };
}
