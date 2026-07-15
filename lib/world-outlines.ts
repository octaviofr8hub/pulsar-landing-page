import { mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { Vector3 } from "three";
import worldTopology from "world-atlas/countries-110m.json";

import { latLonToVector3, slerpDirections } from "./geo";

/**
 * Ángulo máximo de un tramo antes de subdividirlo, en radianes (~1.7°). Los
 * datos traen fronteras rectas muy largas (la de EE. UU. y Canadá es casi una
 * sola línea); sin subdividir, la cuerda se hundiría bajo la superficie.
 */
const MAX_SEGMENT_ANGLE = 0.03;

/**
 * Fronteras del mundo como pares de vértices listos para `THREE.LineSegments`.
 *
 * `mesh()` fusiona los arcos compartidos entre países, así que cada frontera se
 * dibuja una sola vez en lugar de dos veces (una por cada país que la toca).
 * Todo sale en un único buffer → una sola draw call para el planeta entero.
 */
export function buildBorderPositions(radius: number): Float32Array {
  const topology = worldTopology as unknown as Topology;
  const borders = mesh(
    topology,
    topology.objects.countries as GeometryCollection,
  );

  const coordinates: number[] = [];
  const from = new Vector3();
  const to = new Vector3();

  for (const line of borders.coordinates) {
    for (let i = 0; i < line.length - 1; i += 1) {
      const [lonA, latA] = line[i];
      const [lonB, latB] = line[i + 1];
      from.copy(latLonToVector3({ lat: latA, lon: lonA }, radius));
      to.copy(latLonToVector3({ lat: latB, lon: lonB }, radius));

      const steps = Math.max(
        1,
        Math.ceil(from.angleTo(to) / MAX_SEGMENT_ANGLE),
      );
      const dirA = from.clone().normalize();
      const dirB = to.clone().normalize();

      let previous = from.clone();
      for (let step = 1; step <= steps; step += 1) {
        const next = slerpDirections(dirA, dirB, step / steps).multiplyScalar(
          radius,
        );
        coordinates.push(previous.x, previous.y, previous.z);
        coordinates.push(next.x, next.y, next.z);
        previous = next;
      }
    }
  }

  return new Float32Array(coordinates);
}
