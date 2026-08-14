import "server-only";

import { Resend } from "resend";

import { env, isMailConfigured } from "@/backend/config/env";

export type SendResult =
  | { delivered: true }
  | { delivered: false; reason: "not-configured" | "provider-error"; detail?: string };

let client: Resend | null = null;

function getClient() {
  if (!client) client = new Resend(env.resendApiKey);
  return client;
}

/**
 * Envía un correo mediante Resend.
 * Si no hay API key configurada, NO falla en silencio: devuelve
 * `not-configured` para que la interfaz ofrezca WhatsApp como alternativa.
 */
export async function sendMail({
  subject,
  html,
  text,
  replyTo,
  to,
}: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Destinatario; si se omite, va al correo de la empresa. */
  to?: string;
}): Promise<SendResult> {
  if (!isMailConfigured) {
    if (!env.isProduction) {
      console.warn(
        "[mailer] RESEND_API_KEY no configurada. El correo NO se envió.\n" +
          `Asunto: ${subject}\n${text}`,
      );
    }
    return { delivered: false, reason: "not-configured" };
  }

  try {
    const { error } = await getClient().emails.send({
      from: env.contactFromEmail,
      to: [to ?? env.contactToEmail],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error("[mailer] Resend devolvió un error:", error);
      return {
        delivered: false,
        reason: "provider-error",
        detail: error.message,
      };
    }

    return { delivered: true };
  } catch (error) {
    console.error("[mailer] Fallo inesperado al enviar el correo:", error);
    return { delivered: false, reason: "provider-error" };
  }
}
