import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

import { useScenePalette } from "@/components/scene/palette";
import { RocketShape } from "@/components/scene/rocket-shape";
import { latLonToVector3, orbitalArcPoint, sampleOrbitalArc } from "@/lib/geo";
import { smoothstep } from "@/lib/scene-phase";
import type { OrbitalRoute } from "@/types/network";

/** El morro de RocketShape apunta a +Y; el arco lo reorienta desde ahí. */
const ROCKET_UP = new Vector3(0, 1, 0);

/** RocketShape mide ~4 unidades de alto; a escala de globo debe ser un punto. */
const ROCKET_SCALE = 0.055;

export interface OrbitalRouteMeshProps {
  route: OrbitalRoute;
  radius: number;
  active: boolean;
  /** Hay otra ruta fijada: esta pasa a segundo plano */
  dimmed: boolean;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

/**
 * Una ruta de la red: la trayectoria completa como haz de energía y el cohete
 * recorriéndola en bucle. El cohete se desvanece en ambos extremos para que el
 * salto del ciclo (destino → origen) nunca se vea.
 */
export function OrbitalRouteMesh({
  route,
  radius,
  active,
  dimmed,
  reducedMotion,
  onHover,
  onSelect,
}: OrbitalRouteMeshProps) {
  const palette = useScenePalette();
  const rocketRef = useRef<Group>(null);
  const flameMaterialRef = useRef<MeshBasicMaterial>(null);
  const engineLightRef = useRef<PointLight>(null);
  const progressRef = useRef(route.offset);

  const { fromVec, toVec, curve } = useMemo(() => {
    const from = latLonToVector3(route.from.coords, radius);
    const to = latLonToVector3(route.to.coords, radius);
    const points = sampleOrbitalArc(from, to, radius, route.arcHeight, 64);
    return { fromVec: from, toVec: to, curve: new CatmullRomCurve3(points) };
  }, [route, radius]);

  useFrame((state, delta) => {
    const rocket = rocketRef.current;
    if (!rocket) {
      return;
    }

    const speed = route.speed * (reducedMotion ? 0.25 : 1);
    progressRef.current = (progressRef.current + delta * speed) % 1;
    const t = progressRef.current;

    const position = orbitalArcPoint(
      fromVec,
      toVec,
      t,
      radius,
      route.arcHeight,
    );
    const ahead = orbitalArcPoint(
      fromVec,
      toVec,
      Math.min(t + 0.003, 1),
      radius,
      route.arcHeight,
    );
    rocket.position.copy(position);

    const heading = ahead.sub(position);
    if (heading.lengthSq() > 1e-10) {
      rocket.quaternion.setFromUnitVectors(ROCKET_UP, heading.normalize());
    }

    const fade = smoothstep(0, 0.05, t) * (1 - smoothstep(0.95, 1, t));
    const dim = dimmed ? 0.28 : 1;
    const targetScale = ROCKET_SCALE * (active ? 1.5 : 1) * fade;
    rocket.scale.setScalar(
      MathUtils.damp(rocket.scale.x, targetScale, 6, delta),
    );

    rocket.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }
      if (object.material instanceof MeshStandardMaterial) {
        object.material.opacity = fade * dim;
      }
    });

    const flicker = reducedMotion
      ? 1
      : 1 + Math.sin(state.clock.elapsedTime * 26) * 0.2;
    if (flameMaterialRef.current) {
      flameMaterialRef.current.opacity =
        route.thrust * fade * dim * 0.85 * flicker;
    }
    if (engineLightRef.current) {
      engineLightRef.current.intensity = route.thrust * fade * 1.6 * flicker;
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    onHover(route.id);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    onSelect(route.id);
  };

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 128, 0.011, 8, false]} />
        <meshBasicMaterial
          color={active ? palette.flame : palette.accent}
          transparent
          opacity={active ? 0.95 : dimmed ? 0.12 : 0.4}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={rocketRef} scale={0}>
        <RocketShape variant="solid" />
        <mesh position={[0, -2.35, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.26, 1.2, 24, 1, true]} />
          <meshBasicMaterial
            ref={flameMaterialRef}
            color={palette.flame}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight
          ref={engineLightRef}
          position={[0, -2.1, 0]}
          intensity={0}
          color={palette.flame}
          distance={0.9}
          decay={1.8}
        />
        {/* Blanco de hover/click: el cohete es diminuto y el puntero necesita
            margen. Va dentro del grupo escalado, así que al desvanecerse el
            cohete el blanco se encoge con él y deja de ser clickeable. */}
        <mesh
          onPointerOver={handleOver}
          onPointerOut={() => onHover(null)}
          onClick={handleClick}
        >
          <sphereGeometry args={[3, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
