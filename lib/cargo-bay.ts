/**
 * Estiba de la cofia — la lógica del minijuego del cotizador.
 *
 * Es un volumen de verdad, no un tablero plano: la cofia tiene una planta de
 * 4 × 4 posiciones de palé y 8 cubiertas apilables. Los palés se colocan sobre
 * la planta, caen hasta apoyarse en lo que ya hay debajo y, cuando una cubierta
 * queda completa, se consolida y sube al cohete: todo lo de encima baja un
 * nivel.
 *
 * Todo aquí es puro. El componente sólo dibuja el estado que devuelven estas
 * funciones, así que la mecánica se puede razonar (y corregir) sin tocar 3D.
 */

/** Posiciones de palé por lado de la planta de la cofia. */
export const BAY_SIZE = 4;
/** Cubiertas apilables dentro de la cofia. */
export const BAY_LEVELS = 8;
/** Posiciones por cubierta. */
export const LEVEL_CELLS = BAY_SIZE * BAY_SIZE;

/**
 * Volumen de una posición de palé, en m³ (1,2 × 1,2 × 1,25 m). La cofia
 * completa da 4 × 4 × 8 × 1,8 = 230 m³, del orden de una cofia de 5 m de
 * diámetro y 11 m de zona útil.
 */
export const CELL_VOLUME_M3 = 1.8;

/** Volumen útil de la cofia, en m³. */
export const BAY_VOLUME_M3 = LEVEL_CELLS * BAY_LEVELS * CELL_VOLUME_M3;

/**
 * Tipos de palé. Todos son planos: ocupan una cubierta de alto y su huella
 * cambia. Mezclar tamaños de 1 a 4 posiciones es lo que hace que las cubiertas
 * se puedan cerrar sin encaje perfecto — con sólo piezas de 4 sería un castigo.
 */
export type PieceKind =
  | "unit"
  | "pair"
  | "bar3"
  | "corner"
  | "square"
  | "bar4"
  | "ell"
  | "ese"
  | "tee";

export const PIECE_KINDS: readonly PieceKind[] = [
  "unit",
  "pair",
  "bar3",
  "corner",
  "square",
  "bar4",
  "ell",
  "ese",
  "tee",
];

/** Huella de cada palé en su rotación 0, como offsets `[x, z]`. */
const FOOTPRINTS: Record<PieceKind, readonly (readonly [number, number])[]> = {
  unit: [[0, 0]],
  pair: [
    [0, 0],
    [1, 0],
  ],
  bar3: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  corner: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  square: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  bar4: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  ell: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
  ],
  ese: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  tee: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
};

/** Celda de la cofia: el palé que la ocupa, o `null` si está libre. */
export type Cell = PieceKind | null;
/** Volumen indexado `[cubierta][z][x]`; la cubierta 0 es el suelo. */
export type Grid = readonly (readonly (readonly Cell[])[])[];

export interface ActivePiece {
  kind: PieceKind;
  /** Giro sobre el eje vertical, 0–3 en pasos de 90°. */
  rotation: number;
  x: number;
  z: number;
  /** Cubierta en la que está ahora mismo (0 = suelo). */
  y: number;
}

/** Celda ocupada por cada posición del palé, en coordenadas de la cofia. */
export function pieceCells(piece: ActivePiece): [number, number, number][] {
  return FOOTPRINTS[piece.kind].map(([ox, oz]) => {
    const [dx, dz] = rotateOffset(ox, oz, piece.rotation);
    return [piece.x + dx, piece.y, piece.z + dz];
  });
}

function rotateOffset(
  x: number,
  z: number,
  rotation: number,
): [number, number] {
  switch (((rotation % 4) + 4) % 4) {
    case 1:
      return [z, -x];
    case 2:
      return [-x, -z];
    case 3:
      return [-z, x];
    default:
      return [x, z];
  }
}

/** Huella del palé (sin nivel), útil para centrarlo bajo el puntero. */
export function footprintBounds(kind: PieceKind, rotation: number) {
  const cells = FOOTPRINTS[kind].map(([x, z]) => rotateOffset(x, z, rotation));
  const xs = cells.map(([x]) => x);
  const zs = cells.map(([, z]) => z);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

export function createGrid(): Grid {
  return Array.from({ length: BAY_LEVELS }, () =>
    Array.from({ length: BAY_SIZE }, () =>
      Array.from({ length: BAY_SIZE }, () => null as Cell),
    ),
  );
}

/** ¿Cabe el palé dentro de la cofia y sin pisar lo ya estibado? */
export function canPlace(grid: Grid, piece: ActivePiece): boolean {
  return pieceCells(piece).every(
    ([x, y, z]) =>
      x >= 0 &&
      x < BAY_SIZE &&
      z >= 0 &&
      z < BAY_SIZE &&
      y >= 0 &&
      y < BAY_LEVELS &&
      grid[y][z][x] === null,
  );
}

/** Lleva el palé a una posición de la planta, sin salirse de la cofia. */
export function movePieceTo(
  piece: ActivePiece,
  x: number,
  z: number,
): ActivePiece {
  const { minX, maxX, minZ, maxZ } = footprintBounds(
    piece.kind,
    piece.rotation,
  );
  return {
    ...piece,
    x: clamp(x, -minX, BAY_SIZE - 1 - maxX),
    z: clamp(z, -minZ, BAY_SIZE - 1 - maxZ),
  };
}

/** Desplaza una posición en la planta. */
export function movePiece(
  piece: ActivePiece,
  dx: number,
  dz: number,
): ActivePiece {
  return movePieceTo(piece, piece.x + dx, piece.z + dz);
}

/** Gira 90° sobre el eje vertical y vuelve a meterlo dentro de la planta. */
export function rotatePiece(piece: ActivePiece): ActivePiece {
  const rotated = { ...piece, rotation: (piece.rotation + 1) % 4 };
  return movePieceTo(rotated, rotated.x, rotated.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Cubierta en la que se apoyaría el palé si se soltara ahora. */
export function landingLevel(grid: Grid, piece: ActivePiece): number {
  for (let y = 0; y < BAY_LEVELS; y += 1) {
    if (canPlace(grid, { ...piece, y })) return y;
  }
  return -1;
}

/** El palé en su posición de apoyo — la sombra que se dibuja antes de soltar. */
export function landingPiece(
  grid: Grid,
  piece: ActivePiece,
): ActivePiece | null {
  const y = landingLevel(grid, piece);
  return y < 0 ? null : { ...piece, y };
}

export interface LockResult {
  grid: Grid;
  /** Cubiertas consolidadas con este palé. */
  cleared: number;
  /** Índices (antes de consolidar) de las cubiertas completas. */
  clearedLevels: number[];
}

/** Fija el palé y consolida las cubiertas que hayan quedado completas. */
export function lockPiece(grid: Grid, piece: ActivePiece): LockResult {
  const next = grid.map((level) => level.map((row) => [...row]));
  for (const [x, y, z] of pieceCells(piece)) {
    next[y][z][x] = piece.kind;
  }

  const clearedLevels: number[] = [];
  next.forEach((level, index) => {
    if (level.every((row) => row.every((cell) => cell !== null))) {
      clearedLevels.push(index);
    }
  });

  if (clearedLevels.length === 0) {
    return { grid: next, cleared: 0, clearedLevels };
  }

  const kept = next.filter((_, index) => !clearedLevels.includes(index));
  while (kept.length < BAY_LEVELS) {
    kept.push(
      Array.from({ length: BAY_SIZE }, () =>
        Array.from({ length: BAY_SIZE }, () => null as Cell),
      ),
    );
  }
  return { grid: kept, cleared: clearedLevels.length, clearedLevels };
}

/** Palé nuevo, centrado sobre la planta. */
export function spawnPiece(kind: PieceKind): ActivePiece {
  const { maxX, maxZ } = footprintBounds(kind, 0);
  return {
    kind,
    rotation: 0,
    x: Math.floor((BAY_SIZE - 1 - maxX) / 2),
    z: Math.floor((BAY_SIZE - 1 - maxZ) / 2),
    y: BAY_LEVELS - 1,
  };
}

/** Posiciones ocupadas ahora mismo dentro de la cofia. */
export function occupiedCells(grid: Grid): number {
  return grid.reduce(
    (sum, level) =>
      sum +
      level.reduce(
        (rowSum, row) => rowSum + row.filter((cell) => cell !== null).length,
        0,
      ),
    0,
  );
}

/** Cubiertas con al menos un palé — la altura de la pila. */
export function stackHeight(grid: Grid): number {
  for (let y = BAY_LEVELS - 1; y >= 0; y -= 1) {
    if (grid[y].some((row) => row.some((cell) => cell !== null))) return y + 1;
  }
  return 0;
}

/** Huecos tapados: posiciones vacías con carga encima. Penalizan la estiba. */
export function holeCount(grid: Grid): number {
  let holes = 0;
  for (let z = 0; z < BAY_SIZE; z += 1) {
    for (let x = 0; x < BAY_SIZE; x += 1) {
      let covered = false;
      for (let y = BAY_LEVELS - 1; y >= 0; y -= 1) {
        if (grid[y][z][x] !== null) covered = true;
        else if (covered) holes += 1;
      }
    }
  }
  return holes;
}

/**
 * Auto-estiba: prueba las cuatro orientaciones en todas las posiciones de la
 * planta y se queda con la que deja menos huecos tapados, menos altura y más
 * cubiertas cerradas. Es la heurística de empaquetado que vende la sección:
 * aprovechar el volumen sin dejar aire dentro.
 */
export function bestPlacement(
  grid: Grid,
  piece: ActivePiece,
): ActivePiece | null {
  let best: ActivePiece | null = null;
  let bestScore = -Infinity;

  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (let x = 0; x < BAY_SIZE; x += 1) {
      for (let z = 0; z < BAY_SIZE; z += 1) {
        const candidate = movePieceTo({ ...piece, rotation }, x, z);
        const landed = landingPiece(grid, candidate);
        if (!landed) continue;

        const { grid: after, cleared } = lockPiece(grid, landed);
        const score =
          cleared * 20 -
          holeCount(after) * 7 -
          stackHeight(after) * 1.5 -
          landed.y * 0.8;

        if (score > bestScore) {
          bestScore = score;
          best = landed;
        }
      }
    }
  }

  return best;
}

/** Bolsa aleatoria: reparte todos los tipos antes de repetir. */
export function shuffledBag(random: () => number = Math.random): PieceKind[] {
  const bag = [...PIECE_KINDS];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * Cofia de muestra para el escaparate del cotizador: una estiba plausible,
 * siempre la misma. Determinista a propósito — el escaparate se pinta en el
 * primer render y con `Math.random()` no habría hidratación que valiese.
 */
export function previewGrid(): Grid {
  const layout: readonly (readonly (readonly Cell[])[])[] = [
    [
      ["square", "square", "bar4", "bar4"],
      ["square", "square", "bar4", "bar4"],
      ["ell", "ell", "ell", "pair"],
      ["ell", "corner", "corner", "pair"],
    ],
    [
      ["bar3", "bar3", "bar3", "unit"],
      ["tee", "tee", "tee", "unit"],
      ["corner", "tee", "pair", "pair"],
      ["corner", "corner", null, null],
    ],
    [
      ["pair", "pair", "square", "square"],
      ["unit", null, "square", "square"],
      [null, null, null, null],
      [null, null, null, null],
    ],
  ];

  return createGrid().map((level, y) =>
    level.map((row, z) => row.map((_, x) => layout[y]?.[z]?.[x] ?? null)),
  );
}
