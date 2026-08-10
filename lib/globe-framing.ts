import { Matrix4, Quaternion, Vector3 } from "three";

import { latLonToVector3, slerpDirections } from "./geo";
import type { GeoPoint } from "@/types/network";

const DEG2RAD = Math.PI / 180;

/**
 * Encuadre de horizonte: en vez de mirar el globo de frente, lo hunde hasta
 * dejar asomar sólo su casquete superior y deja el arco de la ruta recortado
 * contra el cielo. Todo se resuelve a partir del tamaño real del canvas, así
 * que la composición se mantiene igual en cualquier viewport.
 */
export interface HorizonSolution {
  /** Campo de visión vertical, en grados. */
  fov: number;
  /** Desplazamiento del globo en Y, en unidades de mundo (negativo = baja). */
  offsetY: number;
  /** Radio aparente del globo en pantalla, en px. */
  radiusPx: number;
}

export interface HorizonFramingInput {
  width: number;
  height: number;
  globeRadius: number;
  cameraDistance: number;
  /** Radio aparente del globo como fracción del ancho del canvas. */
  widthFraction: number;
  /** Tope del radio aparente como fracción del alto — evita que el arco se salga. */
  heightFraction: number;
  /** Dónde cae el limbo superior dentro del canvas (0 = arriba, 1 = abajo). */
  horizonLine: number;
}

/**
 * Resuelve lente y desplazamiento para que el globo tenga el radio aparente
 * pedido y su limbo superior caiga en `horizonLine`.
 *
 * El radio aparente sale del ancho (que es lo que fija cuánto se separan los
 * dos extremos de la ruta) y se limita por el alto (que es lo que fija si el
 * apogeo cabe). De ahí el fov: `radio = globeRadius · (alto/2) / (dist · tan(fov/2))`.
 */
export function solveHorizonFraming({
  width,
  height,
  globeRadius,
  cameraDistance,
  widthFraction,
  heightFraction,
  horizonLine,
}: HorizonFramingInput): HorizonSolution | null {
  if (width <= 0 || height <= 0) return null;

  const radiusPx = Math.min(widthFraction * width, heightFraction * height);
  const fov =
    (2 * Math.atan((globeRadius * height) / (2 * radiusPx * cameraDistance))) /
    DEG2RAD;

  const pxPerUnit = radiusPx / globeRadius;
  const centerPx = horizonLine * height + radiusPx;
  return { fov, offsetY: -(centerPx - height / 2) / pxPerUnit, radiusPx };
}

/**
 * Orientación que nivela una ruta: su punto medio sube `elevationDeg` grados
 * por encima del punto sub-cámara y su tangente se alinea con la horizontal de
 * pantalla. El resultado es el arco simétrico del mockup — origen a la
 * izquierda, destino a la derecha — para cualquier par de ciudades.
 *
 * @param subCameraDeg elevación del punto sub-cámara sobre el ecuador de la
 * escena; depende de cuánto se haya hundido el globo.
 */
export function levelRouteQuaternion(
  from: GeoPoint,
  to: GeoPoint,
  elevationDeg: number,
  subCameraDeg: number,
): Quaternion {
  const a = latLonToVector3(from, 1).normalize();
  const b = latLonToVector3(to, 1).normalize();
  const mid = slerpDirections(a, b, 0.5).normalize();

  // Normal del plano de la ruta. Si origen y destino casi coinciden (Tokio y
  // Yokohama), el producto vectorial degenera: se toma un plano cualquiera.
  const normal = new Vector3().crossVectors(a, b);
  if (normal.lengthSq() < 1e-8) {
    normal.crossVectors(new Vector3(0, 1, 0), mid);
  }
  if (normal.lengthSq() < 1e-8) {
    normal.set(1, 0, 0);
  }
  normal.normalize();

  const tangent = new Vector3().crossVectors(normal, mid).normalize();
  const source = new Matrix4().makeBasis(tangent, normal, mid);

  // Marco destino: tangente → derecha de pantalla, punto medio → elevado en el
  // plano vertical que contiene a la cámara.
  const elevation = (elevationDeg + subCameraDeg) * DEG2RAD;
  const midTarget = new Vector3(0, Math.sin(elevation), Math.cos(elevation));
  const tangentTarget = new Vector3(1, 0, 0);
  const normalTarget = new Vector3()
    .crossVectors(midTarget, tangentTarget)
    .normalize();
  const target = new Matrix4().makeBasis(
    tangentTarget,
    normalTarget,
    midTarget,
  );

  return new Quaternion().setFromRotationMatrix(
    target.multiply(source.invert()),
  );
}

/** Elevación del punto sub-cámara sobre el ecuador de la escena, en grados. */
export function subCameraElevation(
  cameraHeight: number,
  cameraDistance: number,
  offsetY: number,
): number {
  return Math.atan2(cameraHeight - offsetY, cameraDistance) / DEG2RAD;
}
