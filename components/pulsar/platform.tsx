"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Section, Reveal, Eyebrow } from "./shared";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const ROUTES = ["MZO → YOK", "LGB → SIN", "NYC → SHA", "TYO → HAM"];

export function Platform() {
  const [mass, setMass] = useState(12);
  const [urgency, setUrgency] = useState(70);
  const [route, setRoute] = useState(0);

  const price = useMemo(() => {
    const base = 1800 + mass * 55 + urgency * 9 + route * 120;
    return base.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [mass, urgency, route]);

  return (
    <Section id="plataforma" className="border-t border-border">
      <Reveal>
        <Eyebrow>La plataforma digital</Eyebrow>
        <h2
          className="mt-5 max-w-2xl text-foreground"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem,3.5vw,3rem)",
            lineHeight: 1.08,
            fontWeight: 600,
          }}
        >
          Reservar un cohete tan fácil como{" "}
          <span className="text-pulse-cyan">pedir un courier.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] text-muted-foreground">
          Cotización en segundos, visibilidad total con IA y gestión por
          excepción.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* quoter */}
          <div className="rounded-2xl border border-pulse-blue/30 bg-gradient-to-b from-space-800 to-space-950 p-6">
            <div className="text-[13px] uppercase tracking-wide text-muted-foreground">
              Cotizador
            </div>
            <Control label="Masa" value={`${mass} t`}>
              <Slider
                value={[mass]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => setMass(v[0])}
              />
            </Control>
            <Control label="Urgencia" value={`${urgency}%`}>
              <Slider
                value={[urgency]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setUrgency(v[0])}
              />
            </Control>
            <div className="mt-5">
              <div className="mb-2 text-[13px] text-muted-foreground">Ruta</div>
              <div className="grid grid-cols-2 gap-2">
                {ROUTES.map((r, i) => (
                  <button
                    key={r}
                    onClick={() => setRoute(i)}
                    className={`rounded-lg border px-3 py-2 text-[13px] transition-colors ${route === i ? "border-pulse-blue bg-pulse-blue/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-pulse-cyan/30 bg-pulse-cyan/10 p-4">
              <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                <span>Precio estimado</span>
                <span className="flex items-center gap-1 text-pulse-cyan">
                  <Zap className="h-3.5 w-3.5" /> en tiempo real
                </span>
              </div>
              <motion.div
                key={price}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-pulse-cyan"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2rem",
                  fontWeight: 600,
                }}
              >
                {price} <span className="text-[16px]">ZYR</span>
              </motion.div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                Entrega estimada: 46 min de vuelo · 11 h puerta a puerta
              </div>
            </div>
          </div>

          {/* control tower dashboard */}
          <div className="rounded-2xl border border-border bg-space-900/60 p-6">
            <Tabs defaultValue="tower">
              <div className="flex items-center justify-between">
                <div
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-foreground"
                >
                  Torre de control
                </div>
                <TabsList className="bg-space-950/60">
                  <TabsTrigger value="tower">Vista general</TabsTrigger>
                  <TabsTrigger value="alerts">Alertas</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tower" className="mt-6">
                <div className="grid grid-cols-3 gap-3">
                  <Score
                    icon={ShieldCheck}
                    label="Readiness"
                    value="96"
                    trend="up"
                  />
                  <Score
                    icon={Activity}
                    label="Risk"
                    value="23"
                    trend="down"
                    tone="good"
                  />
                  <Score
                    icon={HeartPulse}
                    label="Health"
                    value="98"
                    trend="up"
                  />
                </div>
                <div className="mt-4 rounded-xl border border-border bg-space-950/50 p-4">
                  <div className="mb-3 text-[13px] text-muted-foreground">
                    Misiones activas
                  </div>
                  <div className="space-y-2.5">
                    {[
                      {
                        id: "PL-04",
                        route: "MZO → YOK",
                        pct: 72,
                        eta: "26 min",
                      },
                      {
                        id: "PL-11",
                        route: "LGB → SIN",
                        pct: 40,
                        eta: "48 min",
                      },
                      {
                        id: "PL-07",
                        route: "NYC → SHA",
                        pct: 91,
                        eta: "9 min",
                      },
                    ].map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="w-14 text-[13px] text-foreground">
                          {m.id}
                        </span>
                        <span className="w-24 text-[12px] text-muted-foreground">
                          {m.route}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-pulse-cyan"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-[12px] text-pulse-cyan">
                          {m.eta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="mt-6 space-y-3">
                {[
                  {
                    t: "Ventana meteorológica óptima · MZO",
                    d: "Hace 2 min",
                    tone: "good",
                  },
                  {
                    t: "Retraso aduanal resuelto en vuelo · PL-07",
                    d: "Hace 8 min",
                    tone: "good",
                  },
                  {
                    t: "Carga PL-11 verificada y sellada",
                    d: "Hace 14 min",
                    tone: "neutral",
                  },
                ].map((a) => (
                  <div
                    key={a.t}
                    className="flex items-start gap-3 rounded-xl border border-border bg-space-950/50 p-4"
                  >
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${a.tone === "good" ? "bg-pulse-cyan" : "bg-amber"}`}
                    />
                    <div className="flex-1">
                      <div className="text-[14px] text-foreground">{a.t}</div>
                      <div className="text-[12px] text-muted-foreground">
                        {a.d}
                      </div>
                    </div>
                    <MessageCircle className="h-4 w-4 text-pulse-cyan" />
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl border border-pulse-blue/30 bg-pulse-blue/10 p-3 text-[13px] text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-pulse-cyan" />
                  Alertas entregadas al móvil por WhatsApp en tiempo real.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Score({
  icon: Icon,
  label,
  value,
  trend,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: "up" | "down";
  tone?: string;
}) {
  const Trend = trend === "up" ? TrendingUp : TrendingDown;
  const good = tone === "good" ? trend === "down" : true;
  return (
    <div className="rounded-xl border border-border bg-space-950/50 p-4">
      <Icon className="h-4 w-4 text-pulse-blue" />
      <div
        className="mt-2 text-foreground"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem",
          fontWeight: 600,
        }}
      >
        {value}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <Trend
          className={`h-3.5 w-3.5 ${good ? "text-pulse-cyan" : "text-danger"}`}
        />
      </div>
    </div>
  );
}
