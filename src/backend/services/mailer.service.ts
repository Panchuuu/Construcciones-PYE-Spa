import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

import { env, isMailConfigured, isSmtpConfigured } from "@/backend/config/env";

export type SendResult =
  | { delivered: true }
  | { delivered: false; reason: "not-configured" | "provider-error"; detail?: string };

/** Archivo adjunto (por ejemplo, el PDF de un acta de entrega). */
export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

let smtpClient: Transporter | null = null;
let resendClient: Resend | null = null;

function getSmtp() {
  if (!smtpClient) {
    smtpClient = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      // 465 usa TLS implícito; 587 usa STARTTLS (secure: false lo negocia).
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return smtpClient;
}

function getResend() {
  if (!resendClient) resendClient = new Resend(env.resendApiKey);
  return resendClient;
}

/**
 * Envía un correo. Usa SMTP si está configurado (p. ej. Gmail con
 * contraseña de aplicación); si no, intenta con Resend.
 * Si no hay nada configurado, NO falla en silencio: devuelve
 * `not-configured` para que la interfaz ofrezca WhatsApp como alternativa.
 */
export async function sendMail({
  subject,
  html,
  text,
  replyTo,
  to,
  attachments,
}: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Destinatario; si se omite, va al correo de la empresa. */
  to?: string;
  attachments?: MailAttachment[];
}): Promise<SendResult> {
  if (!isMailConfigured) {
    if (!env.isProduction) {
      console.warn(
        "[mailer] Sin SMTP ni RESEND_API_KEY configurados. El correo NO se envió.\n" +
          `Asunto: ${subject}\n${text}`,
      );
    }
    return { delivered: false, reason: "not-configured" };
  }

  const recipient = to ?? env.contactToEmail;

  if (isSmtpConfigured) {
    try {
      await getSmtp().sendMail({
        from: env.contactFromEmail,
        to: recipient,
        subject,
        html,
        text,
        replyTo,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      return { delivered: true };
    } catch (error) {
      console.error("[mailer] SMTP falló al enviar el correo:", error);
      return {
        delivered: false,
        reason: "provider-error",
        detail: error instanceof Error ? error.message : undefined,
      };
    }
  }

  try {
    const { error } = await getResend().emails.send({
      from: env.contactFromEmail,
      to: [recipient],
      subject,
      html,
      text,
      replyTo,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        contentType: a.contentType,
      })),
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
