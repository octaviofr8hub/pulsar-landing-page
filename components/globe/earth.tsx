import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

import { CountryLines } from "@/components/network/country-lines";
import { useScenePalette } from "@/components/scene/palette";

import { NightLights } from "./night-lights";

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
    gl_FragColor = vec4(uColor, pow(rim, 3.0) * uIntensity);
  }
`;

export interface EarthProps {
  radius: number;
  /** Globos ambientales usan menos densidad de luces y sin retícula. */
  quality?: "high" | "low";
  lightsPointScale?: number;
}

/**
 * Tierra estilizada tipo "night earth": esfera oscura que la luz direccional
 * divide en día/noche, fronteras reales luminosas (`CountryLines`), luces de
 * ciudad en la cara nocturna y una cáscara de atmósfera fresnel para el halo.
 */
export function Earth({
  radius,
  quality = "high",
  lightsPointScale,
}: EarthProps) {
  const palette = useScenePalette();

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new Color(palette.glow) },
      uIntensity: { value: 1.15 },
    }),
    [palette.glow],
  );

  return (
    <group>
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

      <CountryLines radius={radius} />

      <NightLights radius={radius} pointScale={lightsPointScale} />

      {quality === "high" && (
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

      <mesh scale={1.13}>
        <sphereGeometry args={[radius, 48, 32]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX}
          fragmentShader={ATMOSPHERE_FRAGMENT}
          uniforms={atmosphereUniforms}
          side={BackSide}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
