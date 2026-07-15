export interface GeoPoint {
  /** Latitud en grados: positiva al norte del ecuador */
  lat: number;
  /** Longitud en grados: positiva al este de Greenwich */
  lon: number;
}

export interface RouteEndpoint {
  city: string;
  country: string;
  coords: GeoPoint;
}

export interface OrbitalRoute {
  id: string;
  from: RouteEndpoint;
  to: RouteEndpoint;
  /** Fase del viaje al montar la escena: 0 = despegue, 1 = llegada */
  offset: number;
  /** Fracción del arco recorrida por segundo */
  speed: number;
  /** Altura del apogeo sobre la superficie, en unidades de mundo */
  arcHeight: number;
  /** 0 → motores apagados, 1 → propulsión máxima */
  thrust: number;
  /** Fase operativa mostrada en el panel (ej. "En órbita") */
  status: string;
  cargoKg: number;
  /** Eficiencia de la ruta en porcentaje (0–100) */
  efficiency: number;
  /** Tiempo estimado de llegada en minutos, al cargar la página */
  etaMinutes: number;
}
