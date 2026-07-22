import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopology from "world-atlas/countries-110m.json";

/** Ancho/alto del lienzo equirectangular en el que se proyecta el mapa plano. */
export const WORLD_MAP_WIDTH = 1000;
export const WORLD_MAP_HEIGHT = 500;

/** Proyección equirectangular estándar (misma que usa el resto de secciones). */
export function projectEquirectangular(
  lat: number,
  lon: number,
): { x: number; y: number } {
  return {
    x: ((lon + 180) / 360) * WORLD_MAP_WIDTH,
    y: ((90 - lat) / 180) * WORLD_MAP_HEIGHT,
  };
}

function ringToPath(ring: number[][]): string {
  let d = "";
  ring.forEach(([lon, lat], i) => {
    const { x, y } = projectEquirectangular(lat, lon);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${d}Z`;
}

const topology = worldTopology as unknown as Topology;
const countries = topology.objects.countries as GeometryCollection;

/**
 * Continentes rellenos: un único path con todos los polígonos de países. Sirve
 * de silueta de tierra para el mapa plano del apartado "El problema".
 */
export const WORLD_LAND_PATH: string = (() => {
  const collection = feature(topology, countries);
  const features =
    "features" in collection ? collection.features : [collection];
  let d = "";
  for (const f of features) {
    const geometry = f.geometry;
    if (!geometry) continue;
    if (geometry.type === "Polygon") {
      for (const ring of geometry.coordinates) d += ringToPath(ring);
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        for (const ring of polygon) d += ringToPath(ring);
      }
    }
  }
  return d;
})();

/** Fronteras entre países como un solo path de líneas (una vez cada arista). */
export const WORLD_BORDER_PATH: string = (() => {
  const borders = mesh(topology, countries);
  let d = "";
  for (const line of borders.coordinates) {
    line.forEach(([lon, lat], i) => {
      const { x, y } = projectEquirectangular(lat, lon);
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    });
  }
  return d;
})();
