import type { MediaRatio, MediaScreen } from "@/types/media";

/** Etiqueta legible de la proporción, p. ej. "3:4". */
export const ratioLabel: Record<MediaRatio, string> = {
  square: "1:1",
  "portrait-3-4": "3:4",
  "portrait-2-3": "2:3",
  "landscape-4-3": "4:3",
  "landscape-16-10": "16:10",
  "video-16-9": "16:9",
  "wide-21-9": "21:9",
};

/**
 * Las 9 pantallas del mockup. Cada `frame` marca dónde vive una imagen
 * generada con IA y con qué resolución conviene generarla. Las pantallas
 * `webgl` son escenas 3D en vivo (no llevan imagen IA).
 */
export const SCREENS: MediaScreen[] = [
  {
    n: "01",
    slug: "hero",
    title: "Hero — Cualquier punto de la Tierra en 90 minutos",
    kind: "webgl",
    note: "Globo terráqueo 3D nocturno interactivo (WebGL) con arcos suborbitales. La imagen de abajo es sólo un respaldo estático opcional para móvil o cuando no hay WebGL.",
    frames: [
      {
        id: "hero-fallback",
        label: "Respaldo del hero",
        caption:
          "Globo terráqueo nocturno con arcos suborbitales luminosos entre puertos; degradado a space-950 por la izquierda para el texto. Sólo si quieres fallback estático.",
        ratio: "wide-21-9",
        width: 2520,
        height: 1080,
        optional: true,
      },
    ],
  },
  {
    n: "02",
    slug: "problema",
    title: "El problema — La velocidad tiene techo",
    kind: "webgl",
    note: "Mapa mundial animado con cuellos de botella (mar Rojo, Panamá) en rojo. Es visualización de datos (SVG/WebGL): no requiere imagen IA.",
    frames: [],
  },
  {
    n: "03",
    slug: "solucion",
    title: "La solución — El salto suborbital",
    kind: "webgl",
    note: "Carrera interactiva barco/avión/Pulsar sobre globo 3D con arco sobre el mar. WebGL + UI: no requiere imagen IA.",
    frames: [],
  },
  {
    n: "04",
    slug: "proceso",
    title: "El viaje de tu paquete — 6 fases",
    kind: "ai-frames",
    note: "Carrusel de 6 cartas, cada una con foto de fondo. La 3ª va destacada (más ancha y con glow). Mantén el sujeto centrado: el recorte es object-cover.",
    frames: [
      {
        id: "proceso-01-reserva",
        label: "01 · Reserva",
        caption:
          "Cliente reservando desde el móvil; app Pulsar en mano, hangar del puerto de fondo. Nocturno, azul.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
      {
        id: "proceso-02-preparacion",
        label: "02 · Preparación",
        caption:
          "Integración horizontal del cohete ya cargado en el hangar del puerto. Luz técnica azul.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
      {
        id: "proceso-03-salida-al-mar",
        label: "03 · Salida al mar",
        caption:
          "Buque semisumergible llevando el cohete 30–60 km mar adentro. Atardecer/nocturno sobre el mar.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
        active: true,
      },
      {
        id: "proceso-04-lanzamiento",
        label: "04 · Carga y lanzamiento",
        caption:
          "Despegue del cohete desde la plataforma en el mar; estela de propulsión, espuma y reflejo en el agua.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
      {
        id: "proceso-05-vuelo-llegada",
        label: "05 · Vuelo y llegada",
        caption:
          "Reentrada del cohete hacia la plataforma destino; cielo nocturno, aduana liberada en vuelo.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
      {
        id: "proceso-06-ultima-milla",
        label: "06 · Última milla",
        caption:
          "Entrega final: repartidor con la caja Pulsar frente a la tienda/cliente. Calle nocturna.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    n: "05",
    slug: "red",
    title: "La red — Puertos espaciales frente a los grandes hubs",
    kind: "ai-frames",
    note: "Globo 3D (WebGL) con nodos. Al pulsar un nodo, el panel muestra una foto de su plataforma. Misma dimensión para las 5; una imagen por nodo.",
    frames: [
      {
        id: "red-nodo-manzanillo",
        label: "Manzanillo · MX",
        caption:
          "Plataforma semisumergible frente a Manzanillo; corredor Pacífico. Resáltalo como hub de nearshoring.",
        ratio: "landscape-16-10",
        width: 1600,
        height: 1000,
      },
      {
        id: "red-nodo-long-beach",
        label: "Long Beach · US",
        caption:
          "Plataforma offshore frente a Long Beach; grúas y pad de lanzamiento, luz azul.",
        ratio: "landscape-16-10",
        width: 1600,
        height: 1000,
      },
      {
        id: "red-nodo-roterdam",
        label: "Róterdam · NL",
        caption:
          "Plataforma offshore frente a Róterdam; mar del Norte, nocturno.",
        ratio: "landscape-16-10",
        width: 1600,
        height: 1000,
      },
      {
        id: "red-nodo-singapur",
        label: "Singapur · SG",
        caption:
          "Plataforma offshore frente a Singapur; skyline al fondo, reflejos en el agua.",
        ratio: "landscape-16-10",
        width: 1600,
        height: 1000,
      },
      {
        id: "red-nodo-veracruz",
        label: "Veracruz · MX",
        caption:
          "Plataforma offshore frente a Veracruz; Golfo de México, amanecer.",
        ratio: "landscape-16-10",
        width: 1600,
        height: 1000,
      },
    ],
  },
  {
    n: "06",
    slug: "flota",
    title: "La flota — Agnósticos al vehículo",
    kind: "ai-frames",
    note: "3 clases de vehículo, cada una con render en hangar. La clase media va seleccionada por defecto. Render sobre fondo oscuro con luz azul inferior.",
    frames: [
      {
        id: "flota-capsula",
        label: "Cápsula · 0,15–1 t",
        caption:
          "Render 3D de cápsula de carga pequeña en hangar oscuro; envíos críticos. Luz azul inferior.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
      {
        id: "flota-clase-media",
        label: "Clase media · 3–10 t",
        caption:
          "Render 3D de cohete clase media en hangar; equilibrio costo-velocidad.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
        active: true,
      },
      {
        id: "flota-clase-pesada",
        label: "Clase pesada · 30–100 t",
        caption:
          "Render 3D de cohete pesado de gran porte en hangar; volumen industrial.",
        ratio: "portrait-3-4",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    n: "08",
    slug: "manana",
    title: "Mañana — La Luna y Marte",
    kind: "webgl",
    note: "Zoom-out interactivo con rutas cislunares y timeline 2026→2040. Diagrama orbital 3D (WebGL); las texturas de Luna/Marte son assets 3D, no marcos IA.",
    frames: [],
  },
  {
    n: "10",
    slug: "plataforma",
    title: "La plataforma digital — Cotizador + Torre de Control",
    kind: "ai-frames",
    note: "El cotizador y el dashboard son UI. La única imagen IA es el render de la caja de carga que flota en el cotizador.",
    frames: [
      {
        id: "plataforma-caja-carga",
        label: "Caja de carga Pulsar",
        caption:
          "Render 3D de contenedor/caja de carga Pulsar; aristas con glow azul, flotando sobre fondo oscuro. Idealmente PNG con transparencia (estudio de producto).",
        ratio: "square",
        width: 1200,
        height: 1200,
      },
    ],
  },
  {
    n: "14",
    slug: "cta",
    title: "CTA final — Reserva tu primer kilogramo",
    kind: "ai-frames",
    note: "Fondo de sección a sangre completa; el formulario va encima a la derecha con un scrim hacia space-950.",
    frames: [
      {
        id: "cta-fondo-lanzamiento",
        label: "Fondo — lanzamiento lejano",
        caption:
          "Cielo nocturno estrellado con un lanzamiento de cohete lejano en el horizonte. Deja espacio limpio a la derecha para el formulario.",
        ratio: "wide-21-9",
        width: 2520,
        height: 1080,
      },
    ],
  },
];

/** Todos los marcos con imagen IA en orden (para la tabla de dimensiones). */
export const ALL_FRAMES = SCREENS.flatMap((screen) =>
  screen.frames.map((frame) => ({ screen, frame })),
);
