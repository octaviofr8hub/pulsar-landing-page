import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useRef } from "react";
import {
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  AdditiveBlending,
  type Group,
  type Object3D,
  type PointLight,
} from "three";

import { computeScenePhase, computeViewportScale } from "@/lib/scene-phase";
import type { ScenePhase } from "@/types/landing";

import { useScenePalette } from "./palette";
import { RocketShape } from "./rocket-shape";

export interface RocketModelProps {
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

function applySolidPhase(root: Object3D, phase: ScenePhase): void {
  const solidOpacity = 1 - phase.xray * 0.9;
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const material = object.material;
    if (material instanceof MeshStandardMaterial) {
      material.opacity = solidOpacity;
      if (material.name === "accent") {
        material.emissiveIntensity = 0.25 + phase.thrust * 1.6;
      }
    }
  });
}

function applyWirePhase(root: Object3D, phase: ScenePhase): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }
    const material = object.material;
    if (material instanceof MeshBasicMaterial) {
      material.opacity = phase.xray * 0.95;
    }
  });
}

export function RocketModel({ progress, reducedMotion }: RocketModelProps) {
  const palette = useScenePalette();
  const outerRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const solidRef = useRef<Group>(null);
  const wireRef = useRef<Group>(null);
  const flameRef = useRef<Mesh>(null);
  const flameMaterialRef = useRef<MeshBasicMaterial>(null);
  const engineLightRef = useRef<PointLight>(null);

  useFrame((state, delta) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    const solid = solidRef.current;
    const wire = wireRef.current;
    if (!outer || !inner || !solid || !wire) {
      return;
    }

    const phase = computeScenePhase(progress.get());
    const scale = computeViewportScale(state.viewport.width);
    const t = state.clock.elapsedTime;
    const motionScale = reducedMotion ? 0.35 : 1;

    const bob = Math.sin(t * 1.5) * 0.09 * (1 - phase.thrust) * motionScale;
    outer.position.x = MathUtils.damp(
      outer.position.x,
      phase.shiftX * scale,
      3.2,
      delta,
    );
    outer.position.y = MathUtils.damp(
      outer.position.y,
      phase.altitude * scale + bob,
      3.2,
      delta,
    );
    outer.rotation.z = MathUtils.damp(outer.rotation.z, phase.tilt, 3, delta);
    outer.scale.setScalar(MathUtils.damp(outer.scale.x, scale, 3, delta));

    inner.rotation.y +=
      delta * (reducedMotion ? 0.08 : 0.28) * (1 - phase.thrust * 0.75);
    inner.position.x = reducedMotion
      ? 0
      : Math.sin(t * 45) * 0.012 * phase.thrust;

    applySolidPhase(solid, phase);
    applyWirePhase(wire, phase);

    const flame = flameRef.current;
    const flameMaterial = flameMaterialRef.current;
    const engineLight = engineLightRef.current;
    if (flame && flameMaterial && engineLight) {
      const flicker = 1 + Math.sin(t * 28) * 0.22 * motionScale;
      const flameScale = phase.thrust;
      flame.visible = flameScale > 0.01;
      flame.scale.set(flameScale, flameScale * flicker, flameScale);
      flame.position.y = -1.75 - 0.6 * flame.scale.y;
      flameMaterial.opacity = phase.thrust * 0.85;
      engineLight.intensity =
        phase.thrust * 26 * (0.85 + 0.15 * Math.sin(t * 30));
    }
  });

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        <group ref={solidRef}>
          <RocketShape variant="solid" />
        </group>
        <group ref={wireRef} scale={1.002}>
          <RocketShape variant="wire" renderOrder={2} />
        </group>
        <mesh
          ref={flameRef}
          position={[0, -2.35, 0]}
          rotation={[Math.PI, 0, 0]}
          renderOrder={1}
        >
          <coneGeometry args={[0.26, 1.2, 32, 1, true]} />
          <meshBasicMaterial
            ref={flameMaterialRef}
            color={palette.flame}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <pointLight
          ref={engineLightRef}
          position={[0, -2.1, 0]}
          intensity={0}
          color={palette.flame}
          distance={9}
          decay={1.8}
        />
      </group>
    </group>
  );
}
