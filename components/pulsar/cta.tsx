"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Rocket, ArrowRight } from "lucide-react";
import { Reveal } from "./shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const PROFILES = [
  { key: "client", title: "Reserva tu primer kilogramo", sub: "Clientes" },
  { key: "anchor", title: "Conviértete en cargador ancla", sub: "Empresas" },
  {
    key: "talent",
    title: "Ayúdanos a construir la Ruta de la Seda orbital",
    sub: "Talento",
  },
];

export function CTA() {
  const [profile, setProfile] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const active = PROFILES.find((p) => p.key === profile)!;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Completa nombre y correo para continuar.");
      return;
    }
    toast.success("Solicitud enviada. Te contactaremos pronto. 🚀");
    setName("");
    setEmail("");
    setCompany("");
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-border"
    >
      {/* night sky with distant launch */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.25),transparent_55%)]" />
      {Array.from({ length: 80 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/70"
          style={{
            width: 1.5,
            height: 1.5,
            left: `${(i * 41) % 100}%`,
            top: `${(i * 29) % 100}%`,
            opacity: 0.2 + ((i * 3) % 6) / 10,
          }}
        />
      ))}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-1 -translate-x-1/2 bg-gradient-to-t from-pulse-cyan/70 to-transparent blur-sm" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-28 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-pulse-blue/30 bg-pulse-blue/10 px-3 py-1 text-[13px] text-pulse-cyan">
            <Rocket className="h-3.5 w-3.5" /> Acceso anticipado
          </span>
          <h2
            className="mt-5 text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.2rem,4vw,3.4rem)",
              lineHeight: 1.05,
              fontWeight: 600,
            }}
          >
            {active.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="text-pulse-cyan">
              {active.title.split(" ").slice(-1)}
            </span>
          </h2>
          <p className="mt-5 max-w-md text-[16px] text-muted-foreground">
            Empieza hoy en el futuro de la logística multiplanetaria. Elige tu
            perfil y solicita acceso.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.key}
                onClick={() => setProfile(p.key)}
                className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${profile === p.key ? "border-pulse-blue bg-pulse-blue/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {p.sub}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={submit}
            className="rounded-2xl border border-pulse-blue/30 bg-space-900/80 p-7 backdrop-blur"
          >
            <div className="text-[13px] uppercase tracking-wide text-muted-foreground">
              Solicita acceso · {active.sub}
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Nombre">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label="Correo">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label="Empresa">
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label="Volumen mensual estimado">
                <Select defaultValue="1-10">
                  <SelectTrigger className="border-border bg-space-950/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1 – 10 t</SelectItem>
                    <SelectItem value="10-100">10 – 100 t</SelectItem>
                    <SelectItem value="100+">100+ t</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button
              type="submit"
              className="mt-6 w-full rounded-full bg-pulse-blue text-white hover:bg-pulse-blue/90"
            >
              Solicitar acceso <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              Sin compromiso. Responderemos en 48 h.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
