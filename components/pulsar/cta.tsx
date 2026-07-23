"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Rocket, ArrowRight } from "lucide-react";
import { Reveal } from "./shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLanguage } from "@/components/i18n/use-language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const COPY = {
  es: {
    profiles: [
      { key: "client", title: "Reserva tu primer kilogramo", sub: "Clientes" },
      {
        key: "anchor",
        title: "Conviértete en cargador ancla",
        sub: "Empresas",
      },
      {
        key: "talent",
        title: "Ayúdanos a construir la Ruta de la Seda orbital",
        sub: "Talento",
      },
    ],
    badge: "Acceso anticipado",
    para: "Empieza hoy en el futuro de la logística multiplanetaria. Elige tu perfil y solicita acceso.",
    requestFor: "Solicita acceso",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo",
    emailPlaceholder: "tu@empresa.com",
    company: "Empresa",
    companyPlaceholder: "Nombre de la empresa",
    volume: "Volumen mensual estimado",
    submit: "Solicitar acceso",
    disclaimer: "Sin compromiso. Responderemos en 48 h.",
    errorToast: "Completa nombre y correo para continuar.",
    successToast: "Solicitud enviada. Te contactaremos pronto. 🚀",
  },
  en: {
    profiles: [
      { key: "client", title: "Book your first kilogram", sub: "Clients" },
      { key: "anchor", title: "Become an anchor shipper", sub: "Enterprises" },
      {
        key: "talent",
        title: "Help us build the orbital Silk Road",
        sub: "Talent",
      },
    ],
    badge: "Early access",
    para: "Start today in the future of multiplanetary logistics. Choose your profile and request access.",
    requestFor: "Request access",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@company.com",
    company: "Company",
    companyPlaceholder: "Company name",
    volume: "Estimated monthly volume",
    submit: "Request access",
    disclaimer: "No commitment. We'll reply within 48 h.",
    errorToast: "Enter name and email to continue.",
    successToast: "Request sent. We'll be in touch soon. 🚀",
  },
} as const;

export function CTA() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [profile, setProfile] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const active = c.profiles.find((p) => p.key === profile) ?? c.profiles[0];
  const words = active.title.split(" ");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error(c.errorToast);
      return;
    }
    toast.success(c.successToast);
    setName("");
    setEmail("");
    setCompany("");
  };

  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-border"
    >
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
            <Rocket className="h-3.5 w-3.5" /> {c.badge}
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
            {words.slice(0, -1).join(" ")}{" "}
            <span className="text-pulse-cyan">{words.slice(-1)}</span>
          </h2>
          <p className="mt-5 max-w-md text-[16px] text-muted-foreground">
            {c.para}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {c.profiles.map((p) => (
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
              {c.requestFor} · {active.sub}
            </div>
            <div className="mt-5 space-y-4">
              <Field label={c.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={c.namePlaceholder}
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label={c.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label={c.company}>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={c.companyPlaceholder}
                  className="border-border bg-space-950/60"
                />
              </Field>
              <Field label={c.volume}>
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
              {c.submit} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              {c.disclaimer}
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
