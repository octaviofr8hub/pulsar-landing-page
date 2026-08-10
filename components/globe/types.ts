import type { GeoPoint } from "@/types/network";

/**
 * Encuadre de horizonte para una ruta: hunde el globo hasta dejar sólo su
 * casquete superior y nivela el arco sobre él. Los valores por defecto están
 * calibrados para que ningún par de puertos se salga de la banda.
 */
export interface HorizonFraming {
  route: { from: GeoPoint; to: GeoPoint };
  /** Radio aparente del globo como fracción del ancho del canvas. */
  widthFraction?: number;
  /** Tope de ese radio como fracción del alto: es lo que deja sitio al apogeo. */
  heightFraction?: number;
  /** Dónde cae el limbo superior dentro del canvas (0 = arriba, 1 = abajo). */
  horizonLine?: number;
  /** Elevación del punto medio de la ruta sobre el punto sub-cámara, en grados. */
  elevation?: number;
}

/** Un hub/puerto marcado sobre el globo, clicable para seleccionarlo. */
export interface GlobeHub {
  id: string;
  name: string;
  coords: GeoPoint;
  /** Hubs de nearshoring se pintan en cian en vez de azul. */
  nearshore?: boolean;
}
