/**
 * Proporciones soportadas por los marcos de imagen (MediaFrame).
 * Cada clave mapea a una clase `aspect-*` de Tailwind en el componente.
 */
export type MediaRatio =
  | "square"
  | "portrait-3-4"
  | "portrait-2-3"
  | "landscape-4-3"
  | "landscape-16-10"
  | "video-16-9"
  | "wide-21-9";

/** Tipo de pantalla del mockup: con imágenes IA o escena 3D (WebGL). */
export type ScreenKind = "ai-frames" | "webgl";

/**
 * Especificación de un marco de imagen: dónde va, qué imagen IA lo llena y
 * la resolución de generación recomendada.
 */
export interface MediaFrameSpec {
  /** Identificador estable (kebab-case) — sirve de nombre de archivo sugerido */
  id: string;
  /** Etiqueta corta visible en el marco */
  label: string;
  /** Qué imagen IA va aquí — guía para el prompt de generación */
  caption: string;
  ratio: MediaRatio;
  /** Ancho de generación recomendado en px */
  width: number;
  /** Alto de generación recomendado en px */
  height: number;
  /** Marco destacado/seleccionado (borde con glow de marca) */
  active?: boolean;
  /** Marco opcional (respaldo/fallback, no imprescindible) */
  optional?: boolean;
}

/** Una de las pantallas del mockup con sus marcos de imagen. */
export interface MediaScreen {
  /** Número de pantalla tal cual el mockup ("01", "04", "14"...) */
  n: string;
  slug: string;
  title: string;
  kind: ScreenKind;
  /** Nota sobre la pantalla (p. ej. qué es WebGL y qué es imagen IA) */
  note?: string;
  frames: MediaFrameSpec[];
}
