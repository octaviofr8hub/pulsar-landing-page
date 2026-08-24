/**
 * Puntuación de la misión — el marcador del minijuego de la cofia.
 *
 * Reparte 1000 puntos entre los tres actos: lo que consigues estibar, lo que
 * clavas del guiado y cómo dejas el cohete en la barcaza. Es el único sitio del
 * proyecto donde los pesos son una decisión de juego y no un dato derivado, así
 * que están aquí, a la vista y con nombre — y el resumen enseña el desglose
 * entero, no sólo el total.
 *
 * Sin runtime ni three.js: aritmética, como `cargo-ascent` y `cargo-landing`.
 */

import { BAY_VOLUME_M3 } from "./cargo-bay";
import type { LandingResult } from "./cargo-landing";

/**
 * Puntos que reparte cada acto. El primero va partido en dos a propósito:
 * cuánta carga metiste y **cómo** la metiste. Meter volumen dejando aire debajo
 * no es estibar, y el marcador tiene que decirlo por separado para que se vea
 * cuál de las dos cosas hay que mejorar.
 */
export const SCORE_WEIGHTS = {
  volume: 250,
  stowage: 150,
  guidance: 300,
  landing: 300,
} as const;

/** Total en juego. */
export const SCORE_TOTAL =
  SCORE_WEIGHTS.volume +
  SCORE_WEIGHTS.stowage +
  SCORE_WEIGHTS.guidance +
  SCORE_WEIGHTS.landing;

/**
 * Carga que hace pleno en el primer acto, en m³: la mitad del volumen útil de
 * la cofia. Llenarla entera exige consolidar cubierta tras cubierta, y eso ya
 * es más una partida larga que un buen estibado.
 */
export const FULL_LOAD_M3 = BAY_VOLUME_M3 / 2;

/** Lo que puntúa un aterrizaje hecho por el piloto automático. */
export const ASSIST_FACTOR = 0.5;

/** Parte de la nota del aterrizaje que sale del propelente que sobró. */
const FUEL_SHARE = 0.22;

export type MissionRank = "S" | "A" | "B" | "C" | "D";

/** Nota mínima para cada rango. */
const RANKS: readonly (readonly [MissionRank, number])[] = [
  ["S", 850],
  ["A", 700],
  ["B", 550],
  ["C", 380],
  ["D", 0],
];

export interface MissionInput {
  /** Metros cúbicos estibados y embarcados. */
  stowedM3: number;
  /** Aprovechamiento del volumen abierto, de 0 a 1. */
  use: number;
  /** Aros de guiado cruzados, de 0 a 1. */
  guidance: number;
  /** Resultado del aterrizaje; `null` si la misión no llegó a él. */
  landing: LandingResult | null;
}

export interface MissionScore {
  volume: number;
  stowage: number;
  guidance: number;
  landing: number;
  total: number;
  rank: MissionRank;
}

function rankOf(total: number): MissionRank {
  return (RANKS.find(([, floor]) => total >= floor) ?? RANKS[RANKS.length - 1])[0];
}

/**
 * Nota de la misión. Un cohete perdido no puntúa el tercer acto —la carga se ha
 * perdido con él— pero conserva lo que se ganó estibando y pilotando: el
 * jugador ve qué parte hizo bien.
 */
export function missionScore({
  stowedM3,
  use,
  guidance,
  landing,
}: MissionInput): MissionScore {
  const volume = Math.round(
    SCORE_WEIGHTS.volume * Math.min(1, stowedM3 / FULL_LOAD_M3),
  );
  const stowage = Math.round(
    SCORE_WEIGHTS.stowage * Math.min(1, Math.max(0, use)),
  );
  const guided = Math.round(
    SCORE_WEIGHTS.guidance * Math.min(1, Math.max(0, guidance)),
  );

  const landed =
    landing && landing.ok
      ? Math.round(
          SCORE_WEIGHTS.landing *
            ((1 - FUEL_SHARE) * landing.score + FUEL_SHARE * landing.fuel) *
            (landing.assisted ? ASSIST_FACTOR : 1),
        )
      : 0;

  const total = volume + stowage + guided + landed;
  return {
    volume,
    stowage,
    guidance: guided,
    landing: landed,
    total,
    rank: rankOf(total),
  };
}
