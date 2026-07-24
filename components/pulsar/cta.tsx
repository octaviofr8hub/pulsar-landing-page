"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  Globe,
  Lock,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
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

const PROFILE_ICONS: Record<string, LucideIcon> = {
  client: Rocket,
  anchor: Building2,
  talent: Sparkles,
};

const STAT_ICONS: LucideIcon[] = [Globe, ShieldCheck, Package, ShieldCheck];

/** Grano procedural (SVG feTurbulence) para romper el banding de los degradados
 *  oscuros — self-contained, sin assets externos. */
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const COPY = {
  es: {
    profiles: [
      {
        key: "client",
        title: "Reserva tu primer kilogramo",
        desc: "Para importadores y e-commerce premium que quieren empezar hoy.",
      },
      {
        key: "anchor",
        title: "Conviértete en cargador ancla",
        desc: "Soluciones a medida para empresas que mueven el mundo.",
      },
      {
        key: "talent",
        title: "Ayúdanos a construir la Ruta de la Seda orbital",
        desc: "Únete al talento que está haciendo posible lo imposible.",
      },
    ],
    subtitle: "Empieza hoy el futuro de la logística multiplanetaria.",
    formTitle: "Solicita acceso anticipado",
    formSub:
      "Completa el formulario y nuestro equipo se pondrá en contacto contigo.",
    name: "Nombre",
    namePlaceholder: "Tu nombre completo",
    email: "Correo",
    emailPlaceholder: "tu@empresa.com",
    company: "Empresa",
    companyPlaceholder: "Nombre de tu empresa",
    interest: "Interés",
    interestPlaceholder: "Selecciona una opción",
    interestOptions: [
      "Reservar capacidad",
      "Alianza empresarial (cargador ancla)",
      "Unirme al equipo",
      "Inversión / prensa",
    ],
    submit: "Solicitar acceso",
    secure: "Tu información está segura con nosotros.",
    stats: [
      { label: "Red global", value: "24/7", sub: "operativa" },
      {
        label: "Entregas suborbitales",
        value: "< 90 min",
        sub: "entre puertos clave",
      },
      {
        label: "Capacidad flexible",
        value: "Bajo demanda",
        sub: "sin compromisos a largo plazo",
      },
      { label: "Confiabilidad", value: "99.9%", sub: "SLA garantizado" },
    ],
    errorToast: "Completa nombre y correo para continuar.",
    successToast: "Solicitud enviada. Te contactaremos pronto. 🚀",
  },
  en: {
    profiles: [
      {
        key: "client",
        title: "Book your first kilogram",
        desc: "For premium importers and e-commerce ready to start today.",
      },
      {
        key: "anchor",
        title: "Become an anchor shipper",
        desc: "Tailored solutions for enterprises that move the world.",
      },
      {
        key: "talent",
        title: "Help us build the orbital Silk Road",
        desc: "Join the talent making the impossible possible.",
      },
    ],
    subtitle: "Start today in the future of multiplanetary logistics.",
    formTitle: "Request early access",
    formSub: "Fill out the form and our team will get in touch with you.",
    name: "Name",
    namePlaceholder: "Your full name",
    email: "Email",
    emailPlaceholder: "you@company.com",
    company: "Company",
    companyPlaceholder: "Your company name",
    interest: "Interest",
    interestPlaceholder: "Select an option",
    interestOptions: [
      "Book capacity",
      "Enterprise partnership (anchor shipper)",
      "Join the team",
      "Investment / press",
    ],
    submit: "Request access",
    secure: "Your information is safe with us.",
    stats: [
      { label: "Global network", value: "24/7", sub: "operational" },
      {
        label: "Suborbital deliveries",
        value: "< 90 min",
        sub: "between key ports",
      },
      {
        label: "Flexible capacity",
        value: "On demand",
        sub: "no long-term commitment",
      },
      { label: "Reliability", value: "99.9%", sub: "guaranteed SLA" },
    ],
    errorToast: "Enter name and email to continue.",
    successToast: "Request sent. We'll be in touch soon. 🚀",
  },
} as const;

export function CTA() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const [active, setActive] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [interest, setInterest] = useState("");
  const [bgFailed, setBgFailed] = useState(false);

  const activeProfile =
    c.profiles.find((p) => p.key === active) ?? c.profiles[0];
  const others = c.profiles.filter((p) => p.key !== active);
  const words = activeProfile.title.split(" ");

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
      {/* fondo: cohete despegando (deja public/cta/launch.jpg).
          Sin imagen → respaldo de cielo estrellado. */}
      {bgFailed ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.22),transparent_55%)]" />
          {Array.from({ length: 70 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/70"
              style={{
                width: 1.5,
                height: 1.5,
                left: `${(i * 41) % 100}%`,
                top: `${(i * 29) % 100}%`,
                opacity: 0.15 + ((i * 3) % 6) / 12,
              }}
            />
          ))}
        </>
      ) : (
        <Image
          src="/cta/launch.jpg"
          alt=""
          fill
          sizes="100vw"
          onError={() => setBgFailed(true)}
          className="object-cover"
        />
      )}

      {/* scrims de legibilidad: oscurecen izquierda (texto) y abajo (métricas)
          dejando ver la imagen al centro/derecha */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/55 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/15 to-transparent" />

      {/* grano sutil anti-banding */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-soft-light"
        style={{ backgroundImage: NOISE_BG }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <h2
              className="text-foreground"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem,4.5vw,3.8rem)",
                lineHeight: 1.02,
                fontWeight: 600,
              }}
            >
              {words.slice(0, -1).join(" ")}{" "}
              <span className="text-pulse-blue">{words.slice(-1)}.</span>
            </h2>
            <p className="mt-5 max-w-md text-[17px] text-muted-foreground">
              {c.subtitle}
            </p>

            <div className="mt-8 border-t border-border">
              {others.map((p) => {
                const Icon = PROFILE_ICONS[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActive(p.key)}
                    className="group flex w-full items-center gap-4 border-b border-border py-5 text-left"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-pulse-blue/30 text-pulse-cyan">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span
                        className="block text-foreground"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.15rem",
                          fontWeight: 600,
                        }}
                      >
                        {p.title}
                      </span>
                      <span className="mt-0.5 block max-w-sm text-[14px] text-muted-foreground">
                        {p.desc}
                      </span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-pulse-cyan" />
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form
              onSubmit={submit}
              className="rounded-2xl border border-border bg-space-900/70 p-7 backdrop-blur-xl"
            >
              <div
                className="text-foreground"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                }}
              >
                {c.formTitle}
              </div>
              <p className="mt-2 text-[14px] text-muted-foreground">
                {c.formSub}
              </p>
              <div className="mt-6 space-y-4">
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
                <Field label={c.interest}>
                  <Select value={interest} onValueChange={setInterest}>
                    <SelectTrigger className="border-border bg-space-950/60">
                      <SelectValue placeholder={c.interestPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {c.interestOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
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
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> {c.secure}
              </p>
            </form>
          </Reveal>
        </div>

        {/* franja de métricas */}
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-10 md:grid-cols-4">
          {c.stats.map((s, i) => {
            const Icon = STAT_ICONS[i];
            return (
              <div key={s.label} className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-pulse-cyan">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[12px] text-muted-foreground">
                    {s.label}
                  </div>
                  <div
                    className="text-foreground"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.4rem",
                      fontWeight: 600,
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
