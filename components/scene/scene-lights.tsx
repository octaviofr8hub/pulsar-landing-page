import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PointLight } from "three";

import { useScenePalette } from "./palette";

/**
 * Iluminación dramática de la escena. La luz de acento "late" como un
 * pulsar — identidad de marca aplicada a la escena.
 */
export function SceneLights() {
  const palette = useScenePalette();
  const pulseRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (!pulseRef.current) {
      return;
    }
    const t = state.clock.elapsedTime;
    pulseRef.current.intensity = 14 + 10 * Math.sin(t * 2.2);
  });

  return (
    <>
      <ambientLight intensity={0.16} />
      <directionalLight position={[4, 6, 3]} intensity={1.15} />
      <pointLight
        ref={pulseRef}
        position={[-5, 2, -3]}
        intensity={14}
        color={palette.accent}
        distance={30}
        decay={1.6}
      />
      <pointLight
        position={[3, -2, 4]}
        intensity={6}
        color={palette.glow}
        distance={20}
        decay={1.8}
      />
    </>
  );
}
