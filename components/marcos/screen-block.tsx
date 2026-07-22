import { Heading } from "@/components/ui/heading";
import { MediaFrame } from "@/components/ui/media-frame";
import { MonoLabel } from "@/components/ui/mono-label";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { MediaFrameSpec, MediaScreen } from "@/types/media";

import { ratioLabel } from "./frame-specs";

/** Clases de grid según la proporción dominante y el número de marcos. */
function gridClass(frames: MediaFrameSpec[]): string {
  const ratio = frames[0]?.ratio;
  if (ratio === "wide-21-9" || ratio === "video-16-9") return "grid-cols-1";
  if (ratio === "landscape-16-10" || ratio === "landscape-4-3") {
    return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  }
  if (frames.length >= 5) {
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  }
  if (frames.length === 1) return "grid-cols-1 max-w-sm";
  return "grid-cols-2 sm:grid-cols-3";
}

function FrameFigure({ frame }: { frame: MediaFrameSpec }) {
  const spec = `${frame.width} × ${frame.height}`;
  return (
    <figure>
      <MediaFrame
        ratio={frame.ratio}
        label={frame.label}
        spec={spec}
        active={frame.active}
      />
      <figcaption className="mt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-space-300">
            {spec} px · {ratioLabel[frame.ratio]}
          </span>
          {frame.optional ? <MonoLabel tone="muted">opcional</MonoLabel> : null}
        </div>
        <span className="mt-1 block font-mono text-[0.6875rem] text-space-500">
          {frame.id}
        </span>
        <Text size="xs" tone="muted" className="mt-2">
          {frame.caption}
        </Text>
      </figcaption>
    </figure>
  );
}

export function ScreenBlock({ screen }: { screen: MediaScreen }) {
  const aiCount = screen.frames.filter((frame) => !frame.optional).length;
  const badge =
    screen.kind === "webgl" && aiCount === 0
      ? "Escena 3D · sin imagen IA"
      : `${aiCount} ${aiCount === 1 ? "imagen IA" : "imágenes IA"}`;

  return (
    <section className="border-t border-space-800 py-14">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <MonoLabel tone="accent">Pantalla {screen.n}</MonoLabel>
        <MonoLabel tone="muted">{badge}</MonoLabel>
      </div>
      <Heading as="h2" level={3} className="mt-3">
        {screen.title}
      </Heading>
      {screen.note ? (
        <Text size="sm" tone="secondary" className="mt-3 max-w-3xl">
          {screen.note}
        </Text>
      ) : null}

      {screen.frames.length > 0 ? (
        <div className={cn("mt-8 grid gap-5", gridClass(screen.frames))}>
          {screen.frames.map((frame) => (
            <FrameFigure key={frame.id} frame={frame} />
          ))}
        </div>
      ) : (
        <div className="mt-6 border-l border-space-800 pl-4">
          <Text size="sm" tone="muted">
            No lleva imagen generada con IA: se resuelve en vivo con la escena
            3D / UI.
          </Text>
        </div>
      )}
    </section>
  );
}
