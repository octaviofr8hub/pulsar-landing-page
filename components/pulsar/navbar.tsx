"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "@/components/i18n/use-language";
import { PulsarLogo } from "@/components/ui/pulsar-mark";
import { ScrollProgress } from "./motion";

const COPY = {
  es: {
    links: [
      { label: "Soluciones", href: "#solucion" },
      { label: "Red global", href: "#red" },
      { label: "Tecnología", href: "#flota" },
      { label: "Plataforma", href: "#plataforma" },
      { label: "Futuro", href: "#futuro" },
    ],
    login: "Iniciar sesión",
    cta: "Reserva capacidad",
    /** En móvil el botón encoge para dejar sitio al logo y a la hamburguesa. */
    ctaShort: "Reservar",
    menu: "Abrir el menú",
    menuClose: "Cerrar el menú",
    nav: "Navegación principal",
  },
  en: {
    links: [
      { label: "Solutions", href: "#solucion" },
      { label: "Global network", href: "#red" },
      { label: "Technology", href: "#flota" },
      { label: "Platform", href: "#plataforma" },
      { label: "Future", href: "#futuro" },
    ],
    login: "Log in",
    cta: "Book capacity",
    ctaShort: "Book",
    menu: "Open the menu",
    menuClose: "Close the menu",
    nav: "Main navigation",
  },
} as const;

export function Navbar() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [scrolled, setScrolled] = useState(false);
  /** Sólo existe por debajo de `md`: arriba la navegación va en la barra. */
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // El menú es un desplegable: se cierra al pulsar fuera y con Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node))
        setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        // `menuOpen` sólo puede ser cierto en móvil (el botón es `md:hidden`),
        // así que de `md` para arriba esto da exactamente lo de siempre.
        scrolled || menuOpen
          ? "border-b border-border bg-space-950/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10 lg:px-14">
        <a href="#top" aria-label="Pulsar">
          <PulsarLogo size="sm" />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {c.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href="#cta"
            className="hidden text-[14px] text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {c.login}
          </a>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
          >
            <a href="#cta">
              <span className="md:hidden">{c.ctaShort}</span>
              <span className="hidden md:inline">{c.cta}</span>
            </a>
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="pulsar-mobile-nav"
            aria-label={menuOpen ? c.menuClose : c.menu}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-pulse-blue/60 hover:text-foreground md:hidden"
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progreso de lectura: subraya el borde inferior de la navbar. */}
      <ScrollProgress />

      {/* Menú de móvil: cuelga por debajo de la barra (h-16), nunca en `md`. */}
      {menuOpen && (
        <nav
          id="pulsar-mobile-nav"
          aria-label={c.nav}
          // El borde inferior lo pone la propia cabecera (`menuOpen` la vuelve
          // opaca): repetirlo aquí dibujaría la línea dos veces.
          className="bg-space-950/95 backdrop-blur-xl md:hidden"
        >
          <ul className="mx-auto flex max-w-[1600px] flex-col divide-y divide-space-800 px-6">
            {[...c.links, { label: c.login, href: "#cta" }].map((l) => (
              <li key={`${l.href}-${l.label}`}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3.5 text-[15px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
