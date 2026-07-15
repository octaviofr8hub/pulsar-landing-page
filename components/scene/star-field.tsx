import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import type { Group } from "three";

import { computeScenePhase } from "@/lib/scene-phase";

export interface StarFieldProps {
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

/**
 * Campo de estrellas que se acelera con la propulsión para simular
 * velocidad orbital.
 */
export function StarField({ progress, reducedMotion }: StarFieldProps) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) {
      return;
    }
    const { thrust } = computeScenePhase(progress.get());
    const drift = reducedMotion ? 0.008 : 0.02;
    const sweep = reducedMotion ? 0 : thrust * 1.1;
    groupRef.current.rotation.y += delta * drift;
    groupRef.current.rotation.x += delta * (drift * 0.5 + sweep);
  });

  return (
    <group ref={groupRef}>
      <Stars
        radius={80}
        depth={50}
        count={4500}
        factor={4}
        saturation={0}
        fade
        speed={reducedMotion ? 0.4 : 1}
      />
    </group>
  );
}
