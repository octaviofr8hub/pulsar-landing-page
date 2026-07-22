import type { Metadata } from "next";

import { ALL_FRAMES, SCREENS } from "@/components/marcos/frame-specs";
import { ScreenBlock } from "@/components/marcos/screen-block";
import { Heading } from "@/components/ui/heading";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";

export const metadata: Metadata = {
  title: "Marcos de imagen — Pulsar",
  description:
    "Referencia de los marcos de imagen del mockup: dónde va cada imagen generada con IA y con qué dimensiones generarla.",
};

export default function MarcosPage() {
  const coreCount = ALL_FRAMES.filter(({ frame }) => !frame.optional).length;
  const optionalCount = ALL_FRAMES.filter(({ frame }) => frame.optional).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24">
      <MonoLabel tone="accent">Referencia · Mock-up</MonoLabel>
      <Heading as="h1" level={1} className="mt-4">
        Marcos de imagen
      </Heading>
      <Text size="lg" className="mt-6 max-w-2xl">
        Cada marco es el hueco donde vive una imagen generada con IA. Están
        vacíos a propósito: genera las imágenes con las dimensiones indicadas y
        colócalas en <span className="font-mono text-space-300">/public</span>.
      </Text>

      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-space-800 bg-space-800 sm:grid-cols-4">
        {[
          { k: "Imágenes IA", v: String(coreCount) },
          { k: "Opcionales", v: String(optionalCount) },
          { k: "Pantallas", v: String(SCREENS.length) },
          { k: "Formato", v: "JPG · PNG" },
        ].map((stat) => (
          <div key={stat.k} className="bg-space-950 px-5 py-6">
            <MonoLabel tone="muted">{stat.k}</MonoLabel>
            <div className="mt-2 font-display text-3xl font-semibold text-white">
              {stat.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-3xl border-l border-space-800 pl-4">
        <Text size="sm" tone="muted">
          Las medidas son de <span className="text-space-300">generación</span>{" "}
          (≈2× el display, para pantallas retina). El recorte es{" "}
          <span className="font-mono text-space-300">object-cover</span>: mantén
          el sujeto centrado. Usa JPG para fotos y PNG para renders con
          transparencia (la caja de carga). El marco con borde azul es el estado{" "}
          <span className="text-brand-400">activo/seleccionado</span>.
        </Text>
      </div>

      <div className="mt-8">
        {SCREENS.map((screen) => (
          <ScreenBlock key={screen.slug} screen={screen} />
        ))}
      </div>
    </main>
  );
}
