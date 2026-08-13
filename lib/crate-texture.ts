import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * Textura procedural del palé de carga — dibujada en canvas, sin assets
 * externos (mismo criterio que `earth-texture.ts`).
 *
 * Son dos mapas sobre la misma geometría de caja:
 *
 * - **albedo**: cartón técnico oscuro, flejes, etiqueta y refuerzos de esquina.
 *   Se pinta en gris azulado neutro para que el `color` del material lo tiña
 *   con el tono de cada familia de palé sin perder el relieve.
 * - **emissive**: sólo los flejes y la etiqueta. Es lo que hace que la caja se
 *   lea oscura con la banda encendida, en vez de un cubo de color plano.
 *
 * Las UV por defecto de `BoxGeometry` mapean la textura completa en cada cara,
 * así que los flejes dan la vuelta al bulto como en un palé real.
 */

const SIZE = 256;
/** Ancho del fleje vertical y horizontal, en píxeles de textura. */
const STRAP = 22;

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  return [canvas, canvas.getContext("2d")!];
}

/**
 * Ruido determinista: la textura se genera una sola vez por sesión, pero
 * conviene que dos cargas den el mismo grano (capturas, tests visuales).
 */
function noise(i: number): number {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/** Franjas de los dos flejes, como rectángulos [x, y, w, h]. */
function strapRects(): [number, number, number, number][] {
  const mid = (SIZE - STRAP) / 2;
  return [
    [mid, 0, STRAP, SIZE],
    [0, mid, SIZE, STRAP],
  ];
}

function drawCorrugation(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(12,18,32,0.16)";
  ctx.lineWidth = 1;
  for (let y = 6; y < SIZE; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(SIZE, y + 0.5);
    ctx.stroke();
  }
}

function drawGrain(ctx: CanvasRenderingContext2D) {
  for (let i = 0; i < 2600; i += 1) {
    const x = noise(i * 2 + 1) * SIZE;
    const y = noise(i * 2 + 2) * SIZE;
    const dark = noise(i * 3) > 0.5;
    ctx.fillStyle = dark ? "rgba(8,12,22,0.10)" : "rgba(200,215,245,0.06)";
    ctx.fillRect(x, y, 1, 1);
  }
}

/** Bisel: luz por arriba-izquierda, sombra por abajo-derecha. */
function drawBevel(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(190,210,245,0.22)";
  ctx.beginPath();
  ctx.moveTo(3, SIZE - 3);
  ctx.lineTo(3, 3);
  ctx.lineTo(SIZE - 3, 3);
  ctx.stroke();

  ctx.strokeStyle = "rgba(6,10,20,0.55)";
  ctx.beginPath();
  ctx.moveTo(SIZE - 3, 3);
  ctx.lineTo(SIZE - 3, SIZE - 3);
  ctx.lineTo(3, SIZE - 3);
  ctx.stroke();
}

/** Escuadras metálicas en las cuatro esquinas del bulto. */
function drawCorners(ctx: CanvasRenderingContext2D, color: string) {
  const arm = 34;
  const inset = 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  const corners: [number, number, number, number][] = [
    [inset, inset, 1, 1],
    [SIZE - inset, inset, -1, 1],
    [inset, SIZE - inset, 1, -1],
    [SIZE - inset, SIZE - inset, -1, -1],
  ];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + sx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * arm);
    ctx.stroke();
  });
}

function drawLabel(ctx: CanvasRenderingContext2D, glow: boolean) {
  const x = 24;
  const y = 168;
  const w = 88;
  const h = 56;

  ctx.fillStyle = glow ? "#2c2c2c" : "#e8eefc";
  ctx.fillRect(x, y, w, h);

  // código de barras
  ctx.fillStyle = glow ? "#8e8e8e" : "#0b1220";
  for (let i = 0; i < 16; i += 1) {
    const bar = 1 + Math.round(noise(i + 40) * 2);
    ctx.fillRect(x + 7 + i * 5, y + 8, bar, 22);
  }

  ctx.fillStyle = glow ? "#c8c8c8" : "#0b1220";
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillText("PULSAR", x + 7, y + 44);
  ctx.font = "9px ui-monospace, monospace";
  ctx.fillText("PLS-247", x + 52, y + 44);
}

/** Cartón técnico: base, grano, flejes, etiqueta y refuerzos. */
function buildAlbedo(): CanvasTexture {
  const [canvas, ctx] = createCanvas();

  const base = ctx.createLinearGradient(0, 0, 0, SIZE);
  base.addColorStop(0, "#525c70");
  base.addColorStop(1, "#333b4c");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  drawCorrugation(ctx);
  drawGrain(ctx);

  // panel hundido: da profundidad a la cara sin geometría extra
  ctx.strokeStyle = "rgba(10,16,28,0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, SIZE - 36, SIZE - 36);

  ctx.fillStyle = "#dce7ff";
  strapRects().forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
  // canto del fleje: dos filos oscuros lo despegan del cartón
  ctx.strokeStyle = "rgba(10,16,28,0.5)";
  ctx.lineWidth = 1;
  strapRects().forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h));

  drawLabel(ctx, false);
  drawCorners(ctx, "rgba(150,170,205,0.55)");
  drawBevel(ctx);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Sólo lo que emite: flejes, etiqueta y el testigo de la esquina. */
function buildEmissive(): CanvasTexture {
  const [canvas, ctx] = createCanvas();

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = "#8d8d8d";
  strapRects().forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));

  drawLabel(ctx, true);

  // testigo de estiba: el punto que se ve encendido en la carga apilada
  ctx.fillStyle = "#d8d8d8";
  ctx.beginPath();
  ctx.arc(SIZE - 42, 42, 9, 0, Math.PI * 2);
  ctx.fill();

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export interface CrateTextures {
  albedo: CanvasTexture;
  emissive: CanvasTexture;
}

let cache: CrateTextures | null = null;

/**
 * Texturas compartidas por todos los palés. Se generan una sola vez y no se
 * liberan: la cofia las monta y desmonta en cada partida, y regenerarlas en
 * cada montaje costaría más que mantenerlas vivas.
 */
export function getCrateTextures(): CrateTextures {
  if (!cache) {
    cache = { albedo: buildAlbedo(), emissive: buildEmissive() };
  }
  return cache;
}
