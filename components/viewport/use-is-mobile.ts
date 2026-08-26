"use client";

import { useSyncExternalStore } from "react";

/** El mismo corte que `md` en Tailwind: por debajo manda la versión de móvil. */
const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/**
 * `true` en anchos de móvil. Se usa para **no montar** lo que en un teléfono
 * sobra o va mal (el minijuego, los globos de adorno), no para maquetar: la
 * maquetación se hace con clases `md:`, que no dependen de la hidratación.
 *
 * El instantáneo del servidor es `false`. Quien monte algo pesado con esto debe
 * esperar también a la hidratación (`useIsClient`), o el árbol de escritorio se
 * montaría un momento en el móvil.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
