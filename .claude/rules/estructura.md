---
description: Convenciones de estructura de carpetas y arquitectura de componentes. Siempre activas.
paths: ["**"]
---

# Estructura de carpetas — Pulsar

```
pulsar-landing-page/
├─ app/                      # SOLO rutas y páginas (App Router)
│  ├─ layout.tsx             # Layout raíz con providers y fuentes
│  ├─ page.tsx               # Home / Landing page principal
│  └─ globals.css            # Variables CSS y tokens de marca
├─ components/
│  ├─ ui/                    # Primitivas compartidas (Radix + CVA)
│  │  ├─ button.tsx
│  │  ├─ heading.tsx
│  │  └─ text.tsx
│  ├─ hero/                  # Sección hero
│  ├─ process/               # Sección proceso (11 pasos)
│  ├─ features/              # Sección pilares de valor
│  └─ cta/                   # Call to action
├─ lib/
│  └─ utils.ts               # cn() y utilidades puras
├─ types/                    # Tipos TypeScript (sin runtime)
└─ public/                   # Assets estáticos
```

## Reglas de organización

1. `app/` contiene **solo** rutas y layouts. Cero lógica de negocio.
2. `components/ui/` contiene **solo** primitivas sin estado ni datos.
3. Cada sección de la landing tiene su propia carpeta en `components/[seccion]/`.
4. Si un componente lo usan 2+ secciones, se mueve a `components/ui/`.
5. `types/` solo define interfaces/tipos TypeScript — sin imports de runtime.
6. `lib/` solo funciones puras sin efectos secundarios ni estado.

## Convenciones de archivos

- Archivos: `kebab-case.tsx`
- Componentes y tipos: `PascalCase`
- Funciones y variables: `camelCase`
- Named exports siempre — sin `export default` en componentes

## Anti-patrones (NUNCA)

- Nunca fetch directo en un componente — siempre via hook de TanStack Query
- Nunca tipos compartidos definidos dentro de un componente
- Nunca lógica de negocio en `app/page.tsx` — delegar a componentes
- Nunca `any` en TypeScript
- Nunca estilos inline: `style={{ ... }}`
