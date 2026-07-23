"use client";

import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Vector3, type Group } from "three";

import { SceneErrorBoundary } from "@/components/scene/scene-error-boundary";
import { SceneFallback } from "@/components/scene/scene-fallback";

import { Earth } from "./earth";
import { useInView, useIsClient, useReducedMotion } from "./hooks";
import { PlanetBody } from "./planet-body";

const EARTH_R = 1.25;
const MOON_POS = new Vector3(4.4, 0.7, 0);
const MARS_POS = new Vector3(8.8, -0.6, -0.6);

/** Puntos de un arco entre dos posiciones, elevado por su punto medio. */
function arcPoints(
  from: Vector3,
  to: Vector3,
  lift: number,
  segments = 48,
): [number, number, number][] {
  const mid = from.clone().lerp(to, 0.5);
  mid.y += lift;
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = from.clone().lerp(mid, t);
    const b = mid.clone().lerp(to, t);
    const p = a.lerp(b, t);
    pts.push([p.x, p.y, p.z]);
  }
  return pts;
}

export interface DioramaLabels {
  terrestrial: string;
  cislunar: string;
  mars: string;
}

const DEFAULT_LABELS: DioramaLabels = {
  terrestrial: "Red terrestre",
  cislunar: "Rutas cislunares",
  mars: "Marte · cada 26 meses",
};

interface DioramaSceneProps {
  progress: number;
  reducedMotion: boolean;
  interactive: boolean;
  labels: DioramaLabels;
}

function DioramaScene({
  progress,
  reducedMotion,
  interactive,
  labels,
}: DioramaSceneProps) {
  const earthSpin = useRef<Group>(null);
  const cislunar = useMemo(
    () => arcPoints(new Vector3(EARTH_R, 0.2, 0), MOON_POS, 1.4),
    [],
  );
  const transfer = useMemo(
    () => arcPoints(MOON_POS.clone(), MARS_POS.clone(), 2.2),
    [],
  );

  useFrame((_, delta) => {
    if (earthSpin.current) {
      earthSpin.current.rotation.y += delta * (reducedMotion ? 0.02 : 0.06);
    }
  });

  const marsReveal = Math.min(1, Math.max(0, progress));

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 2.5, 4]} intensity={2.4} />
      <pointLight position={[-8, -2, -4]} intensity={7} color="#3b82f6" />

      <Stars
        radius={60}
        depth={40}
        count={1400}
        factor={3}
        saturation={0}
        fade
        speed={reducedMotion ? 0 : 0.4}
      />

      {interactive && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.4}
          target={[3.2, 0, 0]}
          minDistance={7}
          maxDistance={20}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.72}
        />
      )}

      {/* Tierra + red terrestre */}
      <group rotation={[0.32, 0, 0.12]}>
        <group ref={earthSpin}>
          <Earth radius={EARTH_R} quality="low" lightsPointScale={5} />
        </group>
      </group>
      <Html position={[0, -EARTH_R - 0.5, 0]} center distanceFactor={11}>
        <span className="whitespace-nowrap text-[11px] tracking-wide text-pulse-glow">
          {labels.terrestrial}
        </span>
      </Html>

      {/* Ruta cislunar */}
      <Line
        points={cislunar}
        color="#60a5fa"
        lineWidth={1.5}
        transparent
        opacity={0.9}
      />
      <PlanetBody
        position={[MOON_POS.x, MOON_POS.y, MOON_POS.z]}
        radius={0.42}
        color="#c3c9d6"
        roughness={1}
      >
        <Html position={[0, 0.65, 0]} center distanceFactor={11}>
          <span className="whitespace-nowrap text-[11px] tracking-wide text-pulse-cyan">
            {labels.cislunar}
          </span>
        </Html>
      </PlanetBody>

      {/* Transferencia a Marte (aparece con el año) */}
      <Line
        points={transfer}
        color="#e0714a"
        lineWidth={1.4}
        dashed
        dashSize={0.35}
        gapSize={0.25}
        transparent
        opacity={0.25 + marsReveal * 0.65}
      />
      <PlanetBody
        position={[MARS_POS.x, MARS_POS.y, MARS_POS.z]}
        radius={0.7}
        scale={0.55 + marsReveal * 0.55}
        color="#c0603a"
        roughness={0.95}
        atmosphere="#e0714a"
        atmosphereIntensity={0.7}
        ring={{ radius: 1.15, color: "#e0714a" }}
      >
        <Html position={[0, 0.95, 0]} center distanceFactor={11}>
          <span className="whitespace-nowrap text-[12px] text-[#f0a184]">
            {labels.mars}
          </span>
        </Html>
      </PlanetBody>
    </>
  );
}

export interface OrbitDioramaProps {
  progress: number;
  interactive?: boolean;
  className?: string;
  labels?: DioramaLabels;
}

/** Diorama interactivo Tierra–Luna–Marte para el apartado "Futuro". */
export function OrbitDiorama({
  progress,
  interactive = true,
  className = "",
  labels = DEFAULT_LABELS,
}: OrbitDioramaProps) {
  const mounted = useIsClient();
  const reducedMotion = useReducedMotion();
  const [containerRef, inView] = useInView<HTMLDivElement>();

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full ${
        interactive ? "cursor-grab active:cursor-grabbing" : ""
      } ${className}`}
    >
      {mounted ? (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <Canvas
            camera={{ position: [2.5, 1.4, 13], fov: 34 }}
            dpr={[1, 2]}
            frameloop={inView ? "always" : "never"}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            fallback={<SceneFallback />}
          >
            <Suspense fallback={null}>
              <DioramaScene
                progress={progress}
                reducedMotion={reducedMotion}
                interactive={interactive}
                labels={labels}
              />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
