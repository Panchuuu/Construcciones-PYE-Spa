import { z } from "zod";

/**
 * Contrato de datos del formulario de cotización.
 * Se usa TANTO en el cliente (validación inmediata) COMO en el servidor
 * (validación real, la única que se puede confiar).
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre completo")
    .max(80, "El nombre es demasiado largo"),

  email: z
    .string()
    .trim()
    .min(1, "Necesitamos tu correo para responderte")
    .email("Revisa el formato del correo"),

  phone: z
    .string()
    .trim()
    .min(8, "Ingresa un teléfono de contacto")
    .max(20, "El teléfono es demasiado largo")
    .regex(/^[0-9+()\s-]+$/, "El teléfono solo puede tener números y + ( ) -"),

  service: z.string().trim().min(1, "Selecciona un servicio"),

  location: z
    .string()
    .trim()
    .max(80, "La ubicación es demasiado larga")
    .optional()
    .or(z.literal("")),

  message: z
    .string()
    .trim()
    .min(20, "Cuéntanos un poco más del proyecto (mínimo 20 caracteres)")
    .max(2000, "El mensaje es demasiado largo"),

  /** Campo trampa para bots: debe llegar vacío. No se muestra a las personas. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Respuesta uniforme de la API de contacto. */
export type ContactResponse =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
