# Prompts de imágenes — Pulsar

Guía para generar (con tu otra IA: Midjourney, DALL·E, Flux, Stable Diffusion, etc.)
las imágenes de la sección **"El viaje de tu paquete"** y otros assets de marca.

Los prompts están en **inglés** porque casi todos los modelos rinden mejor así.
Debajo de cada uno explico en español qué es.

---

## 0) Reglas para que todas combinen

- **Formato:** vertical **3:4** (retrato). Genera a **1024 × 1365** o **1200 × 1600**.
- **Consistencia:** usa **el mismo estilo base** (abajo) y, si tu modelo lo permite,
  **el mismo `seed`** en las 6 para que se vean de la misma "familia".
- **Cohete:** siempre **blanco, reutilizable**, con "Pulsar" sutil en el fuselaje.
- **Paleta:** negro espacial `#05070f`, azul Pulsar `#3b82f6`, cian `#38bdf8`.

### Estilo base (pega esto al inicio de cada prompt)

```
cinematic photoreal render, premium aerospace brand aesthetic (Blue Origin / SpaceX style),
dark moody lighting, deep space-black background, electric blue and cyan accents,
volumetric fog, subtle lens flare, shallow depth of field, shot on 35mm,
teal-and-blue color grade, ultra detailed, 8k --ar 3:4
```

### Negative prompt (lo que NO quieres)

```
text, watermark, extra logos, cartoon, illustration, low quality, blurry,
warm orange sunset (unless asked), cluttered, distorted rocket, deformed hands
```

---

## 1) Las 6 tarjetas del viaje

> **Dónde van:** guarda cada archivo en `public/journey/` con **exactamente**
> estos nombres y aparecen solas en la web:
> `step-1.jpg`, `step-2.jpg`, `step-3.jpg`, `step-4.jpg`, `step-5.jpg`, `step-6.jpg`.
> (Si usas PNG/WEBP, cambia la extensión en el arreglo `STEP_IMAGES` de
> `components/pulsar/journey.tsx`.)

### `step-1.jpg` — 1. Reserva

_Mano sosteniendo un teléfono con la app de Pulsar; puerto de fondo._

```
[estilo base] a hand holding a modern smartphone showing a sleek dark logistics
booking app with blue UI accents (origin "Long Beach", destination "Manzanillo",
weight "2,450 kg", a blue "Book shipment" button), background: blurred container
port at blue hour with cranes and stacked shipping containers, bokeh lights
```

### `step-2.jpg` — 2. Preparación

_Cohete horizontal integrándose en el hangar del puerto._

```
[estilo base] a large white reusable rocket lying horizontally on a transporter
inside a brightly lit industrial port hangar, subtle "Pulsar" on the fuselage,
engineers small in the distance for scale, blue rim light, wide shot
```

### `step-3.jpg` — 3. Salida al mar

_Buque semisumergible llevando el cohete mar adentro._

```
[estilo base] a semi-submersible heavy-lift vessel carrying a horizontal white
rocket, sailing out to open sea at blue-hour dusk, calm ocean, dramatic sky,
"Pulsar" on the hull, cinematic aerial drone view
```

### `step-4.jpg` — 4. Carga y lanzamiento

_Cohete vertical en plataforma offshore; otro despegando al fondo._

```
[estilo base] a white reusable rocket standing vertical on an offshore floating
launch platform in the middle of the ocean at night, being fueled, glowing blue
platform lights, venting vapor, a second rocket lifting off in the background
with a bright engine plume over the sea
```

### `step-5.jpg` — 5. Vuelo y llegada

_Reentrada/aterrizaje propulsivo sobre el mar, luces de ciudad al fondo._

```
[estilo base] a rocket booster performing a precise propulsive vertical landing
over the ocean at night, glowing engine plume, distant city skyline lights on the
horizon, dramatic clouds, small futuristic HUD badge reading "customs cleared"
```

### `step-6.jpg` — 6. Última milla

_Camión Pulsar en un almacén de noche, entrega final._

```
[estilo base] a sleek electric delivery truck with subtle "Pulsar" branding parked
at a modern logistics warehouse loading dock at night, a worker moving a package,
wet reflective asphalt, blue neon accents, city lights in the background
```

---

## 2) Assets extra de marca (opcionales, para reusar)

### Hero / key visual — cohete despegando

```
[estilo base] a white reusable Pulsar rocket launching straight up over a dark
ocean at night, brilliant blue-white engine plume, Earth's curvature and city
lights faint on the horizon, epic scale, mostly negative space at the top --ar 16:9
```

### Plataforma offshore (para "La red")

```
[estilo base] a semi-submersible offshore spaceport platform on the open ocean,
a white rocket standing on it, "Pulsar" on the structure, glowing blue lights,
foggy sea, cinematic wide shot at blue hour --ar 16:9
```

> Nota: el **globo 3D, la Luna y Marte** ya son escenas WebGL en tiempo real
> dentro de la web (no hacen falta imágenes para eso).

---

## 3) Tips de consistencia

- Genera las 6 con el **mismo seed** + mismo estilo base → misma "familia" visual.
- Si una sale muy distinta, reusa el seed de la que más te gustó como referencia.
- Manténlas **oscuras y azuladas**; evita atardeceres naranjas salvo el hero.
- Exporta comprimido (JPG calidad ~80) para que la web cargue rápido.
