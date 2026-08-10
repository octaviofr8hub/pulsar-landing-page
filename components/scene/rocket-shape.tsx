import { useMemo } from "react";
import { AdditiveBlending, Vector2 } from "three";

import { useScenePalette, type ScenePalette } from "./palette";

export type RocketVariant = "solid" | "wire";

/** Radio del fuselaje. Todo el perfil se mide contra él. */
const HULL_RADIUS = 0.34;
/** Alto total ≈ 4 unidades, con el centro de masas en el origen. */
const BASE_Y = -2;
const NOSE_START_Y = 0.95;
const TIP_Y = 2;

/**
 * Perfil del lanzador, de la tobera a la punta, para revolucionarlo con
 * `latheGeometry`.
 *
 * Antes eran seis cilindros apilados: se leía como un juguete porque cada
 * cambio de radio era un escalón. Un perfil revolucionado da la silueta
 * continua de un lanzador reutilizable de verdad — ojiva elíptica, fuselaje
 * recto, popa recogida y campana de motor.
 */
function useRocketProfile(): Vector2[] {
  return useMemo(() => {
    const points: Vector2[] = [];

    // Campana del motor: se abre hacia abajo.
    points.push(new Vector2(0, BASE_Y));
    points.push(new Vector2(0.26, BASE_Y + 0.02));
    points.push(new Vector2(0.2, BASE_Y + 0.26));
    points.push(new Vector2(0.15, BASE_Y + 0.34));

    // Sección de motores y popa recogida hacia el fuselaje.
    points.push(new Vector2(0.3, BASE_Y + 0.36));
    points.push(new Vector2(0.33, BASE_Y + 0.5));
    points.push(new Vector2(HULL_RADIUS, BASE_Y + 0.72));

    // Fuselaje recto.
    points.push(new Vector2(HULL_RADIUS, NOSE_START_Y));

    // Ojiva elíptica: r = R · √(1 − t²). Es la curva que hace que un cohete
    // parezca un cohete y no un lápiz.
    const segments = 14;
    for (let i = 1; i <= segments; i += 1) {
      const t = i / segments;
      const y = NOSE_START_Y + (TIP_Y - NOSE_START_Y) * t;
      const radius = HULL_RADIUS * Math.sqrt(Math.max(0, 1 - t * t));
      points.push(new Vector2(radius, y));
    }

    return points;
  }, []);
}

interface HullMaterialProps {
  variant: RocketVariant;
  palette: ScenePalette;
}

function HullMaterial({ variant, palette }: HullMaterialProps) {
  if (variant === "wire") {
    return (
      <meshBasicMaterial
        color={palette.glow}
        wireframe
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={palette.hull}
      metalness={0.86}
      roughness={0.28}
      transparent
    />
  );
}

function AccentMaterial({ variant, palette }: HullMaterialProps) {
  if (variant === "wire") {
    return (
      <meshBasicMaterial
        color={palette.glow}
        wireframe
        transparent
        opacity={0}
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={palette.accent}
      metalness={0.6}
      roughness={0.3}
      emissive={palette.accent}
      emissiveIntensity={0.35}
      transparent
    />
  );
}

const FIN_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] as const;

export interface RocketShapeProps {
  variant: RocketVariant;
  renderOrder?: number;
}

/**
 * Lanzador reutilizable procedural: fuselaje revolucionado, aletas-rejilla
 * plegadas contra la ojiva y patas de aterrizaje recogidas en la popa. Para
 * usar un modelo real, sustituye el contenido por los nodes de
 * `useGLTF("/models/rocket.glb")`; `RocketModel` anima por traverse, así que
 * funciona con cualquier jerarquía.
 */
export function RocketShape({ variant, renderOrder = 0 }: RocketShapeProps) {
  const palette = useScenePalette();
  const profile = useRocketProfile();

  return (
    <group>
      {/* fuselaje completo, de la tobera a la punta */}
      <mesh renderOrder={renderOrder}>
        <latheGeometry args={[profile, 48]} />
        <HullMaterial variant={variant} palette={palette} />
      </mesh>

      {/* cinta de marca bajo la ojiva */}
      <mesh position={[0, NOSE_START_Y - 0.22, 0]} renderOrder={renderOrder}>
        <cylinderGeometry
          args={[HULL_RADIUS + 0.012, HULL_RADIUS + 0.012, 0.12, 48, 1, true]}
        />
        <AccentMaterial variant={variant} palette={palette} />
      </mesh>

      {/* anillo de la interetapa */}
      <mesh position={[0, -0.55, 0]} renderOrder={renderOrder}>
        <cylinderGeometry
          args={[HULL_RADIUS + 0.02, HULL_RADIUS + 0.02, 0.07, 48, 1, true]}
        />
        <AccentMaterial variant={variant} palette={palette} />
      </mesh>

      {/* aletas-rejilla, arriba y plegadas contra el fuselaje */}
      {FIN_ANGLES.map((angle) => (
        <group key={`grid-${angle}`} rotation={[0, angle, 0]}>
          <mesh
            position={[HULL_RADIUS + 0.05, 0.66, 0]}
            rotation={[0, 0, 0.12]}
            renderOrder={renderOrder}
          >
            <boxGeometry args={[0.12, 0.3, 0.02]} />
            <AccentMaterial variant={variant} palette={palette} />
          </mesh>
        </group>
      ))}

      {/* patas de aterrizaje: cuatro puntales inclinados en la popa */}
      {FIN_ANGLES.map((angle) => (
        <group key={`leg-${angle}`} rotation={[0, angle, 0]}>
          <mesh
            position={[HULL_RADIUS - 0.02, -1.42, 0]}
            rotation={[0, 0, -0.34]}
            renderOrder={renderOrder}
          >
            <boxGeometry args={[0.06, 0.62, 0.06]} />
            <HullMaterial variant={variant} palette={palette} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
