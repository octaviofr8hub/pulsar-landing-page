"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Orbit, CalendarClock, type LucideIcon } from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Slider } from "./ui/slider";
import { OrbitDiorama } from "@/components/globe/orbit-diorama";
import { GlobeHint } from "@/components/globe/globe-hint";
import { useLanguage } from "@/components/i18n/use-language";

const YEARS = [2026, 2030, 2032, 2035, 2040];
const WINDOWS = [2026, 2028.2, 2030.3, 2032.5, 2034.6, 2036.8, 2039];

const COPY = {
  es: {
    eyebrow: "Mañana",
    para: "Toda civilización comercia; la multiplanetaria también necesitará manifiestos, aduanas, seguros y última milla… sobre regolito. Los imperios los construyen quienes mueven las mercancías.",
    feats: [
      { label: "Rutas cislunares", val: "En desarrollo" },
      { label: "Ventanas de transferencia a Marte", val: "Cada 26 meses" },
      { label: "Horizonte", val: "2026 → 2040" },
    ],
    hint: "Arrastra para orbitar · zoom",
    marsWindow: "Ventana Marte",
    timeline: "Línea temporal",
    labels: {
      terrestrial: "Red terrestre",
      cislunar: "Rutas cislunares",
      mars: "Marte · cada 26 meses",
    },
  },
  en: {
    eyebrow: "Tomorrow",
    para: "Every civilization trades; the multiplanetary one will also need manifests, customs, insurance and last mile… over regolith. Empires are built by those who move the goods.",
    feats: [
      { label: "Cislunar routes", val: "In development" },
      { label: "Mars transfer windows", val: "Every 26 months" },
      { label: "Horizon", val: "2026 → 2040" },
    ],
    hint: "Drag to orbit · zoom",
    marsWindow: "Mars window",
    timeline: "Timeline",
    labels: {
      terrestrial: "Terrestrial network",
      cislunar: "Cislunar routes",
      mars: "Mars · every 26 months",
    },
  },
} as const;

export function Future() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [year, setYear] = useState(2026);
  // expansion: 0 at 2026 -> 1 at 2040
  const t = (year - 2026) / 14;
  const marsWindow = WINDOWS.reduce((a, b) =>
    Math.abs(b - year) < Math.abs(a - year) ? b : a,
  );

  return (
    <Section id="futuro" className="border-t border-border">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-center">
        <Reveal>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            {lang === "es" ? (
              <>
                La <span className="text-pulse-cyan">Luna</span> y{" "}
                <span className="text-[#e0714a]">Marte.</span>
              </>
            ) : (
              <>
                The <span className="text-pulse-cyan">Moon</span> and{" "}
                <span className="text-[#e0714a]">Mars.</span>
              </>
            )}
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground">{c.para}</p>
          <div className="mt-8 space-y-3 text-[14px]">
            <Feat icon={Globe2} label={c.feats[0].label} val={c.feats[0].val} />
            <Feat icon={Orbit} label={c.feats[1].label} val={c.feats[1].val} />
            <Feat
              icon={CalendarClock}
              label={c.feats[2].label}
              val={c.feats[2].val}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-space-950/70 p-4">
            <div className="relative h-[360px] overflow-hidden rounded-xl bg-[radial-gradient(circle_at_35%_45%,rgba(59,130,246,0.10),transparent_65%)] sm:h-[420px]">
              <OrbitDiorama progress={t} labels={c.labels} />
              <GlobeHint label={c.hint} />
              <motion.div
                className="pointer-events-none absolute right-4 top-4 rounded-full bg-[#e0714a]/20 px-2.5 py-1 text-[12px] text-[#f0a184]"
                animate={{ opacity: t > 0.1 ? 1 : 0.35 }}
              >
                {c.marsWindow} · {marsWindow.toFixed(1).replace(".0", "")}
              </motion.div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[13px] uppercase tracking-wide text-muted-foreground">
                  {c.timeline}
                </span>
                <span
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-pulse-cyan"
                >
                  {year}
                </span>
              </div>
              <Slider
                className="mt-4"
                value={[year]}
                min={2026}
                max={2040}
                step={1}
                onValueChange={(v) => setYear(v[0])}
              />
              <div className="mt-2 flex justify-between text-[12px] text-muted-foreground">
                {YEARS.map((y) => (
                  <span key={y}>{y}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Feat({
  icon: Icon,
  label,
  val,
}: {
  icon: LucideIcon;
  label: string;
  val: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-space-900/50 px-4 py-3">
      <span className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="h-4 w-4 text-pulse-blue" />
        {label}
      </span>
      <span className="text-foreground">{val}</span>
    </div>
  );
}
