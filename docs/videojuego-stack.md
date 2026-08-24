# Minijuego de la cofia — tecnologías

El simulador de misión que vive dentro del cotizador (sección **Plataforma**):
estibar la carga tipo Tetris, pilotar el ascenso y posar el cohete en la
barcaza. Este documento es para replicarlo: dice, mecánica por mecánica, con
qué librería está hecha.

## Lo esencial en una frase

Es **React Three Fiber** (React + Three.js) para todo lo que se ve en 3D, con
la física y las reglas del juego escritas aparte, en TypeScript normal, sin
ninguna librería de videojuegos. No hay Unity, no hay Unreal, no hay Phaser, no
hay motor de físicas (Rapier/Cannon/Matter) — cada movimiento se calcula a mano
con las fórmulas de la física real (aceleración, gravedad, torque) y **Three.js
sólo dibuja el resultado**.

## Stack completo

| Capa                | Qué se usa                                                                | Versión  |
| ------------------- | ------------------------------------------------------------------------- | -------- |
| Framework           | Next.js (App Router), todo el juego en cliente                            | 16.2     |
| UI                  | React + TypeScript en modo estricto                                       | 19.2 / 5 |
| Motor 3D            | Three.js                                                                  | 0.185    |
| React ↔ Three.js    | @react-three/fiber — deja escribir la escena 3D como componentes de React | 9.6      |
| Ayudas de escena    | @react-three/drei — cámara, estrellas, `OrbitControls`, `Instances`       | 10.7     |
| Estilos y HUD       | Tailwind CSS                                                              | 4.x      |
| Animación de página | Framer Motion — **sólo fuera del lienzo 3D**, ver abajo                   | 12.x     |
| Iconos              | Lucide React                                                              | 1.x      |

**Lo que NO hay:** ni Rapier/Cannon/Matter (física), ni Phaser/PixiJS (motor
2D), ni ninguna librería de gráficas para los relojes del HUD, ni un solo
asset descargado — las texturas se pintan en un `<canvas>` en tiempo de carga.

## Qué ves en pantalla → con qué está hecho

Esta es la parte que hace falta para replicar algo puntual.

### 1. La estiba tipo Tetris (arrastrar/rotar palés en la cofia)

| Mecánica                                                                         | Técnica                                                                                                                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reglas del juego (dónde cabe una pieza, cuándo se cierra una cubierta, gravedad) | **`useReducer` de React puro** — `bay-game.tsx` tiene un `reducer(state, action)` con acciones `move`/`rotate`/`drop`/`auto`. Cero Three.js aquí: es lógica de array. |
| Mover el palé con el puntero                                                     | `onPointerMove` nativo del DOM sobre el `<canvas>`, convertido a una celda de la cuadrícula                                                                           |
| Rotar la vista arrastrando                                                       | `<OrbitControls>` de **drei** (`enableZoom={false}` para no robar el scroll de la página)                                                                             |
| Dibujar los palés ya estibados (pueden ser decenas)                              | `<Instances>`/`<Instance>` de **drei** — una sola llamada de dibujo para todos, en vez de un `<mesh>` por palé                                                        |
| Solver de "Auto-estiba IA"                                                       | Función pura de fuerza bruta en `lib/cargo-bay.ts` (`bestPlacement`): prueba las 4 rotaciones en cada hueco y se queda con la que deja menos aire                     |
| Textura de cartón de las cajas                                                   | Dibujada en un `<canvas>` 2D normal (`lib/crate-texture.ts`), no es una imagen descargada                                                                             |

### 2. El ascenso pilotado (esquivar/cruzar los aros de guiado)

| Mecánica                                             | Técnica                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Física del vuelo (posición, velocidad, aros pasados) | Función pura `stepAscent(state, steer, dt)` en `lib/cargo-ascent.ts` — nada de Three.js, sólo números                                                                                                                                          |
| Mover el cohete y la cámara cada fotograma           | Hook `useFrame` de **react-three/fiber**: se ejecuta 1 vez por fotograma, ahí se lee el resultado de `stepAscent` y se escribe en `mesh.position`/`camera.position` directamente (mutando el objeto de Three.js, **sin** pasar por `setState`) |
| El planeta bajo el corredor                          | Mismo componente de Tierra 3D que el resto del sitio (`earth-below.tsx`), reorientado con matrices de Three.js (`Matrix4`, `Quaternion`) para que la ruta cotizada quede alineada                                                              |
| Aros de guiado, estelas, cielo que cambia de color   | Primitivas de Three.js (`ringGeometry`, `Points`) + `Color.lerp()` interpolado en `useFrame` según la altitud                                                                                                                                  |
| Mando: puntero o flechas                             | Pointer Events + `onKeyDown`/`onKeyUp` nativos de React sobre el `<div role="application">` que envuelve el `<canvas>`                                                                                                                         |

### 3. El aterrizaje vertical (frenar, corregir la deriva, posarse)

| Mecánica                                                       | Técnica                                                                                                                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Física de la maniobra (empuje, actitud, propelente, veredicto) | Función pura `stepLanding(state, command, dt)` en `lib/cargo-landing.ts` — otra vez, ni una línea de Three.js                                                                 |
| Piloto automático                                              | Otra función pura, `autopilotCommand(state)`: un controlador PD (proporcional-derivativo) de toda la vida, no IA de verdad                                                    |
| Inclinar el cohete y perseguirlo con la cámara                 | `useFrame`: `rocket.rotation.x/z` se ajustan cada fotograma, y la cámara usa `camera.position.lerp(objetivo, delta * 4)` — un acercamiento exponencial simple, escrito a mano |
| El mar en movimiento                                           | Textura procedural (`lib/sea-texture.ts`, dibujada en `<canvas>`) cuyo `offset` se desplaza en `useFrame`: no son olas simuladas, es la imagen deslizándose                   |
| El cielo (degradado según la altura)                           | **Shader GLSL escrito a mano** (`SHADER_VERTEX`/`SHADER_FRAGMENT` en `landing-scene.tsx`), pasado a un `<shaderMaterial>` de Three.js                                         |
| Puerto y grúas al fondo                                        | Geometría de Three.js repetida con `<Instances>` de drei, igual que las cajas                                                                                                 |

### 4. El HUD (relojes tipo tacómetro, gráficos de posición, barras)

Nada de librería de gráficas. Son **SVG escritos a mano** (`<circle>`,
`stroke-dasharray` para el arco del reloj) dentro de componentes de React
normales (`Dial`, `PolarPlot` en `bay-game.tsx`), con Tailwind para el color y
el tamaño. Se actualizan por `props` normales de React —no vía Three.js—
porque el HUD sólo necesita refrescarse ~6 veces por segundo, no a 60 fps.

### 5. Cosas que parecen del juego pero son de la página

- **Framer Motion** no toca el minijuego: anima el carrusel de "Cómo
  funciona", las entradas al hacer scroll, etc. Dentro del `<canvas>` 3D todo
  el movimiento lo hace Three.js a mano dentro de `useFrame`.
- **Pantalla completa**: `element.requestFullscreen()`, la API nativa del
  navegador — no una librería.

## Funciones puras: por qué y cómo, con un ejemplo

"Función pura" quiere decir: recibe el estado actual + lo que el jugador está
pidiendo + cuánto tiempo pasó, y devuelve el **estado siguiente** — sin tocar
nada de fuera, sin `Math.random()` a medio camino, sin `console.log` con
efectos. Misma entrada, siempre la misma salida.

```ts
// lib/cargo-landing.ts (simplificado)
function stepLanding(
  state: LandingState, // dónde está el cohete, su velocidad, su propelente…
  command: LandingCommand, // lo que pide el jugador ahora mismo
  dt: number, // segundos reales desde el fotograma anterior
): LandingState {
  const thrust = command.burn ? THRUST : 0;
  const vy = state.vy + (thrust - GRAVITY) * dt;
  const altitude = state.altitude + vy * dt;
  // ...actitud, deriva, consumo de propelente, con las mismas cuentas...
  return { ...state, vy, altitude /* ... */ };
}
```

Eso es **todo** el aterrizaje. No importa react-three-fiber, no importa Three.
Se podría llamar así mil veces seguidas en un test de Node y comprobar que el
cohete aterriza donde debe, sin abrir un navegador.

Por qué se hizo así, dos razones concretas:

1. **React no está pensado para actualizar 60 veces por segundo.** Si el
   estado del cohete viviera en `useState`, cada fotograma dispararía un
   re-render de todo el árbol de componentes. En vez de eso, el estado vive en
   un `useRef` (una caja mutable que React ignora) y el `useFrame` de r3f lo
   actualiza directamente cada fotograma:

   ```ts
   const stateRef = useRef(createLanding());

   useFrame((_, dt) => {
     stateRef.current = stepLanding(stateRef.current, commandRef.current, dt);
     rocketMesh.current.position.y = stateRef.current.altitude / ESCALA;
   });
   ```

   El HUD sí necesita re-renderizar (es DOM/SVG normal), así que el resultado
   se copia a `useState` sólo unas 6 veces por segundo con `onTelemetry(...)`
   — suficiente para que un número en pantalla se vea fluido, sin forzar a
   React a trabajar a la velocidad de los gráficos.

2. **Se puede probar sin la escena.** Antes de tocar una línea de Three.js, se
   simuló el aterrizaje en Node puro (mandando "piloto a fondo", "sin gas",
   "mando al máximo"...) para comprobar que la física tenía sentido. Eso sólo
   es posible porque la función no depende de que exista un `<canvas>`.

Si tu amigo quiere replicar el juego entero: la receta corta es _"React Three
Fiber para dibujar + un `reducer`/función `step(state, input, dt)` de
TypeScript puro para las reglas, con el estado de cada fotograma en un
`useRef` y `useFrame` moviendo objetos de Three.js a mano"_. No hace falta
nada más específico de videojuegos.

## Mapa de archivos

```
components/cargo/
  bay-game.tsx      # el widget: reducer del Tetris, HUD, tablero de instrumentos, marcador
  bay-scene.tsx     # escena 3D de la estiba (cofia, palés, OrbitControls, Instances)
  ascent-scene.tsx  # escena 3D del ascenso (corredor, aros, estelas, useFrame)
  earth-below.tsx   # la Tierra bajo el corredor, orientada a la ruta cotizada
  landing-scene.tsx # escena 3D del aterrizaje (mar, barcaza, puerto, shader del cielo)
lib/
  cargo-bay.ts      # reglas del Tetris + solver de auto-estiba (función pura)
  cargo-ascent.ts   # física del ascenso: stepAscent() (función pura)
  cargo-landing.ts  # física del aterrizaje: stepLanding() + autopilotCommand() (funciones puras)
  mission-score.ts  # puntuación de la misión (función pura)
  crate-texture.ts  sea-texture.ts   # texturas dibujadas en <canvas>, no descargadas
```

El juego recibe por props la ruta y el perfil suborbital que ha calculado el
cotizador (`apogeeKm`, `burnoutSpeedKms`, `from`, `to`), así que las cifras del
HUD son las de la ruta que el usuario está cotizando, no valores inventados.
