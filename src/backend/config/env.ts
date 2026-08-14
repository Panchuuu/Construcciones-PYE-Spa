import "server-only";

import { site } from "@/backend/config/site";

/**
 * Variables de entorno del servidor.
 * Se leen una sola vez y nunca se exponen al navegador.
 * Copia .env.example a .env.local para configurarlas.
 */
export const env = {
  /**
   * Servidor SMTP para enviar correos (opción recomendada).
   * Para Gmail: SMTP_HOST=smtp.gmail.com, SMTP_USER=cuenta@gmail.com y
   * SMTP_PASS=contraseña de aplicación (NO la contraseña normal de la
   * cuenta; se crea en https://myaccount.google.com/apppasswords).
   */
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",

  /** API key de Resend (https://resend.com). Alternativa a SMTP. */
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  /** Correo que RECIBE las cotizaciones. Por defecto, el de la empresa. */
  contactToEmail: process.env.CONTACT_TO_EMAIL || site.contact.email,

  /**
   * Remitente de los correos.
   * Con SMTP de Gmail debe ser la misma cuenta (Gmail lo fuerza).
   * Con Resend debe ser un dominio verificado ahí.
   */
  contactFromEmail:
    process.env.CONTACT_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "Sitio web <onboarding@resend.dev>",

  isProduction: process.env.NODE_ENV === "production",
} as const;

/** ¿Hay SMTP completo configurado? */
export const isSmtpConfigured = Boolean(
  env.smtpHost && env.smtpUser && env.smtpPass,
);

/** ¿Está el envío de correos operativo (por cualquiera de las dos vías)? */
export const isMailConfigured = isSmtpConfigured || Boolean(env.resendApiKey);
