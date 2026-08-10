"use client";

import { Canvas } from "@react-three/fiber";
import { Rocket, RotateCw, Sparkles, Undo2 } from "lucide-react";
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
  occupiedCells,
  pieceCells,
  rotatePiece,
  shuffledBag,
  spawnPiece,
  stackHeight,
  type ActivePiece,
  type Grid,
  type PieceKind,
} from "@/lib/cargo-bay";

import { BayScene } from "./bay-scene";

const COPY = {
  es: {
    used: "Aprovechamiento",
    stowed: "Estibado",
    levels: "Cubiertas cargadas",
    next: "Siguiente",
    rotate: "Rotar",
    auto: "Auto-estiba IA",
    reset: "Vaciar cofia",
    full: "Cofia llena",
    fullSub: "Ya no cabe nada más: es hora de despegar.",
    launch: "Despegar",
    launching: "Encendido…",
    launched: "Misión en vuelo",
    launchedSub: (m3: string, decks: number) =>
      `${m3} m³ estibados · ${decks} cubiertas a bordo`,
    again: "Cargar otra cofia",
    hint: "Apunta y haz clic para soltar · arrastra para girar la vista · R rota, flechas mueven, espacio suelta.",
    assumptions: `Cofia de ${BAY_SIZE} × ${BAY_SIZE} posiciones de palé y ${BAY_LEVELS} cubiertas · 1 posición = ${CELL_VOLUME_M3} m³ · ${BAY_VOLUME_M3} m³ útiles`,
  },
  en: {
    used: "Utilisation",
    stowed: "Stowed",
    levels: "Decks loaded",
    next: "Next",
    rotate: "Rotate",
    auto: "AI auto-stow",
    reset: "Empty fairing",
    full: "Fairing full",
    fullSub: "Nothing else fits: time to launch.",
    launch: "Launch",
    launching: "Ignition…",
    launched: "Mission in flight",
    launchedSub: (m3: string, decks: number) =>
      `${m3} m³ stowed · ${decks} decks aboard`,
    again: "Load another fairing",
    hint: "Aim and click to drop · drag to orbit · R rotates, arrows move, space drops.",
    assumptions: `Fairing of ${BAY_SIZE} × ${BAY_SIZE} pallet positions and ${BAY_LEVELS} decks · 1 position = ${CELL_VOLUME_M3} m³ · ${BAY_VOLUME_M3} m³ usable`,
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

export interface CargoBayProps {
  className?: string;
}

/**
 * Minijuego de estiba dentro de la cofia: el cotizador deja de enseñar una caja
 * quieta y pasa a dejarte cargar el cohete en volumen. Las cifras salen del
 * propio volumen (posiciones ocupadas × volumen de palé), no de un número
 * inventado.
 */
export function CargoBay({ className = "" }: CargoBayProps) {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const mounted = useIsClient();
  const reducedMotion = useReducedMotion();
  const [containerRef, inView] = useInView<HTMLDivElement>();
  /** Distingue el clic que suelta del arrastre que gira la vista. */
  const dragRef = useRef({ startX: 0, startY: 0, moved: false });
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  /** La vista gira sola hasta que alguien la arrastra. */
  const [autoRotate, setAutoRotate] = useState(true);
  /**
   * Fase de la partida: se estiba, despega o ya está en vuelo. El despegue es
   * el premio por acomodar la carga, así que la cofia se vacía después.
   */
  const [phase, setPhase] = useState<"stow" | "launching" | "flight">("stow");
  /** Foto de la carga en el momento del despegue: es lo que resume la misión. */
  const [flown, setFlown] = useState({ m3: "0.0", decks: 0 });

  // Baraja ya en el cliente: ver `initialState`.
  useEffect(() => dispatch({ type: "shuffle" }), []);

  const ghost = useMemo(
    () => (state.active ? landingPiece(state.grid, state.active) : null),
    [state.grid, state.active],
  );

  const metrics = useMemo(() => {
    const occupied = occupiedCells(state.grid);
    const height = stackHeight(state.grid);
    return {
      // Aprovechamiento de las cubiertas usadas: cuánto aire queda dentro.
      used: height === 0 ? 0 : occupied / (height * LEVEL_CELLS),
      stowedM3: (occupied + state.shipped) * CELL_VOLUME_M3,
    };
  }, [state.grid, state.shipped]);

  const launch = useCallback(() => {
    if (phase !== "stow") return;
    setFlown({ m3: metrics.stowedM3.toFixed(1), decks: state.levels });
    setPhase("launching");
  }, [phase, metrics.stowedM3, state.levels]);

  // El ascenso dura lo que tarda en salir de cuadro; después, resumen.
  useEffect(() => {
    if (phase !== "launching") return;
    const id = window.setTimeout(
      () => setPhase("flight"),
      reducedMotion ? 400 : 2800,
    );
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

  const reload = () => {
    dispatch({ type: "reset" });
    setPhase("stow");
  };

  const hasCargo = metrics.stowedM3 > 0;

  /** El puntero apunta a una posición de la planta; el palé se centra ahí. */
  const handleHoverCell = useCallback((x: number, z: number) => {
    dispatch({ type: "hover", x, z });
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  const handleKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      " ",
      "r",
      "R",
    ];
    if (!keys.includes(event.key) || phase !== "stow") return;
    event.preventDefault();

    switch (event.key) {
      case "ArrowLeft":
        return dispatch({ type: "move", dx: -1, dz: 0 });
      case "ArrowRight":
        return dispatch({ type: "move", dx: 1, dz: 0 });
      case "ArrowUp":
        return dispatch({ type: "move", dx: 0, dz: -1 });
      case "ArrowDown":
        return dispatch({ type: "move", dx: 0, dz: 1 });
      case "r":
      case "R":
        return dispatch({ type: "rotate" });
      default:
        return dispatch({ type: "drop" });
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-space-950 via-space-900/40 to-space-950"
      >
        <div
          role="application"
          tabIndex={0}
          aria-label={c.hint}
          onKeyDown={handleKey}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
          className="relative h-[340px] cursor-crosshair touch-pan-y outline-none focus-visible:ring-1 focus-visible:ring-pulse-blue/60 sm:h-[400px]"
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

          {phase === "flight" && (
            <Overlay
              title={c.launched}
              sub={c.launchedSub(flown.m3, flown.decks)}
              action={c.again}
              onAction={reload}
            />
          )}
        </div>

        {/* Scrim: el marcador va sobre la escena, que arriba es clara. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-space-950 via-space-950/70 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-pulse-cyan">
              {c.used.toUpperCase()}
            </div>
            <div className="font-display text-[22px] leading-none text-foreground">
              {Math.round(metrics.used * 100)}%
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              {c.next.toUpperCase()}
            </div>
            <div className="mt-1 flex justify-end">
              <NextPiece kind={state.queue[0]} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BayButton
          onClick={() => dispatch({ type: "rotate" })}
          label={c.rotate}
          icon={<RotateCw className="h-3.5 w-3.5" />}
        />
        <BayButton
          onClick={() => dispatch({ type: "auto" })}
          label={c.auto}
          icon={<Sparkles className="h-3.5 w-3.5" />}
          accent
        />
        <BayButton
          onClick={launch}
          label={phase === "launching" ? c.launching : c.launch}
          icon={<Rocket className="h-3.5 w-3.5" />}
          disabled={!hasCargo || phase !== "stow"}
          primary
        />
        <BayButton
          onClick={() => dispatch({ type: "reset" })}
          label={c.reset}
          icon={<Undo2 className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[13px]">
        <div className="flex items-center justify-between rounded-lg border border-border bg-space-950/40 px-3 py-2">
          <span className="text-muted-foreground">{c.stowed}</span>
          <span className="text-foreground">
            {metrics.stowedM3.toFixed(1)} m³
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-space-950/40 px-3 py-2">
          <span className="text-muted-foreground">{c.levels}</span>
          <span className="text-foreground">{state.levels}</span>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {c.hint}
      </p>
      <p className="font-mono text-[11px] leading-relaxed text-space-500">
        {c.assumptions}
      </p>
    </div>
  );
}

function BayButton({
  onClick,
  label,
  icon,
  accent = false,
  primary = false,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  icon: ReactNode;
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
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Cartel sobre la cofia: fin de partida o resumen de misión. */
function Overlay({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-space-950/80 px-6 text-center backdrop-blur-sm">
      <span className="font-display text-[20px] text-foreground">{title}</span>
      <span className="text-[13px] text-muted-foreground">{sub}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAction();
        }}
        className="mt-2 rounded-full bg-pulse-blue px-4 py-1.5 text-[13px] text-white transition-colors hover:bg-pulse-blue/90"
      >
        {action}
      </button>
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
        gridTemplateColumns: `repeat(${columns}, 7px)`,
        gridTemplateRows: `repeat(${rows}, 7px)`,
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
