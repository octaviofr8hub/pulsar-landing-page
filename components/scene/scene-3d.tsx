"use client";

import dynamic from "next/dynamic";

import { SceneFallback } from "./scene-fallback";

const SceneCanvas = dynamic(
  () => import("./scene-canvas").then((mod) => mod.SceneCanvas),
  { ssr: false, loading: () => <SceneFallback /> },
);

/**
 * Fondo 3D fijo de toda la landing. El Canvas WebGL solo se carga en el
 * cliente (ssr: false debe vivir en un Client Component en Next 16).
 */
export function Scene3D() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <SceneCanvas />
    </div>
  );
}
