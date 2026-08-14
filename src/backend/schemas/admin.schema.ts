import { z } from "zod";

/** Contratos de datos del panel de administración. */

export const clientSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre del cliente").max(100),
  rut: z
    .string()
    .trim()
    .max(15, "RUT demasiado largo")
    .optional()
    .or(z.literal("")),
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
    clientSignerRut: z.string().trim().max(15).optional().or(z.literal("")),
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
