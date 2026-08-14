export type Project = {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: number;
  surface: string;
  duration: string;
  client: string;
  summary: string;
  scope: string[];
  /** Imagen principal en /public/images/proyectos/ */
  image: string;
};

/**
 * ⚠️ REEMPLAZAR por las obras reales.
 * Las imágenes son placeholders: sube las fotos a
 * /public/images/proyectos/ y cambia la ruta en "image".
 */
export const projects: Project[] = [
  {
    slug: "edificio-corporativo-las-condes",
    title: "Edificio corporativo Las Condes",
    category: "Edificación",
    location: "Las Condes, RM",
    year: 2025,
    surface: "4.200 m²",
    duration: "14 meses",
    client: "Inmobiliaria ejemplo",
    summary:
      "Construcción de edificio de oficinas de 6 pisos con dos subterráneos, estructura de hormigón armado y fachada ventilada.",
    scope: [
      "Excavación y entibación de 2 subterráneos",
      "Estructura de hormigón armado",
      "Fachada ventilada y muro cortina",
      "Terminaciones e instalaciones",
    ],
    image: "/images/proyectos/edificio-corporativo.svg",
  },
  {
    slug: "condominio-alto-maipo",
    title: "Condominio Alto Maipo",
    category: "Vivienda",
    location: "Buin, RM",
    year: 2024,
    surface: "6.800 m²",
    duration: "18 meses",
    client: "Inmobiliaria ejemplo",
    summary:
      "Ejecución de 42 viviendas pareadas de dos pisos, incluyendo urbanización completa y áreas comunes.",
    scope: [
      "Movimiento de tierra y urbanización",
      "42 viviendas de albañilería confinada",
      "Redes húmedas y secas",
      "Paisajismo y áreas comunes",
    ],
    image: "/images/proyectos/condominio.svg",
  },
  {
    slug: "galpon-industrial-lampa",
    title: "Galpón industrial Lampa",
    category: "Industrial",
    location: "Lampa, RM",
    year: 2025,
    surface: "3.500 m²",
    duration: "8 meses",
    client: "Empresa ejemplo",
    summary:
      "Montaje de galpón de estructura metálica con radier industrial de alta resistencia y oficinas administrativas.",
    scope: [
      "Fundaciones y radier industrial",
      "Estructura metálica y cubierta",
      "Oficinas y servicios",
      "Pavimentación de patios de maniobra",
    ],
    image: "/images/proyectos/galpon-industrial.svg",
  },
  {
    slug: "habilitacion-oficinas-providencia",
    title: "Habilitación de oficinas Providencia",
    category: "Remodelación",
    location: "Providencia, RM",
    year: 2024,
    surface: "950 m²",
    duration: "4 meses",
    client: "Empresa ejemplo",
    summary:
      "Remodelación integral de dos plantas de oficinas en edificio operativo, ejecutada en turnos para no interrumpir la operación.",
    scope: [
      "Demolición selectiva",
      "Tabiquería, cielos y pavimentos",
      "Climatización e iluminación",
      "Mobiliario fijo y terminaciones",
    ],
    image: "/images/proyectos/oficinas.svg",
  },
  {
    slug: "centro-logistico-san-bernardo",
    title: "Centro logístico San Bernardo",
    category: "Industrial",
    location: "San Bernardo, RM",
    year: 2023,
    surface: "5.100 m²",
    duration: "11 meses",
    client: "Operador logístico ejemplo",
    summary:
      "Obra civil y montaje de centro de distribución con andenes de carga, oficinas y estacionamientos.",
    scope: [
      "Movimiento de tierra y compactación",
      "Obra civil y andenes de carga",
      "Estructura metálica",
      "Urbanización y estacionamientos",
    ],
    image: "/images/proyectos/centro-logistico.svg",
  },
  {
    slug: "ampliacion-colegio-maipu",
    title: "Ampliación colegio Maipú",
    category: "Edificación",
    location: "Maipú, RM",
    year: 2023,
    surface: "1.400 m²",
    duration: "7 meses",
    client: "Corporación educacional ejemplo",
    summary:
      "Ampliación de 8 salas de clases y laboratorio, ejecutada durante período de vacaciones para asegurar el inicio del año escolar.",
    scope: [
      "Obra gruesa de 2 niveles",
      "Instalaciones y climatización",
      "Terminaciones y mobiliario",
      "Accesibilidad universal",
    ],
    image: "/images/proyectos/colegio.svg",
  },
];

export const projectCategories = [
  "Todos",
  ...Array.from(new Set(projects.map((p) => p.category))),
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
