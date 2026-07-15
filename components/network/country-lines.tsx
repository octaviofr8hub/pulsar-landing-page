import { useMemo } from "react";
import { AdditiveBlending } from "three";

import { useScenePalette } from "@/components/scene/palette";
import { buildBorderPositions } from "@/lib/world-outlines";

export interface CountryLinesProps {
  radius: number;
}

/**
 * Fronteras de los países dibujadas sobre el globo. Se apoyan apenas encima de
 * la superficie para que la esfera oculte por z-buffer las del hemisferio
 * opuesto — sin eso, el planeta se vería transparente.
 */
export function CountryLines({ radius }: CountryLinesProps) {
  const palette = useScenePalette();
  const positions = useMemo(
    () => buildBorderPositions(radius * 1.004),
    [radius],
  );

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={palette.glow}
        transparent
        opacity={0.62}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}
