import { AdditiveBlending } from "three";

import { CountryLines } from "@/components/network/country-lines";
import { useScenePalette } from "@/components/scene/palette";

import { Atmosphere } from "./atmosphere";
import { NightLights } from "./night-lights";
import { TexturedEarth } from "./textured-earth";

export interface EarthProps {
  radius: number;
  /** Globos ambientales usan menos densidad de luces y sin retícula. */
  quality?: "high" | "low";
  lightsPointScale?: number;
  /**
   * Modo "black marble": continentes rellenos con textura procedural + luces de
   * ciudad emisivas (se parece a la referencia). El modo por defecto (líneas de
   * frontera + puntos) es más ligero para globos ambientales/hero.
   */
  textured?: boolean;
}

/**
 * Tierra tipo "night earth". En modo `textured` usa las texturas satelitales
 * con shader día/noche; si no, el estilo de líneas de frontera + puntos. En
 * ambos, la luz direccional dibuja el terminador y `Atmosphere` añade el limbo
 * iluminado — una línea fina sobre el borde diurno, no una burbuja azul.
 */
export function Earth({
  radius,
  quality = "high",
  lightsPointScale,
  textured = false,
}: EarthProps) {
  const palette = useScenePalette();

  return (
    <group>
      {textured ? (
        <TexturedEarth radius={radius} />
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 64, 48]} />
          <meshStandardMaterial
            color={palette.dark}
            roughness={0.92}
            metalness={0.04}
            emissive={palette.accent}
            emissiveIntensity={0.06}
          />
        </mesh>
      )}

      {!textured && <CountryLines radius={radius} />}

      {!textured && (
        <NightLights radius={radius} pointScale={lightsPointScale} />
      )}

      {!textured && quality === "high" && (
        <mesh scale={1.002}>
          <sphereGeometry args={[radius, 36, 24]} />
          <meshBasicMaterial
            color={palette.glow}
            wireframe
            transparent
            opacity={0.045}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      <Atmosphere
        radius={radius}
        dayColor={palette.glow}
        twilightColor={palette.flame}
        thickness={0.2}
        intensity={textured ? 1.15 : 0.85}
        falloff={textured ? 6 : 5}
      />
    </group>
  );
}
