import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color, Vector3 } from "three";

import { SUN_DIRECTION } from "./textured-earth";

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vCenter;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // Centro del planeta en espacio mundo: permite medir el parámetro de
    // impacto del rayo de cámara sin depender de dónde esté el globo.
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/**
 * Halo atmosférico medido, no una esfera azul.
 *
 * Para cada píxel se calcula la distancia mínima entre el rayo de cámara y el
 * centro del planeta (parámetro de impacto). Esa distancia menos el radio de la
 * superficie es la altura sobre el limbo, y el brillo decae exponencialmente con
 * ella — la misma ley barométrica que hace que la atmósfera real se vea como una
 * línea fina y no como una burbuja. Además sólo brilla donde le da el sol: azul
 * cielo en el limbo diurno, naranja en el terminador y casi nada en la noche.
 */
const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uDayColor;
  uniform vec3 uTwilightColor;
  uniform vec3 uSunDirection;
  uniform float uSurfaceRadius;
  uniform float uShellRadius;
  uniform float uIntensity;
  uniform float uFalloff;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vCenter;

  void main() {
    vec3 rayDir = normalize(vWorldPosition - cameraPosition);
    vec3 toCenter = vCenter - cameraPosition;
    float along = dot(toCenter, rayDir);
    float impact = sqrt(max(dot(toCenter, toCenter) - along * along, 0.0));

    // 0 justo sobre la superficie, 1 en el borde exterior de la cáscara.
    float altitude = (impact - uSurfaceRadius) / (uShellRadius - uSurfaceRadius);
    float density = exp(-clamp(altitude, 0.0, 1.0) * uFalloff);
    // Recorte suave por dentro: el disco del planeta ya trae su propia bruma.
    density *= smoothstep(-0.04, 0.02, altitude);

    float sun = dot(uSunDirection, normalize(vWorldNormal));
    float lit = smoothstep(-0.28, 0.34, sun);
    vec3 color = mix(uTwilightColor, uDayColor, smoothstep(-0.06, 0.5, sun));

    // El 0.10 residual es el airglow del lado nocturno: nunca desaparece del todo.
    float alpha = density * (0.1 + 0.9 * lit) * uIntensity;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

export interface AtmosphereProps {
  /** Radio de la superficie del planeta, en unidades de mundo. */
  radius: number;
  /** Grosor de la cáscara como fracción del radio. */
  thickness?: number;
  dayColor: string;
  twilightColor: string;
  intensity?: number;
  sunDirection?: Vector3;
  /** Cuánto cae el brillo con la altura: más alto = halo más fino. */
  falloff?: number;
}

export function Atmosphere({
  radius,
  thickness = 0.22,
  dayColor,
  twilightColor,
  intensity = 1,
  sunDirection = SUN_DIRECTION,
  falloff = 5.5,
}: AtmosphereProps) {
  const shellScale = 1 + thickness;

  const uniforms = useMemo(
    () => ({
      uDayColor: { value: new Color(dayColor) },
      uTwilightColor: { value: new Color(twilightColor) },
      uSunDirection: { value: sunDirection },
      uSurfaceRadius: { value: radius },
      uShellRadius: { value: radius * shellScale },
      uIntensity: { value: intensity },
      uFalloff: { value: falloff },
    }),
    [
      dayColor,
      twilightColor,
      sunDirection,
      radius,
      shellScale,
      intensity,
      falloff,
    ],
  );

  return (
    <mesh scale={shellScale}>
      <sphereGeometry args={[radius, 64, 48]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX}
        fragmentShader={ATMOSPHERE_FRAGMENT}
        uniforms={uniforms}
        side={BackSide}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
