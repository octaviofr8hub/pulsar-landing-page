"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import {
  AdditiveBlending,
  BackSide,
  Matrix4,
  Quaternion,
  Vector3,
  type Group,
} from "three";

import { TexturedEarth } from "@/components/globe/textured-earth";
import { ascentProgress, type AscentState } from "@/lib/cargo-ascent";
import { latLonToVector3 } from "@/lib/geo";
import type { GeoPoint } from "@/types/network";

/** Radio del planeta en unidades de escena. */
const EARTH_RADIUS = 300;
/** Altura del corredor sobre la superficie al empezar y al cortar motores. */
const START_ALTITUDE = 26;
const END_ALTITUDE = 96;
/**
 * El planeta se dibuja además **por delante** del cohete, no sólo debajo: así el
 * horizonte entra en el encuadre y lo que se ve es el mar pasando, que es lo que
 * hace legible que esto vuela sobre la Tierra y no por un túnel de estrellas.
 */
const DOWNRANGE_OFFSET = EARTH_RADIUS * 0.62;
/**
 * Grados de traza que recorre el tramo jugable. Un salto real cubre casi 100° de
 * ángulo central, pero eso pasa en el arco balístico entero; aquí sólo se pilota
 * el ascenso, así que se barre la primera parte de la ruta.
 */
const TRACK_DEG = 22;
/** Sol alto y algo a la izquierda: mar iluminado abajo y limbo en sombra. */
const SUN_DIRECTION = new Vector3(-0.5, 0.82, 0.28).normalize();

const TEXTURE_URLS = [
  "/planets/earth-day.jpg",
  "/planets/earth-night.png",
  "/planets/earth-specular.jpg",
];

/** Pide las texturas del planeta antes de que haga falta enseñarlo. */
export function preloadEarthTextures(): void {
  useTexture.preload(TEXTURE_URLS);
}

/**
 * Orientación que pone el puerto de salida justo debajo del cohete y alinea la
 * traza de la ruta con el eje de vuelo (−Z).
 *
 * Se construye una base ortonormal en coordenadas del planeta —vertical del
 * puerto, tangente hacia el destino y su normal— y se invierte: la traspuesta de
 * esa base es la rotación que la lleva a la del mundo. Así, al girar después
 * sobre el eje X, el suelo que va apareciendo por el fondo es el que está de
 * verdad camino del destino.
 */
function routeOrientation(from: GeoPoint, to: GeoPoint): Quaternion {
  const up = latLonToVector3(from, 1).normalize();
  const target = latLonToVector3(to, 1).normalize();

  const along = target.clone().addScaledVector(up, -target.dot(up));
  // Puertos iguales o antipodales: cualquier tangente vale.
  if (along.lengthSq() < 1e-8) {
    along.set(0, 1, 0).addScaledVector(up, -up.y);
    if (along.lengthSq() < 1e-8) along.set(1, 0, 0);
  }
  along.normalize();

  const side = along.clone().cross(up);
  const basis = new Matrix4().makeBasis(side, up, along.clone().negate());
  return new Quaternion().setFromRotationMatrix(basis.transpose());
}

/** Planeta de reserva mientras cargan las texturas: sin él, el ascenso parpadea. */
export function PlainEarth() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 40]} />
      <meshStandardMaterial
        color="#0a1a30"
        roughness={0.95}
        metalness={0}
        emissive="#0b2748"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

/** El planeta con sus texturas; va dentro de un `Suspense` con `PlainEarth`. */
export function EarthSurface() {
  return <TexturedEarth radius={EARTH_RADIUS} sunDirection={SUN_DIRECTION} />;
}

export interface EarthBelowProps {
  stateRef: RefObject<AscentState>;
  /** Puertos de la ruta cotizada: de dónde sale y hacia dónde va la traza. */
  from: GeoPoint;
  to: GeoPoint;
  /** El planeta en sí — `EarthSurface` o su reserva. */
  children: ReactNode;
}

/**
 * La Tierra bajo el corredor de ascenso. Es el mismo planeta texturizado del
 * resto del sitio (`TexturedEarth`), colocado y girado para que el cohete lo
 * sobrevuele: baja y se aleja según sube la misión, y rota sobre el eje de vuelo
 * para que el mar y la costa pasen por debajo camino del destino.
 */
export function EarthBelow({ stateRef, from, to, children }: EarthBelowProps) {
  const groupRef = useRef<Group>(null);
  const orientation = useMemo(() => routeOrientation(from, to), [from, to]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const p = ascentProgress(stateRef.current);

    const altitude = START_ALTITUDE + (END_ALTITUDE - START_ALTITUDE) * p;
    group.position.set(0, -(EARTH_RADIUS + altitude), -DOWNRANGE_OFFSET);
    // Girar sobre +X trae hacia la cámara el suelo que estaba downrange: el
    // cohete avanza hacia −Z, así que el paisaje tiene que venir hacia +Z.
    group.rotation.x = ((TRACK_DEG * Math.PI) / 180) * p;
  });

  return (
    <group ref={groupRef}>
      <group quaternion={orientation}>{children}</group>

      {/* atmósfera: el filo azul que separa el planeta del vacío */}
      <mesh scale={1.022}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 40]} />
        <meshBasicMaterial
          color="#3d8ee0"
          transparent
          opacity={0.22}
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
