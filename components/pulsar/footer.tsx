"use client";

import { useLanguage } from "@/components/i18n/use-language";
import { PulsarLogo } from "@/components/ui/pulsar-mark";
import { Stagger, StaggerItem } from "./motion";

const COPY = {
  es: {
    cols: [
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
      {
        title: "Legal",
        links: ["Términos", "Privacidad", "Aduanas", "Seguridad"],
      },
    ],
    desc: "La logística de la civilización multiplanetaria. Cualquier punto de la Tierra en 90 minutos.",
    rights: "© 2026 Pulsar Space Logistics. Todos los derechos reservados.",
    tagline: "Diseñado para la Ruta de la Seda orbital.",
  },
  en: {
    cols: [
      {
        title: "Product",
        links: ["Quoter", "Control tower", "API", "Pricing"],
      },
      {
        title: "Network",
        links: ["Spaceports", "Corridors", "Fleet", "Coverage"],
      },
      {
        title: "Company",
        links: ["About Pulsar", "Nearshoring", "Press", "Careers"],
      },
      { title: "Legal", links: ["Terms", "Privacy", "Customs", "Security"] },
    ],
    desc: "Logistics for a multiplanetary civilization. Anywhere on Earth in 90 minutes.",
    rights: "© 2026 Pulsar Space Logistics. All rights reserved.",
    tagline: "Designed for the orbital Silk Road.",
  },
} as const;

export function Footer() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <footer className="border-t border-border bg-space-950">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 lg:px-14">
        {/* En móvil las cuatro columnas de enlaces van a dos, con el bloque de
            marca a todo el ancho: apiladas, el pie medía más que una sección. */}
        <Stagger
          className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.5fr_repeat(4,1fr)] md:gap-x-10"
          gap={0.07}
        >
          <StaggerItem distance={16} className="col-span-2 md:col-span-1">
            <PulsarLogo size="sm" />
            <p className="mt-4 max-w-xs text-[14px] text-muted-foreground">
              {c.desc}
            </p>
          </StaggerItem>
          {c.cols.map((col) => (
            <StaggerItem key={col.title} distance={16}>
              <div className="text-[13px] text-foreground">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
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
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row">
          <span>{c.rights}</span>
          <span>{c.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
