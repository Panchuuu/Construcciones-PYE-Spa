import "server-only";

import { site } from "@/backend/config/site";
import type { ContactInput } from "@/backend/schemas/contact.schema";
import { sendMail, type SendResult } from "@/backend/services/mailer.service";
import { sendPushAlert } from "@/backend/services/push-alert.service";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 16px;background:#f5f7fa;font:600 13px/1.4 Arial,sans-serif;color:#455571;width:130px;vertical-align:top">${label}</td>
      <td style="padding:10px 16px;font:400 14px/1.5 Arial,sans-serif;color:#1a2032">${escapeHtml(value)}</td>
    </tr>`;
}

/** Número del cliente en formato internacional, para el enlace de WhatsApp. */
function whatsappDigits(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("56")) return digits;
  // Números chilenos escritos sin el prefijo del país.
  return `56${digits.replace(/^0+/, "")}`;
}

/** Lógica de negocio: convierte una solicitud validada en un aviso para la empresa. */
export async function submitQuoteRequest(
  input: ContactInput,
  /** Id en la base de datos, para enlazar directo a la ficha del panel. */
  quoteId?: string,
): Promise<SendResult> {
  const receivedAt = new Date().toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "full",
    timeStyle: "short",
  });

  const location = input.location?.trim() || "No indicada";
  const firstName = input.name.trim().split(/\s+/)[0];

  // Acciones de un toque desde el celular.
  const waHref = `https://wa.me/${whatsappDigits(input.phone)}?text=${encodeURIComponent(
    `Hola ${firstName}, te contactamos de ${site.name} por tu solicitud de cotización (${input.service}).`,
  )}`;
  const telHref = `tel:${input.phone.replace(/\s/g, "")}`;
  const panelHref = quoteId
    ? `${site.url}/admin/cotizaciones/${quoteId}`
    : `${site.url}/admin/cotizaciones`;

  const text = [
    `Nueva solicitud de cotización — ${site.name}`,
    "",
    `Nombre:    ${input.name}`,
    `Correo:    ${input.email}`,
    `Teléfono:  ${input.phone}`,
    `Servicio:  ${input.service}`,
    `Ubicación: ${location}`,
    `Recibida:  ${receivedAt}`,
    "",
    "Mensaje:",
    input.message,
    "",
    `Responder por WhatsApp: ${waHref}`,
    `Ver en el panel: ${panelHref}`,
  ].join("\n");

  const boton = (href: string, label: string, bg: string, color: string) => `
    <td style="padding:0 6px">
      <a href="${href}" style="display:block;padding:14px 18px;border-radius:10px;background:${bg};color:${color};font:700 15px/1 Arial,sans-serif;text-align:center;text-decoration:none">${label}</a>
    </td>`;

  const html = `
  <div style="background:#eaeef5;padding:20px 10px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d3dae7">
      <tr>
        <td style="background:#0d1220;padding:20px 22px">
          <p style="margin:0;font:800 18px/1.2 Arial,sans-serif;color:#ffffff">
            Nueva cotización: ${escapeHtml(input.name)}
          </p>
          <p style="margin:6px 0 0;font:600 12px/1.4 Arial,sans-serif;color:#d1322d;letter-spacing:.14em;text-transform:uppercase">
            ${escapeHtml(input.service)}
          </p>
        </td>
      </tr>

      <!-- Acciones primero: desde el celular se responde de un toque -->
      <tr>
        <td style="padding:18px 16px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              ${boton(waHref, "Responder por WhatsApp", "#25D366", "#ffffff")}
              ${boton(telHref, "Llamar", "#0d1220", "#ffffff")}
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:8px 0">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${row("Nombre", input.name)}
            ${row("Teléfono", input.phone)}
            ${row("Correo", input.email)}
            ${row("Servicio", input.service)}
            ${row("Ubicación", location)}
            ${row("Recibida", receivedAt)}
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:8px 22px 22px">
          <p style="margin:0 0 8px;font:700 13px/1.4 Arial,sans-serif;color:#455571">MENSAJE</p>
          <div style="padding:16px;background:#f5f7fa;border-left:4px solid #d1322d;border-radius:8px;font:400 15px/1.6 Arial,sans-serif;color:#1a2032;white-space:pre-wrap">${escapeHtml(
            input.message,
          )}</div>

          <p style="margin:20px 0 0;font:400 13px/1.6 Arial,sans-serif;color:#7e91b0">
            También puedes responder este mismo correo para escribirle a
            ${escapeHtml(firstName)}, o
            <a href="${panelHref}" style="color:#d1322d;font-weight:bold">verla en el panel</a>
            para marcarla como contactada.
          </p>
        </td>
      </tr>
    </table>
  </div>`;

  // Aviso al celular (si está configurado). No bloquea ni rompe el envío.
  await sendPushAlert(
    `🔔 Nueva cotización en ${site.name}\n` +
      `${firstName} — ${input.service}\n` +
      `Ver: ${panelHref}`,
  );

  return sendMail({
    subject: `Cotización web — ${input.service} — ${input.name}`,
    html,
    text,
    replyTo: input.email,
  });
}
