---
name: nueva-seccion
description: Procedimiento paso a paso para agregar una nueva sección a la landing page de Pulsar.
---

# Skill: Agregar una nueva sección

## Pasos

1. **Definir los tipos** en `types/[nombre-seccion].ts`
   - Exportar interfaces con `PascalCase`
   - Sin imports de runtime, solo tipos

2. **Crear la carpeta de la sección** en `components/[nombre-seccion]/`
   - Archivo principal: `[nombre-seccion]-section.tsx`
   - Componentes internos: `[componente-interno].tsx`

3. **Construir el componente de sección**
   - Named export (`export function NombreSection`)
   - Props tipadas con la interface del paso 1
   - Usar componentes `Heading` y `Text` de `components/ui/`
   - Usar clases `brand-*` y `space-*` — sin hex directos
   - Mobile-first con breakpoints `md:` y `lg:`

4. **Agregar estados de carga, vacío y error** (si hay datos dinámicos)
   - Skeleton que respete el layout final
   - Mensaje claro en estado vacío con acción sugerida
   - Mensaje amable en error con botón "Reintentar"

5. **Animar con Framer Motion** (si aplica)
   - `fade-in` o `slide-up` al montar
   - Duración 200–300ms, delay escalonado si son múltiples elementos
   - Respetar `prefers-reduced-motion`

6. **Importar en `app/page.tsx`**
   - Mantener el orden visual de la landing

## Checklist de verificación

- [ ] Named export (sin `export default`)
- [ ] Sin `any` en TypeScript
- [ ] Sin estilos inline
- [ ] Sin hex directos en JSX
- [ ] Un solo H1 en toda la página (secciones usan H2/H3)
- [ ] Responsiva desde mobile — sin scroll horizontal
- [ ] Contraste AA y foco visible en teclado
- [ ] Animaciones con `prefers-reduced-motion`
- [ ] Si consume datos: via hook de TanStack Query, nunca fetch directo
