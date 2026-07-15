import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

import { useScenePalette } from "@/components/scene/palette";
import { latLonToVector3 } from "@/lib/geo";
import type { RouteEndpoint } from "@/types/network";

import { CountryLines } from "./country-lines";
import { ORBITAL_ROUTES } from "./routes";

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

/** Ciudades únicas de la red, deduplicadas por nombre. */
function collectCities(): RouteEndpoint[] {
  const byCity = new Map<string, RouteEndpoint>();
  for (const route of ORBITAL_ROUTES) {
    byCity.set(route.from.city, route.from);
    byCity.set(route.to.city, route.to);
  }
  return [...byCity.values()];
}

export interface GlobeProps {
  radius: number;
}

/**
 * Tierra estilizada: superficie mate que el directional light divide en día y
 * noche, grid lat/lon de la malla en wireframe, y una cáscara de atmósfera con
 * fresnel que produce el halo del horizonte.
 */
export function Globe({ radius }: GlobeProps) {
  const palette = useScenePalette();
  const cities = useMemo(() => collectCities(), []);

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new Color(palette.glow) },
      uIntensity: { value: 1.1 },
    }),
    [palette.glow],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 64, 48]} />
        <meshStandardMaterial
          color={palette.dark}
          roughness={0.9}
          metalness={0.05}
          emissive={palette.accent}
          emissiveIntensity={0.05}
        />
      </mesh>

      <CountryLines radius={radius} />

      {/* Grid lat/lon: contexto orbital detrás de las fronteras, muy tenue. */}
      <mesh scale={1.002}>
        <sphereGeometry args={[radius, 36, 24]} />
        <meshBasicMaterial
          color={palette.glow}
          wireframe
          transparent
          opacity={0.05}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.11}>
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

      {cities.map((city) => (
        <group
          key={city.city}
          position={latLonToVector3(city.coords, radius * 1.006)}
        >
          <mesh>
            <sphereGeometry args={[0.017, 12, 12]} />
            <meshBasicMaterial color={palette.flame} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial
              color={palette.glow}
              transparent
              opacity={0.32}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
