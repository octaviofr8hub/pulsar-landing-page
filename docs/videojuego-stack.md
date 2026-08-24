# Minijuego de la cofia — tecnologías

El simulador de misión que vive dentro del cotizador (sección **Plataforma**):
estibar la carga, pilotar el ascenso y posar el cohete en la barcaza.

## Stack

| Capa                | Qué se usa                                               | Versión  |
| ------------------- | -------------------------------------------------------- | -------- |
| Framework           | Next.js (App Router), todo el juego en cliente           | 16.2     |
| UI                  | React + TypeScript en modo estricto                      | 19.2 / 5 |
| 3D                  | Three.js                                                 | 0.185    |
| React ↔ Three.js    | @react-three/fiber                                       | 9.6      |
| Ayudas 3D           | @react-three/drei (cámara, estrellas, instancias)        | 10.7     |
| Estilos y HUD       | Tailwind CSS                                             | 4.x      |
| Animación de página | Framer Motion (fuera del lienzo)                         | 12.x     |
| Iconos              | Lucide React                                             | 1.x      |
| Calidad             | ESLint 9 + eslint-config-next + reglas de React Compiler | —        |

**Nada más.** Sin motor de físicas, sin librería de juego, sin gráficas de
terceros y sin un solo asset descargado para el juego: las texturas se pintan en
un `<canvas>` en tiempo de carga y los instrumentos son SVG escrito a mano.

## Cómo está montado

- **La lógica no sabe que existe React.** Toda la simulación son funciones puras
  en `lib/`, en unidades reales (metros, m/s, m³), y se pueden ejecutar en Node
  sin navegador:
  - `lib/cargo-bay.ts` — volumen de la cofia, piezas, rotación, gravedad,
    consolidación de cubiertas, estadísticas de estiba y el solver de auto-estiba.
  - `lib/cargo-ascent.ts` — ascenso: corredor, aros de guiado, integración.
  - `lib/cargo-landing.ts` — aterrizaje: empuje, actitud, propelente, veredicto.
  - `lib/mission-score.ts` — puntuación de la misión.
- **Integración a paso fijo** (1/60 s) usando el delta real del fotograma: el
  reloj del juego es el del usuario, no el de la tarjeta gráfica.
- **El estado de vuelo vive en `useRef`, no en `useState`.** React no re-renderiza
  a 60 fps; la escena lee el ref dentro de `useFrame` y sólo publica telemetría al
  árbol de React ~6 veces por segundo, que es lo que necesita el HUD.
- **El tablero es DOM sobre el lienzo**, no texto dentro del 3D: relojes, gráficos
  polares y barras en SVG + Tailwind, con la escena WebGL por debajo.
- **Texturas procedurales** generadas en canvas y cacheadas como singleton:
  `lib/crate-texture.ts` (palés), `lib/sea-texture.ts` (oleaje). El planeta usa
  las texturas compartidas del globo del sitio.
- **Un shader GLSL propio** para la cúpula del cielo del aterrizaje.
- **Pantalla completa** con la Fullscreen API del navegador sobre la raíz del
  panel (no un `position: fixed`), para no remontar el lienzo WebGL: se puede
  ampliar a mitad de vuelo sin perder la partida.
- **Controles** con Pointer Events (ratón y táctil) y teclado, con respaldo en
  `window` para que no dependa de quién tiene el foco.

## Mapa de archivos

```
components/cargo/
  bay-game.tsx      # el widget: estados, HUD, tablero de instrumentos, marcador
  bay-scene.tsx     # escena 3D de la estiba (cofia, palés, guía de caída)
  ascent-scene.tsx  # escena 3D del ascenso (corredor, aros, estelas)
  earth-below.tsx   # la Tierra bajo el corredor, orientada a la ruta cotizada
  landing-scene.tsx # escena 3D del aterrizaje (mar, barcaza, puerto, cohete)
lib/
  cargo-bay.ts      cargo-ascent.ts   cargo-landing.ts   mission-score.ts
  crate-texture.ts  sea-texture.ts
```

El juego recibe por props la ruta y el perfil suborbital que ha calculado el
cotizador (`apogeeKm`, `burnoutSpeedKms`, `from`, `to`), así que las cifras del
HUD son las de la ruta que el usuario está cotizando, no valores inventados.
