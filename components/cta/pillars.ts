import type { ValuePillar } from "@/types/landing";

/**
 * Los cuatro pilares se numeran /01../04 en la UI. El orden es el argumento:
 * primero la promesa (velocidad), luego cómo se sostiene.
 */
export const VALUE_PILLARS: readonly ValuePillar[] = [
  {
    title: "Rápido",
    description:
      "Horas, no semanas. Tiempos de entrega drásticamente reducidos.",
    detail:
      "La carga sale del hub de origen y aterriza en el de destino dentro del mismo turno operativo. Sin escalas, sin transbordos, sin esperar consolidación.",
  },
  {
    title: "Preciso",
    description:
      "Datos exactos validados con IA para las mejores decisiones logísticas.",
    detail:
      "Cada envío se modela antes de salir: masa, volumen, centro de gravedad y ventana orbital. El plan de carga se recalcula hasta el cierre de compuertas.",
  },
  {
    title: "Transparente",
    description:
      "Precios 100% claros desde el primer momento y tracking en tiempo real.",
    detail:
      "El precio se fija al reservar y no se mueve. Cada etapa — consolidación, ascenso, órbita, reentrada y entrega — es visible desde el panel de control.",
  },
  {
    title: "Confiable",
    description:
      "Seguridad de grado espacial en cada etapa de la cadena de suministro.",
    detail:
      "Contenedores presurizados y redundancia en los sistemas críticos. La cadena de custodia se firma en cada traspaso, del origen a la puerta final.",
  },
];
