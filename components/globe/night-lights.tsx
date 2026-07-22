import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from "three";

import { useScenePalette } from "@/components/scene/palette";
import { CITY_LIGHTS } from "@/lib/city-lights";
import { latLonToVector3 } from "@/lib/geo";

/** Dirección del "sol" en espacio de mundo — coincide con la directionalLight. */
const SUN_DIR = new Vector3(5, 2.5, 4).normalize();

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uPointScale;
  varying float vAlpha;

  void main() {
    // Normal del punto en espacio de mundo (la esfera está centrada en el grupo).
    vec3 worldNormal = normalize(mat3(modelMatrix) * normalize(position));
    float night = smoothstep(0.18, -0.35, dot(worldNormal, uSunDir));
    float twinkle = 0.72 + 0.28 * sin(uTime * 1.4 + aPhase);

    vAlpha = night * twinkle;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPointScale * night / max(-mvPosition.z, 0.001);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorHalo;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.5);
    vec3 col = mix(uColorHalo, uColorCore, glow);
    gl_FragColor = vec4(col, core * vAlpha * uOpacity);
  }
`;

export interface NightLightsProps {
  radius: number;
  /** Escala base del tamaño de punto; se multiplica por devicePixelRatio. */
  pointScale?: number;
  opacity?: number;
}

/**
 * Luces de ciudad: un único buffer de `Points` cuyo shader las enciende sólo en
 * la cara nocturna del planeta y les da un parpadeo sutil. Reproduce el efecto
 * "black marble" / contaminación lumínica sin necesidad de texturas.
 */
export function NightLights({
  radius,
  pointScale = 7,
  opacity = 1,
}: NightLightsProps) {
  const palette = useScenePalette();
  const materialRef = useRef<ShaderMaterial>(null);
  const dpr = useThree((state) => state.viewport.dpr);

  const { positions, sizes, phases } = useMemo(() => {
    const count = CITY_LIGHTS.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    CITY_LIGHTS.forEach((city, i) => {
      const v = latLonToVector3(city, radius * 1.003);
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      sizes[i] = 2 + city.w * 6;
      phases[i] = (i * 37.13) % (Math.PI * 2);
    });
    return { positions, sizes, phases };
  }, [radius]);

  const uniforms = useMemo(
    () => ({
      uSunDir: { value: SUN_DIR },
      uTime: { value: 0 },
      uPointScale: { value: pointScale * dpr },
      uColorCore: { value: new Color("#fff3d6") },
      uColorHalo: { value: new Color(palette.flame) },
      uOpacity: { value: opacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [palette.flame],
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uPointScale.value = pointScale * dpr;
      materialRef.current.uniforms.uOpacity.value = opacity;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
