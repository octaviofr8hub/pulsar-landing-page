export interface ValuePillar {
  title: string;
  description: string;
}

export interface ScenePhase {
  /** 0 → sólido, 1 → wireframe (visión rayos X) */
  xray: number;
  /** 0 → apagado, 1 → propulsión máxima */
  thrust: number;
  /** 0 → en vuelo, 1 → aterrizado */
  landing: number;
  /** Desplazamiento lateral del cohete en unidades de mundo */
  shiftX: number;
  /** Altura relativa del cohete en unidades de mundo */
  altitude: number;
  /** Inclinación en radianes (ángulo de exhibición en hero/visión) */
  tilt: number;
}
