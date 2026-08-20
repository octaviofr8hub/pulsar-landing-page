"use client";

import { PerspectiveCamera, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera as PerspectiveCameraImpl,
  type PointLight,
} from "three";

import { RocketShape } from "@/components/scene/rocket-shape";
import {
  BURN_SECONDS,
  PAD_RADIUS_M,
  autopilotCommand,
  brakingUrgency,
  createLanding,
  driftOf,
  offsetOf,
  stepLanding,
  tiltOf,
  type LandingCommand,
  type LandingResult,
  type LandingState,
} from "@/lib/cargo-landing";
import { getSeaTextures } from "@/lib/sea-texture";

/**
 * Escala de la escena: 8 metros por unidad. Con ella el lanzador mide sus 32 m,
 * la cubierta de la barcaza 90 × 60 m y la aproximación entra desde 52 unidades
 * de alto. Todo lo que viene de `lib/cargo-landing` está en metros y se divide
 * aquí — el HUD enseña los metros, la escena las unidades.
 */
const METERS_PER_UNIT = 8;
/** Radio útil de la cubierta, en unidades de escena. */
const PAD_RADIUS = PAD_RADIUS_M / METERS_PER_UNIT;
/** Altura de los pies del cohete sobre el centro de su modelo. */
const ROCKET_FEET = 1.73;
/** Media altura del encuadre por unidad de distancia: tan(45°/2). */
const FRAME_HALF = 0.414;
/** Lo que dura el remate (polvareda o deflagración) antes del resumen. */
export const LANDING_FX_SECONDS = 1.8;
/** Media manga de la cubierta, en unidades. */
const DECK_X = 5.6;
const DECK_Z = 3.8;

const HOOP_ON = new Color("#34d399");
const HOOP_OFF = new Color("#f59e0b");

export interface LandingTelemetry {
  altitudeM: number;
  /** Velocidad de descenso, positiva al bajar. */
  descentMs: number;
  offsetM: number;
  driftMs: number;
  tiltDeg: number;
  /** Propelente restante, de 0 a 1. */
  fuel: number;
  throttle: number;
  /** Urgencia de la frenada, ≥1 significa que ya no da tiempo a parar. */
  urgency: number;
}

/* ── Decorado ────────────────────────────────────────────────────────────── */

const SKY_VERTEX = /* glsl */ `
  varying float vHeight;
  void main() {
    vHeight = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform float uRadius;
  varying float vHeight;

  void main() {
    float t = clamp(vHeight / uRadius * 1.5 + 0.06, 0.0, 1.0);
    gl_FragColor = vec4(mix(uHorizon, uZenith, pow(t, 0.6)), 1.0);
  }
`;

const SKY_RADIUS = 460;

/** Cúpula del cielo: azul de mar abierto abajo, negro de noche arriba. */
function SkyDome() {
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new Color("#1d4a72") },
      uZenith: { value: new Color("#040914") },
      uRadius: { value: SKY_RADIUS },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[SKY_RADIUS, 32, 24]} />
      <shaderMaterial
        vertexShader={SKY_VERTEX}
        fragmentShader={SKY_FRAGMENT}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/**
 * El mar: campo de olas procedural que se desplaza bajo la barcaza. Las
 * texturas son el singleton de `lib/sea-texture` y se piden también dentro del
 * fotograma: son objetos de three.js que se mutan —desplazar la textura es lo
 * que hace que el mar corra— y eso no se hace sobre un valor memorizado.
 */
function Sea() {
  const { albedo, relief } = getSeaTextures();
  // Cada baldosa cubre 30 unidades (240 m): con las olas de la textura salen
  // trenes de 30 a 80 m de cresta a cresta, que es marejada de mar abierto.
  // Repetirla más veces la convertía en una rejilla de puntos a lo lejos.
  albedo.repeat.set(30, 30);
  relief.repeat.set(30, 30);

  useFrame((_, delta) => {
    const sea = getSeaTextures();
    sea.albedo.offset.y += delta * 0.008;
    sea.relief.offset.y = sea.albedo.offset.y;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[900, 900]} />
      <meshStandardMaterial
        map={albedo}
        bumpMap={relief}
        bumpScale={0.4}
        color="#89b0dc"
        roughness={0.22}
        metalness={0.4}
      />
    </mesh>
  );
}

/** Esquinas de la cubierta, donde van las balizas. */
const BEACONS: readonly [number, number, number][] = [
  [DECK_X - 0.2, 0.2, DECK_Z - 0.2],
  [-(DECK_X - 0.2), 0.2, DECK_Z - 0.2],
  [DECK_X - 0.2, 0.2, -(DECK_Z - 0.2)],
  [-(DECK_X - 0.2), 0.2, -(DECK_Z - 0.2)],
];

/** Baliza de esquina de la barcaza: parpadea como las de verdad. */
function Beacon({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as MeshBasicMaterial;
    const blink = Math.sin(state.clock.elapsedTime * 3.2 + position[0]);
    material.opacity = blink > 0.4 ? 0.95 : 0.15;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.12, 10, 8]} />
      <meshBasicMaterial color="#f8fafc" transparent opacity={0.9} fog={false} />
    </mesh>
  );
}

/**
 * Barcaza de recuperación. El haz vertical y el aro de puntería son lo que
 * convierte el aterrizaje en algo apuntable: desde 400 m la cubierta es un
 * punto, pero el haz se ve siempre y el aro dice, a la altura del cohete, cuánto
 * te has ido de sitio.
 */
function Droneship() {
  const groupRef = useRef<Group>(null);

  // Cabeceo mínimo con la mar: suficiente para que no parezca una mesa.
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.position.y = Math.sin(t * 0.62) * 0.05;
    group.rotation.z = Math.sin(t * 0.51) * 0.005;
    group.rotation.x = Math.sin(t * 0.43 + 1.1) * 0.004;
  });

  return (
    <group ref={groupRef}>
      {/* casco */}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[DECK_X * 2, 1.4, DECK_Z * 2]} />
        <meshStandardMaterial color="#141c2e" roughness={0.85} metalness={0.25} />
      </mesh>

      {/* cubierta */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DECK_X * 2 - 0.2, DECK_Z * 2 - 0.2]} />
        <meshStandardMaterial color="#26314c" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* diana: el círculo pintado que hay que acertar */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PAD_RADIUS - 0.12, PAD_RADIUS, 64]} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0.75}
          side={DoubleSide}
          fog={false}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PAD_RADIUS * 0.42, PAD_RADIUS * 0.5, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.5}
          side={DoubleSide}
          fog={false}
        />
      </mesh>
      {[0, Math.PI / 2].map((angle) => (
        <mesh
          key={angle}
          position={[0, 0.03, 0]}
          rotation={[-Math.PI / 2, 0, angle]}
        >
          <planeGeometry args={[PAD_RADIUS * 1.9, 0.07]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={DoubleSide}
            fog={false}
          />
        </mesh>
      ))}

      {/* contenedores y grúa: la barcaza no es una tabla lisa */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DECK_X - 0.9), 0.42, DECK_Z - 0.7]}>
          <boxGeometry args={[1.3, 0.8, 0.7]} />
          <meshStandardMaterial
            color="#1b2438"
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}

      {BEACONS.map((position) => (
        <Beacon key={position.join()} position={position} />
      ))}
    </group>
  );
}

/** Haz de guiado: la vertical de la cubierta, visible desde cualquier altura. */
function GuidanceBeam() {
  return (
    <mesh position={[0, 60, 0]}>
      <cylinderGeometry args={[0.42, 0.42, 120, 16, 1, true]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.1}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/**
 * Aro de puntería a la altura del cohete: verde mientras la vertical cae dentro
 * de la cubierta, ámbar cuando no. Es el instrumento de la maniobra.
 */
function TargetHoop({ stateRef }: { stateRef: RefObject<LandingState> }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const state = stateRef.current;
    mesh.position.y = state.altitude / METERS_PER_UNIT;
    mesh.visible = state.altitude > 6;

    const material = mesh.material as MeshBasicMaterial;
    material.color.copy(offsetOf(state) <= PAD_RADIUS_M ? HOOP_ON : HOOP_OFF);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[PAD_RADIUS, 0.035, 8, 48]} />
      <meshBasicMaterial
        color={HOOP_ON}
        transparent
        opacity={0.75}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

/** Pluma de frenada: crece con el gas, y se apaga cuando el motor se corta. */
function LandingPlume({ stateRef }: { stateRef: RefObject<LandingState> }) {
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<PointLight>(null);

  useFrame((frame) => {
    const group = groupRef.current;
    if (!group) return;
    const state = stateRef.current;
    const throttle = state.result ? 0 : state.throttle;
    const flicker = 1 + Math.sin(frame.clock.elapsedTime * 44) * 0.12;

    group.visible = throttle > 0.02;
    group.scale.set(
      0.6 + throttle * 0.5,
      Math.max(0.05, throttle * flicker),
      0.6 + throttle * 0.5,
    );
    if (lightRef.current) lightRef.current.intensity = 260 * throttle * flicker;
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <mesh position={[0, -1.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.2, 2.3, 20, 1, true]} />
        <meshBasicMaterial
          color="#e0f2ff"
          transparent
          opacity={0.9}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh position={[0, -1.9, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 3.8, 20, 1, true]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.3}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -1, 0]}
        color="#93c5fd"
        intensity={0}
        distance={26}
        decay={1.7}
      />
    </group>
  );
}

/**
 * Remate de la maniobra: anillo de spray si el cohete se queda de pie,
 * deflagración si no. Se dibuja a partir del tiempo transcurrido desde el
 * contacto, que la escena lleva en un ref.
 */
function TouchdownFx({
  stateRef,
  elapsedRef,
}: {
  stateRef: RefObject<LandingState>;
  elapsedRef: RefObject<number>;
}) {
  const ringRef = useRef<Mesh>(null);
  const blastRef = useRef<Mesh>(null);

  useFrame(() => {
    const result = stateRef.current.result;
    const ring = ringRef.current;
    const blast = blastRef.current;
    if (!ring || !blast) return;

    if (!result) {
      ring.visible = false;
      blast.visible = false;
      return;
    }

    const t = Math.min(1, elapsedRef.current / LANDING_FX_SECONDS);
    const at = stateRef.current;

    ring.visible = result.ok;
    blast.visible = !result.ok;

    if (result.ok) {
      ring.scale.setScalar(1 + t * 9);
      (ring.material as MeshBasicMaterial).opacity = (1 - t) * 0.55;
    } else {
      const y = Math.max(0.4, at.altitude / METERS_PER_UNIT);
      blast.position.set(at.x / METERS_PER_UNIT, y, at.z / METERS_PER_UNIT);
      blast.scale.setScalar(0.5 + t * 5.5);
      (blast.material as MeshBasicMaterial).opacity = (1 - t) * 0.8;
    }
  });

  return (
    <>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.4, 0.62, 40]} />
        <meshBasicMaterial
          color="#cbd5f5"
          transparent
          opacity={0}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh ref={blastRef}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial
          color="#fb923c"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </>
  );
}

export interface LandingSceneProps {
  reducedMotion: boolean;
  /** Mando del piloto: actitud en los dos ejes y gas. */
  commandRef: RefObject<LandingCommand>;
  /** Con el piloto automático puesto, el lazo de control sustituye al jugador. */
  assist: boolean;
  onTelemetry: (telemetry: LandingTelemetry) => void;
  onDone: (result: LandingResult) => void;
}

/**
 * Aterrizaje vertical sobre la barcaza. Igual que el ascenso: la simulación vive
 * en un ref y la integra `lib/cargo-landing`; a React sólo sale la telemetría, a
 * 6 Hz, para no re-renderizar el árbol en cada fotograma.
 */
export function LandingScene({
  reducedMotion,
  commandRef,
  assist,
  onTelemetry,
  onDone,
}: LandingSceneProps) {
  const stateRef = useRef<LandingState>(createLanding());
  const rocketRef = useRef<Group>(null);
  const cameraRef = useRef<PerspectiveCameraImpl>(null);
  const fxRef = useRef(0);
  const published = useRef(0);
  const finished = useRef(false);
  /** Destino de la cámara, reutilizado para no crear un vector por fotograma. */
  const chase = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const previous = stateRef.current;
    if (assist && !previous.assisted) previous.assisted = true;

    const command = assist ? autopilotCommand(previous) : commandRef.current;
    const state = stepLanding(previous, command, delta);
    stateRef.current = state;
    // Un único reloj para el remate: empieza a correr en cuanto hay veredicto.
    if (state.result) fxRef.current += delta;

    const height = state.altitude / METERS_PER_UNIT;
    const x = state.x / METERS_PER_UNIT;
    const z = state.z / METERS_PER_UNIT;

    const rocket = rocketRef.current;
    if (rocket) {
      rocket.position.set(x, height + ROCKET_FEET, z);
      // Inclinar hacia +X es girar sobre −Z; hacia +Z, sobre +X.
      rocket.rotation.z = -state.tiltX;
      rocket.rotation.x = state.tiltZ;

      if (state.result && !state.result.ok) {
        // Un fallo no se queda quieto en el aire: se tumba y desaparece en la
        // deflagración.
        rocket.rotation.z -= fxRef.current * 1.6;
        rocket.position.y = Math.max(0.4, rocket.position.y - fxRef.current * 3);
        rocket.visible = fxRef.current < 0.35;
      }
    }

    const camera = cameraRef.current;
    if (camera) {
      // Persecución por detrás y algo por encima. La cámara se aleja con la
      // altura y se va acercando según baja: arriba manda el cohete, y desde
      // los últimos ~170 m la barcaza ya está en cuadro, que es cuando hace
      // falta verla para apuntar. `FRAME_HALF` es tan(fov/2) con fov = 45°.
      const nose = height + ROCKET_FEET + 2;
      const distance = Math.min(40, Math.max(13, nose * 1.35));
      const frameHalf = distance * FRAME_HALF;
      const aimY = Math.max(
        (nose - 1) / 2,
        height + ROCKET_FEET - frameHalf * 0.62,
      );
      const shake =
        !reducedMotion && state.result && !state.result.ok
          ? Math.sin(fxRef.current * 60) * 0.35 * Math.max(0, 1 - fxRef.current)
          : 0;

      chase.set(
        x * 0.45 + shake,
        aimY + distance * 0.22,
        z * 0.45 + distance,
      );
      camera.position.lerp(chase, Math.min(1, delta * 4));
      camera.lookAt(x * 0.3, aimY, z * 0.3);
    }

    published.current += delta;
    if (published.current > 1 / 6 || state.result) {
      published.current = 0;
      onTelemetry({
        altitudeM: Math.max(0, state.altitude),
        descentMs: Math.max(0, -state.vy),
        offsetM: offsetOf(state),
        driftMs: driftOf(state),
        tiltDeg: (tiltOf(state) * 180) / Math.PI,
        fuel: state.fuel / BURN_SECONDS,
        throttle: state.throttle,
        urgency: brakingUrgency(state),
      });
    }

    if (state.result && !finished.current && fxRef.current >= LANDING_FX_SECONDS) {
      finished.current = true;
      onDone(state.result);
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 60, 70]}
        fov={45}
        near={0.1}
        far={1200}
      />

      <fogExp2 attach="fog" args={["#12314f", 0.0035]} />
      <SkyDome />
      <Stars
        radius={400}
        depth={80}
        count={reducedMotion ? 500 : 1400}
        factor={6}
        saturation={0}
        fade
        speed={0.4}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[-40, 30, 20]} intensity={2.2} color="#cfe3ff" />
      <pointLight
        position={[0, 6, 0]}
        intensity={120}
        color="#38bdf8"
        distance={40}
        decay={1.8}
      />

      <Sea />
      <Droneship />
      <GuidanceBeam />
      <TargetHoop stateRef={stateRef} />
      <TouchdownFx stateRef={stateRef} elapsedRef={fxRef} />

      <group ref={rocketRef}>
        <RocketShape variant="solid" />
        <LandingPlume stateRef={stateRef} />
      </group>
    </>
  );
}
