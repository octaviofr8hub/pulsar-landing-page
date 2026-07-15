import type { MotionValue } from "framer-motion";

import { CameraRig } from "./camera-rig";
import { LandingPad } from "./landing-pad";
import { RocketModel } from "./rocket-model";
import { SceneLights } from "./scene-lights";
import { StarField } from "./star-field";

export interface SceneContentsProps {
  progress: MotionValue<number>;
  reducedMotion: boolean;
}

export function SceneContents({ progress, reducedMotion }: SceneContentsProps) {
  return (
    <>
      <CameraRig progress={progress} reducedMotion={reducedMotion} />
      <SceneLights />
      <StarField progress={progress} reducedMotion={reducedMotion} />
      <RocketModel progress={progress} reducedMotion={reducedMotion} />
      <LandingPad progress={progress} />
    </>
  );
}
