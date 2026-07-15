export interface NavSection {
  /** id del <section> correspondiente en app/page.tsx */
  id: string;
  label: string;
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { id: "hero", label: "Inicio" },
  { id: "vision", label: "Visión" },
  { id: "logistics", label: "Logística" },
  { id: "network", label: "Red" },
  { id: "cta", label: "Contacto" },
];
