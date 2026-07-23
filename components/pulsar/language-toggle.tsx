"use client";

import { useEffect } from "react";
import { Languages } from "lucide-react";
import { useLanguage, type Lang } from "@/components/i18n/use-language";

const LABELS: Record<Lang, string> = { es: "ES", en: "EN" };

/** Interruptor de idioma ES/EN para la barra de navegación. */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  // Sincroniza el atributo lang del documento (accesibilidad / SEO).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div
      role="group"
      aria-label={lang === "es" ? "Idioma" : "Language"}
      className="flex items-center gap-0.5 rounded-full border border-border bg-white/5 p-0.5"
    >
      <Languages className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
      {(Object.keys(LABELS) as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2 py-1 text-[12px] transition-colors ${
            lang === l
              ? "bg-pulse-blue text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
