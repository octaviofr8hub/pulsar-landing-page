import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, Vector3, type ShaderMaterial } from "three";

import { useScenePalette } from "@/components/scene/palette";

/**
 * Dirección del sol en espacio-mundo. La cámara mira desde +z, así que un sol
 * hacia la izquierda-frente deja el hemisferio derecho en noche (luces de ciudad
 * visibles) con un creciente diurno a la izquierda — la composición del mockup.
 * La escena alinea su directionalLight con `SUN_POSITION` para que Luna/Marte
 * tengan la misma fase.
 */
export const SUN_DIRECTION = new Vector3(-4, 1.2, 0.6).normalize();
export const SUN_POSITION: [number, number, number] = [
  SUN_DIRECTION.x * 10,
  SUN_DIRECTION.y * 10,
  SUN_DIRECTION.z * 10,
];

const EARTH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/**
 * Mezcla día/noche por orientación al sol: el lado iluminado muestra el mapa
 * diurno (océanos, continentes) y el lado oscuro las luces de ciudad emisivas.
 * Añade nubes en deriva, brillo especular del sol sobre el mar y un halo fresnel
 * teñido por el terminador — el look "black marble" de la referencia.
 */
const EARTH_FRAGMENT = /* glsl */ `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform sampler2D uSpecularTexture;
  uniform sampler2D uCloudsTexture;
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereDay;
  uniform vec3 uAtmosphereTwilight;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 color = vec3(0.0);

    float sunOrientation = dot(uSunDirection, normal);

    // Los mapas de color llegan sin decodificar (NoColorSpace): pasamos de
    // sRGB a lineal a mano; el <colorspace_fragment> del final re-codifica.
    // --- día / noche ---
    float dayStrength = smoothstep(-0.2, 0.4, sunOrientation);
    vec3 dayColor = pow(texture2D(uDayTexture, vUv).rgb, vec3(2.2));
    // Luces de ciudad bien marcadas del lado nocturno.
    vec3 nightColor = pow(texture2D(uNightTexture, vUv).rgb, vec3(2.2)) * 3.2;
    color = mix(nightColor, dayColor, dayStrength);

    // --- nubes tenues (fract = repeat sin mutar la textura); solo las densas ---
    float clouds = texture2D(
      uCloudsTexture,
      vec2(fract(vUv.x + uTime * 0.004), vUv.y)
    ).r;
    clouds = smoothstep(0.55, 1.0, clouds);
    float cloudLighting = mix(0.04, 1.0, dayStrength);
    color = mix(color, vec3(0.92, 0.95, 1.0), clouds * cloudLighting * 0.28);

    // --- reflejo especular del sol sobre el océano ---
    float ocean = texture2D(uSpecularTexture, vUv).r;
    vec3 reflection = reflect(-uSunDirection, normal);
    float specular = pow(max(0.0, dot(reflection, -viewDirection)), 30.0);
    color += uAtmosphereDay * specular * ocean * dayStrength * 0.8;

    // --- atmósfera fresnel (más fuerte y azul del lado iluminado) ---
    float fresnel = pow(1.0 - max(0.0, dot(-viewDirection, normal)), 2.5);
    float twilight = smoothstep(-0.5, 0.5, sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilight, uAtmosphereDay, twilight);
    float atmosphereStrength = smoothstep(-0.4, 0.2, sunOrientation);
    color = mix(color, atmosphereColor, fresnel * atmosphereStrength * 0.5);
    color += atmosphereColor * fresnel * dayStrength * 0.25;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface TexturedEarthProps {
  radius: number;
}

/** Tierra foto-real con texturas satelitales y shader día/noche. */
export function TexturedEarth({ radius }: TexturedEarthProps) {
  const palette = useScenePalette();
  const materialRef = useRef<ShaderMaterial>(null);

  const [dayMap, nightMap, specularMap, cloudsMap] = useTexture([
    "/planets/earth-day.jpg",
    "/planets/earth-night.png",
    "/planets/earth-specular.jpg",
    "/planets/earth-clouds.jpg",
  ]);

  const uniforms = useMemo(
    () => ({
      uDayTexture: { value: dayMap },
      uNightTexture: { value: nightMap },
      uSpecularTexture: { value: specularMap },
      uCloudsTexture: { value: cloudsMap },
      uSunDirection: { value: SUN_DIRECTION },
      uAtmosphereDay: { value: new Color(palette.glow) },
      uAtmosphereTwilight: { value: new Color(palette.accent) },
      uTime: { value: 0 },
    }),
    [dayMap, nightMap, specularMap, cloudsMap, palette.glow, palette.accent],
  );

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (material) {
      material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 96, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={EARTH_VERTEX}
        fragmentShader={EARTH_FRAGMENT}
        uniforms={uniforms}
      />
    </mesh>
  );
}
