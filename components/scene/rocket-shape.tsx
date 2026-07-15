import { AdditiveBlending } from "three";

import { useScenePalette, type ScenePalette } from "./palette";

export type RocketVariant = "solid" | "wire";

type PartRole = "hull" | "accent" | "dark";

type CylinderArgs = readonly [number, number, number, number];

interface BodyPart {
  args: CylinderArgs;
  position: readonly [number, number, number];
  role: PartRole;
}

const BODY_PARTS: readonly BodyPart[] = [
  { args: [0.34, 0.42, 2.4, 48], position: [0, 0, 0], role: "hull" },
  { args: [0.3, 0.34, 0.28, 48], position: [0, 1.32, 0], role: "accent" },
  { args: [0.02, 0.3, 0.85, 48], position: [0, 1.88, 0], role: "hull" },
  { args: [0.425, 0.435, 0.1, 48], position: [0, -0.62, 0], role: "accent" },
  { args: [0.42, 0.5, 0.3, 48], position: [0, -1.32, 0], role: "dark" },
  { args: [0.16, 0.3, 0.28, 32], position: [0, -1.58, 0], role: "dark" },
];

const FIN_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] as const;

interface PartMaterialProps {
  role: PartRole;
  variant: RocketVariant;
  palette: ScenePalette;
}

function PartMaterial({ role, variant, palette }: PartMaterialProps) {
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
  if (role === "accent") {
    return (
      <meshStandardMaterial
        name="accent"
        color={palette.accent}
        metalness={0.6}
        roughness={0.3}
        emissive={palette.accent}
        emissiveIntensity={0.25}
        transparent
      />
    );
  }
  if (role === "dark") {
    return (
      <meshStandardMaterial
        color={palette.dark}
        metalness={0.9}
        roughness={0.5}
        transparent
      />
    );
  }
  return (
    <meshStandardMaterial
      color={palette.hull}
      metalness={0.85}
      roughness={0.35}
      transparent
    />
  );
}

export interface RocketShapeProps {
  variant: RocketVariant;
  renderOrder?: number;
}

/**
 * Placeholder procedural del cohete. Para usar un modelo real, reemplaza el
 * contenido de este componente por los nodes de useGLTF("/models/rocket.glb");
 * la animación de RocketModel opera por traverse, así que funciona con
 * cualquier jerarquía de modelo sin cambios.
 */
export function RocketShape({ variant, renderOrder = 0 }: RocketShapeProps) {
  const palette = useScenePalette();

  return (
    <group>
      {BODY_PARTS.map((part, index) => (
        <mesh
          key={index}
          position={[...part.position]}
          renderOrder={renderOrder}
        >
          <cylinderGeometry args={[...part.args]} />
          <PartMaterial role={part.role} variant={variant} palette={palette} />
        </mesh>
      ))}
      {FIN_ANGLES.map((angle) => (
        <group key={angle} rotation={[0, angle, 0]}>
          <mesh
            position={[0.48, -1.02, 0]}
            rotation={[0, 0, -0.24]}
            renderOrder={renderOrder}
          >
            <boxGeometry args={[0.34, 0.82, 0.05]} />
            <PartMaterial role="accent" variant={variant} palette={palette} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
