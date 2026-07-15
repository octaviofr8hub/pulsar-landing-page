"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion, useScroll } from "framer-motion";
import { Suspense } from "react";

import { SceneContents } from "./scene-contents";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { SceneFallback } from "./scene-fallback";

export function SceneCanvas() {
  const { scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Canvas
        className="pointer-events-none"
        camera={{ position: [0, 0.3, 6.5], fov: 42 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        fallback={<SceneFallback />}
      >
        <Suspense fallback={null}>
          <SceneContents
            progress={scrollYProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
