"use client";

import { ChevronLeft, ChevronRight, Minus, Rocket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useIsClient } from "@/components/globe/hooks";
import { useLanguage } from "@/components/i18n/use-language";
import { Flag } from "@/components/ui/flag";
import { useIsMobile } from "@/components/viewport/use-is-mobile";
import {
  SOLD_OUT_M3,
  formatCountdown,
  upcomingLaunches,
  type ScheduledLaunch,
} from "@/lib/launch-schedule";

const COPY = {
  es: {
    title: "Próximos lanzamientos",
    free: "libres",
    full: "Completo",
    prev: "Lanzamiento anterior",
    next: "Lanzamiento siguiente",
    open: "Ver toda la parrilla",
    close: "Cerrar la parrilla",
    collapse: "Plegar el panel",
    expand: "Ver los próximos lanzamientos",
    schedule: "Parrilla de la red",
    book: "Reservar capacidad",
    locale: "es-ES",
  },
  en: {
    title: "Next launches",
    free: "free",
    full: "Sold out",
    prev: "Previous launch",
    next: "Next launch",
    open: "See the full schedule",
    close: "Close the schedule",
    collapse: "Collapse the panel",
    expand: "Show the next launches",
    schedule: "Network schedule",
    book: "Book capacity",
    locale: "en-GB",
  },
} as const;

/** Cuántas salidas trae la parrilla. */
const WINDOW = 6;

/** Dónde se recuerda que el panel se dejó plegado. */
const COLLAPSED_KEY = "pulsar-launches-collapsed";

/**
 * El panel va fijo sobre la página y a veces tapa algo. Si alguien lo pliega,
 * se queda plegado el resto de la visita — volver a desplegarse en cada sección
 * sería justo lo que hace odiosos a estos avisos.
 *
 * `null` significa «nadie ha decidido todavía»: entonces manda el viewport, que
 * en móvil arranca plegado porque si no tapa el titular del hero.
 */
function readCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(COLLAPSED_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return null;
}

/** Fecha de salida en hora UTC, que es en la que se publican los lanzamientos. */
function formatDeparture(departure: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(departure);
}

/**
 * Panel de próximos lanzamientos, fijo en la esquina superior derecha de toda la
 * página.
 *
 * La parrilla se calcula en el cliente (`upcomingLaunches`) y la cuenta atrás
 * corre a un tick por segundo. **No se dibuja nada en el servidor**: la hora del
 * render de Next nunca coincidiría con la del navegador y la hidratación se
 * quejaría de cada dígito.
 *
 * En pantalla completa del minijuego no estorba: ahí el navegador sólo pinta el
 * elemento en pantalla completa, así que este panel desaparece solo.
 */
export function NextLaunches() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const mounted = useIsClient();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLElement>(null);

  const [now, setNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  /**
   * Plegado: el panel es fijo y a veces tapa lo que hay debajo. El inicializador
   * lee `localStorage` y en el servidor devuelve `null`, pero da igual: hasta
   * `mounted` este componente no dibuja nada, así que no hay hidratación que
   * romper.
   */
  const [storedCollapsed, setStoredCollapsed] = useState<boolean | null>(
    readCollapsed,
  );
  const collapsed = storedCollapsed ?? isMobile;

  const toggleCollapsed = (value: boolean) => {
    setStoredCollapsed(value);
    window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // La parrilla sólo se rehace cada minuto: recalcularla en cada tic tiraría
  // seis rutas por segundo a la basura sin que cambiase una sola fecha.
  const minute = Math.floor(now / 60_000) * 60_000;
  const launches = useMemo(() => upcomingLaunches(minute, WINDOW), [minute]);

  // Cuando despega el vuelo que se está mirando, la lista se corre: hay que
  // volver a acotar el índice o se queda apuntando fuera.
  const current: ScheduledLaunch | undefined =
    launches[Math.min(index, launches.length - 1)];

  const step = (delta: number) =>
    setIndex((value) => (value + delta + launches.length) % launches.length);

  // Cerrar la parrilla al pulsar fuera o con Esc: es un desplegable, no una
  // sección — quedarse abierto tapando la página sería un incordio.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || !current) return null;

  if (collapsed) {
    return (
      <aside
        aria-label={c.title}
        className="fixed right-3 top-[70px] z-40 lg:right-5 lg:top-[78px]"
      >
        <button
          type="button"
          onClick={() => toggleCollapsed(false)}
          aria-label={c.expand}
          className="flex items-center gap-1.5 rounded-full border border-border bg-space-950/85 px-2.5 py-1.5 backdrop-blur-xl transition-colors hover:border-pulse-blue/60 md:gap-2 md:px-3"
        >
          <Rocket className="h-3 w-3 shrink-0 text-pulse-cyan" />
          <span className="font-mono text-[11px] text-pulse-cyan">
            T− {formatCountdown(current.departure - now)}
          </span>
          <Flag country={current.route.from.country} />
          {/* Los códigos de puerto sobran en 390 px: la píldora no cabría. */}
          <span className="hidden font-mono text-[10px] text-space-400 md:inline">
            {current.route.from.code}→{current.route.to.code}
          </span>
          <Flag country={current.route.to.country} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      ref={panelRef}
      aria-label={c.title}
      className="fixed right-3 top-[70px] z-40 w-[228px] lg:right-5 lg:top-[78px] lg:w-[276px]"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-space-950/85 shadow-[0_24px_60px_-30px_rgba(2,8,20,0.95)] backdrop-blur-xl">
        <header className="flex items-center justify-between gap-2 border-b border-space-800 px-3 py-2">
          <span className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] tracking-[0.06em] text-pulse-cyan">
            <Rocket className="h-3 w-3 shrink-0" />
            <span className="truncate">{c.title.toUpperCase()}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <StepButton label={c.prev} onClick={() => step(-1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </StepButton>
            <span className="font-mono text-[9px] text-space-500">
              {index + 1}/{launches.length}
            </span>
            <StepButton label={c.next} onClick={() => step(1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </StepButton>
            <StepButton
              label={c.collapse}
              onClick={() => {
                setOpen(false);
                toggleCollapsed(true);
              }}
            >
              <Minus className="h-3.5 w-3.5" />
            </StepButton>
          </span>
        </header>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? c.close : c.open}
          className="w-full px-3 py-2.5 text-left transition-colors hover:bg-white/5"
        >
          <Route launch={current} />

          <div className="mt-1 hidden font-mono text-[10px] text-muted-foreground lg:block">
            {formatDeparture(current.departure, c.locale)} UTC ·{" "}
            {current.route.vehicle}
          </div>

          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[15px] leading-none text-pulse-cyan">
              T− {formatCountdown(current.departure - now)}
            </span>
            <Capacity launch={current} c={c} />
          </div>

          <CapacityBar launch={current} />
        </button>

        {open && (
          <div className="max-h-[340px] overflow-y-auto border-t border-space-800">
            <div className="px-3 pb-1 pt-2 font-mono text-[9px] tracking-[0.16em] text-space-500">
              {c.schedule.toUpperCase()}
            </div>
            <ul>
              {launches.map((launch, position) => (
                <li key={launch.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setIndex(position);
                      setOpen(false);
                    }}
                    className={`w-full border-t border-space-800/60 px-3 py-2 text-left transition-colors hover:bg-white/5 ${
                      position === index ? "bg-pulse-blue/10" : ""
                    }`}
                  >
                    <Route launch={launch} compact />
                    <div className="mt-0.5 flex items-baseline justify-between gap-2 font-mono text-[10px]">
                      <span className="text-muted-foreground">
                        {formatDeparture(launch.departure, c.locale)}
                      </span>
                      <span className="text-pulse-cyan">
                        T− {formatCountdown(launch.departure - now)}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px]">
                      <Capacity launch={launch} c={c} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <a
              href="#plataforma"
              onClick={() => setOpen(false)}
              className="block border-t border-space-800 px-3 py-2 text-center font-mono text-[10px] tracking-[0.14em] text-pulse-cyan transition-colors hover:bg-pulse-blue/10"
            >
              {c.book.toUpperCase()}
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Puerto de salida y de llegada con sus banderas. */
function Route({
  launch,
  compact = false,
}: {
  launch: ScheduledLaunch;
  compact?: boolean;
}) {
  const { lang } = useLanguage();
  const { from, to } = launch.route;

  return (
    <div
      className={`flex items-center gap-1.5 text-foreground ${
        compact ? "text-[12px]" : "text-[13px]"
      }`}
    >
      <Flag country={from.country} />
      <span className="truncate">{from.city[lang]}</span>
      <span className="shrink-0 text-space-500">→</span>
      <Flag country={to.country} />
      <span className="truncate">{to.city[lang]}</span>
    </div>
  );
}

/** Volumen libre de la cofia, o el aviso de que ya no queda. */
function Capacity({
  launch,
  c,
}: {
  launch: ScheduledLaunch;
  c: (typeof COPY)["es"] | (typeof COPY)["en"];
}) {
  if (launch.availableM3 < SOLD_OUT_M3) {
    return (
      <span className="shrink-0 font-mono text-[11px] text-amber-300">
        {c.full}
      </span>
    );
  }

  return (
    <span className="shrink-0 font-mono text-[11px] text-space-300">
      {launch.availableM3.toFixed(1)} m³{" "}
      <span className="text-space-500">{c.free}</span>
    </span>
  );
}

/** Cuánta cofia queda libre, en barra: el dato de un vistazo. */
function CapacityBar({ launch }: { launch: ScheduledLaunch }) {
  const free = Math.max(0, Math.min(1, launch.availableM3 / launch.capacityM3));

  return (
    <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${
          free < 0.08 ? "bg-amber-300" : "bg-pulse-blue"
        }`}
        style={{ width: `${Math.max(2, free * 100)}%` }}
      />
    </div>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-pulse-blue/60 hover:text-foreground"
    >
      {children}
    </button>
  );
}
