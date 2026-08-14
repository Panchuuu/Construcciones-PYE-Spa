/**
 * Capa de datos: información pura, sin dependencias de UI.
 * El campo `icon` es una clave que el frontend traduce a un ícono
 * (ver src/frontend/lib/icons.ts).
 *
 * ⚠️ REEMPLAZAR los textos por los servicios reales de la empresa.
 * Puedes agregar o quitar servicios libremente: el sitio se adapta solo.
 */

export type ServiceIcon =
  | "hojalateria"
  | "obra-gruesa"
  | "edificacion"
  | "remodelacion"
  | "industrial"
  | "ingenieria"
  | "movimiento-tierra";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  icon: ServiceIcon;
  bullets: string[];
};

export const services: Service[] = [
  {
    slug: "hojalateria",
    title: "Hojalatería y techumbres",
    summary:
      "Nuestra especialidad: fabricación e instalación de cubiertas, canales, bajadas de aguas lluvia y forros a medida.",
    icon: "hojalateria",
    bullets: [
      "Cubiertas y reparación de techumbres",
      "Canales y bajadas de aguas lluvia",
      "Forros, remates y caballetes",
      "Fabricación a medida en obra",
    ],
  },
  {
    slug: "obra-gruesa",
    title: "Obra gruesa",
    summary:
      "Fundaciones, hormigón armado, albañilería estructural y radieres, con control de calidad en cada partida.",
    icon: "obra-gruesa",
    bullets: [
      "Excavaciones y fundaciones",
      "Hormigón armado y moldajes",
      "Albañilería estructural",
      "Radieres y sobrelosas",
    ],
  },
  {
    slug: "edificacion",
    title: "Edificación y ampliaciones",
    summary:
      "Construcción de viviendas, oficinas y locales comerciales desde el proyecto hasta la recepción municipal.",
    icon: "edificacion",
    bullets: [
      "Viviendas y condominios",
      "Oficinas y locales comerciales",
      "Ampliaciones y segundos pisos",
      "Tramitación y recepción municipal",
    ],
  },
  {
    slug: "remodelaciones",
    title: "Remodelación y terminaciones",
    summary:
      "Renovación integral de espacios con terminaciones de alto estándar y plazos comprometidos por contrato.",
    icon: "remodelacion",
    bullets: [
      "Habilitación de oficinas",
      "Cocinas y baños",
      "Tabiquería, cielos y pavimentos",
      "Pintura y revestimientos",
    ],
  },
  {
    slug: "montaje-industrial",
    title: "Montaje industrial",
    summary:
      "Estructuras metálicas, galpones y obras civiles para faenas productivas, mineras y agroindustriales.",
    icon: "industrial",
    bullets: [
      "Estructuras metálicas y galpones",
      "Bases y fundaciones de equipos",
      "Obras civiles industriales",
      "Mantención de infraestructura",
    ],
  },
  {
    slug: "proyectos-e-ingenieria",
    title: "Proyectos e ingeniería",
    summary:
      "Anteproyecto, cálculo, especificaciones técnicas y presupuesto detallado antes de mover la primera piedra.",
    icon: "ingenieria",
    bullets: [
      "Arquitectura y cálculo estructural",
      "Especificaciones técnicas",
      "Presupuesto y carta Gantt",
      "Permisos de edificación",
    ],
  },
  {
    slug: "movimiento-de-tierra",
    title: "Movimiento de tierra",
    summary:
      "Escarpe, nivelación, compactación y urbanización con maquinaria propia y operadores certificados.",
    icon: "movimiento-tierra",
    bullets: [
      "Escarpe y nivelación de terreno",
      "Compactación y rellenos",
      "Urbanización y pavimentos",
      "Redes húmedas y secas",
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

/** Lista de títulos para el selector del formulario de contacto. */
export const serviceTitles = services.map((s) => s.title);
