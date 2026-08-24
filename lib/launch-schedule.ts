/**
 * Manifiesto de lanzamientos — la parrilla de salidas de la red Pulsar.
 *
 * No hay servidor detrás: la parrilla se **calcula** a partir de la hora
 * actual. Cada ruta tiene una cadencia fija y un desfase, así que las próximas
 * salidas salen de una división entera y la cuenta atrás siempre cuadra, hoy y
 * dentro de seis meses. Una lista de fechas escritas a mano se habría quedado
 * en el pasado a la semana de publicarla.
 *
 * El espacio libre de cada vuelo también es determinista: sale de un hash del
 * instante de despegue, no de `Math.random()` — si no, el número bailaría en
 * cada render y rompería la hidratación de Next.
 *
 * Sin runtime ni React: aritmética pura, como el resto de `lib/`.
 */

import { BAY_VOLUME_M3 } from "./cargo-bay";
import type { CountryCode } from "@/types/network";

const HOUR = 3_600_000;

export interface LaunchPort {
  id: string;
  /** Código de tres letras del puerto espacial. */
  code: string;
  city: { es: string; en: string };
  country: CountryCode;
}

export const LAUNCH_PORTS: Record<string, LaunchPort> = {
  zlo: {
    id: "zlo",
    code: "ZLO",
    city: { es: "Manzanillo", en: "Manzanillo" },
    country: "mx",
  },
  vcr: {
    id: "vcr",
    code: "VCR",
    city: { es: "Veracruz", en: "Veracruz" },
    country: "mx",
  },
  lgb: {
    id: "lgb",
    code: "LGB",
    city: { es: "Long Beach", en: "Long Beach" },
    country: "us",
  },
  rtm: {
    id: "rtm",
    code: "RTM",
    city: { es: "Róterdam", en: "Rotterdam" },
    country: "nl",
  },
  sin: {
    id: "sin",
    code: "SIN",
    city: { es: "Singapur", en: "Singapore" },
    country: "sg",
  },
  yok: {
    id: "yok",
    code: "YOK",
    city: { es: "Yokohama", en: "Yokohama" },
    country: "jp",
  },
  sha: {
    id: "sha",
    code: "SHA",
    city: { es: "Shanghái", en: "Shanghai" },
    country: "cn",
  },
  ham: {
    id: "ham",
    code: "HAM",
    city: { es: "Hamburgo", en: "Hamburg" },
    country: "de",
  },
};

export interface LaunchRoute {
  id: string;
  from: LaunchPort;
  to: LaunchPort;
  /** Cada cuántas horas sale un vuelo de esta ruta. */
  cadenceHours: number;
  /** Desfase de la parrilla desde el epoch, en horas. */
  offsetHours: number;
  /** Vehículo asignado a la ruta. */
  vehicle: string;
}

const route = (
  id: string,
  from: string,
  to: string,
  cadenceHours: number,
  offsetHours: number,
  vehicle: string,
): LaunchRoute => ({
  id,
  from: LAUNCH_PORTS[from],
  to: LAUNCH_PORTS[to],
  cadenceHours,
  offsetHours,
  vehicle,
});

/**
 * Parrilla de la red. Las cadencias son primas entre sí a propósito: así las
 * salidas no se alinean nunca y la lista siempre mezcla rutas distintas.
 */
export const LAUNCH_ROUTES: readonly LaunchRoute[] = [
  route("zlo-rtm", "zlo", "rtm", 53, 7, "Pulsar-1 · Aurora"),
  route("lgb-sin", "lgb", "sin", 67, 19, "Pulsar-1 · Cygnus"),
  route("rtm-sha", "rtm", "sha", 71, 31, "Pulsar-1 · Boreal"),
  route("vcr-ham", "vcr", "ham", 89, 5, "Pulsar-1 · Meridian"),
  route("sin-lgb", "sin", "lgb", 59, 41, "Pulsar-1 · Cygnus"),
  route("zlo-yok", "zlo", "yok", 97, 23, "Pulsar-1 · Aurora"),
];

export interface ScheduledLaunch {
  /** Identificador estable: la ruta y su instante de salida. */
  id: string;
  route: LaunchRoute;
  /** Instante de despegue, en ms desde el epoch. */
  departure: number;
  /** Volumen libre en la cofia, en m³. */
  availableM3: number;
  /** Volumen total de la cofia, en m³ — el mismo del minijuego. */
  capacityM3: number;
}

/** Cofia llena: ya no se admite carga. */
export const SOLD_OUT_M3 = 0.9;

/**
 * Ruido determinista de 0 a 1 a partir de un entero. El seno multiplicado y
 * truncado es el truco clásico de los shaders: barato, sin estado y siempre da
 * lo mismo para la misma entrada, que es justo lo que hace falta aquí.
 */
function hashUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** Primera salida de la ruta posterior a `now`. */
function nextDeparture(routeItem: LaunchRoute, now: number): number {
  const cadence = routeItem.cadenceHours * HOUR;
  const offset = routeItem.offsetHours * HOUR;
  const elapsed = now - offset;
  return offset + (Math.floor(elapsed / cadence) + 1) * cadence;
}

/** Volumen libre del vuelo: baja según se acerca la fecha, como en la realidad. */
function availability(departure: number, now: number): number {
  const daysOut = Math.max(0, (departure - now) / (24 * HOUR));
  // Cuanto más cerca está el vuelo, menos queda: el margen se cierra desde el
  // 55 % del volumen a los diez días hasta casi nada la víspera.
  const fill = 0.45 + 0.5 * (1 - Math.min(1, daysOut / 10));
  const jitter = 0.18 * (hashUnit(Math.round(departure / HOUR)) - 0.5);
  const free = BAY_VOLUME_M3 * Math.max(0, 1 - fill + jitter);
  return Math.round(free * 10) / 10;
}

/**
 * Las próximas `count` salidas de toda la red, ordenadas por fecha. Se piden
 * varias vueltas de cada ruta para que, aunque una tenga la cadencia muy larga,
 * la lista se llene con las que vienen antes.
 */
export function upcomingLaunches(
  now: number,
  count: number,
): ScheduledLaunch[] {
  const launches: ScheduledLaunch[] = [];

  for (const routeItem of LAUNCH_ROUTES) {
    let departure = nextDeparture(routeItem, now);
    for (let turn = 0; turn < count; turn += 1) {
      launches.push({
        id: `${routeItem.id}-${departure}`,
        route: routeItem,
        departure,
        availableM3: availability(departure, now),
        capacityM3: BAY_VOLUME_M3,
      });
      departure += routeItem.cadenceHours * HOUR;
    }
  }

  return launches.sort((a, b) => a.departure - b.departure).slice(0, count);
}

/**
 * Cuenta atrás en `Nd HH:MM:SS`, o sólo `HH:MM:SS` el último día. Devuelve
 * ceros si la ventana ya se ha cerrado, que es lo que se ve un instante antes
 * de que la parrilla se recalcule.
 */
export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}
