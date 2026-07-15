@AGENTS.md

# Pulsar — Space Freight Forwarder Landing Page

Pulsar es una landing page futurista para una empresa de logística espacial ("Space Freight Forwarder"). El concepto es que cohetes reutilizables pueden transportar carga de alta densidad de valor entre ciudades globales (ej. New York ↔ Tokyo ↔ Shanghai) en horas, no semanas. El branding es inspirado en pulsares del espacio: oscuro, preciso, imponente — al estilo de Blue Origin pero con más carácter de startup.

## Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript
- **Estilos**: Tailwind CSS v4
- **Primitivas accesibles**: Radix UI
- **Variantes de componentes**: CVA + clsx + tailwind-merge (`cn()` en `lib/utils.ts`)
- **Datos**: TanStack Query (cuando aplique)
- **Animaciones**: Framer Motion

## Reglas de negocio y branding

@.claude/rules/branding.md
@.claude/rules/estructura.md
@.claude/rules/negocio.md

## Convenciones de código

- **Sin** `any`, **sin** `default exports` en componentes, **sin** estilos inline
- `PascalCase` → componentes y tipos
- `camelCase` → funciones y variables
- `kebab-case` → nombres de archivos
- Sin hex directos en componentes: siempre clases `brand-*`
- Sin fetch directo en componentes: siempre a través de hooks de TanStack Query

