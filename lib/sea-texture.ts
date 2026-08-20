import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Textura procedural del mar para el aterrizaje en barcaza — dibujada en canvas,
 * sin assets externos (mismo criterio que `earth-texture.ts` y `crate-texture.ts`).
 *
 * Son dos mapas del mismo campo de olas:
 *
 * - **albedo**: azul profundo con las crestas apenas más claras.
 * - **relieve**: el mismo campo en gris, que va de `bumpMap` para que la luz
 *   rasante saque brillos en las crestas. Sin él, el mar es una lámina plana y
 *   se nota que el cohete baja sobre una moqueta azul.
 *
 * El campo se compone con senos de frecuencia **entera** sobre el lienzo, así
 * que la textura casa consigo misma al repetirse: sin costuras en el horizonte.
 */

const SIZE = 512;

/**
 * Trenes de olas: frecuencia en x, en y, amplitud y fase. Manda una marejada
 * larga casi paralela —de ahí las crestas alargadas en vez de un salpicado de
 * puntos— y encima van dos trenes cortos que la rompen.
 */
const WAVES: readonly (readonly [number, number, number, number])[] = [
  [1, 3, 0.62, 0.2],
  [2, 5, 0.3, 1.1],
  [-3, 8, 0.16, 2.4],
  [7, 13, 0.09, 0.7],
];

function height(u: number, v: number): number {
  let h = 0;
  for (const [fx, fy, amp, phase] of WAVES) {
    h += Math.sin((u * fx + v * fy) * Math.PI * 2 + phase) * amp;
  }
  return h / 1.17;
}

function createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  return [canvas, canvas.getContext("2d")!];
}

export interface SeaTextures {
  albedo: CanvasTexture;
  relief: CanvasTexture;
}

function build(): SeaTextures {
  const [albedoCanvas, albedoCtx] = createCanvas();
  const [reliefCanvas, reliefCtx] = createCanvas();
  const albedoData = albedoCtx.createImageData(SIZE, SIZE);
  const reliefData = reliefCtx.createImageData(SIZE, SIZE);

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const h = height(x / SIZE, y / SIZE);
      // 0 en el seno de la ola, 1 en la cresta.
      const t = (h + 1) / 2;
      // La espuma sólo asoma en lo alto de la cresta, y entra suave: con un
      // corte duro el mar se lee como una retícula de puntos brillantes.
      const crest = Math.min(1, Math.max(0, (t - 0.72) / 0.28) ** 1.6);

      const i = (y * SIZE + x) * 4;
      albedoData.data[i] = 10 + t * 26 + crest * 74;
      albedoData.data[i + 1] = 34 + t * 54 + crest * 92;
      albedoData.data[i + 2] = 62 + t * 74 + crest * 104;
      albedoData.data[i + 3] = 255;

      const shade = Math.round(60 + t * 195);
      reliefData.data[i] = shade;
      reliefData.data[i + 1] = shade;
      reliefData.data[i + 2] = shade;
      reliefData.data[i + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  reliefCtx.putImageData(reliefData, 0, 0);

  const albedo = new CanvasTexture(albedoCanvas);
  albedo.colorSpace = SRGBColorSpace;
  albedo.wrapS = RepeatWrapping;
  albedo.wrapT = RepeatWrapping;
  albedo.anisotropy = 8;

  const relief = new CanvasTexture(reliefCanvas);
  relief.wrapS = RepeatWrapping;
  relief.wrapT = RepeatWrapping;
  relief.anisotropy = 4;

  return { albedo, relief };
}

let cached: SeaTextures | null = null;

/**
 * Singleton de módulo: generar el campo de olas cuesta un cuarto de millón de
 * senos y el mar es el mismo en todas las partidas. No se libera a propósito —
 * la escena se monta y desmonta cada vez que se juega.
 */
export function getSeaTextures(): SeaTextures {
  if (!cached) cached = build();
  return cached;
}
