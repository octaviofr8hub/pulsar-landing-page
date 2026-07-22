"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Slider } from "./ui/slider";

const CLASSES = [
  {
    key: "capsule",
    name: "Cápsula",
    range: "0,15 – 1 t",
    desc: "Muestras, repuestos críticos, farma en frío.",
    max: 1,
    scale: 0.55,
  },
  {
    key: "medium",
    name: "Clase media",
    range: "3 – 10 t",
    desc: "E-commerce urgente, electrónica, componentes.",
    max: 10,
    scale: 0.78,
  },
  {
    key: "heavy",
    name: "Clase pesada",
    range: "30 – 100 t",
    desc: "Maquinaria, contenedores, carga estratégica.",
    max: 100,
    scale: 1,
  },
];

export function Fleet() {
  const [mass, setMass] = useState(8); // tons

  const recommended = mass <= 1 ? 0 : mass <= 10 ? 1 : 2;

  return (
    <Section id="flota" className="border-t border-border">
      <Reveal>
        <Eyebrow>La flota</Eyebrow>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2
            className="max-w-xl text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,3.5vw,3rem)",
              lineHeight: 1.08,
              fontWeight: 600,
            }}
          >
            Agnósticos al <span className="text-pulse-cyan">vehículo.</span>
          </h2>
          <p className="max-w-md text-[16px] text-muted-foreground">
            No fabricamos cohetes: contratamos los mejores. Cada kilo vuela en
            la unidad más eficiente, y tu carga nunca depende de un solo
            proveedor.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CLASSES.map((c, i) => {
            const on = i === recommended;
            return (
              <motion.div
                key={c.key}
                animate={{
                  borderColor: on
                    ? "rgba(56,189,248,0.6)"
                    : "rgba(120,145,200,0.14)",
                  scale: on ? 1.02 : 1,
                }}
                className="relative flex flex-col items-center overflow-hidden rounded-2xl border bg-gradient-to-b from-space-800 to-space-950 p-8"
              >
                {on && (
                  <span className="absolute right-4 top-4 rounded-full bg-pulse-cyan/20 px-2.5 py-1 text-[11px] text-pulse-cyan">
                    Recomendado
                  </span>
                )}
                <div className="flex h-44 items-end justify-center">
                  <motion.div
                    animate={{ height: `${c.scale * 160}px` }}
                    className="flex w-10 flex-col items-center justify-end"
                  >
                    <div
                      className="h-0 w-0 border-x-[20px] border-b-[26px] border-x-transparent"
                      style={{ borderBottomColor: on ? "#38bdf8" : "#60a5fa" }}
                    />
                    <div className="w-10 flex-1 rounded-b bg-gradient-to-b from-slate-200 to-slate-500" />
                    <div className="flex gap-1">
                      <div className="h-4 w-2 -skew-x-12 bg-slate-600" />
                      <div className="h-4 w-2 skew-x-12 bg-slate-600" />
                    </div>
                    {on && (
                      <Rocket className="mt-1 h-4 w-4 animate-pulse text-pulse-cyan" />
                    )}
                  </motion.div>
                </div>
                <h3
                  className="mt-4 text-foreground"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 600,
                  }}
                >
                  {c.name}
                </h3>
                <div className="text-pulse-cyan">{c.range}</div>
                <p className="mt-2 text-center text-[14px] text-muted-foreground">
                  {c.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-space-900/60 p-6">
          <div className="flex items-center justify-between">
            <span className="text-[13px] uppercase tracking-wide text-muted-foreground">
              Masa / urgencia de tu envío
            </span>
            <span
              style={{ fontFamily: "var(--font-display)" }}
              className="text-pulse-cyan"
            >
              {mass} t
            </span>
          </div>
          <Slider
            className="mt-5"
            value={[mass]}
            min={0.15}
            max={100}
            step={0.15}
            onValueChange={(v) => setMass(Number(v[0].toFixed(2)))}
          />
          <div className="mt-2 flex justify-between text-[12px] text-muted-foreground">
            <span>0,15 t</span>
            <span>100 t</span>
          </div>
          <p className="mt-4 text-[14px] text-muted-foreground">
            Recomendación óptima:{" "}
            <span className="text-foreground">{CLASSES[recommended].name}</span>{" "}
            ({CLASSES[recommended].range}).
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
