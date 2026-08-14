import "server-only";

import { site } from "@/backend/config/site";
import { DELIVERY_TYPES, type DeliveryType } from "@/backend/schemas/admin.schema";
import {
  formatFolio,
  parseItems,
} from "@/backend/services/deliveries.service";
import { sendMail } from "@/backend/services/mailer.service";
import type { Prisma } from "@/generated/prisma/client";

type DeliveryWithWork = Prisma.DeliveryGetPayload<{
  include: { work: { include: { client: true } } };
}>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(date: Date) {
  return date.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "full",
    timeStyle: "short",
  });
}

/** Resumen en texto plano del acta (correo y WhatsApp). */
export function buildDeliveryText(delivery: DeliveryWithWork) {
  const items = parseItems(delivery.itemsJson);
  const lines = [
    `${site.name} — Acta de entrega ${formatFolio(delivery.folio)}`,
    "",
    `Tipo: ${DELIVERY_TYPES[delivery.type as DeliveryType] ?? delivery.type}`,
    `Fecha: ${formatDate(delivery.date)}`,
    `Cliente: ${delivery.work.client.name}`,
    `Trabajo: ${delivery.work.title}`,
  ];

  if (delivery.work.location) lines.push(`Ubicación: ${delivery.work.location}`);

  if (items.length > 0) {
    lines.push("", "Materiales entregados:");
    for (const item of items) {
      lines.push(
        `• ${item.descripcion} — ${item.cantidad}${item.unidad ? ` ${item.unidad}` : ""}`,
      );
    }
  }

  if (delivery.notes) lines.push("", `Observaciones: ${delivery.notes}`);

  lines.push(
    "",
    `Recibido ${delivery.receivedOk ? "CONFORME" : "CON OBSERVACIONES"} por ${delivery.clientSignerName}${
      delivery.clientSignerRut ? ` (RUT ${delivery.clientSignerRut})` : ""
    }.`,
    `Entregó por ${site.name}: ${delivery.companySignerName}.`,
    "Documento firmado por ambas partes.",
  );

  return lines.join("\n");
}

/** Enlace de WhatsApp al cliente con el resumen del acta precargado. */
export function buildDeliveryWhatsAppUrl(delivery: DeliveryWithWork) {
  const phone = delivery.work.client.phone?.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(buildDeliveryText(delivery));
  return phone
    ? `https://wa.me/${phone}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

/** Envía el detalle del acta al correo del cliente. */
export async function sendDeliveryEmail(delivery: DeliveryWithWork) {
  const to = delivery.work.client.email;
  if (!to) {
    return {
      delivered: false as const,
      reason: "no-email" as const,
    };
  }

  const items = parseItems(delivery.itemsJson);
  const folio = formatFolio(delivery.folio);
  const typeLabel =
    DELIVERY_TYPES[delivery.type as DeliveryType] ?? delivery.type;

  const rows = [
    ["Tipo", typeLabel],
    ["Fecha", formatDate(delivery.date)],
    ["Cliente", delivery.work.client.name],
    ["Trabajo", delivery.work.title],
    ...(delivery.work.location ? [["Ubicación", delivery.work.location]] : []),
    [
      "Recibido por",
      `${delivery.clientSignerName}${delivery.clientSignerRut ? ` — RUT ${delivery.clientSignerRut}` : ""}`,
    ],
    ["Entregó", delivery.companySignerName],
    [
      "Estado",
      delivery.receivedOk ? "Recibido conforme" : "Recibido con observaciones",
    ],
  ]
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 16px;background:#f5f7fa;font:600 13px/1.4 Arial,sans-serif;color:#455571;width:150px;vertical-align:top">${label}</td>
        <td style="padding:10px 16px;font:400 14px/1.5 Arial,sans-serif;color:#1a2032">${escapeHtml(String(value))}</td>
      </tr>`,
    )
    .join("");

  const itemsHtml =
    items.length > 0
      ? `
      <tr><td colspan="2" style="padding:14px 16px 4px;font:700 13px/1.4 Arial,sans-serif;color:#455571">MATERIALES ENTREGADOS</td></tr>
      ${items
        .map(
          (item) => `
        <tr>
          <td colspan="2" style="padding:6px 16px;font:400 14px/1.5 Arial,sans-serif;color:#1a2032;border-bottom:1px solid #eaeef5">
            • ${escapeHtml(item.descripcion)} — <strong>${escapeHtml(item.cantidad)}${item.unidad ? ` ${escapeHtml(item.unidad)}` : ""}</strong>
          </td>
        </tr>`,
        )
        .join("")}`
      : "";

  const html = `
  <div style="background:#eaeef5;padding:28px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d3dae7">
      <tr>
        <td style="background:#0d1220;padding:22px 24px">
          <p style="margin:0;font:800 18px/1.2 Arial,sans-serif;color:#ffffff">
            Acta de entrega ${folio}
          </p>
          <p style="margin:6px 0 0;font:600 12px/1.4 Arial,sans-serif;color:#d1322d;letter-spacing:.14em;text-transform:uppercase">
            ${escapeHtml(site.legalName)}
          </p>
        </td>
      </tr>
      <tr><td style="padding:8px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}${itemsHtml}</table>
      </td></tr>
      ${
        delivery.notes
          ? `<tr><td style="padding:8px 24px 8px">
              <p style="margin:0 0 8px;font:700 13px/1.4 Arial,sans-serif;color:#455571">OBSERVACIONES</p>
              <div style="padding:14px;background:#f5f7fa;border-left:4px solid #d1322d;border-radius:8px;font:400 14px/1.6 Arial,sans-serif;color:#1a2032;white-space:pre-wrap">${escapeHtml(delivery.notes)}</div>
            </td></tr>`
          : ""
      }
      <tr><td style="padding:12px 24px 24px">
        <p style="margin:0;font:400 12px/1.6 Arial,sans-serif;color:#7e91b0">
          Este documento fue firmado en pantalla por ambas partes al momento
          de la entrega. Ante cualquier duda, responde este correo o llámanos
          al ${site.contact.phoneDisplay}.
        </p>
      </td></tr>
    </table>
  </div>`;

  return sendMail({
    to,
    subject: `Acta de entrega ${folio} — ${delivery.work.title} — ${site.name}`,
    html,
    text: buildDeliveryText(delivery),
  });
}
