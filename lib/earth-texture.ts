import { CanvasTexture, SRGBColorSpace } from "three";

import { CITY_LIGHTS } from "./city-lights";
import {
  WORLD_BORDER_PATH,
  WORLD_LAND_PATH,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
} from "./world-map-2d";

/**
 * Genera texturas equirectangulares de la Tierra desde el mismo topojson que el
 * resto del sitio — sin assets externos (entorno offline). El mapeo lon→u /
 * lat→v coincide exactamente con `latLonToVector3`, así que continentes, hubs y
 * arcos quedan alineados sobre la esfera.
 */

const TEX_W = 2048;
const TEX_H = 1024;

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  return [canvas, canvas.getContext("2d")!];
}

function projectPixel(lat: number, lon: number): [number, number] {
  return [((lon + 180) / 360) * TEX_W, ((90 - lat) / 180) * TEX_H];
}

/** Albedo: océano oscuro + continentes rellenos + fronteras muy tenues. */
export function buildEarthAlbedo(): CanvasTexture {
  const [canvas, ctx] = createCanvas();

  ctx.fillStyle = "#081420";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.save();
  ctx.scale(TEX_W / WORLD_MAP_WIDTH, TEX_H / WORLD_MAP_HEIGHT);
  ctx.fillStyle = "#183a52";
  ctx.fill(new Path2D(WORLD_LAND_PATH), "evenodd");
  ctx.lineWidth = 0.4;
  ctx.strokeStyle = "rgba(120,165,225,0.10)";
  ctx.stroke(new Path2D(WORLD_BORDER_PATH));
  ctx.restore();

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Emissive: continentes con brillo tenue (para verse en la cara nocturna) +
 *  luces de ciudad cálidas. */
export function buildEarthLights(): CanvasTexture {
  const [canvas, ctx] = createCanvas();

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // continentes apenas visibles en el lado oscuro
  ctx.save();
  ctx.scale(TEX_W / WORLD_MAP_WIDTH, TEX_H / WORLD_MAP_HEIGHT);
  ctx.fillStyle = "rgba(20,50,74,0.55)";
  ctx.fill(new Path2D(WORLD_LAND_PATH), "evenodd");
  ctx.restore();

  // luces de ciudad
  for (const city of CITY_LIGHTS) {
    const [px, py] = projectPixel(city.lat, city.lon);
    const r = 2.5 + city.w * 8;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 2.4);
    glow.addColorStop(0, "rgba(255,226,164,0.95)");
    glow.addColorStop(0.4, "rgba(255,198,120,0.4)");
    glow.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,244,214,0.95)";
    ctx.beginPath();
    ctx.arc(px, py, Math.max(1, r * 0.35), 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
