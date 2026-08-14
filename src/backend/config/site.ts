/**
 * ────────────────────────────────────────────────────────────────
 *  DATOS DE LA EMPRESA — edita SOLO este archivo para actualizar
 *  el sitio completo (teléfonos, correos, dirección, redes, etc.)
 *
 *  Los valores marcados con  ⚠️ REEMPLAZAR  son provisorios.
 * ────────────────────────────────────────────────────────────────
 */

export const site = {
  name: "Construcciones PYE",
  legalName: "Construcciones PYE SpA",
  shortName: "PYE",
  /** ⚠️ REEMPLAZAR — RUT de la empresa */
  rut: "77.XXX.XXX-X",
  tagline: "Construimos con estándar, plazo y palabra.",
  description:
    "Empresa constructora chilena especializada en obra gruesa, edificación, remodelación y montaje industrial. Ejecutamos proyectos con planificación rigurosa, seguridad certificada y entrega en plazo.",

  /** URL final del sitio (se usa en SEO, sitemap y Open Graph) */
  /** ⚠️ REEMPLAZAR cuando tengas el dominio definitivo */
  url: "https://construccionespye.cl",

  foundedYear: 2015,

  contact: {
    /** ⚠️ REEMPLAZAR — formato internacional, sin espacios */
    phone: "+56912345678",
    phoneDisplay: "+56 9 1234 5678",
    /** Número de WhatsApp en formato internacional sin "+" ni espacios */
    whatsapp: "56912345678",
    /** ⚠️ REEMPLAZAR */
    email: "contacto@construccionespye.cl",
    /** ⚠️ REEMPLAZAR */
    address: "Av. Ejemplo 1234, Oficina 56",
    city: "Santiago",
    region: "Región Metropolitana",
    country: "Chile",
    hours: "Lunes a viernes, 08:30 – 18:30 hrs",
  },

  social: {
    /** ⚠️ REEMPLAZAR o dejar en "" para ocultar el ícono */
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    linkedin: "https://linkedin.com/",
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

export const stats = [
  { value: "10+", label: "Años de experiencia" },
  { value: "120+", label: "Proyectos entregados" },
  { value: "85.000", label: "m² construidos" },
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
