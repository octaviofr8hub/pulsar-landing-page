"use client";

import { Edges, Float } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { AdditiveBlending, CanvasTexture, DoubleSide } from "three";

import {
  useInView,
  useIsClient,
  useReducedMotion,
} from "@/components/globe/hooks";
import { SceneErrorBoundary } from "@/components/scene/scene-error-boundary";
import { SceneFallback } from "@/components/scene/scene-fallback";

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.26, cy - r * 0.26);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r * 0.26, cy + r * 0.26);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.26, cy + r * 0.26);
  ctx.lineTo(cx - r, cy);
  ctx.lineTo(cx - r * 0.26, cy - r * 0.26);
  ctx.closePath();
  ctx.fill();
}

/** Textura de la cara frontal pintada en canvas 2D — sin texto, solo la marca. */
function makeLabelTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 400;
  const x = c.getContext("2d")!;
  x.fillStyle = "#0f1626";
  x.fillRect(0, 0, 512, 400);
  x.strokeStyle = "rgba(96,165,250,0.16)";
  x.lineWidth = 4;
  x.strokeRect(16, 16, 480, 368);

  drawSparkle(x, 256, 200, 42, "#4f8ef0");

  const tex = new CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function BoxScene({ reducedMotion }: { reducedMotion: boolean }) {
  const label = useMemo(() => makeLabelTexture(), []);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 3]} intensity={2.1} />
      <pointLight
        position={[-4, -1, 4]}
        intensity={22}
        color="#3b82f6"
        distance={14}
        decay={1.6}
      />

      <Float
        speed={reducedMotion ? 0 : 2}
        rotationIntensity={reducedMotion ? 0 : 0.35}
        floatIntensity={reducedMotion ? 0 : 0.7}
      >
        <group rotation={[0, -0.5, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 1.15, 1.15]} />
            <meshStandardMaterial
              attach="material-0"
              color="#111a2e"
              roughness={0.6}
              metalness={0.15}
            />
            <meshStandardMaterial
              attach="material-1"
              color="#111a2e"
              roughness={0.6}
              metalness={0.15}
            />
            <meshStandardMaterial
              attach="material-2"
              color="#16223c"
              roughness={0.55}
              metalness={0.15}
            />
            <meshStandardMaterial
              attach="material-3"
              color="#0d1424"
              roughness={0.6}
              metalness={0.15}
            />
            <meshStandardMaterial
              attach="material-4"
              map={label}
              roughness={0.5}
              metalness={0.1}
            />
            <meshStandardMaterial
              attach="material-5"
              color="#111a2e"
              roughness={0.6}
              metalness={0.15}
            />
            <Edges threshold={15} color="#2b6fd6" />
          </mesh>

          {/* cinta de embalaje sobre la tapa */}
          <mesh position={[0, 0.585, 0]}>
            <boxGeometry args={[1.52, 0.03, 0.34]} />
            <meshStandardMaterial color="#1b2848" roughness={0.4} />
          </mesh>
        </group>
      </Float>

      {/* pad luminoso bajo la caja */}
      <group position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.86, 1.02, 64]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.75}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[1.02, 64]} />
          <meshBasicMaterial
            color="#1d4ed8"
            transparent
            opacity={0.12}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}

export interface QuoteBoxProps {
  className?: string;
}

/** Paquete 3D flotando sobre una plataforma luminosa (cotizador). */
export function QuoteBox({ className = "" }: QuoteBoxProps) {
  const mounted = useIsClient();
  const reducedMotion = useReducedMotion();
  const [containerRef, inView] = useInView<HTMLDivElement>();

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {mounted ? (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <Canvas
            camera={{ position: [2.3, 1.7, 3.3], fov: 42 }}
            dpr={[1, 2]}
            frameloop={inView ? "always" : "never"}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <BoxScene reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
