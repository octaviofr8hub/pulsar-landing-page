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
import { useLanguage } from "@/components/i18n/use-language";

const ROUTES = ["MZO → YOK", "LGB → SIN", "NYC → SHA", "TYO → HAM"];

const MISSIONS = [
  { id: "PL-04", route: "MZO → YOK", pct: 72, eta: "26 min" },
  { id: "PL-11", route: "LGB → SIN", pct: 40, eta: "48 min" },
  { id: "PL-07", route: "NYC → SHA", pct: 91, eta: "9 min" },
];

const COPY = {
  es: {
    eyebrow: "La plataforma digital",
    h2Lead: "Reservar un cohete tan fácil como ",
    h2Accent: "pedir un courier.",
    para: "Cotización en segundos, visibilidad total con IA y gestión por excepción.",
    quoter: "Cotizador",
    mass: "Masa",
    urgency: "Urgencia",
    route: "Ruta",
    estPrice: "Precio estimado",
    realtime: "en tiempo real",
    delivery: "Entrega estimada: 46 min de vuelo · 11 h puerta a puerta",
    tower: "Torre de control",
    tabOverview: "Vista general",
    tabAlerts: "Alertas",
    readiness: "Preparación",
    risk: "Riesgo",
    health: "Salud",
    activeMissions: "Misiones activas",
    alerts: [
      {
        text: "Ventana meteorológica óptima · MZO",
        time: "Hace 2 min",
        good: true,
      },
      {
        text: "Retraso aduanal resuelto en vuelo · PL-07",
        time: "Hace 8 min",
        good: true,
      },
      {
        text: "Carga PL-11 verificada y sellada",
        time: "Hace 14 min",
        good: false,
      },
    ],
    whatsapp: "Alertas entregadas al móvil por WhatsApp en tiempo real.",
  },
  en: {
    eyebrow: "The digital platform",
    h2Lead: "Booking a rocket as easy as ",
    h2Accent: "ordering a courier.",
    para: "Quote in seconds, full AI visibility and management by exception.",
    quoter: "Quoter",
    mass: "Mass",
    urgency: "Urgency",
    route: "Route",
    estPrice: "Estimated price",
    realtime: "real time",
    delivery: "Estimated delivery: 46 min flight · 11 h door-to-door",
    tower: "Control tower",
    tabOverview: "Overview",
    tabAlerts: "Alerts",
    readiness: "Readiness",
    risk: "Risk",
    health: "Health",
    activeMissions: "Active missions",
    alerts: [
      { text: "Optimal weather window · MZO", time: "2 min ago", good: true },
      {
        text: "Customs delay resolved in flight · PL-07",
        time: "8 min ago",
        good: true,
      },
      {
        text: "Cargo PL-11 verified and sealed",
        time: "14 min ago",
        good: false,
      },
    ],
    whatsapp: "Alerts delivered to your phone via WhatsApp in real time.",
  },
} as const;

export function Platform() {
  const { lang } = useLanguage();
  const c = COPY[lang];
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
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h2
          className="mt-5 max-w-2xl text-foreground"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem,3.5vw,3rem)",
            lineHeight: 1.08,
            fontWeight: 600,
          }}
        >
          {c.h2Lead}
          <span className="text-pulse-cyan">{c.h2Accent}</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] text-muted-foreground">
          {c.para}
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* quoter */}
          <div className="rounded-2xl border border-pulse-blue/30 bg-gradient-to-b from-space-800 to-space-950 p-6">
            <div className="text-[13px] uppercase tracking-wide text-muted-foreground">
              {c.quoter}
            </div>
            <Control label={c.mass} value={`${mass} t`}>
              <Slider
                value={[mass]}
                min={1}
                max={100}
                step={1}
                onValueChange={(v) => setMass(v[0])}
              />
            </Control>
            <Control label={c.urgency} value={`${urgency}%`}>
              <Slider
                value={[urgency]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setUrgency(v[0])}
              />
            </Control>
            <div className="mt-5">
              <div className="mb-2 text-[13px] text-muted-foreground">
                {c.route}
              </div>
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
                <span>{c.estPrice}</span>
                <span className="flex items-center gap-1 text-pulse-cyan">
                  <Zap className="h-3.5 w-3.5" /> {c.realtime}
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
                {c.delivery}
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
                  {c.tower}
                </div>
                <TabsList className="bg-space-950/60">
                  <TabsTrigger value="tower">{c.tabOverview}</TabsTrigger>
                  <TabsTrigger value="alerts">{c.tabAlerts}</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tower" className="mt-6">
                <div className="grid grid-cols-3 gap-3">
                  <Score
                    icon={ShieldCheck}
                    label={c.readiness}
                    value="96"
                    trend="up"
                  />
                  <Score
                    icon={Activity}
                    label={c.risk}
                    value="23"
                    trend="down"
                    tone="good"
                  />
                  <Score
                    icon={HeartPulse}
                    label={c.health}
                    value="98"
                    trend="up"
                  />
                </div>
                <div className="mt-4 rounded-xl border border-border bg-space-950/50 p-4">
                  <div className="mb-3 text-[13px] text-muted-foreground">
                    {c.activeMissions}
                  </div>
                  <div className="space-y-2.5">
                    {MISSIONS.map((m) => (
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
                {c.alerts.map((a) => (
                  <div
                    key={a.text}
                    className="flex items-start gap-3 rounded-xl border border-border bg-space-950/50 p-4"
                  >
                    <span
                      className={`mt-1 h-2 w-2 rounded-full ${a.good ? "bg-pulse-cyan" : "bg-amber"}`}
                    />
                    <div className="flex-1">
                      <div className="text-[14px] text-foreground">
                        {a.text}
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        {a.time}
                      </div>
                    </div>
                    <MessageCircle className="h-4 w-4 text-pulse-cyan" />
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl border border-pulse-blue/30 bg-pulse-blue/10 p-3 text-[13px] text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-pulse-cyan" />
                  {c.whatsapp}
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
