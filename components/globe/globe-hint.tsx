import { Move3d } from "lucide-react";

export interface GlobeHintProps {
  label?: string;
  className?: string;
}

/**
 * Indicador en esquina que comunica que el globo es manipulable (arrastrar /
 * zoom). Es puramente decorativo: no captura eventos del canvas de abajo.
 */
export function GlobeHint({
  label = "Arrastra para rotar · scroll para zoom",
  className = "",
}: GlobeHintProps) {
  return (
    <div
      className={`pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full border border-border bg-space-950/70 px-3 py-1.5 text-[11px] text-space-200 backdrop-blur ${className}`}
    >
      <Move3d className="h-3.5 w-3.5 text-pulse-cyan" />
      <span>{label}</span>
    </div>
  );
}
