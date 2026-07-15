import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { MathUtils, PerspectiveCamera } from "three";

import { computeScenePhase } from "@/lib/scene-phase";

export interface CameraRigProps {
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

/**
 * Ensancha el FOV durante la propulsión para dar sensación de velocidad
 * orbital sin mover la cámara.
 */
export function CameraRig({ progress, reducedMotion }: CameraRigProps) {
  useFrame((state, delta) => {
    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const { thrust } = computeScenePhase(progress.get());
    const targetFov = 42 + (reducedMotion ? 0 : thrust * 9);
    camera.fov = MathUtils.damp(camera.fov, targetFov, 3.5, delta);
    camera.updateProjectionMatrix();
  });

  return null;
}
