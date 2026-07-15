import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";

import { useScenePalette } from "@/components/scene/palette";
import { latLonToVector3, orbitalArcPoint } from "@/lib/geo";

import { Globe } from "./globe";
import { OrbitalRouteMesh } from "./orbital-route";
import { GLOBE_RADIUS, ORBITAL_ROUTES } from "./routes";

/** Ángulo de giro (rad/s) cuando nadie está tocando la escena. */
const AUTO_SPIN = 0.05;

/**
 * Yaw que hay que aplicar al grupo para que el punto medio de la ruta quede
 * mirando a la cámara (+Z). Rotar θ = -atan2(x, z) lleva ese punto al frente.
 */
function focusYawFor(routeId: string | null): number | null {
  if (!routeId) {
    return null;
  }
  const route = ORBITAL_ROUTES.find((r) => r.id === routeId);
  if (!route) {
    return null;
  }
  const from = latLonToVector3(route.from.coords, GLOBE_RADIUS);
  const to = latLonToVector3(route.to.coords, GLOBE_RADIUS);
  const middle = orbitalArcPoint(from, to, 0.5, GLOBE_RADIUS, route.arcHeight);
  return -Math.atan2(middle.x, middle.z);
}

export interface NetworkSceneProps {
  activeRouteId: string | null;
  selectedRouteId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}

export function NetworkScene({
  activeRouteId,
  selectedRouteId,
  onHover,
  onSelect,
  reducedMotion,
}: NetworkSceneProps) {
  const palette = useScenePalette();
  const spinRef = useRef<Group>(null);
  const draggingRef = useRef(false);

  const focusYaw = useMemo(() => focusYawFor(selectedRouteId), [selectedRouteId]);

  useFrame((_, delta) => {
    const spin = spinRef.current;
    if (!spin) {
      return;
    }
    // Prioridad: lo que hace el usuario > enfocar la ruta fijada > giro libre.
    if (draggingRef.current) {
      return;
    }
    if (focusYaw !== null) {
      const shortest = Math.atan2(
        Math.sin(focusYaw - spin.rotation.y),
        Math.cos(focusYaw - spin.rotation.y),
      );
      spin.rotation.y += shortest * Math.min(1, delta * 2.5);
      return;
    }
    spin.rotation.y += delta * (reducedMotion ? 0.012 : AUTO_SPIN);
  });

  return (
    <>
      <ambientLight intensity={0.16} />
      {/* Luz principal: es la que dibuja el terminador día/noche del globo. */}
      <directionalLight position={[5, 2.5, 4]} intensity={2.4} />
      <pointLight
        position={[-6, -1, -4]}
        intensity={9}
        color={palette.accent}
        distance={28}
        decay={1.7}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.82}
        onStart={() => {
          draggingRef.current = true;
        }}
        onEnd={() => {
          draggingRef.current = false;
        }}
      />

      {/* Eje inclinado fuera del grupo que gira, para que el giro sea limpio. */}
      <group rotation={[0.3, 0, 0.14]}>
        <group ref={spinRef}>
          <Globe radius={GLOBE_RADIUS} />
          {ORBITAL_ROUTES.map((route) => (
            <OrbitalRouteMesh
              key={route.id}
              route={route}
              radius={GLOBE_RADIUS}
              active={activeRouteId === route.id}
              dimmed={selectedRouteId !== null && selectedRouteId !== route.id}
              reducedMotion={reducedMotion}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </group>
      </group>
    </>
  );
}
