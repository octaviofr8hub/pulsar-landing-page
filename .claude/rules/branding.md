---
description: Reglas de branding y sistema visual de Pulsar. Siempre activas.
paths: ["**"]
---

# Branding — Pulsar

## Identidad

Pulsar es un Space Freight Forwarder. La marca hace alusión a los pulsares estelares: precisos, potentes y constantes. El tono visual es oscuro, futurista e imponente — inspirado en Blue Origin pero con espíritu de startup.

## Paleta de colores

Usar **siempre** las clases CSS `brand-*` definidas en `app/globals.css`. Nunca hex directos.

| Token        | Uso                                     |
| ------------ | --------------------------------------- |
| `brand-50`   | Fondos de secciones claras (raramente)  |
| `brand-100`  | Bordes sutiles, separadores             |
| `brand-500`  | Color de acento principal (azul pulsar) |
| `brand-600`  | Hover de elementos interactivos         |
| `brand-900`  | Fondo base oscuro (casi negro espacial) |
| `brand-950`  | Fondo más profundo                      |
| `brand-glow` | Efecto glow/halo de pulsar              |

Colores complementarios:

- Fondo principal: `bg-space-950` (negro azulado profundo)
- Texto primario: `text-white`
- Texto secundario: `text-space-400`
- Acento: `text-brand-500` / `bg-brand-500`

## Tipografía

- Fuente principal: **Inter** (sans-serif, cargada en el layout)
- Fuente display (titulares hero): **Space Grotesk** para H1/H2 y cifras grandes
- Fuente de dato: **JetBrains Mono** (`font-mono`) para microetiquetas, numeración y telemetría
- Jerarquía: usa siempre los componentes `Heading`, `Text` y `MonoLabel` de `components/ui/`
- `MonoLabel` es el **único** lugar donde se aplican mayúsculas por CSS: ahí forman parte del sistema tipográfico

## Sistema editorial (cómo se componen los bloques)

La marca **no usa cards**. Un bloque de contenido se define por tipografía y
espacio, no por una caja que lo encierre:

- **Reglas hairline** (`border-t border-space-800`) para separar, en vez de bordes que rodean
- **Microetiqueta mono** arriba (`MonoLabel`), titular display debajo
- **Numeración** `/01 /02 /03` en las listas de argumentos
- **Cifras grandes** en `font-display` como ancla visual del dato
- Para texto sobre la escena 3D: **scrim** (gradiente direccional a `space-950`), nunca un panel de vidrio

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
- Nunca texto en mayúsculas por CSS (`text-transform: uppercase`) fuera de `MonoLabel`
- Nunca usar colores fuera de la escala `brand-*` / `space-*`
- Nunca colores brillantes o saturados que rompan el mood oscuro espacial

### La "card genérica" — el anti-patrón que más se cuela

Esta combinación es la firma de una plantilla autogenerada y **está prohibida**:

```
glass/backdrop-blur + rounded-2xl + border + hover:border-brand-500/50
+ chip de icono (size-11 rounded-xl bg-brand-500/15)
+ grid de 4 cards idénticas
```

El delator más fuerte es el **chip de icono cuadrado con fondo tintado al 15%**.
Si un bloque necesita jerarquía, se la da el tipo y una regla hairline — no una
caja. Iconos: solo cuando aportan significado, nunca como decoración dentro de
un chip.
