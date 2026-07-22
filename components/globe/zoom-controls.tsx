import { Minus, Plus } from "lucide-react";

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

/** Botones +/- de zoom para el globo interactivo (además de rueda y pinch). */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  className = "",
}: ZoomControlsProps) {
  return (
    <div
      className={`absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-full border border-border bg-space-950/70 backdrop-blur ${className}`}
    >
      <button
        type="button"
        aria-label="Acercar"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center text-space-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
      <span className="mx-auto h-px w-5 bg-border" />
      <button
        type="button"
        aria-label="Alejar"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center text-space-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
