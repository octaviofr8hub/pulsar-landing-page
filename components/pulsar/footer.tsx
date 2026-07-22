"use client";

import { Rocket } from "lucide-react";

const COLS = [
  {
    title: "Producto",
    links: ["Cotizador", "Torre de control", "API", "Precios"],
  },
  {
    title: "Red",
    links: ["Puertos espaciales", "Corredores", "Flota", "Cobertura"],
  },
  {
    title: "Empresa",
    links: ["Sobre Pulsar", "Nearshoring", "Prensa", "Carreras"],
  },
  { title: "Legal", links: ["Términos", "Privacidad", "Aduanas", "Seguridad"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-space-950">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pulse-blue to-pulse-cyan">
                <Rocket className="h-4 w-4 text-white" />
              </span>
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
                className="text-foreground"
              >
                Pulsar
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] text-muted-foreground">
              La logística de la civilización multiplanetaria. Cualquier punto
              de la Tierra en 90 minutos.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-[13px] text-foreground">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[14px] text-muted-foreground transition-colors hover:text-pulse-cyan"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row">
          <span>
            © 2026 Pulsar Space Logistics. Todos los derechos reservados.
          </span>
          <span>Diseñado para la Ruta de la Seda orbital.</span>
        </div>
      </div>
    </footer>
  );
}
