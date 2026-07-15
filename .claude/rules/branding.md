---
description: Reglas de branding y sistema visual de Pulsar. Siempre activas.
paths: ["**"]
---

# Branding — Pulsar

## Identidad

Pulsar es un Space Freight Forwarder. La marca hace alusión a los pulsares estelares: precisos, potentes y constantes. El tono visual es oscuro, futurista e imponente — inspirado en Blue Origin pero con espíritu de startup.

## Paleta de colores

Usar **siempre** las clases CSS `brand-*` definidas en `app/globals.css`. Nunca hex directos.

| Token                | Uso                                      |
|----------------------|------------------------------------------|
| `brand-50`           | Fondos de secciones claras (raramente)   |
| `brand-100`          | Bordes sutiles, separadores              |
| `brand-500`          | Color de acento principal (azul pulsar)  |
| `brand-600`          | Hover de elementos interactivos          |
| `brand-900`          | Fondo base oscuro (casi negro espacial)  |
| `brand-950`          | Fondo más profundo                       |
| `brand-glow`         | Efecto glow/halo de pulsar               |

Colores complementarios:
- Fondo principal: `bg-space-950` (negro azulado profundo)
- Texto primario: `text-white`
- Texto secundario: `text-space-400`
- Acento: `text-brand-500` / `bg-brand-500`

## Tipografía

- Fuente principal: **Inter** (sans-serif, cargada en el layout)
- Fuente display (titulares hero): **Space Grotesk** o **Syne** para H1
- Jerarquía: usa siempre los componentes `Heading` y `Text` de `components/ui/`

## Tono de voz

- Confiante, técnico y visionario
- Frases cortas y directas
- Sin exclamaciones exageradas; la potencia viene del concepto, no del copy
- Palabras clave: velocidad, precisión, confianza, futuro, red global

## Iconografía y assets

- Iconos: Lucide React (consistentes, sans-serif, limpios)
- Sin emojis en la UI
- Imágenes: preferir fondos de espacio, cohetes, rutas orbitales sobre globo terrestre

## Anti-patrones (NUNCA)

- Nunca `style={{ color: "#0066ff" }}` — siempre clase `text-brand-500`
- Nunca texto en mayúsculas por CSS (`text-transform: uppercase`) sin que esté en el sistema tipográfico
- Nunca usar colores fuera de la escala `brand-*` / `space-*`
- Nunca colores brillantes o saturados que rompan el mood oscuro espacial
