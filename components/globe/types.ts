import type { GeoPoint } from "@/types/network";

/** Un hub/puerto marcado sobre el globo, clicable para seleccionarlo. */
export interface GlobeHub {
  id: string;
  name: string;
  coords: GeoPoint;
  /** Hubs de nearshoring se pintan en cian en vez de azul. */
  nearshore?: boolean;
}
