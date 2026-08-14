import "server-only";

import { site } from "@/backend/config/site";

/**
 * Variables de entorno del servidor.
 * Se leen una sola vez y nunca se exponen al navegador.
 * Copia .env.example a .env.local para configurarlas.
 */
export const env = {
  /** API key de Resend (https://resend.com). Sin ella, el formulario no envía correos. */
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  /** Correo que RECIBE las cotizaciones. Por defecto, el de la empresa. */
  contactToEmail: process.env.CONTACT_TO_EMAIL || site.contact.email,

  /**
   * Remitente verificado en Resend.
   * Para probar sin dominio propio se puede usar onboarding@resend.dev
   */
  contactFromEmail:
    process.env.CONTACT_FROM_EMAIL || "Sitio web <onboarding@resend.dev>",

  isProduction: process.env.NODE_ENV === "production",
} as const;

/** ¿Está el envío de correos operativo? */
export const isMailConfigured = Boolean(env.resendApiKey);
