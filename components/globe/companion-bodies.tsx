import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { PerspectiveCamera, type Group } from "three";

import { PlanetBody } from "./planet-body";

/**
 * Profundidad de cada cuerpo. No está a escala — la Luna real está a 30
 * diámetros terrestres y Marte a 16 000 — pero conserva el orden y la
 * proporción relativa de tamaños.
 */
const MOON_Z = -4.8;
const MARS_Z = -11;

const MOON_RADIUS = 0.52;
const MARS_RADIUS = 1;

/** Altura en pantalla de cada cuerpo, en fracción de la media altura. */
const MOON_FY = 0.62;
const MARS_FY = -0.52;

/** Aire entre el limbo terrestre y el cuerpo, en fracción de media anchura. */
const EARTH_CLEARANCE = 0.04;

/** Aire contra el borde del canvas. */
const EDGE_MARGIN = 0.03;

interface DriftingBodyProps {
  anchor: [number, number, number];
  /** Amplitud del cabeceo lento, en unidades de mundo. */
  bob: number;
  /** Desfase para que los cuerpos no se muevan al unísono. */
  phase: number;
  spin: number;
  reducedMotion: boolean;
  children: React.ReactNode;
}

/** Deriva y rotación propia: los cuerpos nunca se quedan del todo quietos. */
function DriftingBody({
  anchor,
  bob,
  phase,
  spin,
  reducedMotion,
  children,
}: DriftingBodyProps) {
  const driftRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (driftRef.current) {
      const amount = reducedMotion ? bob * 0.25 : bob;
      driftRef.current.position.y =
        anchor[1] + Math.sin(t * 0.16 + phase) * amount;
      driftRef.current.position.x =
        anchor[0] + Math.cos(t * 0.11 + phase) * amount * 0.6;
    }
    if (spinRef.current) {
      spinRef.current.rotation.y += delta * spin * (reducedMotion ? 0.3 : 1);
    }
  });

  return (
    <group ref={driftRef} position={anchor}>
      <group ref={spinRef}>{children}</group>
    </group>
  );
}

export interface CompanionBodiesProps {
  showMoon: boolean;
  showMars: boolean;
  reducedMotion: boolean;
  /** Radio del globo terrestre: define el hueco libre alrededor del disco. */
  earthRadius: number;
  /** Distancia inicial de la cámara: define el frustum de referencia. */
  cameraDistance: number;
}

/**
 * Luna y Marte como telón de fondo del hero: iluminados por la misma
 * `directionalLight` que la Tierra, así que muestran la misma fase. Se colocan
 * midiendo el frustum de la cámara, no con coordenadas fijas, para que ninguna
 * proporción de ventana las deje cortadas contra el borde del canvas.
 */
export function CompanionBodies({
  showMoon,
  showMars,
  reducedMotion,
  earthRadius,
  cameraDistance,
}: CompanionBodiesProps) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const aspect = size.width / Math.max(1, size.height);

  const { moon, mars } = useMemo(() => {
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 38;
    const tanHalfFov = Math.tan((fov * Math.PI) / 360);
    // Radio del disco terrestre en pantalla, en unidades de media altura.
    const earthScreenRadius = earthRadius / (cameraDistance * tanHalfFov);

    /**
     * Coloca el cuerpo en el hueco que queda entre el limbo terrestre y el
     * borde del canvas, a la altura pedida. La Tierra es un círculo, así que su
     * anchura a esa altura sale de Pitágoras — por eso Marte, que va más abajo,
     * necesita menos margen lateral que la Luna. Si no queda hueco (ventanas
     * verticales, donde la Tierra llena el encuadre) devuelve `null`.
     */
    const place = (
      z: number,
      fy: number,
      radius: number,
    ): [number, number, number] | null => {
      const halfHeight = (cameraDistance + Math.abs(z)) * tanHalfFov;
      const halfWidth = halfHeight * aspect;
      const bodyFraction = radius / halfWidth;
      const earthHalfWidthHere =
        Math.sqrt(Math.max(0, earthScreenRadius ** 2 - fy ** 2)) / aspect;

      const min = earthHalfWidthHere + bodyFraction + EARTH_CLEARANCE;
      const max = 1 - bodyFraction - EDGE_MARGIN;
      if (min > max) return null;

      return [((min + max) / 2) * halfWidth, fy * (halfHeight - radius), z];
    };

    return {
      moon: place(MOON_Z, MOON_FY, MOON_RADIUS),
      mars: place(MARS_Z, MARS_FY, MARS_RADIUS),
    };
  }, [aspect, cameraDistance, camera, earthRadius]);

  return (
    <>
      {showMoon && moon && (
        <DriftingBody
          anchor={moon}
          bob={0.12}
          phase={0}
          spin={0.012}
          reducedMotion={reducedMotion}
        >
          <PlanetBody
            position={[0, 0, 0]}
            radius={MOON_RADIUS}
            color="#c3c9d6"
            mapUrl="/planets/moon.jpg"
            roughness={1}
          />
        </DriftingBody>
      )}

      {showMars && mars && (
        <DriftingBody
          anchor={mars}
          bob={0.18}
          phase={2.1}
          spin={0.02}
          reducedMotion={reducedMotion}
        >
          <PlanetBody
            position={[0, 0, 0]}
            radius={MARS_RADIUS}
            color="#c0603a"
            mapUrl="/planets/mars.jpg"
            bumpUrl="/planets/mars-bump.jpg"
            roughness={0.95}
            atmosphere="#e0714a"
            atmosphereIntensity={0.32}
          />
        </DriftingBody>
      )}
    </>
  );
}
