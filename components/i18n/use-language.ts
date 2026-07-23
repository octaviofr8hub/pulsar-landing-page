"use client";

import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";

const STORAGE_KEY = "pulsar-lang";
const listeners = new Set<() => void>();

function readLang(): Lang {
  if (typeof window === "undefined") return "es";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "es";
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
  const lang = useSyncExternalStore(subscribe, readLang, (): Lang => "es");
  return {
    lang,
    setLang,
    toggle: () => setLang(lang === "es" ? "en" : "es"),
  };
}
