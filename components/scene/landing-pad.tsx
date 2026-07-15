import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import {
  AdditiveBlending,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";

import { computeScenePhase, computeViewportScale } from "@/lib/scene-phase";

import { useScenePalette } from "./palette";

export interface LandingPadProps {
  progress: MotionValue<number>;
}

/**
 * Plataforma de aterrizaje que emerge en la sección final. El anillo late
 * al ritmo de un pulsar.
 */
export function LandingPad({ progress }: LandingPadProps) {
  const palette = useScenePalette();
  const groupRef = useRef<Group>(null);
  const padMaterialRef = useRef<MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    const group = groupRef.current;
    const padMaterial = padMaterialRef.current;
    const ringMaterial = ringMaterialRef.current;
    if (!group || !padMaterial || !ringMaterial) {
      return;
    }

    const { landing } = computeScenePhase(progress.get());
    const scale = computeViewportScale(state.viewport.width);
    const t = state.clock.elapsedTime;

    group.visible = landing > 0.01;
    group.position.y = -2.88 * scale;
    group.scale.setScalar(scale);
    padMaterial.opacity = landing * 0.9;
    ringMaterial.opacity = landing * (0.55 + 0.35 * Math.sin(t * 2.6));
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.95, 1.08, 0.08, 64]} />
        <meshStandardMaterial
          ref={padMaterialRef}
          color={palette.panel}
          metalness={0.7}
          roughness={0.45}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.55, 0.63, 64]} />
        <meshBasicMaterial
          ref={ringMaterialRef}
          color={palette.glow}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
