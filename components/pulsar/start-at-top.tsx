"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    /** Marca de que esta carga de página ya se ha colocado en el hero. */
    __pulsarStartedAtTop?: boolean;
  }
}

/**
 * Abrir la landing siempre por el hero.
 *
 * El navegador guarda el scroll y lo restaura al recargar
 * (`history.scrollRestoration === "auto"`), así que volver a entrar tras haber
 * mirado el pie te dejaba en mitad de la página. En una landing de una sola
 * página eso nunca es lo que se quiere: se entra por arriba.
 *
 * La marca va en `window`, no en un ref ni en una variable de módulo, porque
 * tiene que sobrevivir al Fast Refresh: si no, cada recarga en caliente
 * mientras se edita salta al hero y no deja trabajar. Un recargado de verdad
 * estrena `window`, así que ahí sí vuelve a colocarse arriba.
 *
 * Respeta el ancla de la URL: `/#solucion` sigue llevando a su sección.
 */
export function StartAtTop() {
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    window.history.scrollRestoration = "manual";

    if (window.__pulsarStartedAtTop) return;
    window.__pulsarStartedAtTop = true;

    if (window.location.hash) return;
    // `instant`: el `scroll-behavior: smooth` global haría un barrido raro.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return null;
}
