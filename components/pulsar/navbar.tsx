"use client";

import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "@/components/i18n/use-language";

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
  },
} as const;

export function Navbar() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-space-950/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pulse-blue to-pulse-cyan">
            <Rocket className="h-4 w-4 text-white" />
          </span>
          <span
            className="text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Pulsar
          </span>
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
            <a href="#cta">{c.cta}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
