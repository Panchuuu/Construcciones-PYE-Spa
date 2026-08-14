/**
 * ────────────────────────────────────────────────────────────────
 *  DATOS DE LA EMPRESA — edita SOLO este archivo para actualizar
 *  el sitio completo (teléfonos, correos, dirección, redes, etc.)
 * ────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Construcciones PYE",
  legalName: "Construcciones PYE SpA",
  shortName: "PYE",
  rut: "77.200.759-0",
  tagline: "Fabricación & Montaje",
  description:
    "Empresa constructora chilena especializada en hojalatería, techumbres, obra gruesa, edificación, remodelación y montaje. Ejecutamos proyectos con planificación rigurosa, seguridad certificada y entrega en plazo.",

  /** URL final del sitio (se usa en SEO, sitemap y Open Graph) */
  url: "https://construccionespyespa.cl",

  foundedYear: 2022,

  contact: {
    phone: "+56954249184",
    phoneDisplay: "+56 9 5424 9184",
    /** Número de WhatsApp en formato internacional sin "+" ni espacios */
    whatsapp: "56954249184",
    email: "construccionespyespa@gmail.com",
    address: "Las Torpederas 638, El Bosque",
    city: "Santiago",
    region: "Región Metropolitana",
    country: "Chile",
    hours: "Lunes a viernes, 08:30 – 18:30 hrs",
  },

  /** Deja una red en "" para que no aparezca su ícono en el sitio. */
  social: {
    instagram: "https://www.instagram.com/construccionesparra/",
    facebook: "",
    linkedin: "",
  },

  /** Áreas geográficas donde opera la empresa */
  coverage: [
    "Región Metropolitana",
    "Valparaíso",
    "O'Higgins",
    "Maule",
    "Biobío",
  ],
} as const;

/** Años de trayectoria, calculados solos para que nunca queden desactualizados. */
export const yearsOfExperience = new Date().getFullYear() - site.foundedYear;

/**
 * ⚠️ CONFIRMAR las tres últimas cifras antes de publicar el sitio:
 * son estimaciones provisorias, no datos reales de la empresa.
 */
export const stats = [
  { value: `${yearsOfExperience}`, label: "Años de experiencia" },
  { value: "40+", label: "Proyectos entregados" },
  { value: "12.000", label: "m² construidos" },
  { value: "0", label: "Accidentes con tiempo perdido" },
] as const;

/** Mensaje precargado al abrir WhatsApp */
export const whatsappMessage =
  "Hola Construcciones PYE, quiero cotizar un proyecto.";

export const whatsappUrl = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
] as const;
