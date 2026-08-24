"use client";

import { Canvas } from "@react-three/fiber";
import {
  FastForward,
  Flame,
  Maximize2,
  Minimize2,
  Rocket,
  RotateCw,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import {
  useInView,
  useIsClient,
  useReducedMotion,
} from "@/components/globe/hooks";
import { SceneErrorBoundary } from "@/components/scene/scene-error-boundary";
import { SceneFallback } from "@/components/scene/scene-fallback";
import { useLanguage } from "@/components/i18n/use-language";
import {
  BAY_LEVELS,
  BAY_SIZE,
  BAY_VOLUME_M3,
  CELL_VOLUME_M3,
  LEVEL_CELLS,
  PIECE_KINDS,
  bestPlacement,
  createGrid,
  footprintBounds,
  landingPiece,
  lockPiece,
  movePiece,
  movePieceTo,
  pieceCells,
  rotatePiece,
  shuffledBag,
  spawnPiece,
  stowageStats,
  type StowageGrade,
  type StowageStats,
  type ActivePiece,
  type Grid,
  type PieceKind,
} from "@/lib/cargo-bay";
import {
  ASCENT_SECONDS,
  CORRIDOR_HALF,
  GATE_COUNT,
  type SteerTarget,
} from "@/lib/cargo-ascent";
import {
  APPROACH_ALTITUDE_M,
  COMMAND_TILT_RAD,
  GRAVITY_MS2,
  IDLE_COMMAND,
  MAX_TILT_RAD,
  MAX_TOUCHDOWN_MS,
  PAD_RADIUS_M,
  THRUST_MS2,
  type LandingCommand,
  type LandingResult,
  type LandingVerdict,
} from "@/lib/cargo-landing";
import {
  SCORE_TOTAL,
  SCORE_WEIGHTS,
  missionScore,
  type MissionRank,
  type MissionScore,
} from "@/lib/mission-score";
import type { GeoPoint } from "@/types/network";

import {
  AscentScene,
  type AscentResult,
  type AscentTelemetry,
} from "./ascent-scene";
import { BayScene } from "./bay-scene";
import { preloadEarthTextures } from "./earth-below";
import { LandingScene, type LandingTelemetry } from "./landing-scene";

/** Una línea del cartel de mandos: qué se pulsa y para qué. */
interface ControlHint {
  keys: readonly string[];
  action: string;
}

const COPY = {
  es: {
    used: "Aprovechamiento",
    stowed: "Estibado",
    levels: "Cubiertas",
    next: "Siguiente",
    rotate: "Rotar",
    auto: "Auto-estiba IA",
    reset: "Vaciar",
    expand: "Ampliar",
    shrink: "Reducir",
    stage: "Simulador de misión",
    expandHint: "Tecla F · Esc para salir",
    full: "Cofia llena",
    fullSub: "Ya no cabe nada más: es hora de despegar.",
    launch: "Despegar",
    launching: "Encendido…",
    launched: "Misión completada",
    launchedSub: (
      m3: string,
      decks: number,
      guidance: number,
      landing: string,
    ) => `${m3} m³ · ${decks} cubiertas · guiado ${guidance}% · ${landing}`,
    again: "Cargar otra cofia",
    altitude: "Altitud",
    speed: "Velocidad",
    guidance: "Guiado",
    skip: "Saltar ascenso",
    steerHint: "Pilota con el puntero · cruza los aros",
    hint: "Clic para soltar · arrastra para girar la vista · R rota, flechas mueven, espacio suelta.",
    hintShort: "Clic suelta · arrastra gira · R rota · flechas mueven",
    approach: "Aproximación final",
    approachSub: `Vuelves a casa sobre la barcaza, a ${APPROACH_ALTITUDE_M} m y descentrado. Frena a tiempo y mata la deriva antes de tocar.`,
    approachStart: "Tomar el mando",
    landingHint: "Mantén pulsado para frenar · puntero para corregir",
    controls: [
      { keys: ["Clic", "Espacio"], action: "Motor: frena la caída" },
      { keys: ["Puntero", "← ↑ ↓ →"], action: "Inclinar: corrige el desvío" },
      { keys: ["A"], action: "Piloto automático" },
      { keys: ["F"], action: "Pantalla completa" },
    ] as readonly ControlHint[],
    thrust: "Empuje",
    attitude: "Actitud",
    position: "Posición",
    braking: "Margen de frenada",
    limits: "Límites de toma",
    holes: "Huecos",
    grades: {
      tight: "Estiba impecable: no queda aire dentro de la cofia.",
      good: "Buen aprovechamiento. Cierra la cubierta antes de subir otra.",
      loose: "Cubierta a medias: acábala antes de empezar la de encima.",
      airy: "Estás tapando huecos: ese aire ya no se recupera en toda la misión.",
    } as Record<StowageGrade, string>,
    climbing: "Subiendo · suelta el gas",
    score: "Puntuación",
    scoreVolume: "Volumen",
    scoreStowage: "Aprovechamiento",
    scoreGuidance: "Guiado",
    scoreLanding: "Aterrizaje",
    ranks: {
      S: "Comandante",
      A: "Piloto de pruebas",
      B: "Piloto",
      C: "En prácticas",
      D: "Novato",
    } as Record<MissionRank, string>,
    descent: "Descenso",
    climb: "Ascenso",
    fuel: "Propelente",
    brake: "Frenar",
    autoland: "Piloto automático IA",
    retry: "Reintentar aterrizaje",
    assisted: "asistido",
    landings: {
      perfect: "aterrizaje impecable",
      nominal: "cohete recuperado",
      hard: "impacto",
      offpad: "fuera de la barcaza",
      tipped: "volcó al tomar tierra",
      tumbled: "pérdida de control",
    } as Record<LandingVerdict, string>,
    verdictSub: (result: LandingResult) => {
      switch (result.verdict) {
        case "perfect":
          return `De pie a ${result.offset.toFixed(1)} m del centro y a ${result.speed.toFixed(1)} m/s.`;
        case "nominal":
          return `Dentro de tolerancias: ${result.speed.toFixed(1)} m/s y ${result.offset.toFixed(1)} m de desvío.`;
        case "hard":
          return `Llegó a ${result.speed.toFixed(1)} m/s; el tren aguanta ${MAX_TOUCHDOWN_MS}.`;
        case "offpad":
          return `Cayó al agua a ${result.offset.toFixed(0)} m del centro; la cubierta llega a ${PAD_RADIUS_M}.`;
        case "tipped":
          return `Tocó torcido: ${result.tiltDeg.toFixed(0)}° y ${result.drift.toFixed(1)} m/s de deriva.`;
        default:
          return "Demasiado mando: el cohete se tumbó en vuelo y ya no se enderezó.";
      }
    },
    assumptions: `Cofia ${BAY_SIZE}×${BAY_SIZE}×${BAY_LEVELS} · 1 posición = ${CELL_VOLUME_M3} m³ · ${BAY_VOLUME_M3} m³ útiles · ascenso comprimido a ${ASCENT_SECONDS} s con el apogeo y la velocidad de corte de la ruta · aterrizaje desde ${APPROACH_ALTITUDE_M} m con cubierta de ${PAD_RADIUS_M} m de radio, toma máxima ${MAX_TOUCHDOWN_MS} m/s y ${Math.round((MAX_TILT_RAD * 180) / Math.PI)}° de inclinación`,
  },
  en: {
    used: "Utilisation",
    stowed: "Stowed",
    levels: "Decks",
    next: "Next",
    rotate: "Rotate",
    auto: "AI auto-stow",
    reset: "Empty",
    expand: "Expand",
    shrink: "Shrink",
    stage: "Mission simulator",
    expandHint: "Press F · Esc to exit",
    full: "Fairing full",
    fullSub: "Nothing else fits: time to launch.",
    launch: "Launch",
    launching: "Ignition…",
    launched: "Mission complete",
    launchedSub: (
      m3: string,
      decks: number,
      guidance: number,
      landing: string,
    ) => `${m3} m³ · ${decks} decks · ${guidance}% guidance · ${landing}`,
    again: "Load another fairing",
    altitude: "Altitude",
    speed: "Speed",
    guidance: "Guidance",
    skip: "Skip ascent",
    steerHint: "Fly with the pointer · thread the rings",
    hint: "Click to drop · drag to orbit · R rotates, arrows move, space drops.",
    hintShort: "Click drops · drag orbits · R rotates · arrows move",
    approach: "Final approach",
    approachSub: `You are coming home to the droneship from ${APPROACH_ALTITUDE_M} m, off centre. Brake in time and kill the drift before you touch.`,
    approachStart: "Take control",
    landingHint: "Hold to brake · pointer to correct",
    controls: [
      { keys: ["Click", "Space"], action: "Engine: brakes the fall" },
      { keys: ["Pointer", "← ↑ ↓ →"], action: "Tilt: kills the drift" },
      { keys: ["A"], action: "Autopilot" },
      { keys: ["F"], action: "Full screen" },
    ] as readonly ControlHint[],
    thrust: "Thrust",
    attitude: "Attitude",
    position: "Position",
    braking: "Braking margin",
    limits: "Touchdown limits",
    holes: "Trapped air",
    grades: {
      tight: "Flawless stow: no air left inside the fairing.",
      good: "Good use of the volume. Close the deck before starting another.",
      loose: "Deck half done: finish it before starting the one above.",
      airy: "You are burying gaps: that air is lost for the rest of the mission.",
    } as Record<StowageGrade, string>,
    climbing: "Climbing · ease off",
    score: "Score",
    scoreVolume: "Volume",
    scoreStowage: "Utilisation",
    scoreGuidance: "Guidance",
    scoreLanding: "Landing",
    ranks: {
      S: "Commander",
      A: "Test pilot",
      B: "Pilot",
      C: "Trainee",
      D: "Rookie",
    } as Record<MissionRank, string>,
    descent: "Descent",
    climb: "Climb",
    fuel: "Propellant",
    brake: "Brake",
    autoland: "AI autopilot",
    retry: "Retry landing",
    assisted: "assisted",
    landings: {
      perfect: "flawless landing",
      nominal: "booster recovered",
      hard: "hard impact",
      offpad: "missed the deck",
      tipped: "tipped over on contact",
      tumbled: "loss of control",
    } as Record<LandingVerdict, string>,
    verdictSub: (result: LandingResult) => {
      switch (result.verdict) {
        case "perfect":
          return `Upright ${result.offset.toFixed(1)} m off centre at ${result.speed.toFixed(1)} m/s.`;
        case "nominal":
          return `Within limits: ${result.speed.toFixed(1)} m/s and ${result.offset.toFixed(1)} m off centre.`;
        case "hard":
          return `Touchdown at ${result.speed.toFixed(1)} m/s; the gear takes ${MAX_TOUCHDOWN_MS}.`;
        case "offpad":
          return `Into the water ${result.offset.toFixed(0)} m out; the deck reaches ${PAD_RADIUS_M}.`;
        case "tipped":
          return `Came down crooked: ${result.tiltDeg.toFixed(0)}° and ${result.drift.toFixed(1)} m/s of drift.`;
        default:
          return "Too much stick: the booster tipped past recovery in flight.";
      }
    },
    assumptions: `Fairing ${BAY_SIZE}×${BAY_SIZE}×${BAY_LEVELS} · 1 position = ${CELL_VOLUME_M3} m³ · ${BAY_VOLUME_M3} m³ usable · ascent compressed to ${ASCENT_SECONDS} s from the route apogee and burnout speed · landing from ${APPROACH_ALTITUDE_M} m onto a ${PAD_RADIUS_M} m deck radius, ${MAX_TOUCHDOWN_MS} m/s and ${Math.round((MAX_TILT_RAD * 180) / Math.PI)}° limits`,
  },
} as const;

interface BayState {
  grid: Grid;
  active: ActivePiece | null;
  queue: PieceKind[];
  /** Cubiertas que ya han salido hacia el cohete. */
  levels: number;
  /** Posiciones consolidadas (ya no están en la cofia). */
  shipped: number;
  /** Cambia en cada consolidación para disparar el destello. */
  flash: number;
  flashLevels: number[];
  over: boolean;
}

type BayAction =
  | { type: "hover"; x: number; z: number }
  | { type: "move"; dx: number; dz: number }
  | { type: "rotate" }
  | { type: "drop" }
  | { type: "auto" }
  | { type: "shuffle" }
  | { type: "reset" };

/**
 * Fases de la partida: estibar, encender, pilotar el ascenso, posar el cohete
 * en la barcaza y el resumen.
 */
type Phase = "stow" | "launching" | "ascent" | "landing" | "debrief";

/**
 * Cómo se ve el panel: encajado en el cotizador, en pantalla completa del
 * navegador o —si esa no está disponible— tapando la página por su cuenta.
 */
type ViewMode = "inline" | "native" | "overlay";

function refill(queue: PieceKind[]): PieceKind[] {
  return queue.length > 2 ? queue : [...queue, ...shuffledBag()];
}

/**
 * Estado inicial **determinista**: el orden sale de `PIECE_KINDS`, no de
 * `Math.random()`. Barajar en el primer render rompía la hidratación (servidor
 * y cliente sacaban piezas distintas); la baraja llega en `shuffle`, ya montado.
 */
function initialState(): BayState {
  const [first, ...rest] = PIECE_KINDS;
  return {
    grid: createGrid(),
    active: spawnPiece(first),
    queue: refill([...rest]),
    levels: 0,
    shipped: 0,
    flash: 0,
    flashLevels: [],
    over: false,
  };
}

/** Suelta el palé donde apoye, consolida cubiertas y saca el siguiente. */
function commit(state: BayState, piece: ActivePiece): BayState {
  const landed = landingPiece(state.grid, piece);
  if (!landed) return state;

  const { grid, cleared, clearedLevels } = lockPiece(state.grid, landed);
  const [next, ...rest] = state.queue;
  const spawned = spawnPiece(next);
  const fits = landingPiece(grid, spawned) !== null;

  return {
    grid,
    active: fits ? spawned : null,
    queue: refill(rest),
    levels: state.levels + cleared,
    shipped: state.shipped + cleared * LEVEL_CELLS,
    flash: cleared > 0 ? state.flash + 1 : state.flash,
    flashLevels: cleared > 0 ? clearedLevels : state.flashLevels,
    over: !fits,
  };
}

function reducer(state: BayState, action: BayAction): BayState {
  if (action.type === "reset") {
    return { ...initialState(), queue: shuffledBag() };
  }
  if (action.type === "shuffle") return { ...state, queue: shuffledBag() };
  if (!state.active) return state;

  switch (action.type) {
    case "hover":
      return {
        ...state,
        active: movePieceTo(state.active, action.x, action.z),
      };
    case "move":
      return {
        ...state,
        active: movePiece(state.active, action.dx, action.dz),
      };
    case "rotate":
      return { ...state, active: rotatePiece(state.active) };
    case "drop":
      return commit(state, state.active);
    case "auto": {
      const best = bestPlacement(state.grid, state.active);
      return best ? commit(state, best) : state;
    }
    default:
      return state;
  }
}

const EMPTY_TELEMETRY: AscentTelemetry = {
  altitudeKm: 0,
  speedKms: 0,
  progress: 0,
  passed: 0,
  gates: 0,
};

const EMPTY_LANDING: LandingTelemetry = {
  altitudeM: APPROACH_ALTITUDE_M,
  descentMs: 0,
  offsetM: 0,
  driftMs: 0,
  tiltDeg: 0,
  fuel: 1,
  throttle: 0,
  urgency: 0,
  commandX: 0,
  commandZ: 0,
  tiltX: 0,
  tiltZ: 0,
  offsetX: 0,
  offsetZ: 0,
};

const MAX_TILT_DEG = (MAX_TILT_RAD * 180) / Math.PI;
/** Fondo de escala del reloj de caída, en m/s. */
const DESCENT_FULL_SCALE = 45;

export interface BayGameProps {
  className?: string;
  /** Apogeo de la ruta cotizada, en km — la meta del ascenso. */
  apogeeKm?: number;
  /** Velocidad de corte de motores de esa ruta, en km/s. */
  burnoutSpeedKms?: number;
  /** Puerto de salida: el suelo que se sobrevuela al subir es el suyo. */
  from?: GeoPoint;
  /** Puerto de destino: hacia allí va la traza. */
  to?: GeoPoint;
}

/** Ruta por defecto si el juego se abre fuera del cotizador. */
const DEFAULT_FROM: GeoPoint = { lat: 40.71, lon: -74.01 };
const DEFAULT_TO: GeoPoint = { lat: 35.68, lon: 139.69 };

/**
 * Minijuego de la cofia, en tres actos: estibar la carga en volumen, pilotar el
 * ascenso sobre la Tierra y posar el cohete de pie en la barcaza. Las cifras
 * salen del propio volumen (posiciones × volumen de palé), del perfil
 * suborbital de la ruta elegida y de la física del aterrizaje — ninguna
 * inventada.
 */
export function BayGame({
  className = "",
  apogeeKm = 1200,
  burnoutSpeedKms = 6.4,
  from = DEFAULT_FROM,
  to = DEFAULT_TO,
}: BayGameProps) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const mounted = useIsClient();
  const reducedMotion = useReducedMotion();
  const [containerRef, inView] = useInView<HTMLDivElement>();
  /** Distingue el clic que suelta del arrastre que gira la vista. */
  const dragRef = useRef({ startX: 0, startY: 0, moved: false });
  /** Posición lateral pedida al piloto automático durante el ascenso. */
  const steerRef = useRef<SteerTarget>({ x: 0, z: 0 });
  /** Mando del aterrizaje: actitud en los dos ejes y gas. */
  const commandRef = useRef<LandingCommand>({ ...IDLE_COMMAND });
  /** Teclas de mando pulsadas ahora mismo, para sostener el gas y el giro. */
  const keysRef = useRef(new Set<string>());
  /** Última posición del puntero dentro del lienzo, y si está apretado. */
  const stickRef = useRef({ x: 0, z: 0, down: false });
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  /** La vista gira sola hasta que alguien la arrastra. */
  const [autoRotate, setAutoRotate] = useState(true);
  const [phase, setPhase] = useState<Phase>("stow");
  /** Foto de la carga en el momento del despegue: es lo que resume la misión. */
  const [flown, setFlown] = useState({ m3: 0, decks: 0, use: 0 });
  const [telemetry, setTelemetry] = useState<AscentTelemetry>(EMPTY_TELEMETRY);
  const [guidance, setGuidance] = useState(1);
  const [landing, setLanding] = useState<LandingTelemetry>(EMPTY_LANDING);
  const [outcome, setOutcome] = useState<LandingResult | null>(null);
  /** El mando no se entrega hasta que el jugador acepta la aproximación. */
  const [approaching, setApproaching] = useState(false);
  const [assist, setAssist] = useState(false);
  /** Remonta la escena de aterrizaje en cada intento. */
  const [attempt, setAttempt] = useState(0);
  /**
   * Cómo se está viendo el panel. Ampliar no remonta nada —cambian las clases
   * del mismo nodo, no su sitio en el árbol—, así que la partida, el vuelo y el
   * lienzo WebGL siguen tal cual: se puede ampliar a mitad de un aterrizaje.
   */
  const [view, setView] = useState<ViewMode>("inline");
  const expanded = view !== "inline";
  /** La raíz del panel: es la que se manda a pantalla completa. */
  const rootRef = useRef<HTMLDivElement>(null);
  /** El tablero: se le devuelve el foco al ampliar para no perder el teclado. */
  const stageRef = useRef<HTMLDivElement>(null);
  /** Manejadores de teclado vivos, para el respaldo que escucha en la ventana. */
  const keyboardRef = useRef<{
    pressKey: (key: string) => boolean;
    releaseKey: (key: string) => void;
  } | null>(null);

  // Baraja ya en el cliente: ver `initialState`.
  useEffect(() => dispatch({ type: "shuffle" }), []);

  // El planeta del ascenso son 1,1 MB de texturas: se piden nada más abrir el
  // juego para que estén listas cuando el cohete salga de la torre.
  useEffect(() => preloadEarthTextures(), []);

  /**
   * Ampliar. Se pide pantalla completa de verdad al navegador: el panel vive
   * dentro de contenedores con `backdrop-blur` y con filtros de Framer Motion,
   * y cualquiera de los dos convierte un `position: fixed` en un panel del
   * tamaño de la caja padre. Si el navegador no la da (iPhone, por ejemplo),
   * queda el panel fijo, que ahí sí se coloca bien.
   */
  const expand = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const request = root.requestFullscreen?.({ navigationUI: "hide" });
    if (!request) {
      setView("overlay");
      return;
    }
    request.then(
      () => setView("native"),
      () => setView("overlay"),
    );
  }, []);

  const collapse = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    setView("inline");
  }, []);

  // Salir con el gesto del navegador (Esc, la barra del sistema) también tiene
  // que devolver el panel a su sitio.
  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement !== rootRef.current) {
        setView((current) => (current === "native" ? "inline" : current));
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Ampliado, el tablero recupera el teclado; en el panel fijo, además, se
  // bloquea el scroll del fondo y Esc sale desde cualquier foco.
  useEffect(() => {
    if (!expanded) return;
    stageRef.current?.focus();
    if (view !== "overlay") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setView("inline");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, view]);

  const ghost = useMemo(
    () => (state.active ? landingPiece(state.grid, state.active) : null),
    [state.grid, state.active],
  );

  const metrics = useMemo(() => {
    const stats = stowageStats(state.grid, state.shipped);
    return {
      ...stats,
      stowedM3: (stats.occupied + state.shipped) * CELL_VOLUME_M3,
    };
  }, [state.grid, state.shipped]);

  const launch = useCallback(() => {
    if (phase !== "stow") return;
    setFlown({ m3: metrics.stowedM3, decks: state.levels, use: metrics.use });
    setTelemetry(EMPTY_TELEMETRY);
    steerRef.current = { x: 0, z: 0 };
    setPhase("launching");
  }, [phase, metrics.stowedM3, metrics.use, state.levels]);

  /** Deja el cohete en la vertical de la barcaza, listo para tomar el mando. */
  const armLanding = useCallback(() => {
    commandRef.current = { ...IDLE_COMMAND };
    keysRef.current.clear();
    setLanding(EMPTY_LANDING);
    setOutcome(null);
    setAssist(false);
    setApproaching(false);
    setAttempt((n) => n + 1);
    setPhase("landing");
  }, []);

  // El encendido dura lo que tarda la cofia en salir de cuadro; después, el
  // mando pasa al jugador.
  useEffect(() => {
    if (phase !== "launching") return;
    const id = window.setTimeout(
      () => setPhase("ascent"),
      reducedMotion ? 400 : 1700,
    );
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

  const finishAscent = useCallback(
    (result: AscentResult) => {
      setGuidance(result.score);
      armLanding();
    },
    [armLanding],
  );

  /**
   * Saltar el ascenso no regala el guiado: los aros que no se han volado
   * cuentan como fallados. Contándolo sólo sobre los ya evaluados, saltar en el
   * primer segundo daba un 100 % — y el guiado son 300 puntos de la misión.
   */
  const skipAscent = useCallback(() => {
    setGuidance(telemetry.passed / GATE_COUNT);
    armLanding();
  }, [telemetry.passed, armLanding]);

  const finishLanding = useCallback((result: LandingResult) => {
    setOutcome(result);
    setPhase("debrief");
  }, []);

  const reload = () => {
    dispatch({ type: "reset" });
    setOutcome(null);
    setApproaching(false);
    setPhase("stow");
  };

  /** Marcador de la misión: los tres actos, con su desglose. */
  const score = useMemo(
    () =>
      missionScore({
        stowedM3: flown.m3,
        use: flown.use,
        guidance,
        landing: outcome,
      }),
    [flown.m3, flown.use, guidance, outcome],
  );

  const hasCargo = metrics.stowedM3 > 0;
  const flying = phase === "ascent";
  const landingPhase = phase === "landing";
  const inFlight = flying || landingPhase;
  /** Pilotando el descenso: el puntero es el mando y el clic, el gas. */
  const piloting = phase === "landing" && approaching;

  /** El puntero apunta a una posición de la planta; el palé se centra ahí. */
  const handleHoverCell = useCallback((x: number, z: number) => {
    dispatch({ type: "hover", x, z });
  }, []);

  /**
   * Compone el mando del aterrizaje con las dos fuentes a la vez: el teclado
   * manda si hay flecha pulsada y, si no, la posición del puntero; el gas se
   * enciende con cualquiera de las dos. Así se puede frenar con el ratón y
   * corregir con las flechas sin que una entrada borre a la otra.
   */
  const syncCommand = useCallback(() => {
    const keys = keysRef.current;
    const stick = stickRef.current;
    const keyX =
      (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
    const keyZ =
      (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0);

    commandRef.current = {
      x: keyX !== 0 ? keyX : stick.x,
      z: keyZ !== 0 ? keyZ : stick.z,
      burn: stick.down || keys.has(" "),
    };
  }, []);

  /** Curva del mando: fino cerca del centro, a fondo sólo en los bordes. */
  const stickCurve = (value: number) => {
    const clamped = Math.max(-1, Math.min(1, value));
    return Math.sign(clamped) * Math.abs(clamped) ** 1.4;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (piloting) {
      stickRef.current.down = true;
      syncCommand();
      return;
    }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  /** Soltar el puntero corta el gas: el motor sólo empuja mientras se aprieta. */
  const handlePointerRelease = () => {
    if (!stickRef.current.down) return;
    stickRef.current.down = false;
    syncCommand();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Pilotando, el puntero es el mando: la posición dentro del tablero es la
    // desviación que se le pide al cohete, sin tener que pulsar nada.
    if (flying || piloting) {
      const rect = event.currentTarget.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      if (flying) {
        steerRef.current = {
          x: nx * CORRIDOR_HALF,
          z: ny * CORRIDOR_HALF * 0.7,
        };
        return;
      }

      stickRef.current.x = stickCurve(nx);
      stickRef.current.z = stickCurve(ny);
      syncCommand();
      return;
    }

    if (event.buttons === 0) return;
    const { startX, startY } = dragRef.current;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) {
      dragRef.current.moved = true;
    }
  };

  /** Un clic suelta el palé; un arrastre sólo ha estado girando la vista. */
  const handleClick = () => {
    if (phase !== "stow") return;
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    dispatch({ type: "drop" });
  };

  const steer = (dx: number, dz: number) => {
    const { x, z } = steerRef.current;
    steerRef.current = {
      x: Math.max(-CORRIDOR_HALF, Math.min(CORRIDOR_HALF, x + dx)),
      z: Math.max(-CORRIDOR_HALF, Math.min(CORRIDOR_HALF, z + dz)),
    };
  };

  /**
   * Núcleo del teclado, separado del evento de React: lo usan el tablero (que
   * lo recibe por el foco) y el respaldo de ventana. Devuelve `true` si la
   * tecla era del juego, para que quien la reciba se la trague.
   */
  const pressKey = (key: string): boolean => {
    // A entrega el mando al piloto automático mientras se pilota el descenso.
    if ((key === "a" || key === "A") && piloting) {
      setAssist(true);
      return true;
    }

    // F amplía y reduce en cualquier fase: es un mando de la vista, no del juego.
    if (key === "f" || key === "F") {
      if (expanded) collapse();
      else expand();
      return true;
    }

    const keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      " ",
      "r",
      "R",
    ];
    if (!keys.includes(key)) return false;
    if (phase !== "stow" && !flying && !piloting) return false;

    // Pilotando el descenso, la tecla se queda pulsada: el mando y el gas se
    // sostienen mientras no se suelte (`releaseKey`).
    if (piloting) {
      keysRef.current.add(key);
      syncCommand();
      return true;
    }

    if (flying) {
      switch (key) {
        case "ArrowLeft":
          steer(-0.7, 0);
          return true;
        case "ArrowRight":
          steer(0.7, 0);
          return true;
        case "ArrowUp":
          steer(0, -0.7);
          return true;
        case "ArrowDown":
          steer(0, 0.7);
          return true;
        default:
          return true;
      }
    }

    switch (key) {
      case "ArrowLeft":
        dispatch({ type: "move", dx: -1, dz: 0 });
        return true;
      case "ArrowRight":
        dispatch({ type: "move", dx: 1, dz: 0 });
        return true;
      case "ArrowUp":
        dispatch({ type: "move", dx: 0, dz: -1 });
        return true;
      case "ArrowDown":
        dispatch({ type: "move", dx: 0, dz: 1 });
        return true;
      case "r":
      case "R":
        dispatch({ type: "rotate" });
        return true;
      default:
        dispatch({ type: "drop" });
        return true;
    }
  };

  const releaseKey = (key: string) => {
    if (!keysRef.current.delete(key)) return;
    syncCommand();
  };

  const handleKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (pressKey(event.key)) event.preventDefault();
  };

  const handleKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    releaseKey(event.key);
  };

  // El respaldo de ventana tiene que ver siempre la fase actual, y el efecto que
  // lo instala no se rehace en cada render: se guarda la última versión aquí.
  useEffect(() => {
    keyboardRef.current = { pressKey, releaseKey };
  });

  /**
   * Teclado en vuelo. El tablero tiene `tabIndex`, pero al pulsar "Tomar el
   * mando" el foco se queda en un botón que desaparece con el cartel: a partir
   * de ahí ni el espacio ni las flechas llegaban a ninguna parte y había que
   * hacer clic en la escena para recuperarlos. Así que en cuanto empieza el
   * vuelo se le devuelve el foco al tablero **y** se escucha en la ventana por
   * si se ha vuelto a perder.
   *
   * El respaldo sólo atiende teclas que salen del propio juego o del `body`:
   * nunca las de los controles del cotizador, que también usan flechas.
   */
  useEffect(() => {
    if (!inFlight) return;
    stageRef.current?.focus({ preventScroll: true });

    const owns = (target: EventTarget | null) =>
      target === document.body ||
      (target instanceof Node && rootRef.current?.contains(target) === true);

    const onKeyDown = (event: KeyboardEvent) => {
      // El tablero enfocado ya lo maneja React; no hay que hacerlo dos veces.
      if (event.target === stageRef.current || !owns(event.target)) return;
      if (keyboardRef.current?.pressKey(event.key)) event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.target === stageRef.current || !owns(event.target)) return;
      keyboardRef.current?.releaseKey(event.key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [inFlight, approaching]);

  /** Ampliado hay sitio para instrumentos grandes; encajado, no. */
  const board: BoardSize = expanded ? "lg" : "sm";

  return (
    <div
      ref={rootRef}
      className={`flex flex-col gap-2 ${
        view === "native"
          ? "h-full w-full bg-space-950 p-3 sm:p-5"
          : view === "overlay"
            ? "fixed inset-0 z-[70] bg-space-950 p-3 sm:p-5"
            : className
      }`}
    >
      {expanded && (
        <div className="flex items-center justify-between gap-3 border-b border-space-800 pb-2">
          <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
            {c.stage.toUpperCase()}
          </span>
          <BayButton
            onClick={collapse}
            label={c.shrink}
            title={c.expandHint}
            icon={<Minimize2 className="h-3 w-3" />}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-space-950 via-space-900/40 to-space-950 ${
          expanded ? "min-h-0 flex-1" : ""
        }`}
      >
        <div
          ref={stageRef}
          role="application"
          tabIndex={0}
          aria-label={piloting ? c.landingHint : flying ? c.steerHint : c.hint}
          onKeyDown={handleKey}
          onKeyUp={handleKeyUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerRelease}
          onPointerLeave={handlePointerRelease}
          onPointerCancel={handlePointerRelease}
          onClick={handleClick}
          className={`relative cursor-crosshair outline-none focus-visible:ring-1 focus-visible:ring-pulse-blue/60 ${
            expanded ? "h-full" : "h-[clamp(260px,46vh,440px)]"
          } ${inFlight ? "touch-none" : "touch-pan-y"}`}
        >
          {mounted ? (
            <SceneErrorBoundary fallback={<SceneFallback />}>
              <Canvas
                camera={{ position: [10.5, 9.5, 13], fov: 38 }}
                dpr={[1, 1.75]}
                frameloop={inView ? "always" : "never"}
                gl={{ antialias: true, alpha: true }}
              >
                <Suspense fallback={null}>
                  {landingPhase ? (
                    <LandingScene
                      key={attempt}
                      reducedMotion={reducedMotion}
                      armed={approaching}
                      commandRef={commandRef}
                      assist={assist}
                      onTelemetry={setLanding}
                      onDone={finishLanding}
                    />
                  ) : flying ? (
                    <AscentScene
                      apogeeKm={apogeeKm}
                      burnoutSpeedKms={burnoutSpeedKms}
                      reducedMotion={reducedMotion}
                      from={from}
                      to={to}
                      steerRef={steerRef}
                      onTelemetry={setTelemetry}
                      onDone={finishAscent}
                    />
                  ) : (
                    <BayScene
                      grid={state.grid}
                      active={phase === "stow" ? state.active : null}
                      ghost={phase === "stow" ? ghost : null}
                      flash={state.flash}
                      flashLevels={state.flashLevels}
                      reducedMotion={reducedMotion}
                      autoRotate={autoRotate && phase === "stow"}
                      launching={phase === "launching"}
                      onOrbitStart={() => setAutoRotate(false)}
                      onHoverCell={handleHoverCell}
                    />
                  )}
                </Suspense>
              </Canvas>
            </SceneErrorBoundary>
          ) : (
            <SceneFallback />
          )}

          {state.over && phase === "stow" && (
            <Overlay
              title={c.full}
              sub={c.fullSub}
              action={c.launch}
              onAction={launch}
            />
          )}

          {/* La aproximación no arranca sola: primero se explica el mando, que
              son dos cosas a la vez y sin aviso no hay quien lo pose. */}
          {landingPhase && !approaching && (
            <Overlay
              title={c.approach}
              sub={c.approachSub}
              hints={c.controls}
              action={c.approachStart}
              onAction={() => setApproaching(true)}
            />
          )}

          {phase === "debrief" && outcome && (
            <Overlay
              title={c.launched}
              sub={c.launchedSub(
                flown.m3.toFixed(1),
                flown.decks,
                Math.round(guidance * 100),
                `${c.landings[outcome.verdict]}${outcome.assisted ? ` (${c.assisted})` : ""}`,
              )}
              note={c.verdictSub(outcome)}
              panel={
                <ScoreBoard
                  score={score}
                  label={c.score}
                  rank={c.ranks[score.rank]}
                  rows={[
                    [c.scoreVolume, score.volume, SCORE_WEIGHTS.volume],
                    [c.scoreStowage, score.stowage, SCORE_WEIGHTS.stowage],
                    [c.scoreGuidance, score.guidance, SCORE_WEIGHTS.guidance],
                    [c.scoreLanding, score.landing, SCORE_WEIGHTS.landing],
                  ]}
                />
              }
              tone={outcome.ok ? "good" : "bad"}
              action={outcome.ok ? c.again : c.retry}
              onAction={outcome.ok ? reload : armLanding}
              secondary={outcome.ok ? undefined : c.again}
              onSecondary={outcome.ok ? undefined : reload}
            />
          )}
        </div>

        {/* Scrim: el marcador va sobre la escena, que arriba es clara. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-space-950 via-space-950/70 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          {landingPhase ? (
            <>
              <div>
                <Readout
                  label={c.altitude}
                  value={`${Math.round(landing.altitudeM)} m`}
                />
                {/* Margen de frenada: cuánto de la altura que queda se comería
                    una parada a tope de gas. Es la cifra que decide cuándo hay
                    que encender, así que va dibujada, no sólo avisada. */}
                <div className="mt-1.5 w-[132px]">
                  <div className="whitespace-nowrap font-mono text-[8px] tracking-[0.14em] text-space-400">
                    {c.braking.toUpperCase()}
                  </div>
                  <div className="mt-0.5 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-[width] duration-150 ${
                        landing.urgency > 0.85
                          ? "bg-amber-300"
                          : "bg-pulse-cyan"
                      }`}
                      style={{
                        width: `${Math.round(Math.min(1, landing.urgency) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Placa de límites: contra esto se juzga la toma. */}
              <div className="text-right font-mono text-[9px] leading-relaxed text-space-400">
                <div className="tracking-[0.18em]">
                  {c.limits.toUpperCase()}
                </div>
                <div className="text-space-300">
                  ≤ {MAX_TOUCHDOWN_MS} m/s · ≤ {Math.round(MAX_TILT_DEG)}° · ⌀{" "}
                  {PAD_RADIUS_M} m
                </div>
              </div>
            </>
          ) : flying ? (
            <>
              <Readout
                label={c.altitude}
                value={`${telemetry.altitudeKm < 100 ? telemetry.altitudeKm.toFixed(1) : Math.round(telemetry.altitudeKm)} km`}
              />
              <Readout
                label={c.guidance}
                value={`${telemetry.passed}/${GATE_COUNT}`}
                align="right"
              />
            </>
          ) : (
            <>
              <Readout
                label={c.used}
                value={`${Math.round(metrics.use * 100)}%`}
                tone={metrics.grade === "airy" ? "warn" : "plain"}
              />
              <div className="text-right">
                <div className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                  {c.next.toUpperCase()}
                </div>
                <div className="mt-1 flex justify-end">
                  <NextPiece kind={state.queue[0]} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Aviso de frenada: sale de la distancia de parada a tope de gas
            comparada con la altura que queda, no es una alarma de adorno. */}
        {piloting && (landing.descentMs < -1 || landing.urgency > 0.55) && (
          <div className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap text-center">
            <span
              className={`font-mono text-[11px] tracking-[0.22em] ${
                landing.descentMs < -1
                  ? "text-amber-300"
                  : landing.urgency > 0.85
                    ? "text-amber-300"
                    : "text-pulse-cyan"
              }`}
            >
              {(landing.descentMs < -1 ? c.climbing : c.brake).toUpperCase()}
            </span>
          </div>
        )}

        {/* Tablero de la fase: los relojes de lo que está pasando. Cada acto
            tiene los suyos, y el de aterrizaje es el que de verdad se pilota. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="bg-gradient-to-t from-space-950 via-space-950/85 to-transparent px-3 pb-2 pt-7">
            {phase === "debrief" ? null : landingPhase ? (
              <LandingBoard c={c} landing={landing} size={board} />
            ) : flying ? (
              <AscentBoard
                c={c}
                telemetry={telemetry}
                burnoutSpeedKms={burnoutSpeedKms}
                size={board}
              />
            ) : (
              <StowBoard
                c={c}
                stats={metrics}
                decks={state.levels}
                size={board}
              />
            )}
          </div>
          {flying && (
            <div className="h-[3px] w-full bg-white/10">
              <div
                className="h-full bg-pulse-cyan transition-[width] duration-150"
                style={{ width: `${telemetry.progress * 100}%` }}
              />
            </div>
          )}
          {landingPhase && (
            <div className="h-[3px] w-full bg-white/10">
              <div
                className="h-full bg-pulse-blue transition-[width] duration-100"
                style={{ width: `${landing.throttle * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {landingPhase ? (
          <BayButton
            onClick={() => setAssist(true)}
            label={c.autoland}
            icon={<Sparkles className="h-3 w-3" />}
            disabled={assist || !approaching}
            accent
          />
        ) : flying ? (
          <BayButton
            onClick={skipAscent}
            label={c.skip}
            icon={<FastForward className="h-3 w-3" />}
          />
        ) : (
          <>
            <BayButton
              onClick={() => dispatch({ type: "rotate" })}
              label={c.rotate}
              icon={<RotateCw className="h-3 w-3" />}
            />
            <BayButton
              onClick={() => dispatch({ type: "auto" })}
              label={c.auto}
              icon={<Sparkles className="h-3 w-3" />}
              accent
            />
            <BayButton
              onClick={launch}
              label={phase === "launching" ? c.launching : c.launch}
              icon={<Rocket className="h-3 w-3" />}
              disabled={!hasCargo || phase !== "stow"}
              primary
            />
            <BayButton
              onClick={() => dispatch({ type: "reset" })}
              label={c.reset}
              icon={<Undo2 className="h-3 w-3" />}
            />
          </>
        )}
        {!expanded && (
          <BayButton
            onClick={expand}
            label={c.expand}
            title={c.expandHint}
            icon={<Maximize2 className="h-3 w-3" />}
          />
        )}
        {phase === "stow" && (
          <span className="font-mono text-[10px] text-space-500">
            {c.hintShort}
          </span>
        )}
        {piloting && (
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <Flame
              className={`h-3 w-3 ${landing.throttle > 0.05 ? "text-pulse-cyan" : "text-space-600"}`}
            />
            {c.landingHint}
          </span>
        )}
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-space-500">
        {c.assumptions}
      </p>
    </div>
  );
}

/**
 * Tamaño de cada instrumento. `sm`/`lg` son los del tablero según esté el panel
 * encajado o ampliado; `md`/`xl` los usa el reloj de aprovechamiento, que manda
 * sobre el resto de su tablero — es el dato del que va la sección.
 */
type BoardSize = "sm" | "md" | "lg" | "xl";

const INSTRUMENT_BOX: Record<BoardSize, string> = {
  sm: "h-[46px] w-[46px]",
  md: "h-[62px] w-[62px]",
  lg: "h-[76px] w-[76px]",
  xl: "h-[104px] w-[104px]",
};
const INSTRUMENT_VALUE: Record<BoardSize, string> = {
  sm: "text-[11px]",
  md: "text-[16px]",
  lg: "text-[18px]",
  xl: "text-[26px]",
};
const INSTRUMENT_UNIT: Record<BoardSize, string> = {
  sm: "text-[7px]",
  md: "text-[8px]",
  lg: "text-[9px]",
  xl: "text-[11px]",
};
const INSTRUMENT_LABEL =
  "font-mono text-[8px] tracking-[0.14em] text-space-400";

/** Grados que barre la aguja y desde dónde arranca (0° = las tres en punto). */
const DIAL_SWEEP = 270;
const DIAL_START = 135;
const DIAL_RADIUS = 40;
const DIAL_LENGTH = 2 * Math.PI * DIAL_RADIUS;
/** Aro exterior donde se marca el tramo bueno de la escala. */
const DIAL_BAND_RADIUS = 47;
const DIAL_BAND_LENGTH = 2 * Math.PI * DIAL_BAND_RADIUS;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Punto del arco para una fracción del recorrido. */
function dialPoint(fraction: number, radius: number): [number, number] {
  const angle = ((DIAL_START + fraction * DIAL_SWEEP) * Math.PI) / 180;
  return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
}

/**
 * Reloj del tablero: arco de 270°, aguja en el canto y la cifra en el centro.
 *
 * `value` va de 0 a 1 —cada instrumento decide cómo escala su magnitud, que no
 * todas son lineales— y `band` pinta el tramo bueno. Esa banda es lo que
 * convierte un número en una lectura de un vistazo: no hay que saberse el
 * límite, se ve si la aguja cae dentro.
 */
function Dial({
  label,
  value,
  text,
  unit,
  band,
  warn = false,
  accent = false,
  size,
}: {
  label: string;
  value: number;
  text: string;
  unit?: string;
  /** Tramo correcto de la escala, en fracciones del recorrido. */
  band?: readonly [number, number];
  warn?: boolean;
  /** Instrumento principal de su tablero: la etiqueta va en color de marca. */
  accent?: boolean;
  size: BoardSize;
}) {
  const fraction = clamp01(value);
  const [nx, ny] = dialPoint(fraction, DIAL_RADIUS - 3);
  const [bx, by] = dialPoint(fraction, DIAL_RADIUS - 13);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${INSTRUMENT_BOX[size]}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r={DIAL_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-space-800"
            strokeDasharray={`${(DIAL_LENGTH * DIAL_SWEEP) / 360} ${DIAL_LENGTH}`}
            transform="rotate(135 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r={DIAL_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={warn ? "text-amber-300" : "text-pulse-blue"}
            strokeDasharray={`${(DIAL_LENGTH * DIAL_SWEEP * fraction) / 360} ${DIAL_LENGTH}`}
            transform="rotate(135 50 50)"
          />
          {/* Tramo bueno de la escala, por fuera del aro y dibujado el último:
              debajo del valor se quedaba tapado justo cuando hace falta. */}
          {band && (
            <circle
              cx="50"
              cy="50"
              r={DIAL_BAND_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-emerald-400"
              strokeDasharray={`${(DIAL_BAND_LENGTH * DIAL_SWEEP * (band[1] - band[0])) / 360} ${DIAL_BAND_LENGTH}`}
              strokeDashoffset={`${(-DIAL_BAND_LENGTH * DIAL_SWEEP * band[0]) / 360}`}
              transform="rotate(135 50 50)"
            />
          )}
          {/* Aguja corta, sólo en el canto: el centro queda para la cifra. */}
          <line
            x1={bx}
            y1={by}
            x2={nx}
            y2={ny}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={warn ? "text-amber-200" : "text-white"}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display leading-none ${INSTRUMENT_VALUE[size]} ${
              warn ? "text-amber-300" : "text-foreground"
            }`}
          >
            {text}
          </span>
          {unit && (
            <span
              className={`font-mono leading-none text-space-500 ${INSTRUMENT_UNIT[size]}`}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
      <span
        className={
          accent
            ? "font-mono text-[10px] tracking-[0.16em] text-pulse-cyan"
            : INSTRUMENT_LABEL
        }
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

/**
 * Instrumento de dos ejes: dónde estás dentro de un límite circular. Sirve para
 * la inclinación (hacia dónde se va el cohete y cuánto pide el mando) y para la
 * posición sobre la cubierta — las dos cosas son un punto respecto a un centro,
 * y verlas así es mucho más rápido que leer dos cifras.
 */
function PolarPlot({
  label,
  x,
  y,
  /** Valor que llega al borde del instrumento. */
  scale,
  /** Límite operativo, en las mismas unidades: se dibuja como aro. */
  limit,
  /** Segundo punto, hueco: lo que está pidiendo el mando. */
  ghostX,
  ghostY,
  warn = false,
  size,
}: {
  label: string;
  x: number;
  y: number;
  scale: number;
  limit: number;
  ghostX?: number;
  ghostY?: number;
  warn?: boolean;
  size: BoardSize;
}) {
  const toPlot = (value: number) =>
    50 + Math.max(-1, Math.min(1, value / scale)) * 40;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${INSTRUMENT_BOX[size]}`}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-space-800"
          />
          <circle
            cx="50"
            cy="50"
            r={(limit / scale) * 40}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-amber-300/60"
          />
          <line
            x1="50"
            y1="12"
            x2="50"
            y2="88"
            stroke="currentColor"
            strokeWidth="1"
            className="text-space-800"
          />
          <line
            x1="12"
            y1="50"
            x2="88"
            y2="50"
            stroke="currentColor"
            strokeWidth="1"
            className="text-space-800"
          />
          {ghostX !== undefined && ghostY !== undefined && (
            <circle
              cx={toPlot(ghostX)}
              cy={toPlot(ghostY)}
              r="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-pulse-blue/70"
            />
          )}
          <circle
            cx={toPlot(x)}
            cy={toPlot(y)}
            r="6"
            fill="currentColor"
            className={warn ? "text-amber-300" : "text-pulse-cyan"}
          />
        </svg>
      </div>
      <span className={INSTRUMENT_LABEL}>{label.toUpperCase()}</span>
    </div>
  );
}

/**
 * Tablero del aterrizaje. Empuje, velocidad de caída, propelente, actitud y
 * posición sobre la cubierta: los cinco datos con los que se posa un cohete.
 * La escala de la caída es de raíz cuadrada porque lo que importa se juega en
 * los primeros metros por segundo; lineal, la aguja no se movía hasta el final.
 */
function LandingBoard({
  c,
  landing,
  size,
}: {
  c: (typeof COPY)["es"] | (typeof COPY)["en"];
  landing: LandingTelemetry;
  size: BoardSize;
}) {
  const rate = Math.abs(landing.descentMs);
  const rateScale = Math.sqrt(Math.min(1, rate / DESCENT_FULL_SCALE));
  const climbing = landing.descentMs < -1;
  const accelG = (landing.throttle * THRUST_MS2) / GRAVITY_MS2;

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3">
      <Dial
        label={c.thrust}
        value={landing.throttle}
        text={`${Math.round(landing.throttle * 100)}`}
        unit={`${accelG.toFixed(1)} g`}
        size={size}
      />
      <Dial
        label={climbing ? c.climb : c.descent}
        value={rateScale}
        text={rate.toFixed(1)}
        unit="m/s"
        band={[0, Math.sqrt(MAX_TOUCHDOWN_MS / DESCENT_FULL_SCALE)]}
        warn={climbing || (landing.altitudeM < 40 && rate > MAX_TOUCHDOWN_MS)}
        size={size}
      />
      <PolarPlot
        label={c.attitude}
        x={landing.tiltX}
        y={landing.tiltZ}
        scale={MAX_TILT_RAD * 1.9}
        limit={MAX_TILT_RAD}
        ghostX={landing.commandX * COMMAND_TILT_RAD}
        ghostY={landing.commandZ * COMMAND_TILT_RAD}
        warn={landing.tiltDeg > MAX_TILT_DEG}
        size={size}
      />
      <PolarPlot
        label={c.position}
        x={landing.offsetX}
        y={landing.offsetZ}
        scale={PAD_RADIUS_M * 2.4}
        limit={PAD_RADIUS_M}
        warn={landing.offsetM > PAD_RADIUS_M}
        size={size}
      />
      <Dial
        label={c.fuel}
        value={landing.fuel}
        text={`${Math.round(landing.fuel * 100)}`}
        unit="%"
        warn={landing.fuel < 0.2}
        size={size}
      />
    </div>
  );
}

/** Tablero del ascenso: la velocidad que lleva contra la de corte de la ruta. */
function AscentBoard({
  c,
  telemetry,
  burnoutSpeedKms,
  size,
}: {
  c: (typeof COPY)["es"] | (typeof COPY)["en"];
  telemetry: AscentTelemetry;
  burnoutSpeedKms: number;
  size: BoardSize;
}) {
  return (
    <div className="flex items-center gap-3">
      <Dial
        label={c.speed}
        value={telemetry.speedKms / burnoutSpeedKms}
        text={telemetry.speedKms.toFixed(1)}
        unit="km/s"
        size={size}
      />
      <Dial
        label={c.guidance}
        value={telemetry.passed / GATE_COUNT}
        text={`${telemetry.passed}`}
        unit={`/ ${GATE_COUNT}`}
        size={size}
      />
      <span className="flex-1 text-right font-mono text-[10px] leading-relaxed text-muted-foreground">
        {c.steerHint}
      </span>
    </div>
  );
}

/**
 * Tablero de la estiba: el aprovechamiento en el reloj, el aire atrapado en
 * cifras y una línea que dice, en cristiano, si se está estibando bien. Es la
 * estadística que el usuario pidió — que el juego te diga si aprovechas el
 * espacio, no sólo cuánto has metido.
 */
function StowBoard({
  c,
  stats,
  decks,
  size,
}: {
  c: (typeof COPY)["es"] | (typeof COPY)["en"];
  stats: StowageStats & { stowedM3: number };
  decks: number;
  size: BoardSize;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Dial
        label={c.used}
        value={stats.use}
        text={`${Math.round(stats.use * 100)}`}
        unit="%"
        band={[0.72, 1]}
        warn={stats.grade === "airy"}
        accent
        size={size === "lg" ? "xl" : "md"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-x-3 font-mono text-[10px] text-muted-foreground">
          <span className="whitespace-nowrap">
            {c.stowed}{" "}
            <span className="text-foreground">
              {stats.stowedM3.toFixed(1)} m³
            </span>
          </span>
          <span className="whitespace-nowrap">
            {c.levels} <span className="text-foreground">{decks}</span>
          </span>
          <span className="whitespace-nowrap">
            {c.holes}{" "}
            <span
              className={stats.holes > 0 ? "text-amber-300" : "text-foreground"}
            >
              {stats.holesM3.toFixed(1)} m³
            </span>
          </span>
        </div>
        {/* Con la cofia vacía todavía no hay estiba que juzgar: ahí la línea
            enseña los mandos, que es lo que hace falta en ese momento. */}
        <p className="mt-1 text-[10px] leading-snug text-space-400">
          {stats.stowedM3 === 0 ? c.hintShort : c.grades[stats.grade]}
        </p>
      </div>
    </div>
  );
}

/** Cifra del marcador: microetiqueta mono arriba, dato en display debajo. */
function Readout({
  label,
  value,
  align = "left",
  tone = "plain",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
  tone?: "plain" | "warn";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div
        className={`font-mono text-[9px] tracking-[0.18em] ${align === "right" ? "text-muted-foreground" : "text-pulse-cyan"}`}
      >
        {label.toUpperCase()}
      </div>
      <div
        className={`font-display text-[19px] leading-none ${tone === "warn" ? "text-amber-300" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function BayButton({
  onClick,
  label,
  icon,
  title,
  accent = false,
  primary = false,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  icon: ReactNode;
  /** Aclaración al pasar el puntero: los atajos de teclado, sobre todo. */
  title?: string;
  accent?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  const tone = primary
    ? "border-pulse-blue bg-pulse-blue text-white hover:bg-pulse-blue/90"
    : accent
      ? "border-pulse-blue bg-pulse-blue/15 text-pulse-cyan hover:bg-pulse-blue/25"
      : "border-border text-muted-foreground hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Cartel sobre la cofia: fin de partida, aviso de maniobra o resumen de misión. */
function Overlay({
  title,
  sub,
  note,
  hints,
  panel,
  tone = "plain",
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  title: string;
  sub: string;
  /** Segunda línea: el detalle técnico de lo que ha pasado. */
  note?: string;
  /** Mandos de la maniobra, uno por línea. */
  hints?: readonly ControlHint[];
  /** Bloque suelto entre el texto y los botones — el marcador, por ejemplo. */
  panel?: ReactNode;
  tone?: "plain" | "good" | "bad";
  action: string;
  onAction: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  const titleTone =
    tone === "good"
      ? "text-pulse-cyan"
      : tone === "bad"
        ? "text-amber-300"
        : "text-foreground";

  return (
    <div className="absolute inset-0 overflow-y-auto bg-space-950/85 backdrop-blur-sm">
      <div className="flex min-h-full flex-col items-center justify-center gap-1.5 px-5 py-4 text-center">
        <span className={`font-display text-[18px] ${titleTone}`}>{title}</span>
        <span className="max-w-[46ch] text-[12px] leading-relaxed text-muted-foreground">
          {sub}
        </span>
        {note && (
          <span className="max-w-[46ch] font-mono text-[10px] leading-relaxed text-space-500">
            {note}
          </span>
        )}
        {hints && (
          <div className="mt-2 grid gap-1">
            {hints.map((hint) => (
              <div
                key={hint.action}
                className="flex items-center justify-center gap-2"
              >
                <span className="flex shrink-0 gap-1">
                  {hint.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-space-700 bg-space-900 px-1.5 py-0.5 font-mono text-[10px] leading-none text-space-300"
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {hint.action}
                </span>
              </div>
            ))}
          </div>
        )}
        {panel}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            className="rounded-full bg-pulse-blue px-4 py-1.5 text-[12px] text-white transition-colors hover:bg-pulse-blue/90"
          >
            {action}
          </button>
          {secondary && onSecondary && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSecondary();
              }}
              className="rounded-full border border-border px-4 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {secondary}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Marcador de la misión: el total, el rango y de dónde salen los puntos. El
 * desglose no es adorno — es lo que dice qué acto hay que mejorar.
 */
function ScoreBoard({
  score,
  label,
  rank,
  rows,
}: {
  score: MissionScore;
  label: string;
  rank: string;
  rows: readonly (readonly [string, number, number])[];
}) {
  return (
    <div className="mt-2 w-[min(300px,100%)] border-t border-space-800 pt-2">
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-mono text-[9px] tracking-[0.18em] text-space-500">
          {label.toUpperCase()}
        </span>
        <span className="font-display text-[30px] leading-none text-foreground">
          {score.total}
        </span>
        <span className="font-mono text-[10px] text-space-500">
          / {SCORE_TOTAL}
        </span>
        <span className="rounded-full border border-pulse-blue/50 px-2 py-0.5 font-mono text-[10px] text-pulse-cyan">
          {score.rank} · {rank}
        </span>
      </div>

      <div className="mt-2 grid gap-1">
        {rows.map(([name, points, max]) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-[94px] shrink-0 truncate text-left font-mono text-[8px] tracking-[0.1em] text-space-500">
              {name.toUpperCase()}
            </span>
            <span className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-pulse-blue"
                style={{ width: `${Math.round((points / max) * 100)}%` }}
              />
            </span>
            <span className="w-[54px] shrink-0 text-right font-mono text-[10px] text-space-300">
              {points}
              <span className="text-space-600">/{max}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Miniatura en planta del palé que viene. */
function NextPiece({ kind }: { kind: PieceKind | undefined }) {
  if (!kind) return null;

  const piece: ActivePiece = { kind, rotation: 0, x: 0, y: 0, z: 0 };
  const { minX, maxX, minZ, maxZ } = footprintBounds(kind, 0);
  const cells = pieceCells(piece).map(
    ([x, , z]) => [x - minX, z - minZ] as const,
  );
  const columns = maxX - minX + 1;
  const rows = maxZ - minZ + 1;

  return (
    <div
      className="grid gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${columns}, 6px)`,
        gridTemplateRows: `repeat(${rows}, 6px)`,
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => {
        const x = index % columns;
        const z = Math.floor(index / columns);
        const on = cells.some(([cx, cz]) => cx === x && cz === z);
        return (
          <span
            key={index}
            className={`rounded-[1px] ${on ? "bg-pulse-cyan" : "bg-transparent"}`}
          />
        );
      })}
    </div>
  );
}
