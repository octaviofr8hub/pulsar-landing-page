import { useMemo, type ReactNode } from "react";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  type ColorRepresentation,
} from "three";

const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
    gl_FragColor = vec4(uColor, pow(rim, 2.6) * uIntensity);
  }
`;

export interface PlanetBodyProps {
  position: [number, number, number];
  radius: number;
  color: ColorRepresentation;
  roughness?: number;
  /** Color del halo fresnel; omitir para un cuerpo sin atmósfera (Luna). */
  atmosphere?: ColorRepresentation;
  atmosphereIntensity?: number;
  /** Anillo de órbita punteado alrededor del cuerpo. */
  ring?: { radius: number; color: ColorRepresentation };
  scale?: number;
  children?: ReactNode;
}

/**
 * Cuerpo planetario iluminado por la luz de la escena: la directionalLight le
 * dibuja el terminador (fase) igual que a la Tierra. Sirve para Luna y Marte.
 */
export function PlanetBody({
  position,
  radius,
  color,
  roughness = 0.95,
  atmosphere,
  atmosphereIntensity = 0.9,
  ring,
  scale = 1,
  children,
}: PlanetBodyProps) {
  const rimUniforms = useMemo(
    () =>
      atmosphere
        ? {
            uColor: { value: new Color(atmosphere) },
            uIntensity: { value: atmosphereIntensity },
          }
        : null,
    [atmosphere, atmosphereIntensity],
  );

  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={0.02}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>

      {rimUniforms && (
        <mesh scale={1.12}>
          <sphereGeometry args={[radius, 40, 40]} />
          <shaderMaterial
            vertexShader={RIM_VERTEX}
            fragmentShader={RIM_FRAGMENT}
            uniforms={rimUniforms}
            side={BackSide}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {ring && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring.radius * 0.985, ring.radius, 96]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={0.28}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {children}
    </group>
  );
}
