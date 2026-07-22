import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, DoubleSide, type Mesh } from "three";

import { useScenePalette } from "@/components/scene/palette";
import { latLonToVector3 } from "@/lib/geo";

import type { GlobeHub } from "./types";

interface HubMarkerProps {
  hub: GlobeHub;
  radius: number;
  active: boolean;
  index: number;
  showLabel: boolean;
  onSelect: (id: string) => void;
}

function HubMarker({
  hub,
  radius,
  active,
  index,
  showLabel,
  onSelect,
}: HubMarkerProps) {
  const palette = useScenePalette();
  const ringRef = useRef<Mesh>(null);
  const position = useMemo(
    () => latLonToVector3(hub.coords, radius * 1.006),
    [hub.coords, radius],
  );
  const color = hub.nearshore ? palette.flame : palette.glow;

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.elapsedTime * 1.6 + index * 1.3;
    const pulse = active ? 1.5 : 1;
    const s = (1 + (Math.sin(t) * 0.5 + 0.5) * 0.8) * pulse;
    ringRef.current.scale.setScalar(s);
    const mat = ringRef.current.material;
    if (!Array.isArray(mat) && "opacity" in mat) {
      mat.opacity =
        (0.5 - (Math.sin(t) * 0.5 + 0.5) * 0.4) * (active ? 1 : 0.7);
    }
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[active ? 0.05 : 0.032, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <mesh ref={ringRef}>
        <ringGeometry args={[0.05, 0.075, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Blanco de click generoso: el marcador es diminuto. */}
      <mesh
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          onSelect(hub.id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {showLabel && (
        <Html
          center
          position={[0, 0.16, 0]}
          distanceFactor={8}
          zIndexRange={[20, 0]}
          className="pointer-events-none select-none"
        >
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ${
              active
                ? "bg-pulse-blue/25 text-white"
                : "bg-space-950/70 text-space-200"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {hub.name}
          </span>
        </Html>
      )}
    </group>
  );
}

export interface HubMarkersProps {
  hubs: readonly GlobeHub[];
  radius: number;
  activeId: string | null;
  showLabels?: boolean;
  onSelect: (id: string) => void;
}

export function HubMarkers({
  hubs,
  radius,
  activeId,
  showLabels = true,
  onSelect,
}: HubMarkersProps) {
  return (
    <>
      {hubs.map((hub, index) => (
        <HubMarker
          key={hub.id}
          hub={hub}
          radius={radius}
          index={index}
          active={activeId === hub.id}
          showLabel={showLabels}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
