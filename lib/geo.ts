import { Vector3 } from "three";

import type { GeoPoint } from "@/types/network";

const DEG2RAD = Math.PI / 180;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Proyecta coordenadas geográficas sobre la esfera del globo. Mapeo
 * equirectangular estándar: +Y es el polo norte y el meridiano 0 mira a -Z.
 */
export function latLonToVector3(point: GeoPoint, radius: number): Vector3 {
  const phi = (90 - point.lat) * DEG2RAD;
  const theta = (point.lon + 180) * DEG2RAD;
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Interpolación esférica entre dos direcciones. A diferencia de `lerp`, el
 * recorrido sigue el círculo máximo — la ruta real que volaría un cohete.
 */
export function slerpDirections(a: Vector3, b: Vector3, t: number): Vector3 {
  const omega = Math.acos(clamp(a.dot(b), -1, 1));
  if (omega < 1e-6) {
    return a.clone().lerp(b, t).normalize();
  }
  const sinOmega = Math.sin(omega);
  return a
    .clone()
    .multiplyScalar(Math.sin((1 - t) * omega) / sinOmega)
    .add(b.clone().multiplyScalar(Math.sin(t * omega) / sinOmega));
}

/**
 * Punto del arco orbital en `t` (0 = origen, 1 = destino). La altitud sigue una
 * campana senoidal: apogeo a mitad de camino, superficie en ambos extremos.
 */
export function orbitalArcPoint(
  from: Vector3,
  to: Vector3,
  t: number,
  radius: number,
  arcHeight: number,
): Vector3 {
  const direction = slerpDirections(
    from.clone().normalize(),
    to.clone().normalize(),
    t,
  );
  return direction.multiplyScalar(radius + arcHeight * Math.sin(Math.PI * t));
}

/** Muestrea el arco completo — para construir la geometría de la trayectoria. */
export function sampleOrbitalArc(
  from: Vector3,
  to: Vector3,
  radius: number,
  arcHeight: number,
  segments: number,
): Vector3[] {
  return Array.from({ length: segments + 1 }, (_, index) =>
    orbitalArcPoint(from, to, index / segments, radius, arcHeight),
  );
}
