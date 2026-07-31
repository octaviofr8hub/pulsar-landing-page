import type { GeoPoint } from "@/types/network";

export interface Port {
  id: string;
  /** Nombre en cada idioma: sólo difieren los exónimos. */
  name: { es: string; en: string };
  coords: GeoPoint;
}

/**
 * Puertos del simulador de rutas. Las coordenadas son las de la terminal real,
 * porque de ellas sale la distancia de círculo máximo que alimenta todo el
 * modelo de `lib/logistics.ts`.
 */
export const PORTS: readonly Port[] = [
  {
    id: "long-beach",
    name: { es: "Long Beach", en: "Long Beach" },
    coords: { lat: 33.77, lon: -118.19 },
  },
  {
    id: "manzanillo",
    name: { es: "Manzanillo", en: "Manzanillo" },
    coords: { lat: 19.05, lon: -104.32 },
  },
  {
    id: "singapur",
    name: { es: "Singapur", en: "Singapore" },
    coords: { lat: 1.29, lon: 103.85 },
  },
  {
    id: "shanghai",
    name: { es: "Shanghái", en: "Shanghai" },
    coords: { lat: 31.23, lon: 121.47 },
  },
  {
    id: "yokohama",
    name: { es: "Yokohama", en: "Yokohama" },
    coords: { lat: 35.44, lon: 139.64 },
  },
  {
    id: "tokyo",
    name: { es: "Tokio", en: "Tokyo" },
    coords: { lat: 35.68, lon: 139.69 },
  },
  {
    id: "rotterdam",
    name: { es: "Róterdam", en: "Rotterdam" },
    coords: { lat: 51.92, lon: 4.48 },
  },
  {
    id: "hamburg",
    name: { es: "Hamburgo", en: "Hamburg" },
    coords: { lat: 53.55, lon: 9.99 },
  },
  {
    id: "new-york",
    name: { es: "Nueva York", en: "New York" },
    coords: { lat: 40.71, lon: -74.01 },
  },
  {
    id: "veracruz",
    name: { es: "Veracruz", en: "Veracruz" },
    coords: { lat: 19.17, lon: -96.13 },
  },
];

export function findPort(id: string): Port {
  return PORTS.find((p) => p.id === id) ?? PORTS[0];
}
