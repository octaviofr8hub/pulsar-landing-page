"use client";

import { PerspectiveCamera, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

import { RocketShape } from "@/components/scene/rocket-shape";
import {
  GATE_COUNT,
  GATE_RADIUS,
  altitudeKm,
  ascentProgress,
  createAscent,
  gatePosition,
  gateProgress,
  guidanceScore,
  speedKms,
  stepAscent,
  type AscentState,
  type SteerTarget,
} from "@/lib/cargo-ascent";

/**
 * Profundidad de escena que representa el ascenso completo.
 *
 * El corredor se dibuja **hacia el fondo**, no hacia arriba: la cámara persigue
 * al cohete desde atrás, como un avión de seguimiento. Puesto en vertical, los
 * aros de guiado quedaban de canto —una raya— y era imposible apuntar. Es
 * además lo que hace un lanzador de verdad: se tumba downrange en cuanto sale
 * de la atmósfera densa.
 */
const WORLD_DEPTH = 95;
/** Tamaño del lanzador dentro de la escena. */
const ROCKET_SCALE = 0.72;
/** Inclinación del cohete: nariz arriba y hacia el fondo. */
const ROCKET_PITCH = -0.95;
/** Base del cohete: de ahí sale la pluma. */
const ROCKET_BASE = -2 * ROCKET_SCALE;
/** Estelas de velocidad que cruzan el encuadre. */
const STREAK_COUNT = 52;

const GATE_PENDING = new Color("#38bdf8");
const GATE_HIT = new Color("#34d399");
const GATE_MISS = new Color("#f59e0b");
const SKY_LOW = new Color("#12335c");
const SKY_HIGH = new Color("#01030a");

export interface AscentTelemetry {
  altitudeKm: number;
  speedKms: number;
  progress: number;
  passed: number;
  gates: number;
}

export interface AscentResult {
  passed: number;
  missed: number;
  score: number;
}

/** Ruido determinista: la lluvia de estelas es la misma en cada partida. */
function noise(i: number): number {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Puerta de guiado. Cada una lleva su propio bucle de fotograma porque su
 * posición depende del avance del ascenso, que cambia 60 veces por segundo —
 * pasarlo por estado de React sería tirar los fotogramas a la basura.
 */
function Gate({
  index,
  stateRef,
}: {
  index: number;
  stateRef: RefObject<AscentState>;
}) {
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const center = gatePosition(index);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const state = stateRef.current;
    // Hacia el fondo: la puerta llega desde el punto de fuga.
    const depth = (gateProgress(index) - ascentProgress(state)) * WORLD_DEPTH;
    group.position.set(center.x, -center.z, -depth);
    group.visible = depth > -6 && depth < 72;

    const ring = ringRef.current;
    if (!ring) return;
    const material = ring.material as MeshBasicMaterial;
    const result = state.results[index];
    material.color.copy(
      result === undefined ? GATE_PENDING : result ? GATE_HIT : GATE_MISS,
    );
    // Se destaca cuando la tienes encima: es tu próxima maniobra.
    const near = Math.max(0, 1 - Math.abs(depth) / 26);
    material.opacity = 0.3 + near * 0.6;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={ringRef}>
        <torusGeometry args={[GATE_RADIUS, 0.05, 8, 64]} />
        <meshBasicMaterial
          color={GATE_PENDING}
          transparent
          opacity={0.6}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* marcas radiales: dan referencia de tamaño al acercarse */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={angle}
            position={[
              Math.cos(angle) * (GATE_RADIUS + 0.16),
              Math.sin(angle) * (GATE_RADIUS + 0.16),
              0,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.26, 0.03, 0.03]} />
            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0.5}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Pluma de los motores: núcleo, penacho y la luz que baña la popa. */
function Plume({ reducedMotion }: { reducedMotion: boolean }) {
  const coreRef = useRef<Mesh>(null);
  const flareRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);

  useFrame((state) => {
    const flicker = reducedMotion
      ? 1
      : 1 + Math.sin(state.clock.elapsedTime * 46) * 0.16;
    if (coreRef.current) coreRef.current.scale.set(1, flicker, 1);
    if (flareRef.current) {
      flareRef.current.scale.set(flicker, flicker * 1.15, flicker);
    }
    if (lightRef.current) lightRef.current.intensity = 90 * flicker;
  });

  return (
    <group position={[0, ROCKET_BASE, 0]}>
      <mesh ref={coreRef} position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 2.1, 24, 1, true]} />
        <meshBasicMaterial
          color="#e0f2ff"
          transparent
          opacity={0.9}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={flareRef} position={[0, -1.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 3.6, 24, 1, true]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.34}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.6, 0]}
        color="#7dd3fc"
        intensity={90}
        distance={14}
        decay={1.6}
      />
    </group>
  );
}

/** Estelas verticales: la sensación de velocidad del ascenso. */
function Streaks({ stateRef }: { stateRef: RefObject<AscentState> }) {
  const groupRef = useRef<Group>(null);

  const seeds = useMemo(
    () =>
      Array.from({ length: STREAK_COUNT }, (_, i) => {
        const angle = noise(i * 3 + 1) * Math.PI * 2;
        const radius = 2.6 + noise(i * 3 + 2) * 8;
        return {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 6 - noise(i * 3 + 3) * 70,
          length: 1.2 + noise(i * 5) * 3.2,
        };
      }),
    [],
  );

  // Vienen del fondo y pasan de largo por los lados: velocidad de crucero.
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const speed = 26 + ascentProgress(stateRef.current) * 80;
    group.children.forEach((child) => {
      child.position.z += speed * delta;
      if (child.position.z > 10) child.position.z -= 76;
    });
  });

  return (
    <group ref={groupRef}>
      {seeds.map((seed, i) => (
        <mesh key={i} position={[seed.x, seed.y, seed.z]}>
          <boxGeometry args={[0.028, 0.028, seed.length]} />
          <meshBasicMaterial
            color="#9ad5ff"
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** El planeta cayendo: la referencia de que esto sube de verdad. */
function PlanetBelow({ stateRef }: { stateRef: RefObject<AscentState> }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const p = ascentProgress(stateRef.current);
    // Se hunde y se aleja: la curvatura entra en cuadro y luego queda atrás.
    group.position.y = -58 - p * 62;
    group.position.z = -26 - p * 40;
    group.rotation.y += 0.0004;
  });

  return (
    <group ref={groupRef} position={[0, -58, -26]}>
      <mesh>
        <sphereGeometry args={[44, 48, 32]} />
        <meshStandardMaterial
          color="#0a1a30"
          roughness={0.95}
          metalness={0}
          emissive="#0b2748"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* atmósfera: el filo azul del horizonte */}
      <mesh scale={1.045}>
        <sphereGeometry args={[44, 48, 32]} />
        <meshBasicMaterial
          color="#2f7ad6"
          transparent
          opacity={0.28}
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export interface AscentSceneProps {
  /** Apogeo de la ruta cotizada, en km: la meta del ascenso. */
  apogeeKm: number;
  /** Velocidad de corte de motores de esa misma ruta, en km/s. */
  burnoutSpeedKms: number;
  reducedMotion: boolean;
  /** Posición lateral pedida por el mando (puntero o teclado). */
  steerRef: RefObject<SteerTarget>;
  onTelemetry: (telemetry: AscentTelemetry) => void;
  onDone: (result: AscentResult) => void;
}

/**
 * Ascenso pilotable: el cohete sube solo y el jugador corrige la deriva para
 * cruzar las puertas de guiado. La simulación vive en un ref —`lib/cargo-ascent`
 * la integra— y sólo la telemetría sale a React, a 6 Hz, para no re-renderizar
 * el árbol en cada fotograma.
 */
export function AscentScene({
  apogeeKm,
  burnoutSpeedKms,
  reducedMotion,
  steerRef,
  onTelemetry,
  onDone,
}: AscentSceneProps) {
  const stateRef = useRef<AscentState>(createAscent());
  const rocketRef = useRef<Group>(null);
  const skyRef = useRef<Mesh>(null);
  const published = useRef(0);
  const finished = useRef(false);

  useFrame((_, delta) => {
    const previous = stateRef.current;
    const state = stepAscent(previous, steerRef.current, delta);
    stateRef.current = state;
    const progress = ascentProgress(state);

    const rocket = rocketRef.current;
    if (rocket) {
      // El mando mueve el cohete dentro del corredor: x a los lados, z arriba
      // y abajo en pantalla (el eje de vuelo es la profundidad).
      rocket.position.set(state.x, -state.z, 0);
      // Alabeo: se inclina hacia donde empuja, como un lanzador corrigiendo con
      // gimbal. El cabeceo base lo lleva el grupo interior.
      rocket.rotation.z = -state.vx * 0.06;
      rocket.rotation.x = -state.vz * 0.05;
      const shake = reducedMotion ? 0 : Math.sin(state.t * 58) * 0.012;
      rocket.position.x += shake;
    }

    const sky = skyRef.current;
    if (sky) {
      const material = sky.material as MeshBasicMaterial;
      material.color.copy(SKY_LOW).lerp(SKY_HIGH, Math.min(1, progress * 1.35));
    }

    // Telemetría a 6 Hz: suficiente para leerla, barato para React.
    published.current += delta;
    if (published.current > 1 / 6 || state.done) {
      published.current = 0;
      onTelemetry({
        altitudeKm: altitudeKm(progress, apogeeKm),
        speedKms: speedKms(progress, burnoutSpeedKms),
        progress,
        passed: state.passed,
        gates: state.results.length,
      });
    }

    if (state.done && !finished.current) {
      finished.current = true;
      onDone({
        passed: state.passed,
        missed: state.missed,
        score: guidanceScore(state),
      });
    }
  });

  return (
    <>
      {/* Cámara de persecución: detrás del cohete y mirando al punto de fuga.
          A 9 unidades y 44° de campo, el corredor (±3.6) llena justo el alto
          del encuadre, así que lo que se ve es exactamente lo que se pilota. */}
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 10]}
        fov={44}
        near={0.1}
        far={400}
      />

      {/* cielo: azul de troposfera al negro de vacío conforme se sube */}
      <mesh ref={skyRef}>
        <sphereGeometry args={[220, 24, 16]} />
        <meshBasicMaterial color={SKY_LOW} side={BackSide} depthWrite={false} />
      </mesh>
      <Stars
        radius={140}
        depth={60}
        count={reducedMotion ? 800 : 2200}
        factor={3}
        saturation={0}
        fade
        speed={0.6}
      />

      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 8]} intensity={2.4} />
      <pointLight
        position={[-6, 2, 6]}
        intensity={70}
        color="#3b82f6"
        distance={34}
        decay={1.7}
      />

      <PlanetBelow stateRef={stateRef} />
      <Streaks stateRef={stateRef} />

      {Array.from({ length: GATE_COUNT }, (_, i) => (
        <Gate key={i} index={i} stateRef={stateRef} />
      ))}

      <group ref={rocketRef}>
        {/* Cabeceado hacia el fondo: se ve el fuselaje de tres cuartos, no un
            círculo de tobera. */}
        <group rotation={[ROCKET_PITCH, 0, 0]}>
          <group scale={ROCKET_SCALE}>
            <RocketShape variant="solid" />
          </group>
          <Plume reducedMotion={reducedMotion} />
        </group>
      </group>
    </>
  );
}
