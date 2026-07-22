"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useMemo,
  useRef,
  type ElementRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { MathUtils, Vector3, type Group } from "three";

import { OrbitalRouteMesh } from "@/components/network/orbital-route";
import { SceneErrorBoundary } from "@/components/scene/scene-error-boundary";
import { SceneFallback } from "@/components/scene/scene-fallback";
import { useScenePalette } from "@/components/scene/palette";
import { latLonToVector3 } from "@/lib/geo";
import type { OrbitalRoute } from "@/types/network";

import { Earth } from "./earth";
import { GlobeHint } from "./globe-hint";
import { useInView, useIsClient, useReducedMotion } from "./hooks";
import { HubMarkers } from "./hub-markers";
import { PlanetBody } from "./planet-body";
import { ZoomControls } from "./zoom-controls";
import type { GlobeHub } from "./types";

const GLOBE_RADIUS = 2;
const HERO_DIR = new Vector3(0, 0.12, 1).normalize();

/** Estados clave de la cámara del hero: [progreso, distancia, objetivo]. */
const HERO_KEYS: {
  p: number;
  dist: number;
  target: [number, number, number];
}[] = [
  { p: 0, dist: 5.2, target: [0.3, 0, 0] },
  { p: 0.5, dist: 10.5, target: [6.2, 0.5, -0.4] },
  { p: 1, dist: 17, target: [12, -0.9, -1.2] },
];

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

interface DragState {
  yaw: number;
  pitch: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
}

/** Cámara del hero: dolly-out guiado por scroll que revela Luna y Marte. */
function HeroCameraRig({ zoomProgress }: { zoomProgress: number }) {
  const camera = useThree((s) => s.camera);
  const target = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const p = Math.min(1, Math.max(0, zoomProgress));
    let dist = HERO_KEYS[0].dist;
    const tgt: [number, number, number] = [...HERO_KEYS[0].target];
    for (let i = 1; i < HERO_KEYS.length; i += 1) {
      const a = HERO_KEYS[i - 1];
      const b = HERO_KEYS[i];
      if (p >= a.p) {
        const f = smoothstep(a.p, b.p, p);
        dist = MathUtils.lerp(a.dist, b.dist, f);
        tgt[0] = MathUtils.lerp(a.target[0], b.target[0], f);
        tgt[1] = MathUtils.lerp(a.target[1], b.target[1], f);
        tgt[2] = MathUtils.lerp(a.target[2], b.target[2], f);
      }
    }
    target.set(tgt[0], tgt[1], tgt[2]);
    const desired = target.clone().addScaledVector(HERO_DIR, dist);
    const k = 1 - Math.exp(-6 * delta);
    camera.position.lerp(desired, k);
    camera.lookAt(target);
  });

  return null;
}

interface GlobeSceneProps {
  mode: "hero" | "orbit";
  interactive: boolean;
  autoSpin: boolean;
  spinSpeed: number;
  reducedMotion: boolean;
  showMoon: boolean;
  showMars: boolean;
  hubs: readonly GlobeHub[] | null;
  activeHubId: string | null;
  onSelectHub?: (id: string) => void;
  showHubLabels: boolean;
  routes: readonly OrbitalRoute[] | null;
  focusHubId: string | null;
  zoomProgress: number;
  quality: "high" | "low";
  minDistance: number;
  maxDistance: number;
  tilt: [number, number, number];
  lightsPointScale?: number;
  dragRef: MutableRefObject<DragState>;
  controlsRef: MutableRefObject<ElementRef<typeof OrbitControls> | null>;
}

function GlobeScene({
  mode,
  interactive,
  autoSpin,
  spinSpeed,
  reducedMotion,
  showMoon,
  showMars,
  hubs,
  activeHubId,
  onSelectHub,
  showHubLabels,
  routes,
  focusHubId,
  zoomProgress,
  quality,
  minDistance,
  maxDistance,
  tilt,
  lightsPointScale,
  dragRef,
  controlsRef,
}: GlobeSceneProps) {
  const palette = useScenePalette();
  const spinRef = useRef<Group>(null);
  const spinAccum = useRef(0);
  const orbitingRef = useRef(false);

  const focusYaw = useMemo(() => {
    if (!focusHubId || !hubs) return null;
    const hub = hubs.find((h) => h.id === focusHubId);
    if (!hub) return null;
    const v = latLonToVector3(hub.coords, GLOBE_RADIUS);
    return -Math.atan2(v.x, v.z);
  }, [focusHubId, hubs]);

  useFrame((_, delta) => {
    const g = spinRef.current;
    if (!g) return;
    const spin = autoSpin ? spinSpeed * (reducedMotion ? 0.3 : 1) : 0;

    if (mode === "hero") {
      spinAccum.current += delta * spin;
      g.rotation.y = spinAccum.current + dragRef.current.yaw;
      g.rotation.x = MathUtils.clamp(
        tilt[0] + dragRef.current.pitch,
        -0.7,
        0.7,
      );
      return;
    }

    // orbit mode: enfocar hub fijado > giro libre (respeta arrastre de cámara)
    if (focusYaw !== null && !orbitingRef.current) {
      const shortest = Math.atan2(
        Math.sin(focusYaw - g.rotation.y),
        Math.cos(focusYaw - g.rotation.y),
      );
      g.rotation.y += shortest * Math.min(1, delta * 2.5);
    } else {
      g.rotation.y += delta * spin;
    }
  });

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[5, 2.5, 4]} intensity={2.4} />
      <pointLight
        position={[-6, -1, -4]}
        intensity={9}
        color={palette.accent}
        distance={28}
        decay={1.7}
      />

      {mode === "hero" && <HeroCameraRig zoomProgress={zoomProgress} />}

      {mode === "orbit" && interactive && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.45}
          zoomSpeed={0.7}
          minDistance={minDistance}
          maxDistance={maxDistance}
          minPolarAngle={Math.PI * 0.16}
          maxPolarAngle={Math.PI * 0.84}
          onStart={() => (orbitingRef.current = true)}
          onEnd={() => (orbitingRef.current = false)}
        />
      )}

      <group rotation={mode === "hero" ? [0, 0, 0] : tilt}>
        <group ref={spinRef} rotation={mode === "hero" ? [0, 0, 0] : [0, 0, 0]}>
          <Earth
            radius={GLOBE_RADIUS}
            quality={quality}
            lightsPointScale={lightsPointScale}
          />
          {hubs && onSelectHub && (
            <HubMarkers
              hubs={hubs}
              radius={GLOBE_RADIUS}
              activeId={activeHubId}
              showLabels={showHubLabels}
              onSelect={onSelectHub}
            />
          )}
          {routes?.map((route) => (
            <OrbitalRouteMesh
              key={route.id}
              route={route}
              radius={GLOBE_RADIUS}
              active={false}
              dimmed={false}
              reducedMotion={reducedMotion}
              onHover={() => undefined}
              onSelect={() => undefined}
            />
          ))}
        </group>
      </group>

      {mode === "hero" && showMoon && (
        <PlanetBody
          position={[7, 1, -1]}
          radius={0.55}
          color="#c3c9d6"
          roughness={1}
        />
      )}
      {mode === "hero" && showMars && (
        <PlanetBody
          position={[13, -1.4, -1.5]}
          radius={0.9}
          color="#c0603a"
          roughness={0.95}
          atmosphere="#e0714a"
          atmosphereIntensity={0.7}
          ring={{ radius: 1.5, color: "#e0714a" }}
        />
      )}
    </>
  );
}

export interface GlobeCanvasProps {
  mode?: "hero" | "orbit";
  className?: string;
  interactive?: boolean;
  autoSpin?: boolean;
  spinSpeed?: number;
  showMoon?: boolean;
  showMars?: boolean;
  hubs?: readonly GlobeHub[];
  activeHubId?: string | null;
  onSelectHub?: (id: string) => void;
  showHubLabels?: boolean;
  routes?: readonly OrbitalRoute[];
  focusHubId?: string | null;
  zoomProgress?: number;
  quality?: "high" | "low";
  cameraDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  tilt?: [number, number, number];
  dpr?: [number, number] | number;
  lightsPointScale?: number;
  showHint?: boolean;
  hintLabel?: string;
  showZoomButtons?: boolean;
}

/**
 * Globo 3D interactivo reutilizable. `mode="hero"` hace dolly-out por scroll y
 * revela Luna/Marte; `mode="orbit"` usa OrbitControls para explorar la red.
 * Congela el render loop cuando la sección sale de pantalla.
 */
export function GlobeCanvas({
  mode = "orbit",
  className = "",
  interactive = false,
  autoSpin = true,
  spinSpeed = 0.05,
  showMoon = false,
  showMars = false,
  hubs,
  activeHubId = null,
  onSelectHub,
  showHubLabels = true,
  routes,
  focusHubId = null,
  zoomProgress = 0,
  quality = "high",
  cameraDistance = 6,
  minDistance = 3.4,
  maxDistance = 12,
  tilt = [0.3, 0, 0.14],
  dpr = [1, 2],
  lightsPointScale,
  showHint = false,
  hintLabel,
  showZoomButtons = false,
}: GlobeCanvasProps) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls> | null>(null);
  const dragRef = useRef<DragState>({
    yaw: 0,
    pitch: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const mounted = useIsClient();
  const reducedMotion = useReducedMotion();
  const [containerRef, inView] = useInView<HTMLDivElement>();

  const zoomBy = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    const cam = c.object;
    const offset = cam.position.clone().sub(c.target);
    const len = MathUtils.clamp(
      offset.length() * factor,
      minDistance,
      maxDistance,
    );
    offset.setLength(len);
    cam.position.copy(c.target).add(offset);
    c.update();
  };

  // Arrastre para el hero (rota el grupo, no la cámara — no pelea con el dolly).
  const heroPointerHandlers =
    mode === "hero"
      ? {
          onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
            const d = dragRef.current;
            d.dragging = true;
            d.lastX = e.clientX;
            d.lastY = e.clientY;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          },
          onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
            const d = dragRef.current;
            if (!d.dragging) return;
            d.yaw += (e.clientX - d.lastX) * 0.006;
            d.pitch += (e.clientY - d.lastY) * 0.004;
            d.lastX = e.clientX;
            d.lastY = e.clientY;
          },
          onPointerUp: () => (dragRef.current.dragging = false),
          onPointerLeave: () => (dragRef.current.dragging = false),
        }
      : {};

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full ${
        mode === "hero" ? "cursor-grab active:cursor-grabbing" : ""
      } ${className}`}
      {...heroPointerHandlers}
    >
      {mounted ? (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <Canvas
            camera={{ position: [0, 0.4, cameraDistance], fov: 38 }}
            dpr={dpr}
            frameloop={inView ? "always" : "never"}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            fallback={<SceneFallback />}
          >
            <Suspense fallback={null}>
              <GlobeScene
                mode={mode}
                interactive={interactive}
                autoSpin={autoSpin}
                spinSpeed={spinSpeed}
                reducedMotion={reducedMotion}
                showMoon={showMoon}
                showMars={showMars}
                hubs={hubs ?? null}
                activeHubId={activeHubId}
                onSelectHub={onSelectHub}
                showHubLabels={showHubLabels}
                routes={routes ?? null}
                focusHubId={focusHubId}
                zoomProgress={zoomProgress}
                quality={quality}
                minDistance={minDistance}
                maxDistance={maxDistance}
                tilt={tilt}
                lightsPointScale={lightsPointScale}
                dragRef={dragRef}
                controlsRef={controlsRef}
              />
            </Suspense>
          </Canvas>
        </SceneErrorBoundary>
      ) : (
        <SceneFallback />
      )}

      {showZoomButtons && interactive && mode === "orbit" && (
        <ZoomControls
          onZoomIn={() => zoomBy(0.8)}
          onZoomOut={() => zoomBy(1.25)}
        />
      )}
      {showHint && <GlobeHint label={hintLabel} />}
    </div>
  );
}

/** Construye una ruta orbital puntual entre dos coordenadas (para Solución). */
export function buildSingleRoute(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): OrbitalRoute {
  const a = latLonToVector3(from, GLOBE_RADIUS);
  const b = latLonToVector3(to, GLOBE_RADIUS);
  // Apogeo proporcional a la separación angular: rutas largas suben más.
  const arcHeight = MathUtils.clamp(0.3 + a.angleTo(b) * 0.55, 0.4, 1.2);
  return {
    id: `${from.lat}_${from.lon}-${to.lat}_${to.lon}`,
    from: { city: "", country: "", coords: from },
    to: { city: "", country: "", coords: to },
    offset: 0,
    speed: 0.05,
    arcHeight,
    thrust: 0.6,
    status: "",
    cargoKg: 0,
    efficiency: 0,
    etaMinutes: 0,
  };
}
