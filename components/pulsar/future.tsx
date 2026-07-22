"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Orbit, CalendarClock, type LucideIcon } from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Slider } from "./ui/slider";
import { OrbitDiorama } from "@/components/globe/orbit-diorama";
import { GlobeHint } from "@/components/globe/globe-hint";

const YEARS = [2026, 2030, 2032, 2035, 2040];
const WINDOWS = [2026, 2028.2, 2030.3, 2032.5, 2034.6, 2036.8, 2039];

export function Future() {
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
          <Eyebrow>Mañana</Eyebrow>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            La <span className="text-pulse-cyan">Luna</span> y{" "}
            <span className="text-[#e0714a]">Marte.</span>
          </h2>
          <p className="mt-5 text-[16px] text-muted-foreground">
            Toda civilización comercia; la multiplanetaria también necesitará
            manifiestos, aduanas, seguros y última milla… sobre regolito. Los
            imperios los construyen quienes mueven las mercancías.
          </p>
          <div className="mt-8 space-y-3 text-[14px]">
            <Feat icon={Globe2} label="Rutas cislunares" val="En desarrollo" />
            <Feat
              icon={Orbit}
              label="Ventanas de transferencia a Marte"
              val="Cada 26 meses"
            />
            <Feat icon={CalendarClock} label="Horizonte" val="2026 → 2040" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-space-950/70 p-4">
            <div className="relative h-[360px] overflow-hidden rounded-xl bg-[radial-gradient(circle_at_35%_45%,rgba(59,130,246,0.10),transparent_65%)] sm:h-[420px]">
              <OrbitDiorama progress={t} />
              <GlobeHint label="Arrastra para orbitar · zoom" />
              <motion.div
                className="pointer-events-none absolute right-4 top-4 rounded-full bg-[#e0714a]/20 px-2.5 py-1 text-[12px] text-[#f0a184]"
                animate={{ opacity: t > 0.1 ? 1 : 0.35 }}
              >
                Ventana Marte · {marsWindow.toFixed(1).replace(".0", "")}
              </motion.div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[13px] uppercase tracking-wide text-muted-foreground">
                  Línea temporal
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
