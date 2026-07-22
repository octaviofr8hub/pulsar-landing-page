# Prompt — Implementar el mockup de Pulsar en la página principal

> Pégale esto a un agente de Claude Code trabajando dentro de este repo.
> Es un brief autocontenido: tiene todo el copy, las interacciones y las
> dimensiones. Aun así, el agente **debe** leer los archivos que se indican.

---

## 0. Tu misión (TL;DR)

Reconstruye la **página principal (`/`)** de Pulsar para que siga el mockup
`mockup/Mock-up.pdf` (9 pantallas) como un **scroll-telling interactivo tipo
videojuego**, incluyendo un **calculador de precios ficticio**.

Reglas duras de esta tarea:

1. **Todo va en `/`** (`app/page.tsx`). No dejes las secciones en rutas aparte.
2. **Elimina la animación del cohete.** El hero del mockup es un **globo 3D**,
   no el cohete. Retira `components/scene/*`, `lib/scene-phase.ts` y el
   `<Scene3D />` de `app/page.tsx`. Reutiliza/expande el **globo que ya existe**
   en `components/network/*` para el hero y la red.
3. **Adáptate a lo que ya existe** (mismos tokens, primitivas y convenciones).
   No reinventes el sistema de diseño.
4. **Reutiliza el sistema de marcos ya construido** (`MediaFrame`) para cada
   hueco de imagen. Las imágenes las genera el dueño del repo; tú dejas los
   marcos vacíos listos.
5. **Implementa las interacciones**, no solo el layout estático.

Antes de escribir una línea, **lee** en este orden:
`mockup/Mock-up.pdf` (Read, pages "1-9") → `CLAUDE.md` → `AGENTS.md` →
`.claude/rules/branding.md` → `.claude/rules/estructura.md` →
`.claude/rules/negocio.md` → `components/ui/media-frame.tsx` →
`components/marcos/frame-specs.ts`.

---

## 1. Contexto del proyecto

Pulsar es un **Space Freight Forwarder**: mueve carga de alto valor entre hubs
globales con cohetes reutilizables (y, a futuro, la Luna y Marte). El tono es
oscuro, futurista, preciso — inspirado en Blue Origin con carácter de startup.
El nuevo concepto de la landing es un **recorrido narrativo interactivo** (tipo
videojuego) que termina en un **producto real: la plataforma/cotizador**.

**Stack** (respétalo): Next.js 16 (App Router) · React 19 + TS · Tailwind v4 ·
Radix UI · CVA + clsx + tailwind-merge (`cn()`) · TanStack Query · Framer Motion
· Lucide (iconos) · React Three Fiber + drei (3D).

---

## 2. Lo que YA existe (reutiliza / adapta / elimina)

**Primitivas UI (reutiliza tal cual):** `components/ui/`

- `heading.tsx` (`<Heading level={1|2|3}>`), `text.tsx` (`<Text size tone>`),
  `mono-label.tsx` (`<MonoLabel>` — **único** lugar con mayúsculas por CSS),
  `button.tsx` (variant primary|secondary|ghost, `asChild`),
  `split-text.tsx`, `wordmark.tsx`.
- `media-frame.tsx` → **el marco de imagen** (ver §7).

**Datos de marcos (reutiliza):** `components/marcos/frame-specs.ts` y
`types/media.ts`. La ruta `/marcos` (`app/marcos/page.tsx`) es una **referencia
visual** de todos los marcos con sus medidas — puedes dejarla como está o
borrarla al final; no es parte del home.

**Globo 3D (reutiliza/expande):** `components/network/` ya tiene
`globe.tsx`, `network-canvas.tsx`, `network-scene.tsx`, `orbital-route.tsx`,
`route-panel.tsx`, `routes.ts`, `country-lines.tsx`. Es tu punto de partida para
el globo del hero (P.01) y de la red (P.05).

**Secciones existentes (adapta al nuevo copy/mockup o reemplaza):**
`components/hero/hero-section.tsx`, `vision/`, `logistics/`, `cta/`,
`nav/site-nav.tsx` + `nav/sections.ts`.

**ELIMINA (animación del cohete):** `components/scene/*`
(`scene-3d.tsx`, `scene-canvas.tsx`, `scene-contents.tsx`, `camera-rig.tsx`,
`scene-lights.tsx`, `star-field.tsx`, `landing-pad.tsx`, `rocket-model.tsx`,
`rocket-shape.tsx`, `scene-fallback.tsx`, `scene-error-boundary.tsx`,
`palette.ts`) y `lib/scene-phase.ts`. Quita `<Scene3D />` de `app/page.tsx`.
Antes de borrar, revisa que nada más los importe (grep) y reubica lo que sirva
(p. ej. `star-field` puede reciclarse como fondo estrellado de secciones).

---

## 3. Reglas innegociables

**De AGENTS.md:** esta versión de Next.js tiene breaking changes. **Lee la guía
en `node_modules/next/dist/docs/` antes de usar cualquier API.** En particular
para imágenes: usa `preload` (NO `priority`, deprecado en v16); `fill` requiere
padre `position: relative`; `object-fit` por clase (`object-cover`), nunca por
`style`; no pases `quality` custom sin configurar `images.qualities`.

**De CLAUDE.md / rules:**

- Sin `any`. Sin `default export` en componentes (las `page.tsx`/`layout.tsx` de
  rutas SÍ lo llevan, eso es correcto). Sin estilos inline (`style={{}}`).
- Colores **solo** con clases `brand-*` / `space-*` (+ modificadores de opacidad
  `/xx`). Nunca hex directos. `text-white`/`text-space-*` para texto.
- Mayúsculas por CSS **solo** dentro de `MonoLabel`.
- Archivos `kebab-case.tsx`; componentes/tipos `PascalCase`; funciones `camelCase`.
- Named exports. Tipos compartidos en `types/`, no dentro de componentes.
- `app/` solo rutas/layouts, cero lógica de negocio → delega a `components/`.
- `lib/` solo funciones puras. Sin fetch directo en componentes → hooks de
  TanStack Query. (El cotizador es cálculo local puro, ver §6.)
- Respeta `prefers-reduced-motion` en toda animación (usa
  `useReducedMotion()` de Framer Motion, como ya hacen las secciones actuales).

**Tensión de branding a resolver:** `branding.md` dice _"la marca NO usa cards"_,
pero el mockup **sí** usa cartas (P.04 proceso, P.06 flota, panel P.05, cotizador
P.10). El **mockup es la nueva fuente de verdad**: usa cartas, pero **evita el
anti-patrón de "card genérica"** (nada de `glass/backdrop-blur + rounded-2xl +
chip de icono cuadrado con `bg-brand-500/15`). Las cartas del mockup son oscuras,
cinematográficas, con foto de fondo y borde hairline + acento azul en la activa.
Sugiere al dueño actualizar `branding.md` para reflejar esto (deja una nota, no
lo cambies sin permiso).

---

## 4. Orden de secciones en `/`

Sigue el orden del mockup (los números son los del PDF):

`Nav` → `01 Hero` → `02 Problema` → `03 Solución/Carrera` → `04 Proceso (6 fases)`
→ `05 Red/Nodos` → `06 Flota` → `08 Mañana (Luna y Marte)` → `10 Plataforma
(Cotizador + Torre de Control)` → `14 CTA final`.

**Nav (todas las pantallas):** logo `Pulsar` + links **Soluciones · Red global ·
Tecnología · Empresa · Recursos** + **Iniciar sesión** + botón **Reserva
capacidad**. Adapta `components/nav/site-nav.tsx`. Usa `@radix-ui/react-navigation-menu`
(ya instalado) para los dropdowns.

---

## 5. Las 9 pantallas — copy, interacción y marcos

> El copy va literal. "Marcos" = ids de `frame-specs.ts` (usa `MediaFrame`).
> "WebGL" = escena 3D. "UI" = componentes interactivos, sin imagen IA.

### 01 · Hero — WebGL (globo)

- **H1:** «Cualquier punto de la Tierra en 90 minutos. La Luna en días. Marte,
  cuando estés listo.» **Sub:** «Pulsar: la logística de la civilización
  multiplanetaria.» **CTAs:** `Reserva capacidad` / `Mira cómo funciona`.
- **Visual:** globo 3D nocturno interactivo; arcos suborbitales luminosos entre
  puertos (Manzanillo–Yokohama, Long Beach–Singapur, New York–Shanghái,
  Tokyo–Hamburgo). Al hacer scroll la cámara se aleja y un arco se extiende a la
  **Luna** (3–5 días) y otro punteado a **Marte** (4–6 meses).
- **Stat tiles (hairline, no cards):** `Red global · 24/7` · `Entregas
suborbitales · <90 MIN` · `Confiabilidad · 99.9%` · `Capacidad flexible · bajo
demanda`.
- **Marco:** `hero-fallback` (opcional, respaldo estático móvil/no-WebGL).
- **Interacción:** arrastrar para rotar; scroll extiende arcos Luna/Marte.

### 02 · El problema — WebGL/data-viz

- **H2:** «La velocidad tiene techo. La geopolítica cobra peaje.» **Body:** «El
  comercio lleva 50 años sin acelerar: los aviones no pueden volar más rápido y
  las rutas cruzan estrechos que otros pueden cerrar. **El espacio no tiene
  estrechos.**»
- **Visual:** mapa mundial animado; un buque tarda 35 días y se desvía por el
  cabo de Buena Esperanza; cuellos de botella (mar Rojo, Panamá, espacios aéreos
  cerrados) encendidos en **rojo**.
- **Interacción:** al tocar cada cuello de botella aparece el **coste de la
  crisis** (Canal de Panamá: coste de la crisis / demora / retrasos; Mar Rojo:
  coste, primas de seguro, rodeos; Espacio aéreo cerrado: coste, desvíos,
  capacidad restringida).
- **Stat tiles:** `35 días · desvío marítimo` · `Cuellos de botella · Mar Rojo,
Panamá` · `Capacidad restringida · cierres y desvíos` · `Sin aceleración · 50
años de estancamiento`.
- Sin marco IA.

### 03 · La solución — UI + WebGL (la "carrera")

- **H2:** «De días a horas no es una mejora: es un cambio de categoría.»
  **Body:** «Elige cualquier ruta y compara tres realidades logísticas: barco,
  avión y Pulsar. Inmune a canales, huelgas y fronteras.» **CTAs:** `Reserva
capacidad` / `Simula tu ruta`.
- **Interacción (núcleo):** el usuario elige **par de ciudades** (selector, p. ej.
  Long Beach → Singapur) y **compiten tres barras/puntos**: **Barco ~35 días
  (marítimo)** / **Avión ~48 h (aéreo)** / **Pulsar 90 min de vuelo, 8–16 h puerta
  a puerta (suborbital)**. Anima la carrera; el arco de Pulsar vuela sobre el mar,
  por encima de todo espacio aéreo soberano.
- **Stat tiles:** `90 MIN · vuelo suborbital` · `8–16 H · puerta a puerta` · `Sin
estrechos · sin Panamá ni mar Rojo` · `Sin fronteras · sobre el mar y fuera de
rutas soberanas`.
- Sin marco IA. Usa `@radix-ui/react-select` para el par de ciudades.

### 04 · El viaje de tu paquete — 6 cartas (imágenes IA) ⭐

- **Título:** «El viaje de tu paquete». **Mensaje:** «La mercancía se carga en
  tierra; el propelente, en el mar. Tú entregas y recibes: todo lo demás es
  invisible, como debe ser.» + «Despacho aduanero 100% digital mientras el cohete
  vuela.» **CTA:** `Ver el proceso`.
- **Interacción:** carrusel de cartas que se pueden pasar (flechas ‹ ›,
  paginación 1–6). La carta **activa se expande** y muestra glow azul. Aunque
  narrativamente es storytelling, preséntalo **como cartas** (el dueño lo pidió
  explícito).
- **6 cartas (marcos `portrait-3-4`, `MediaFrame`):**
  1. `proceso-01-reserva` — «Reserva» · Reserva desde el móvil.
  2. `proceso-02-preparacion` — «Preparación» · Integración horizontal del cohete
     en el hangar del puerto.
  3. `proceso-03-salida-al-mar` — «Salida al mar» · Buque semisumergible, 30–60 km
     mar adentro. **(activa por defecto)**
  4. `proceso-04-lanzamiento` — «Carga y lanzamiento» · Propelente solo en el mar
     → lanzamiento.
  5. `proceso-05-vuelo-llegada` — «Vuelo y llegada» · Reentrada en la plataforma
     destino · «Aduana liberada en vuelo».
  6. `proceso-06-ultima-milla` — «Última milla» · Barcaza rápida → aduana → última
     milla.

### 05 · La red — Nodos (imágenes IA) ⭐ + WebGL

- **H2:** «Puertos espaciales frente a los grandes hubs.» **Body:** «Lo mejor de
  dos mundos: la infraestructura de los grandes puertos y la libertad del mar
  abierto. Sin ruido sobre ciudades, sin sobrevolar a nadie.» + «Pulsar conecta
  corredores marítimos y plataformas offshore para habilitar lanzamientos limpios,
  discretos y escalables.» **CTAs:** `Explorar redes` / `Ver corredores`.
- **Visual:** globo con nodos (Manzanillo, Long Beach, Róterdam, Singapur,
  Veracruz); **México resaltado como hub de nearshoring**.
- **Interacción:** al pulsar un nodo, el **panel derecho** actualiza su **foto**
  (marco) + datos del corredor. Panel (ejemplo Manzanillo): «Corredor Pacífico ·
  Operativo», atributos: Acceso marítimo, Operación offshore, Sin sobrevuelo
  urbano, Integración portuaria; badges: Disponibilidad **Alta**, Cadencia
  **Frecuente**, Capacidad **Alta**; botón `Ver detalles del nodo`.
- **5 marcos (`landscape-16-10`):** `red-nodo-manzanillo`, `red-nodo-long-beach`,
  `red-nodo-roterdam`, `red-nodo-singapur`, `red-nodo-veracruz`.
- **Stat tiles:** `Red de nodos · 5 plataformas activas` · `Cobertura global · 3
corredores oceánicos` · `Disponibilidad · Alta (operación 24/7)`.

### 06 · La flota — Agnósticos al vehículo (imágenes IA) ⭐ + UI

- **H2:** «Agnósticos al vehículo.» **Body:** «No fabricamos cohetes: contratamos
  los mejores. Cada kilo vuela en la unidad más eficiente, y tu carga nunca
  depende de un solo proveedor.» **CTAs:** `Reserva capacidad` / `Configura tu
envío`.
- **3 clases (marcos `portrait-3-4`):** `flota-capsula` — «Cápsula · 0,15–1 t ·
  envíos críticos»; `flota-clase-media` — «Clase media · 3–10 t · equilibrio
  costo-velocidad» **(seleccionada)**; `flota-clase-pesada` — «Clase pesada ·
  30–100 t · volumen industrial».
- **Interacción (núcleo):** sliders **Masa de la carga** y **Urgencia**
  (Flexible → Crítica) → **recomienda el vehículo óptimo** (resalta la carta y
  actualiza un panel: «Vehículo recomendado: Clase media», «Carga estimada 6,5 t»,
  «SLA objetivo: entrega acelerada», «Proveedor: red multioperador», «Sin
  dependencia de un solo proveedor»). Usa `@radix-ui/react-slider`.
- **Stat tiles:** `3 clases · de capacidad` · `0,15–100 t · rango operable` ·
  `Multioperador · sin proveedor único` · `Optimización · por masa y urgencia`.

### 08 · Mañana — La Luna y Marte — WebGL + UI

- **H2:** «La Luna y Marte.» **Body:** «Toda civilización comercia; la
  multiplanetaria también necesitará manifiestos, aduanas, seguros y última
  milla… sobre regolito. **Los imperios los construyen quienes mueven las
  mercancías.**»
- **Visual:** zoom-out interactivo: la red terrestre se expande a **rutas
  cislunares** y, con un **slider temporal (2026→2040)**, se visualizan las
  **ventanas de transferencia a Marte** como alineaciones orbitales cada 26 meses.
- **Leyenda:** Red terrestre (cobertura logística suborbital) · Rutas cislunares
  (corredores de alta disponibilidad) · Ventanas de transferencia (alineaciones
  cada 26 meses). Nota de producto: «Pulsar OS · inteligencia logística para un
  comercio sin fronteras».
- **Interacción:** el slider temporal anima las rutas activas y las transferencias
  a Marte. Sin marco IA (las texturas de Luna/Marte son assets 3D).

### 10 · La plataforma — Cotizador + Torre de Control — UI + 1 imagen IA ⭐

- **H2:** «Reservar un cohete tan fácil como pedir un courier.» **Body:**
  «Cotización en segundos, visibilidad total con IA y gestión por excepción.»
  **CTAs:** `Prueba la demo interactiva` / `Ver recorrido guiado`.
- **Cotizador (izq→centro):** inputs **Dimensiones** (Largo/Ancho/Alto cm),
  **Peso** (kg), **Ruta** (Long Beach → Singapur), **Urgencia**
  (Estándar/Prioritario/Exprés), **Carga** (Ligera/Media/Pesada), **Servicios**
  (Seguro, Monitoreo IA, Embalaje), toggle **modo simple/avanzado**, muestra
  **Volumétrico** (m³). Ver §6 para la fórmula.
- **Marco:** `plataforma-caja-carga` (`square`, PNG con transparencia) — render de
  la caja de carga flotando en el cotizador.
- **Resultado (der):** **Tiempo de tránsito estimado** (p. ej. 46 min suborbital)
  · **Precio estimado (Zayren)** `2,842.75 ZYR` · botón `Reservar capacidad` ·
  nota «Bloquea la tarifa por 15 minutos».
- **Torre de Control (dashboard, abajo):** tabs `Vista general · Misiones ·
Activos · Alertas · Análisis`. Scores: **Readiness 96** (Excelente) · **Risk 23**
  (Bajo) · **Health 98** (Excelente) · **On-Time Performance 99.2%**. Paneles:
  Misiones activas, Alertas (viento lateral alto, demora en aduana, carga crítica
  completada), Actividad en tiempo real (PLS-247 en ruta, PLS-238 en carga…), y un
  globo pequeño con la ruta Long Beach → Manzanillo → Singapur.
  → El dashboard es **UI de demo con datos mock tipados** (no inventes backend).
  Usa `@radix-ui/react-tabs`.

### 14 · CTA final — 1 imagen IA (fondo)

- **H2:** «Reserva tu primer kilogramo.» **Body:** «Empieza hoy el futuro de la
  logística multiplanetaria.» **CTAs secundarios:** `Conviértete en cargador
ancla` (empresas — soluciones a medida) · `Ayúdanos a construir la Ruta de la
Seda orbital` (talento).
- **Formulario (der):** «Solicita acceso anticipado» — Nombre · Correo · Empresa ·
  Interés (select) · botón `Solicitar acceso` · nota «Tu información está segura
  con nosotros». (Sin backend: valida en cliente y muestra estado de éxito.)
- **Marco:** `cta-fondo-lanzamiento` (`wide-21-9`) — fondo a sangre; deja la
  derecha limpia para el formulario, con scrim hacia `space-950`.
- **Stat tiles:** `Red global · 24/7` · `Entregas suborbitales · <90 MIN` ·
  `Capacidad flexible · bajo demanda` · `Confiabilidad · 99.9% (SLA garantizado)`.

---

## 6. El calculador de precios (ficticio) — cómo simularlo

Es **ficticio pero determinista y creíble**. Nada de backend ni fetch.

- Pon la lógica en `lib/pricing.ts` como **función pura**; los tipos en
  `types/quote.ts`. Expón el estado del cotizador con un hook cliente
  (`components/plataforma/use-quote.ts`) — `useState`/`useMemo`, sin red.
- Moneda: **ZYR (Zayren)**, ficticia. Formatea con `Intl.NumberFormat` a 2
  decimales + sufijo ` ZYR`.
- Fórmula sugerida (ajústala para que los números se parezcan al mockup, ~2,800
  ZYR y ~46 min):
  - `pesoVolumétrico(kg) = (largo*ancho*alto en cm) / 5000`
  - `pesoFacturable = max(pesoReal, pesoVolumétrico)`
  - `precio = base + pesoFacturable * tarifaPorKg * multiplicadorUrgencia *
factorRuta * factorCarga + servicios`
  - `tiempoTránsito` según ruta + urgencia (suborbital: decenas de minutos).
  - Deriva un “descuento” mostrado (p. ej. −6.3%) de forma determinista, no
    aleatoria (evita `Math.random`).
- Recalcula en vivo al mover cualquier slider/input (precio + tiempo + m³).

---

## 7. Sistema de marcos (ya construido) — ÚSALO

Componente `components/ui/media-frame.tsx`. API:

```tsx
<MediaFrame
  ratio="portrait-3-4" // square | portrait-3-4 | portrait-2-3 |
  //  landscape-4-3 | landscape-16-10 |
  //  video-16-9 | wide-21-9
  label="03 · Salida al mar" // etiqueta visible en el placeholder
  spec="1200 × 1600" // medida (opcional, informativa)
  active // borde azul + glow (carta seleccionada)
  src="/proceso/03-salida-al-mar.jpg" // cuando exista la imagen
  alt="…"
  sizes="(max-width:768px) 50vw, 20vw" // ajústalo al layout real
  preload // solo above-the-fold (Next 16, no priority)
/>
```

Sin `src` muestra un placeholder HUD (rejilla + esquinas tipo mira + etiqueta y
medida). **Deja todos los marcos sin `src`** salvo que ya exista la imagen en
`/public`. Los ids, ratios y dimensiones de cada marco están en
`components/marcos/frame-specs.ts`.

**Tabla de dimensiones (generación, ≈2×; recorte object-cover → sujeto centrado):**

| Pantalla     | Marcos              | Ratio | Medida    | Formato             |
| ------------ | ------------------- | ----- | --------- | ------------------- |
| 04 Proceso   | 6 cartas            | 3:4   | 1200×1600 | JPG                 |
| 06 Flota     | 3 vehículos         | 3:4   | 1200×1600 | JPG                 |
| 05 Red       | 5 nodos             | 16:10 | 1600×1000 | JPG                 |
| 10 Cotizador | caja de carga       | 1:1   | 1200×1200 | PNG (transparencia) |
| 14 CTA       | fondo               | 21:9  | 2520×1080 | JPG                 |
| 01 Hero      | fallback (opcional) | 21:9  | 2520×1080 | JPG                 |

---

## 8. Estructura de archivos sugerida

Una carpeta por sección (regla de `estructura.md`):

```
components/
  nav/            (adaptar) site-nav.tsx
  hero/           hero-section.tsx        (globo + copy P.01)
  problema/       problema-section.tsx    (mapa + cuellos de botella P.02)
  carrera/        carrera-section.tsx     (comparador barco/avión/Pulsar P.03)
  proceso/        proceso-section.tsx, proceso-carousel.tsx, steps.ts (P.04)
  red/            red-section.tsx, node-panel.tsx, nodes.ts (P.05)
  flota/          flota-section.tsx, fleet-recommender.tsx, classes.ts (P.06)
  manana/         manana-section.tsx, timeline.tsx (P.08)
  plataforma/     plataforma-section.tsx, quote-form.tsx, quote-result.tsx,
                  control-tower.tsx, use-quote.ts (P.10)
  cta/            (adaptar) cta-section.tsx, access-form.tsx (P.14)
lib/              pricing.ts
types/            quote.ts, network.ts, fleet.ts (según haga falta)
```

`app/page.tsx` solo compone las secciones en orden (§4). Cero lógica ahí.

---

## 9. Plan de trabajo por fases

1. **Limpieza:** elimina la escena del cohete (§2), quita `<Scene3D />`, verifica
   que compila (`npm run build`).
2. **Andamiaje:** crea todas las secciones con copy + `MediaFrame` placeholders +
   stat tiles, en orden, en `/`. Estático primero. Que compile y se vea completo.
3. **Interacciones sin 3D:** carrusel proceso (P.04), recomendador de flota (P.06),
   cotizador + resultado + dashboard tabs (P.10), formulario CTA (P.14), toggles.
4. **3D/mapas:** hero globo + arcos (P.01, reutiliza `components/network`), mapa de
   cuellos de botella (P.02), carrera (P.03), red/nodos (P.05), timeline Luna/Marte
   (P.08). Si algún 3D es muy costoso, primero deja un fallback estático (imagen o
   SVG/Canvas 2D) y márcalo con un `TODO`.
5. **Pulido:** responsive (móvil→desktop), `prefers-reduced-motion`, foco/teclado
   en todo lo interactivo (Radix ayuda), scrims sobre 3D en vez de paneles de
   vidrio.

Trabaja incremental y verifica `npm run build`, `npx tsc --noEmit` y
`npm run lint` al cerrar cada fase.

---

## 10. Criterios de aceptación (Done)

- [ ] `/` renderiza las 9 pantallas en orden; **sin** la escena/animación del
      cohete.
- [ ] `tsc --noEmit`, `eslint` y `next build` pasan limpios. Sin `any`, sin
      estilos inline, sin default exports en componentes, solo colores `brand-*`/
      `space-*`.
- [ ] Interacciones funcionando: carrera (P.03), carrusel (P.04), selección de
      nodo (P.05), recomendador de flota (P.06), slider temporal (P.08), cotizador
      con precio/tiempo dinámicos (P.10), formularios validados (P.10/P.14).
- [ ] Todos los huecos de imagen usan `MediaFrame` con el `id` y `ratio` correctos
      de `frame-specs.ts`. Se ven bien vacíos (placeholder) y aceptan `src` cuando
      llegue la imagen a `/public`.
- [ ] Cálculo del cotizador determinista y creíble (≈ números del mockup); sin
      `Math.random`, sin backend.
- [ ] Responsive y accesible; respeta `prefers-reduced-motion`.

---

## 11. Notas / decisiones abiertas (pregúntale al dueño si dudas)

- Reglas y rutas (Manzanillo, Long Beach, Róterdam, Singapur, Veracruz, Yokohama,
  Shanghái, Hamburgo) — usa las del mockup; no compares con competidores por
  nombre (regla de negocio).
- No prometas tiempos exactos sin disclaimer (regla de negocio); mantén el «*»
  con nota, como en las secciones actuales.
- Si vas a actualizar `branding.md` por lo de las cartas, **pide confirmación**.
- La ruta `/marcos` es solo referencia: puedes conservarla o eliminarla al final.
