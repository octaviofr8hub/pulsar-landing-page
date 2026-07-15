"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { SceneErrorBoundary } from "@/components/scene/scene-error-boundary";
import { SceneFallback } from "@/components/scene/scene-fallback";

import { NetworkScene } from "./network-scene";

export interface NetworkCanvasProps {
  activeRouteId: string | null;
  selectedRouteId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
  /** Falso cuando la sección está fuera de pantalla: congela el render loop. */
  inView: boolean;
}

export function NetworkCanvas({
  activeRouteId,
  selectedRouteId,
  onHover,
  onSelect,
  reducedMotion,
  inView,
}: NetworkCanvasProps) {
  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Canvas
        camera={{ position: [0, 0.5, 6.4], fov: 40 }}
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
          <NetworkScene
            activeRouteId={activeRouteId}
            selectedRouteId={selectedRouteId}
            onHover={onHover}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
