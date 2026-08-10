"use client";

import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
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
import {
  levelRouteQuaternion,
  solveHorizonFraming,
  subCameraElevation,
} from "@/lib/globe-framing";
import {
  EARTH_RADIUS_KM,
  greatCircleKm,
  suborbitalProfile,
} from "@/lib/logistics";
import type { GeoPoint, OrbitalRoute } from "@/types/network";

import { CompanionBodies } from "./companion-bodies";
import { Earth } from "./earth";
import { GlobeHint } from "./globe-hint";
import { useInView, useIsClient, useReducedMotion } from "./hooks";
import { HubMarkers } from "./hub-markers";
import { SUN_POSITION } from "./textured-earth";
import { ZoomControls } from "./zoom-controls";
import type { GlobeHub, HorizonFraming } from "./types";

const GLOBE_RADIUS = 2;
const HERO_DIR = new Vector3(0, 0.12, 1).normalize();

/**
 * Altura de la cámara del encuadre de horizonte. A la altura del eje y sin
 * `lookAt`, la proyección del globo hundido es exacta: lo que baje el globo es
 * exactamente lo que baja en pantalla.
 */
const HORIZON_CAMERA_Y = 0;

/**
 * Valores por defecto del encuadre de horizonte (ver `HorizonFraming`).
 * Calibrados sobre los 45 pares de puertos del simulador: el limbo queda arriba
 * (el planeta es el fondo, no una franja al pie), y aun así entran el apogeo por
 * arriba y las dos ciudades con su etiqueta por abajo, en todos los anchos.
 */
const HORIZON_DEFAULTS = {
  widthFraction: 0.36,
  heightFraction: 0.8,
  horizonLine: 0.28,
  elevation: 18,
} as const;

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
  focusPoint: GeoPoint | null;
  horizon: HorizonFraming | null;
  sunDirection: Vector3 | null;
  detailScale: number;
  showStars: boolean;
  cameraDistance: number;
  zoomProgress: number;
  quality: "high" | "low";
  textured: boolean;
  enableWheelZoom: boolean;
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
  focusPoint,
  horizon,
  sunDirection,
  detailScale,
  showStars,
  cameraDistance,
  zoomProgress,
  quality,
  textured,
  enableWheelZoom,
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
  const posedRef = useRef(false);
  const size = useThree((s) => s.size);

  const focusYaw = useMemo(() => {
    const coords =
      focusPoint ?? hubs?.find((h) => h.id === focusHubId)?.coords ?? null;
    if (!coords) return null;
    const v = latLonToVector3(coords, GLOBE_RADIUS);
    return -Math.atan2(v.x, v.z);
  }, [focusHubId, focusPoint, hubs]);

  // Encuadre de horizonte: lente y hundimiento del globo salen del tamaño real
  // del canvas, y la ruta se nivela sobre el limbo con un cuaternión.
  const framing = useMemo(
    () =>
      horizon
        ? solveHorizonFraming({
            width: size.width,
            height: size.height,
            globeRadius: GLOBE_RADIUS,
            cameraDistance,
            widthFraction:
              horizon.widthFraction ?? HORIZON_DEFAULTS.widthFraction,
            heightFraction:
              horizon.heightFraction ?? HORIZON_DEFAULTS.heightFraction,
            horizonLine: horizon.horizonLine ?? HORIZON_DEFAULTS.horizonLine,
          })
        : null,
    [horizon, size.width, size.height, cameraDistance],
  );

  const horizonPose = useMemo(() => {
    if (!horizon || !framing) return null;
    return levelRouteQuaternion(
      horizon.route.from,
      horizon.route.to,
      horizon.elevation ?? HORIZON_DEFAULTS.elevation,
      subCameraElevation(HORIZON_CAMERA_Y, cameraDistance, framing.offsetY),
    );
  }, [horizon, framing, cameraDistance]);

  useFrame((_, delta) => {
    const g = spinRef.current;
    if (!g) return;
    const spin = autoSpin ? spinSpeed * (reducedMotion ? 0.3 : 1) : 0;

    if (horizonPose) {
      // Al montar se coloca de golpe; al cambiar de ruta gira hasta la nueva.
      if (posedRef.current) {
        g.quaternion.slerp(horizonPose, Math.min(1, delta * 2.5));
      } else {
        g.quaternion.copy(horizonPose);
        posedRef.current = true;
      }
      return;
    }

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
      <directionalLight
        position={
          sunDirection
            ? [sunDirection.x * 10, sunDirection.y * 10, sunDirection.z * 10]
            : SUN_POSITION
        }
        intensity={2.4}
      />
      <pointLight
        position={[-6, -1, -4]}
        intensity={9}
        color={palette.accent}
        distance={28}
        decay={1.7}
      />

      {showStars && (
        <Stars
          radius={90}
          depth={50}
          count={reducedMotion ? 600 : 1600}
          factor={3.2}
          saturation={0}
          fade
          speed={reducedMotion ? 0 : 0.3}
        />
      )}

      {/* Cámara propia del encuadre: la lente sale del tamaño del canvas y mira
          de frente (sin `lookAt`), que es la geometría que resuelve el módulo
          de encuadre. */}
      {framing && (
        <PerspectiveCamera
          makeDefault
          fov={framing.fov}
          position={[0, HORIZON_CAMERA_Y, cameraDistance]}
        />
      )}

      {mode === "hero" && <HeroCameraRig zoomProgress={zoomProgress} />}

      {mode === "orbit" && interactive && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableZoom={enableWheelZoom}
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

      <group position={[0, framing?.offsetY ?? 0, 0]}>
        <group rotation={mode === "hero" || horizonPose ? [0, 0, 0] : tilt}>
          <group ref={spinRef}>
            <Earth
              radius={GLOBE_RADIUS}
              quality={quality}
              textured={textured}
              lightsPointScale={lightsPointScale}
              sunDirection={sunDirection ?? undefined}
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
                detailScale={detailScale}
                reducedMotion={reducedMotion}
                onHover={() => undefined}
                onSelect={() => undefined}
              />
            ))}
          </group>
        </group>
      </group>

      {(showMoon || showMars) && (
        <CompanionBodies
          showMoon={showMoon}
          showMars={showMars}
          reducedMotion={reducedMotion}
          earthRadius={GLOBE_RADIUS}
          cameraDistance={cameraDistance}
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
  /**
   * Gira el globo hasta poner estas coordenadas de cara a la cámara. Tiene
   * prioridad sobre `focusHubId` — útil para encuadrar el centro de una ruta.
   */
  focusPoint?: GeoPoint | null;
  /**
   * Encuadre de horizonte: hunde el globo hasta dejar sólo su casquete superior
   * y nivela el arco de la ruta sobre él. Sustituye a `tilt` y `focusPoint`.
   */
  horizon?: HorizonFraming | null;
  /**
   * Dirección del sol para este canvas. Por defecto la de la escena, que
   * ilumina el hemisferio de frente; ponerlo detrás del globo deja la cara
   * visible en noche con el limbo encendido.
   */
  sunDirection?: [number, number, number] | null;
  /**
   * Escala del trazo de las rutas y del cohete. Bajarlo cuando el globo se
   * dibuja muy grande, para que la trayectoria siga siendo una línea fina.
   */
  detailScale?: number;
  /** Campo de estrellas de fondo (sólo donde el canvas es protagonista). */
  showStars?: boolean;
  zoomProgress?: number;
  quality?: "high" | "low";
  /** Modo "black marble" con textura de continentes (más pesado). */
  textured?: boolean;
  /**
   * Permite hacer zoom con la rueda/pinch. Por defecto `false`: el globo de
   * fondo NO secuestra el scroll de la página (se usan los botones +/−).
   */
  enableWheelZoom?: boolean;
  cameraDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  tilt?: [number, number, number];
  dpr?: [number, number] | number;
  lightsPointScale?: number;
  showHint?: boolean;
  hintLabel?: string;
  showZoomButtons?: boolean;
  /** Reubica los botones +/− cuando algo (la navbar) ocupa su esquina. */
  zoomButtonsClassName?: string;
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
  focusPoint = null,
  horizon = null,
  sunDirection = null,
  detailScale = 1,
  showStars = false,
  zoomProgress = 0,
  quality = "high",
  textured = false,
  enableWheelZoom = false,
  cameraDistance = 6,
  minDistance = 3.4,
  maxDistance = 12,
  tilt = [0.3, 0, 0.14],
  dpr = [1, 2],
  lightsPointScale,
  showHint = false,
  hintLabel,
  showZoomButtons = false,
  zoomButtonsClassName,
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
  const sunVector = useMemo(
    () => (sunDirection ? new Vector3(...sunDirection).normalize() : null),
    [sunDirection],
  );
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
      } ${interactive ? "touch-pan-y" : ""} ${className}`}
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
                focusPoint={focusPoint}
                horizon={horizon}
                sunDirection={sunVector}
                detailScale={detailScale}
                showStars={showStars}
                cameraDistance={cameraDistance}
                zoomProgress={zoomProgress}
                quality={quality}
                textured={textured}
                enableWheelZoom={enableWheelZoom}
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
          className={zoomButtonsClassName}
        />
      )}
      {showHint && <GlobeHint label={hintLabel} />}
    </div>
  );
}

/**
 * Ampliación del apogeo real para que el arco se lea sobre el globo. A escala
 * exacta, 1 300 km de apogeo son un 20 % del radio terrestre: correcto, pero
 * casi rasante en pantalla.
 */
const APOGEE_EXAGGERATION = 1.8;

/**
 * Construye una ruta orbital puntual entre dos coordenadas (para Solución). El
 * apogeo no es decorativo: sale de la trayectoria balística de mínima energía
 * que resuelve `suborbitalProfile`, escalado al radio del globo.
 */
export function buildSingleRoute(
  from: GeoPoint,
  to: GeoPoint,
  options: { speed?: number; offset?: number } = {},
): OrbitalRoute {
  const { apogeeKm, distanceKm } = suborbitalProfile(greatCircleKm(from, to));
  const arcHeight =
    (GLOBE_RADIUS * apogeeKm * APOGEE_EXAGGERATION) / EARTH_RADIUS_KM;

  return {
    id: `${from.lat}_${from.lon}-${to.lat}_${to.lon}`,
    from: { city: "", country: "", coords: from },
    to: { city: "", country: "", coords: to },
    offset: options.offset ?? 0,
    speed: options.speed ?? 0.055,
    arcHeight,
    thrust: 0.6,
    status: "",
    cargoKg: Math.round(distanceKm),
    efficiency: 0,
    etaMinutes: 0,
  };
}
