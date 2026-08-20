import { z } from "zod";

import { formatRut, isValidRut } from "@/backend/lib/rut";

/** Contratos de datos del panel de administración. */

/**
 * RUT chileno opcional: si viene, debe tener dígito verificador válido
 * (acepta K) y se guarda siempre con formato "12.345.678-5".
 */
const rutSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isValidRut(value), {
    message: "RUT no válido: revisa el número y el dígito verificador",
  })
  .transform((value) => (value === "" ? "" : formatRut(value)));

export const clientSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre del cliente").max(100),
  rut: rutSchema.optional(),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo no válido")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+()\s-]*$/, "El teléfono solo puede tener números y + ( ) -")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(150).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const WORK_STATUSES = {
  en_progreso: "En progreso",
  entregado: "Entregado",
} as const;

export type WorkStatus = keyof typeof WORK_STATUSES;

export const workSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  title: z.string().trim().min(3, "Describe el trabajo").max(150),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  location: z.string().trim().max(150).optional().or(z.literal("")),
  status: z.enum(["en_progreso", "entregado"]),
});

export type WorkInput = z.infer<typeof workSchema>;

export const DELIVERY_TYPES = {
  trabajo: "Entrega de trabajo",
  materiales: "Entrega de materiales",
} as const;

export type DeliveryType = keyof typeof DELIVERY_TYPES;

/** Firma dibujada en pantalla, exportada como imagen PNG. */
const signatureSchema = z
  .string()
  .startsWith("data:image/png;base64,", "Falta la firma")
  .max(300_000, "La firma es demasiado pesada, dibújala de nuevo");

export const materialItemSchema = z.object({
  descripcion: z.string().trim().min(1, "Describe el material").max(150),
  cantidad: z.string().trim().min(1, "Indica la cantidad").max(20),
  unidad: z.string().trim().max(20).optional().or(z.literal("")),
});

export type MaterialItem = z.infer<typeof materialItemSchema>;

export const deliverySchema = z
  .object({
    workId: z.string().min(1, "Selecciona un trabajo"),
    type: z.enum(["trabajo", "materiales"]),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    items: z.array(materialItemSchema).default([]),
    companySignerName: z
      .string()
      .trim()
      .min(3, "Nombre del representante de la empresa")
      .max(100),
    clientSignerName: z
      .string()
      .trim()
      .min(3, "Nombre de quien recibe")
      .max(100),
    clientSignerRut: rutSchema.optional(),
    companySignature: signatureSchema,
    clientSignature: signatureSchema,
    receivedOk: z.boolean().default(true),
  })
  .refine(
    (data) => data.type !== "materiales" || data.items.length > 0,
    {
      path: ["items"],
      message: "Agrega al menos un material a la entrega",
    },
  );

export type DeliveryInput = z.infer<typeof deliverySchema>;

/**
 * Representante de la empresa con su firma guardada.
 * Al editar, la firma puede venir vacía: se conserva la que ya tenía.
 */
export const signerSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre completo").max(100),
  role: z.string().trim().max(60).optional().or(z.literal("")),
  signature: z
    .string()
    .refine(
      (value) => value === "" || value.startsWith("data:image/png;base64,"),
      { message: "Falta la firma" },
    )
    .refine((value) => value.length <= 300_000, {
      message: "La firma es demasiado pesada, súbela de nuevo",
    }),
  isDefault: z.boolean().default(false),
});

export type SignerInput = z.infer<typeof signerSchema>;

/** Convierte un título en slug para la URL: "Galpón Lampa" → "galpon-lampa". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const PROJECT_CATEGORIES = [
  "Hojalatería",
  "Techumbres",
  "Edificación",
  "Vivienda",
  "Industrial",
  "Remodelación",
  "Obra gruesa",
  "Montaje",
] as const;

const currentYear = new Date().getFullYear();

export const projectSchema = z.object({
  title: z.string().trim().min(3, "Escribe el nombre de la obra").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((value) => value?.trim() ?? ""),
  category: z.string().trim().min(3, "Indica la categoría").max(40),
  location: z.string().trim().min(3, "Indica la ubicación").max(120),
  year: z.coerce
    .number()
    .int("El año debe ser un número")
    .min(1990, "Año demasiado antiguo")
    .max(currentYear + 1, "Año demasiado lejano"),
  surface: z.string().trim().min(1, "Indica la superficie").max(40),
  duration: z.string().trim().min(1, "Indica la duración").max(40),
  client: z.string().trim().min(2, "Indica el mandante").max(120),
  summary: z.string().trim().min(20, "Describe la obra").max(1000),
  /** Un hito por línea en el formulario. */
  scope: z.array(z.string().trim().min(1).max(200)).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/* ── Presupuestos ──────────────────────────────────────────── */

/**
 * Cantidad de una partida: acepta coma o punto decimal ("13,00").
 * Se guarda como número.
 */
const quantitySchema = z
  .string()
  .trim()
  .min(1, "Indica la cantidad")
  .transform((value) => Number(value.replace(/\./g, "").replace(",", ".")))
  .refine((value) => Number.isFinite(value) && value > 0, {
    message: "Cantidad no válida",
  });

/** Precio en pesos chilenos, sin decimales. */
const priceSchema = z.coerce
  .number()
  .int("El precio debe ser un número entero")
  .min(0, "Precio no válido")
  .max(9_999_999_999, "Precio demasiado grande");

export const budgetItemSchema = z.object({
  descripcion: z.string().trim().min(1, "Describe la partida").max(600),
  unidad: z.string().trim().max(10).optional().or(z.literal("")),
  cantidad: quantitySchema,
  precio: priceSchema,
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

export const budgetSchema = z.object({
  clientId: z.string().trim().optional().or(z.literal("")),
  clientName: z.string().trim().max(120).optional().or(z.literal("")),
  clientRut: rutSchema.optional(),
  clientPhone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+()\s-]*$/, "El teléfono solo puede tener números y + ( ) -")
    .optional()
    .or(z.literal("")),
  clientEmail: z
    .string()
    .trim()
    .email("Correo no válido")
    .optional()
    .or(z.literal("")),
  workAddress: z.string().trim().max(150).optional().or(z.literal("")),
  workPlace: z.string().trim().max(150).optional().or(z.literal("")),
  workTitle: z.string().trim().min(3, "Escribe el título de la obra").max(200),
  date: z.coerce.date(),
  validityDays: z.coerce
    .number()
    .int("Debe ser un número de días")
    .min(1, "Mínimo 1 día")
    .max(365, "Máximo 365 días"),
  items: z.array(budgetItemSchema).min(1, "Agrega al menos una partida"),
  conditions: z.string().trim().max(6000).optional().or(z.literal("")),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

/** Condiciones comerciales precargadas al crear un presupuesto. */
export const DEFAULT_BUDGET_CONDITIONS = [
  "Plazos de ejecución. Se informarán en la aceptación del presupuesto y se cuentan desde la entrega del recinto en condiciones de intervención.",
  "Forma de pago. Según acuerdo entre las partes.",
  "Alcance. Los valores incluyen materiales, mano de obra especializada, herramientas, supervisión de faena y retiro de escombros. Se excluyen obras no descritas expresamente en el detalle, modificaciones estructurales, permisos municipales y trabajos derivados de condiciones preexistentes no visibles al momento de la visita.",
  "Garantía. Construcciones PYE SpA se hace responsable de la ejecución, supervisión y garantía de la totalidad de las partidas, incluidas aquellas ejecutadas mediante terceros especialistas.",
  "Obras adicionales. Toda partida no contemplada será cotizada y aprobada por escrito antes de su ejecución.",
  "Validez. La presente oferta tiene validez desde su fecha de emisión por los días indicados. Los valores están expresados en pesos chilenos.",
].join("\n");

export const QUOTE_STATUSES = {
  nueva: "Nueva",
  contactada: "Contactada",
  cerrada: "Cerrada",
} as const;

export type QuoteStatus = keyof typeof QUOTE_STATUSES;

/** Convierte los issues de Zod en un mapa campo → primer error. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
