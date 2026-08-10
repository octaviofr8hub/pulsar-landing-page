"use client";

import { Edges, Instance, Instances, OrbitControls } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  type Group,
  type Mesh,
  type PointLight,
} from "three";

import {
  BAY_LEVELS,
  BAY_SIZE,
  pieceCells,
  type ActivePiece,
  type Grid,
  type PieceKind,
} from "@/lib/cargo-bay";

/** Un palé = 1 unidad de mundo; la planta se centra en el origen. */
const HALF = (BAY_SIZE - 1) / 2;
/** Radio interior de la cofia: tiene que tragarse la diagonal de la planta. */
const FAIRING_RADIUS = Math.SQRT2 * (BAY_SIZE / 2) + 0.25;
/** Altura del cilindro de la cofia, por encima de la última cubierta. */
const FAIRING_HEIGHT = BAY_LEVELS + 0.5;
const NOSE_HEIGHT = 2.6;
/** Encendido antes de que el cohete se mueva, en segundos. */
const IGNITION_SECONDS = 0.9;

/** Centro de una posición de la cofia en coordenadas de escena. */
function cellPosition(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [x - HALF, y + 0.5, z - HALF];
}

/**
 * Cada tipo de palé lleva su tinte dentro de la familia azul-cian de la marca.
 * Nada de paleta arcoíris: esto es carga, no caramelos.
 */
const PIECE_COLOR: Record<PieceKind, string> = {
  unit: "#7dd3fc",
  pair: "#38bdf8",
  bar3: "#60a5fa",
  corner: "#93c5fd",
  square: "#3b82f6",
  bar4: "#2563eb",
  ell: "#4f8ef0",
  ese: "#1d4ed8",
  tee: "#0ea5e9",
};

/**
 * Cofia del cohete. Se dibuja **sólo por dentro** (`BackSide`): así la mitad
 * que queda entre la cámara y la carga no la tapa, y aun así se ve el tubo
 * cerrándose sobre los palés. Es lo que hace que se lea "dentro del cohete".
 */
function Fairing() {
  return (
    <group>
      <mesh position={[0, FAIRING_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[FAIRING_RADIUS, FAIRING_RADIUS, FAIRING_HEIGHT, 48, 1, true]}
        />
        <meshStandardMaterial
          color="#16223c"
          side={BackSide}
          transparent
          opacity={0.55}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* ojiva */}
      <mesh position={[0, FAIRING_HEIGHT + NOSE_HEIGHT / 2, 0]}>
        <coneGeometry args={[FAIRING_RADIUS, NOSE_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial
          color="#16223c"
          side={BackSide}
          transparent
          opacity={0.45}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* cuadernas: los aros que marcan cada cubierta */}
      {Array.from({ length: BAY_LEVELS + 1 }, (_, level) => (
        <mesh
          key={level}
          position={[0, level, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[FAIRING_RADIUS - 0.045, FAIRING_RADIUS, 48]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={level === 0 ? 0.5 : 0.14}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* cuadernas de la ojiva: dibujan la punta aunque el cono se vea por
          dentro, que es lo que le da silueta de cohete */}
      {Array.from({ length: 5 }, (_, i) => {
        const t = (i + 1) / 6;
        return (
          <mesh
            key={`nose-${t}`}
            position={[0, FAIRING_HEIGHT + NOSE_HEIGHT * t, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry
              args={[
                FAIRING_RADIUS * (1 - t) - 0.045,
                FAIRING_RADIUS * (1 - t),
                48,
              ]}
            />
            <meshBasicMaterial
              color="#3b82f6"
              transparent
              opacity={0.22}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* largueros: las costillas verticales de la cofia */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={angle}
            position={[
              Math.cos(angle) * (FAIRING_RADIUS - 0.02),
              FAIRING_HEIGHT / 2,
              Math.sin(angle) * (FAIRING_RADIUS - 0.02),
            ]}
          >
            <boxGeometry args={[0.06, FAIRING_HEIGHT, 0.06]} />
            <meshStandardMaterial
              color="#1a2340"
              roughness={0.6}
              metalness={0.45}
              emissive="#1d4ed8"
              emissiveIntensity={0.12}
            />
          </mesh>
        );
      })}

      {/* interetapa y cuerpo: el resto del cohete asomando por debajo */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry
          args={[FAIRING_RADIUS, FAIRING_RADIUS * 0.94, 1, 48]}
        />
        <meshStandardMaterial
          color="#10162a"
          roughness={0.75}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, -3.2, 0]}>
        <cylinderGeometry
          args={[FAIRING_RADIUS * 0.94, FAIRING_RADIUS * 0.94, 4.4, 48]}
        />
        <meshStandardMaterial color="#0b0f1e" roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  );
}

/** Suelo de la cubierta: placa encendida y rejilla de posiciones. */
function BayFloor() {
  return (
    <group>
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[FAIRING_RADIUS - 0.05, 48]} />
        <meshStandardMaterial
          color="#0d1424"
          roughness={0.6}
          metalness={0.3}
          emissive="#1d4ed8"
          emissiveIntensity={0.25}
        />
      </mesh>
      <gridHelper
        args={[BAY_SIZE, BAY_SIZE, "#3b82f6", "#1a2340"]}
        position={[0, 0.005, 0]}
      />
    </group>
  );
}

/** Palé suelto: cuerpo + aristas. Se usa para el activo y para la sombra. */
function Pallet({
  position,
  color,
  ghost = false,
}: {
  position: [number, number, number];
  color: string;
  ghost?: boolean;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.92, 0.92, 0.92]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={ghost ? 0.12 : 0.95}
        roughness={0.45}
        metalness={0.25}
        emissive={color}
        emissiveIntensity={ghost ? 0.1 : 0.25}
        depthWrite={!ghost}
      />
      <Edges threshold={15} color={color} />
    </mesh>
  );
}

/**
 * Columna guía entre el palé que flota y su hueco de apoyo. En 3D, sin esta
 * línea es imposible saber sobre qué posición estás.
 */
function DropGuide({
  cells,
  from,
  to,
}: {
  cells: [number, number, number][];
  from: number;
  to: number;
}) {
  const height = Math.max(0.001, from - to);
  return (
    <group>
      {cells.map(([x, , z]) => (
        <mesh
          key={`${x}-${z}`}
          position={[x - HALF, to + 0.5 + height / 2, z - HALF]}
        >
          <boxGeometry args={[0.14, height, 0.14]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.28}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Pluma de escape del despegue. Nace justo bajo la plataforma —los motores
 * quedan fuera de cuadro— y crece con el encendido, con parpadeo y una luz que
 * ilumina la panza del cohete.
 */
function ExhaustPlume({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  const coneRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const life = useRef(0);

  useFrame((state, delta) => {
    life.current = active
      ? Math.min(1, life.current + delta * 2.4)
      : Math.max(0, life.current - delta * 4);

    const flicker = reducedMotion
      ? 1
      : 1 + Math.sin(state.clock.elapsedTime * 42) * 0.14;
    const cone = coneRef.current;
    if (cone) {
      cone.visible = life.current > 0.01;
      const scale = life.current * flicker;
      cone.scale.set(scale, life.current * (0.7 + life.current * 0.6), scale);
      const material = cone.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = life.current * 0.7;
      }
    }
    if (lightRef.current) {
      lightRef.current.intensity = life.current * 130 * flicker;
    }
  });

  return (
    <group position={[0, -1.1, 0]}>
      <mesh ref={coneRef} rotation={[Math.PI, 0, 0]} visible={false}>
        <coneGeometry args={[1.05, 4.4, 32, 1, true]} />
        <meshBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.5, 0]}
        color="#7dd3fc"
        intensity={0}
        distance={16}
        decay={1.6}
      />
    </group>
  );
}

/** Destello de cubierta consolidada: un disco que sube y se apaga. */
function LevelFlash({ flash, levels }: { flash: number; levels: number[] }) {
  const groupRef = useRef<Group>(null);
  const life = useRef(0);
  const seen = useRef(flash);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (seen.current !== flash) {
      seen.current = flash;
      life.current = 1;
    }
    if (life.current <= 0) {
      group.visible = false;
      return;
    }

    life.current = Math.max(0, life.current - delta * 1.6);
    group.visible = true;
    // sube hacia la ojiva mientras se apaga: la cubierta "se carga"
    group.position.y = (1 - life.current) * 2.4;
    group.children.forEach((child) => {
      const mesh = child as Mesh;
      const material = mesh.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = life.current * 0.75;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {levels.map((level) => (
        <mesh
          key={level}
          position={[0, level + 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[FAIRING_RADIUS - 0.1, 48]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export interface BaySceneProps {
  grid: Grid;
  active: ActivePiece | null;
  ghost: ActivePiece | null;
  flash: number;
  flashLevels: number[];
  reducedMotion: boolean;
  /** Gira solo hasta que el usuario toma el control de la vista. */
  autoRotate: boolean;
  /** Secuencia de despegue en marcha: encendido y ascenso. */
  launching: boolean;
  onOrbitStart: () => void;
  /** El puntero sobrevuela una posición de la planta. */
  onHoverCell: (x: number, z: number) => void;
}

/** Contenido 3D: cofia, carga estibada, palé en juego y su sombra de apoyo. */
export function BayScene({
  grid,
  active,
  ghost,
  flash,
  flashLevels,
  reducedMotion,
  autoRotate,
  launching,
  onOrbitStart,
  onHoverCell,
}: BaySceneProps) {
  const activeRef = useRef<Group>(null);
  const launchRef = useRef<Group>(null);
  const launchTime = useRef(0);

  /** Posiciones ocupadas, agrupadas por tipo: una instancia por familia. */
  const stowed = useMemo(() => {
    const groups = new Map<PieceKind, [number, number, number][]>();
    grid.forEach((level, y) =>
      level.forEach((row, z) =>
        row.forEach((cell, x) => {
          if (!cell) return;
          const list = groups.get(cell) ?? [];
          list.push([x, y, z]);
          groups.set(cell, list);
        }),
      ),
    );
    return [...groups.entries()];
  }, [grid]);

  // El palé en juego flota para distinguirlo de lo ya estibado.
  useFrame((state) => {
    const group = activeRef.current;
    if (!group || !active) return;
    const float = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
    group.position.y = float;
  });

  /**
   * Despegue: primero el encendido —el cohete vibra sobre la plataforma— y
   * después el ascenso, con la altura creciendo con el cuadrado del tiempo
   * porque un lanzador sale acelerando, no a velocidad constante.
   */
  useFrame((_, delta) => {
    const group = launchRef.current;
    if (!group) return;

    if (!launching) {
      launchTime.current = 0;
      group.position.set(0, 0, 0);
      return;
    }

    launchTime.current += delta;
    const rise = Math.max(0, launchTime.current - IGNITION_SECONDS);
    group.position.y = rise * rise * 11;
    const shaking = launchTime.current < IGNITION_SECONDS && !reducedMotion;
    group.position.x = shaking ? Math.sin(launchTime.current * 70) * 0.045 : 0;
  });

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHoverCell(
      Math.round(event.point.x + HALF),
      Math.round(event.point.z + HALF),
    );
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 12, 8]} intensity={2} />
      <pointLight
        position={[-5, 4, 6]}
        intensity={60}
        color="#3b82f6"
        distance={30}
        decay={1.7}
      />
      <pointLight
        position={[0, BAY_LEVELS + 2, 0]}
        intensity={30}
        color="#38bdf8"
        distance={18}
        decay={1.8}
      />

      <OrbitControls
        makeDefault
        target={[0, BAY_LEVELS * 0.68, 0]}
        autoRotate={autoRotate && !reducedMotion}
        autoRotateSpeed={0.5}
        onStart={onOrbitStart}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.52}
      />

      {/* La plataforma se queda; lo que despega es el cohete. */}
      <BayFloor />

      <group ref={launchRef}>
        <Fairing />
        <ExhaustPlume active={launching} reducedMotion={reducedMotion} />

        {/* Plano invisible de la planta: convierte el puntero en una posición. */}
        <mesh
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handleMove}
        >
          <planeGeometry args={[BAY_SIZE + 6, BAY_SIZE + 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {stowed.map(([kind, cells]) => (
          <Instances
            key={kind}
            limit={BAY_SIZE * BAY_SIZE * BAY_LEVELS}
            range={cells.length}
          >
            <boxGeometry args={[0.92, 0.92, 0.92]} />
            <meshStandardMaterial
              color={PIECE_COLOR[kind]}
              roughness={0.5}
              metalness={0.3}
              emissive={PIECE_COLOR[kind]}
              emissiveIntensity={0.16}
            />
            {cells.map(([x, y, z]) => (
              <Instance
                key={`${x}-${y}-${z}`}
                position={cellPosition(x, y, z)}
              />
            ))}
          </Instances>
        ))}

        {ghost && (
          <>
            {pieceCells(ghost).map(([x, y, z]) => (
              <Pallet
                key={`ghost-${x}-${z}`}
                position={cellPosition(x, y, z)}
                color={PIECE_COLOR[ghost.kind]}
                ghost
              />
            ))}
            {active && (
              <DropGuide
                cells={pieceCells(ghost)}
                from={active.y}
                to={ghost.y}
              />
            )}
          </>
        )}

        <group ref={activeRef}>
          {active &&
            pieceCells(active).map(([x, y, z]) => (
              <Pallet
                key={`active-${x}-${z}`}
                position={cellPosition(x, y, z)}
                color={PIECE_COLOR[active.kind]}
              />
            ))}
        </group>

        <LevelFlash flash={flash} levels={flashLevels} />
      </group>
    </>
  );
}
