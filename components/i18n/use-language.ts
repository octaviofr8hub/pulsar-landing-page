"use client";

import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";

const STORAGE_KEY = "pulsar-lang";
const listeners = new Set<() => void>();

/**
 * Idioma con el que arranca la página para quien no ha elegido todavía (no
 * hay nada en `localStorage`). El switcher de la navbar sigue ahí — esto sólo
 * cambia el punto de partida, de "es" a "en".
 */
const DEFAULT_LANG: Lang = "en";

function readLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "es" || stored === "en" ? stored : DEFAULT_LANG;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** Cambia el idioma globalmente y notifica a todos los componentes suscritos. */
export function setLang(lang: Lang): void {
  window.localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((fn) => fn());
}

/**
 * Idioma actual del sitio, reactivo y SSR-safe. No usa Context ni Provider: un
 * store externo mínimo (localStorage + `useSyncExternalStore`) evita el patrón
 * `setState`-en-efecto y sincroniza entre pestañas por el evento `storage`.
 */
export function useLanguage(): {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
} {
  const lang = useSyncExternalStore(
    subscribe,
    readLang,
    (): Lang => DEFAULT_LANG,
  );
  return {
    lang,
    setLang,
    toggle: () => setLang(lang === "es" ? "en" : "es"),
  };
}
