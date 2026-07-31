import type { GeoPoint } from "@/types/network";

/**
 * Modelo físico-logístico de la comparativa barco / avión / Pulsar.
 *
 * Todo lo que la landing muestra como cifra sale de aquí: no hay números
 * inventados. Cada constante es un parámetro operativo real y publicable, y
 * cada componente enseña sus supuestos junto al resultado.
 */

/** Radio medio terrestre (IUGG), en km. */
export const EARTH_RADIUS_KM = 6371;

/** Parámetro gravitacional estándar de la Tierra μ = GM, en km³/s². */
const MU_EARTH = 398600.4418;

const DEG2RAD = Math.PI / 180;

/** Distancia de círculo máximo (haversine) entre dos coordenadas, en km. */
export function greatCircleKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLon = (b.lon - a.lon) * DEG2RAD;
  const lat1 = a.lat * DEG2RAD;
  const lat2 = b.lat * DEG2RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ── Suborbital ──────────────────────────────────────────────────────────── */

export interface SuborbitalProfile {
  distanceKm: number;
  /** Ángulo central recorrido, en grados. */
  rangeAngleDeg: number;
  /** Coasting balístico puro entre corte de motores y reentrada, en minutos. */
  ballisticMinutes: number;
  /** Ascenso propulsado + frenado y aterrizaje vertical, en minutos. */
  poweredMinutes: number;
  /** Puerta de embarque a puerta de embarque, en minutos. */
  flightMinutes: number;
  /** Altura del apogeo sobre la superficie, en km. */
  apogeeKm: number;
  /** Velocidad en el corte de motores, en km/s. */
  burnoutSpeedKms: number;
  /** Excentricidad de la elipse de transferencia. */
  eccentricity: number;
  /** Semieje mayor de la elipse, en km. */
  semiMajorAxisKm: number;
}

/**
 * Ascenso propulsado hasta el corte de motores más reentrada, frenado y
 * aterrizaje vertical. Fuera del arco balístico, que es lo único que resuelve
 * Kepler. Valor de referencia de un lanzador reutilizable de dos etapas.
 */
const POWERED_MINUTES = 13;

/**
 * Trayectoria balística de mínima energía entre dos puntos de la superficie.
 *
 * La elipse tiene el foco en el centro de la Tierra y el apogeo en el punto
 * medio del recorrido. Minimizando el semieje mayor sobre la excentricidad se
 * obtiene la solución cerrada `e = (1 − sin Φ)/cos Φ`, `a = R(1 + sin Φ)/2`,
 * con `Φ` el semiángulo de alcance. El tiempo de vuelo sale de la ecuación de
 * Kepler entre la anomalía verdadera de lanzamiento y el apogeo.
 *
 * Es la misma física que describe un vuelo balístico intercontinental: para
 * 10 000 km da apogeo ≈ 1 320 km y 32 min de coasting, que es lo observado.
 */
export function suborbitalProfile(distanceKm: number): SuborbitalProfile {
  const range = Math.max(1, distanceKm);
  // Ángulo central; se limita a la antípoda (media vuelta al planeta).
  const psi = Math.min(Math.PI, range / EARTH_RADIUS_KM);
  const phi = psi / 2;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);

  // e → 0 en la antípoda: la elipse degenera en una órbita circular rasante.
  const ecc = cosPhi < 1e-6 ? 0 : (1 - sinPhi) / cosPhi;
  const a = (EARTH_RADIUS_KM * (1 + sinPhi)) / 2;

  // Anomalía verdadera del lanzamiento medida desde el perigeo (bajo tierra).
  const nu = Math.PI - phi;
  const tanHalfE = Math.sqrt((1 - ecc) / (1 + ecc)) * Math.tan(nu / 2);
  const eAnom = 2 * Math.atan(tanHalfE);
  const meanAnom = eAnom - ecc * Math.sin(eAnom);

  const meanMotionInv = Math.sqrt(a ** 3 / MU_EARTH);
  const ballisticSeconds = 2 * meanMotionInv * (Math.PI - meanAnom);

  const apogeeKm = a * (1 + ecc) - EARTH_RADIUS_KM;
  const burnoutSpeedKms = Math.sqrt(MU_EARTH * (2 / EARTH_RADIUS_KM - 1 / a));

  const ballisticMinutes = ballisticSeconds / 60;

  return {
    distanceKm: range,
    rangeAngleDeg: psi / DEG2RAD,
    ballisticMinutes,
    poweredMinutes: POWERED_MINUTES,
    flightMinutes: ballisticMinutes + POWERED_MINUTES,
    apogeeKm,
    burnoutSpeedKms,
    eccentricity: ecc,
    semiMajorAxisKm: a,
  };
}

/* ── Supuestos operativos de cada modo ───────────────────────────────────── */

/** Portacontenedor en slow steaming + escalas y despacho en ambos puertos. */
export const SHIP_MODEL = {
  knots: 17,
  /** Derrota real frente al círculo máximo: costas, canales, esquemas de tráfico. */
  detour: 1.25,
  /** Estancia en terminal de origen y destino más despacho aduanero, en horas. */
  portDwellHours: 96,
} as const;

/** Carguero de fuselaje ancho tipo 777F sobre rutas aerocomerciales. */
export const AIR_MODEL = {
  /** Velocidad de bloque media, ya descontados vientos y niveles, en km/h. */
  blockSpeedKmh: 880,
  /** Sobrelongitud de la aerovía frente al círculo máximo. */
  detour: 1.06,
  /** Rodaje, ascenso y descenso, en horas. */
  terminalHours: 1.4,
  /** Alcance con carga de pago máxima: por encima hay escala técnica, en km. */
  maxPayloadRangeKm: 9000,
  techStopHours: 1.8,
  /** Consolidación, almacén de carga, aduana y arrastre terrestre, en horas. */
  groundHours: 26,
} as const;

/** Cadena en tierra de Pulsar: recogida, plataforma marina y última milla. */
export const PULSAR_MODEL = {
  pickupHours: 3,
  toPlatformHours: 2.5,
  integrationHours: 1.5,
  arrivalHours: 1.5,
  lastMileHours: 2,
} as const;

export const PULSAR_GROUND_HOURS =
  PULSAR_MODEL.pickupHours +
  PULSAR_MODEL.toPlatformHours +
  PULSAR_MODEL.integrationHours +
  PULSAR_MODEL.arrivalHours +
  PULSAR_MODEL.lastMileHours;

const KNOT_KMH = 1.852;

export interface ModeEstimate {
  /** Tiempo en el vehículo (navegación, vuelo o trayectoria). */
  transitHours: number;
  /** Puerta a puerta, incluyendo toda la cadena en tierra. */
  doorHours: number;
  /** Km realmente recorridos por ese modo. */
  pathKm: number;
}

/**
 * Horas puerta a puerta de un barco sobre una derrota ya trazada. Se usa cuando
 * la ruta está dibujada por derrotas (Cabo de Buena Esperanza, canales) y sus km
 * reales son mejores que estimar un factor de desvío.
 */
export function shipHoursForPath(pathKm: number): number {
  return pathKm / (SHIP_MODEL.knots * KNOT_KMH) + SHIP_MODEL.portDwellHours;
}

export function shipEstimate(distanceKm: number): ModeEstimate {
  const pathKm = distanceKm * SHIP_MODEL.detour;
  return {
    transitHours: pathKm / (SHIP_MODEL.knots * KNOT_KMH),
    doorHours: shipHoursForPath(pathKm),
    pathKm,
  };
}

export function airEstimate(distanceKm: number): ModeEstimate {
  const pathKm = distanceKm * AIR_MODEL.detour;
  const techStop =
    distanceKm > AIR_MODEL.maxPayloadRangeKm ? AIR_MODEL.techStopHours : 0;
  const transitHours =
    pathKm / AIR_MODEL.blockSpeedKmh + AIR_MODEL.terminalHours + techStop;
  return {
    transitHours,
    doorHours: transitHours + AIR_MODEL.groundHours,
    pathKm,
  };
}

export interface PulsarEstimate extends ModeEstimate {
  profile: SuborbitalProfile;
}

export function pulsarEstimate(distanceKm: number): PulsarEstimate {
  const profile = suborbitalProfile(distanceKm);
  const transitHours = profile.flightMinutes / 60;
  return {
    profile,
    transitHours,
    doorHours: transitHours + PULSAR_GROUND_HOURS,
    pathKm: distanceKm,
  };
}

/* ── Economía del lanzamiento ────────────────────────────────────────────── */

/** Impulso específico en vacío de un motor metalox de ciclo cerrado, en s. */
export const ISP_SECONDS = 380;

/** Aceleración estándar de la gravedad, en m/s². */
const G0 = 9.80665;

/** Pérdidas por gravedad, arrastre y frenado de aterrizaje, en km/s. */
const DELTA_V_LOSSES_KMS = 2;

/**
 * Propelente por kg de carga = (ratio de masas − 1) × factor estructural. El
 * 3.5 calibra el modelo contra un vehículo de clase Starship: ~4 600 t de
 * metalox para 100 t de carga son ~46 kg/kg a 9.7 km/s de Δv.
 */
const STRUCTURE_FACTOR = 3.5;

/** Metalox a granel: LOX ≈ 0.15 $/kg y LNG ≈ 0.50 $/kg en razón 3.6:1. */
const PROPELLANT_USD_PER_KG = 0.22;

/** Recuperación, inspección y operaciones de lanzamiento sobre el propelente. */
const OPS_MULTIPLIER = 2.4;

/** Integración, manipulación en plataforma, seguro base y última milla. */
const HANDLING_USD_PER_KG = 6;

/** Divisor volumétrico IATA (1:6000 cm³/kg): 166.7 kg facturables por m³. */
export const VOLUMETRIC_KG_PER_M3 = 1e6 / 6000;

export interface LaunchEconomics {
  /** Δv total del perfil, incluidas pérdidas, en km/s. */
  deltaVKms: number;
  /** Ratio de masas de Tsiolkovsky (inicial / final). */
  massRatio: number;
  /** Kilos de propelente quemados por cada kg de carga de pago. */
  propellantPerPayloadKg: number;
  /** Tarifa resultante, en USD por kg facturable. */
  usdPerKg: number;
}

/**
 * Coste por kg derivado de la trayectoria, no de una tabla. La ecuación del
 * cohete convierte el Δv del trayecto en propelente quemado, y de ahí sale la
 * tarifa: rutas más largas exigen más energía y cuestan más por kilo.
 */
export function launchEconomics(profile: SuborbitalProfile): LaunchEconomics {
  const deltaVKms = profile.burnoutSpeedKms + DELTA_V_LOSSES_KMS;
  const massRatio = Math.exp((deltaVKms * 1000) / (ISP_SECONDS * G0));
  const propellantPerPayloadKg = (massRatio - 1) * STRUCTURE_FACTOR;
  const usdPerKg =
    propellantPerPayloadKg * PROPELLANT_USD_PER_KG * OPS_MULTIPLIER +
    HANDLING_USD_PER_KG;

  return { deltaVKms, massRatio, propellantPerPayloadKg, usdPerKg };
}

/**
 * Peso facturable: el mayor entre la masa real y la volumétrica. Es la regla
 * que usa toda la industria — el hueco cuesta lo mismo esté lleno o vacío.
 */
export function chargeableKg(massKg: number, volumeM3: number): number {
  return Math.max(massKg, volumeM3 * VOLUMETRIC_KG_PER_M3);
}

/* ── Formato ─────────────────────────────────────────────────────────────── */

/** Duración legible: días si supera 48 h, horas si supera 90 min, si no min. */
export function formatDuration(hours: number, lang: "es" | "en"): string {
  if (hours >= 48) {
    const days = Math.round(hours / 24);
    return `${days} ${lang === "es" ? "días" : "days"}`;
  }
  if (hours >= 1.5) {
    return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)} h`;
  }
  return `${Math.round(hours * 60)} min`;
}

/** Miles con separador local, sin decimales. */
export function formatKm(km: number, lang: "es" | "en"): string {
  return `${Math.round(km).toLocaleString(lang === "es" ? "es-ES" : "en-US")} km`;
}
