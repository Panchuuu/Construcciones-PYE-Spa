/**
 * Contenido institucional: proceso de trabajo, valores, hitos y clientes.
 * ⚠️ REEMPLAZAR por la información real de la empresa.
 */

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
};

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Visita y levantamiento",
    description:
      "Vamos a terreno, medimos, revisamos condiciones y entendemos exactamente qué necesitas. Sin costo y sin compromiso.",
  },
  {
    step: "02",
    title: "Propuesta y presupuesto",
    description:
      "Entregamos un presupuesto detallado por partida, con especificaciones técnicas y carta Gantt. Lo que ves es lo que pagas.",
  },
  {
    step: "03",
    title: "Ejecución de obra",
    description:
      "Equipo propio, jefe de obra dedicado y reportes de avance periódicos con registro fotográfico. Sabes en qué va tu proyecto.",
  },
  {
    step: "04",
    title: "Entrega y postventa",
    description:
      "Revisión conjunta, corrección de observaciones y garantía escrita sobre la obra ejecutada.",
  },
];

export type Value = {
  title: string;
  description: string;
};

export const values: Value[] = [
  {
    title: "Plazos que se cumplen",
    description:
      "Planificamos con holguras reales, no optimistas. Si comprometemos una fecha por contrato, la cumplimos.",
  },
  {
    title: "Precio transparente",
    description:
      "Presupuesto abierto por partidas. Sin cobros sorpresa a mitad de obra ni extras que aparecen al final.",
  },
  {
    title: "Seguridad primero",
    description:
      "Programa de prevención de riesgos, elementos de protección y charlas diarias. Cero accidentes con tiempo perdido.",
  },
  {
    title: "Equipo propio",
    description:
      "Maestros y profesionales contratados por la empresa, no subcontratos rotativos. La calidad se sostiene en el tiempo.",
  },
];

export type TeamMember = {
  name: string;
  /** Cargo o profesión; se muestra bajo el nombre. */
  role: string;
  description: string;
};

/** Quiénes están detrás de la empresa (sección Nosotros). */
export const team: TeamMember[] = [
  {
    name: "Patricio Parra",
    role: "Constructor Civil",
    description:
      "Lidera la planificación y ejecución de las obras: presupuestos, programación y control técnico en terreno. Es quien responde por el cumplimiento de plazos y estándares de cada proyecto.",
  },
  {
    name: "Eduardo Parra",
    role: "Jefe de Terreno",
    description:
      "A cargo del día a día en obra: coordinación de los equipos, materiales y avances. Su experiencia en faena asegura que lo proyectado se ejecute como corresponde.",
  },
];

export type Milestone = {
  year: string;
  title: string;
  description: string;
};

export const milestones: Milestone[] = [
  {
    year: "2022",
    title: "Nace Construcciones PYE",
    description:
      "Partimos con proyectos de remodelación y ampliaciones en la Región Metropolitana.",
  },
  {
    year: "2023",
    title: "Primeras obras de edificación",
    description:
      "Consolidamos el área de obra gruesa y ejecutamos nuestros primeros proyectos de edificación completa.",
  },
  {
    year: "2024",
    title: "Área industrial",
    description:
      "Incorporamos montaje de estructuras metálicas y obras civiles para clientes industriales.",
  },
  {
    year: "2025",
    title: "Expansión regional",
    description:
      "Ampliamos la cobertura fuera de la Región Metropolitana con equipos y maquinaria propios.",
  },
];

export type Faq = {
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    question: "¿La visita y el presupuesto tienen costo?",
    answer:
      "No. La visita técnica y el presupuesto son gratuitos y sin compromiso dentro de nuestra zona de cobertura.",
  },
  {
    question: "¿Cuánto demoran en entregar una cotización?",
    answer:
      "Entregamos la propuesta formal dentro de 3 a 5 días hábiles después de la visita a terreno, según la complejidad del proyecto.",
  },
  {
    question: "¿Trabajan con boleta o factura?",
    answer:
      "Emitimos factura por cada estado de pago y trabajamos con contrato de obra firmado por ambas partes.",
  },
  {
    question: "¿Se hacen cargo de los permisos municipales?",
    answer:
      "Sí. Gestionamos permisos de edificación, regularizaciones y recepción final cuando el proyecto lo requiere.",
  },
  {
    question: "¿Qué garantía tienen los trabajos?",
    answer:
      "Toda obra cuenta con garantía escrita. El plazo depende de la partida y queda establecido en el contrato.",
  },
  {
    question: "¿Atienden fuera de la Región Metropolitana?",
    answer:
      "Sí, operamos en varias regiones. Escríbenos con la ubicación del proyecto y confirmamos disponibilidad.",
  },
];
