import "server-only";

import { site } from "@/backend/config/site";
import type { ContactInput } from "@/backend/schemas/contact.schema";
import { sendMail, type SendResult } from "@/backend/services/mailer.service";

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
      <td style="padding:10px 16px;background:#f5f7fa;font:600 13px/1.4 Arial,sans-serif;color:#455571;width:150px;vertical-align:top">${label}</td>
      <td style="padding:10px 16px;font:400 14px/1.5 Arial,sans-serif;color:#1a2032">${escapeHtml(value)}</td>
    </tr>`;
}

/** Lógica de negocio: convierte una solicitud validada en un correo para la empresa. */
export async function submitQuoteRequest(
  input: ContactInput,
): Promise<SendResult> {
  const receivedAt = new Date().toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "full",
    timeStyle: "short",
  });

  const location = input.location?.trim() || "No indicada";

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
  ].join("\n");

  const html = `
  <div style="background:#eaeef5;padding:28px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d3dae7">
      <tr>
        <td style="background:#0d1220;padding:22px 24px">
          <p style="margin:0;font:800 18px/1.2 Arial,sans-serif;color:#ffffff">
            Nueva solicitud de cotización
          </p>
          <p style="margin:6px 0 0;font:600 12px/1.4 Arial,sans-serif;color:#d1322d;letter-spacing:.14em;text-transform:uppercase">
            ${escapeHtml(site.legalName)}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${row("Nombre", input.name)}
            ${row("Correo", input.email)}
            ${row("Teléfono", input.phone)}
            ${row("Servicio", input.service)}
            ${row("Ubicación", location)}
            ${row("Recibida", receivedAt)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 24px">
          <p style="margin:0 0 8px;font:700 13px/1.4 Arial,sans-serif;color:#455571">MENSAJE</p>
          <div style="padding:16px;background:#f5f7fa;border-left:4px solid #d1322d;border-radius:8px;font:400 14px/1.6 Arial,sans-serif;color:#1a2032;white-space:pre-wrap">${escapeHtml(
            input.message,
          )}</div>
          <p style="margin:20px 0 0;font:400 12px/1.5 Arial,sans-serif;color:#7e91b0">
            Responde directamente a este correo para contactar a ${escapeHtml(input.name)}.
          </p>
        </td>
      </tr>
    </table>
  </div>`;

  return sendMail({
    subject: `Cotización web — ${input.service} — ${input.name}`,
    html,
    text,
    replyTo: input.email,
  });
}
