import type { OrbitalRoute } from "@/types/network";

/** Radio del globo en unidades de mundo. Todo el arco se calcula desde aquí. */
export const GLOBE_RADIUS = 2;

/**
 * Las cuatro rutas de la red. Cada una arranca en una fase distinta del viaje
 * (`offset`) para que la escena siempre muestre el ciclo completo a la vez:
 * inserción orbital, crucero, aproximación final y reentrada.
 */
export const ORBITAL_ROUTES: readonly OrbitalRoute[] = [
  {
    id: "nyc-tyo",
    from: {
      city: "New York",
      country: "EE. UU.",
      coords: { lat: 40.71, lon: -74.01 },
    },
    to: {
      city: "Tokyo",
      country: "Japón",
      coords: { lat: 35.68, lon: 139.69 },
    },
    offset: 0.5,
    speed: 0.02,
    arcHeight: 0.78,
    thrust: 0.12,
    status: "En órbita",
    cargoKg: 24000,
    efficiency: 87,
    etaMinutes: 392,
  },
  {
    id: "lhr-sha",
    from: {
      city: "Londres",
      country: "Reino Unido",
      coords: { lat: 51.51, lon: -0.13 },
    },
    to: {
      city: "Shanghái",
      country: "China",
      coords: { lat: 31.23, lon: 121.47 },
    },
    offset: 0.88,
    speed: 0.028,
    arcHeight: 0.42,
    thrust: 0.38,
    status: "Aproximación final",
    cargoKg: 18500,
    efficiency: 91,
    etaMinutes: 47,
  },
  {
    id: "gig-dxb",
    from: {
      city: "Río de Janeiro",
      country: "Brasil",
      coords: { lat: -22.91, lon: -43.17 },
    },
    to: { city: "Dubái", country: "EAU", coords: { lat: 25.2, lon: 55.27 } },
    offset: 0.08,
    speed: 0.018,
    arcHeight: 0.72,
    thrust: 0.9,
    status: "Inserción orbital",
    cargoKg: 31200,
    efficiency: 84,
    etaMinutes: 485,
  },
  {
    id: "syd-cai",
    from: {
      city: "Sídney",
      country: "Australia",
      coords: { lat: -33.87, lon: 151.21 },
    },
    to: {
      city: "El Cairo",
      country: "Egipto",
      coords: { lat: 30.04, lon: 31.24 },
    },
    offset: 0.95,
    speed: 0.024,
    arcHeight: 0.32,
    thrust: 0.75,
    status: "Reentrada",
    cargoKg: 12750,
    efficiency: 89,
    etaMinutes: 12,
  },
];
