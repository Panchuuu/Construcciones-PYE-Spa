import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { site } from "@/backend/config/site";
import { DELIVERY_TYPES, type DeliveryType } from "@/backend/schemas/admin.schema";
import { formatFolio, parseItems } from "@/backend/services/deliveries.service";
import type { getDelivery } from "@/backend/services/deliveries.service";

type DeliveryWithWork = NonNullable<Awaited<ReturnType<typeof getDelivery>>>;

/* Paleta del documento (coherente con el sitio). */
const INK = rgb(0.1, 0.13, 0.2); // texto principal
const MUTED = rgb(0.42, 0.47, 0.56); // etiquetas
const LINE = rgb(0.83, 0.86, 0.91); // bordes
const BRAND = rgb(0.82, 0.2, 0.18); // acento rojo
const PAGE_W = 595.28; // A4 vertical, en puntos
const PAGE_H = 841.89;
const MARGIN = 48;

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** pdf-lib no parte líneas solo: cortamos el texto al ancho disponible. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

/**
 * Genera el acta de entrega como PDF (una página A4) con los datos,
 * los materiales (si corresponde) y las dos firmas dibujadas en pantalla.
 */
export async function generateDeliveryPdf(
  delivery: DeliveryWithWork,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  const contentWidth = PAGE_W - MARGIN * 2;
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  /* ── Encabezado ── */
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 8,
    width: PAGE_W,
    height: 8,
    color: BRAND,
  });

  page.drawText(site.legalName, {
    x: MARGIN,
    y: (y -= 24),
    size: 16,
    font: bold,
    color: INK,
  });
  page.drawText(`RUT ${site.rut} · ${site.contact.address}, ${site.contact.city}`, {
    x: MARGIN,
    y: (y -= 16),
    size: 9,
    font: regular,
    color: MUTED,
  });
  page.drawText(`${site.contact.phoneDisplay} · ${site.contact.email}`, {
    x: MARGIN,
    y: (y -= 13),
    size: 9,
    font: regular,
    color: MUTED,
  });

  // Folio en la esquina superior derecha
  const folioText = `ACTA ${formatFolio(delivery.folio)}`;
  page.drawText(folioText, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(folioText, 14),
    y: PAGE_H - MARGIN - 24,
    size: 14,
    font: bold,
    color: BRAND,
  });

  y -= 18;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: LINE,
  });

  /* ── Título ── */
  const typeLabel =
    DELIVERY_TYPES[delivery.type as DeliveryType] ?? delivery.type;
  page.drawText(`${typeLabel.toUpperCase()} — ENTREGA CONFORME`, {
    x: MARGIN,
    y: (y -= 30),
    size: 13,
    font: bold,
    color: INK,
  });

  /* ── Datos generales ── */
  const rows: Array<[string, string]> = [
    ["Fecha", formatDate(delivery.date)],
    ["Cliente", delivery.work.client.name],
    ...(delivery.work.client.rut
      ? ([["RUT cliente", delivery.work.client.rut]] as Array<[string, string]>)
      : []),
    ["Trabajo", delivery.work.title],
    ...(delivery.work.location
      ? ([["Ubicación", delivery.work.location]] as Array<[string, string]>)
      : []),
    [
      "Recibido conforme",
      delivery.receivedOk ? "Sí, sin observaciones" : "Con observaciones",
    ],
  ];

  y -= 10;
  for (const [label, value] of rows) {
    ensureSpace(20);
    page.drawText(label.toUpperCase(), {
      x: MARGIN,
      y: (y -= 18),
      size: 8,
      font: bold,
      color: MUTED,
    });
    const valueLines = wrapText(value, regular, 10, contentWidth - 130);
    for (const [index, line] of valueLines.entries()) {
      if (index > 0) y -= 13;
      page.drawText(line, {
        x: MARGIN + 130,
        y,
        size: 10,
        font: regular,
        color: INK,
      });
    }
  }

  /* ── Materiales ── */
  const items = parseItems(delivery.itemsJson);
  if (items.length > 0) {
    ensureSpace(60);
    page.drawText("MATERIALES ENTREGADOS", {
      x: MARGIN,
      y: (y -= 30),
      size: 9,
      font: bold,
      color: MUTED,
    });

    y -= 8;
    const colQty = MARGIN;
    const colUnit = MARGIN + 70;
    const colDesc = MARGIN + 150;

    page.drawText("CANT.", { x: colQty, y: (y -= 16), size: 8, font: bold, color: MUTED });
    page.drawText("UNIDAD", { x: colUnit, y, size: 8, font: bold, color: MUTED });
    page.drawText("DESCRIPCIÓN", { x: colDesc, y, size: 8, font: bold, color: MUTED });
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: LINE,
    });

    for (const item of items) {
      ensureSpace(20);
      const descLines = wrapText(
        item.descripcion,
        regular,
        10,
        PAGE_W - MARGIN - colDesc,
      );
      page.drawText(item.cantidad, { x: colQty, y: (y -= 16), size: 10, font: regular, color: INK });
      page.drawText(item.unidad || "—", { x: colUnit, y, size: 10, font: regular, color: INK });
      for (const [index, line] of descLines.entries()) {
        if (index > 0) y -= 13;
        page.drawText(line, { x: colDesc, y, size: 10, font: regular, color: INK });
      }
    }
  }

  /* ── Observaciones ── */
  if (delivery.notes) {
    ensureSpace(50);
    page.drawText("OBSERVACIONES", {
      x: MARGIN,
      y: (y -= 30),
      size: 9,
      font: bold,
      color: MUTED,
    });
    for (const line of wrapText(delivery.notes, regular, 10, contentWidth)) {
      ensureSpace(15);
      page.drawText(line, {
        x: MARGIN,
        y: (y -= 15),
        size: 10,
        font: regular,
        color: INK,
      });
    }
  }

  /* ── Firmas ── */
  const SIG_W = 180;
  const SIG_H = 70;
  ensureSpace(SIG_H + 80);
  y -= 40;

  const colLeft = MARGIN;
  const colRight = PAGE_W - MARGIN - SIG_W;

  const drawSignature = async (
    dataUrl: string,
    x: number,
    signerName: string,
    signerDetail: string,
  ) => {
    // Las firmas se guardan como data URL PNG; pdf-lib espera solo el base64.
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const image = await doc.embedPng(Buffer.from(base64, "base64"));
    const scale = Math.min(SIG_W / image.width, SIG_H / image.height);

    page.drawImage(image, {
      x: x + (SIG_W - image.width * scale) / 2,
      y: y - SIG_H,
      width: image.width * scale,
      height: image.height * scale,
    });
    page.drawLine({
      start: { x, y: y - SIG_H - 6 },
      end: { x: x + SIG_W, y: y - SIG_H - 6 },
      thickness: 0.75,
      color: INK,
    });
    page.drawText(signerName, {
      x,
      y: y - SIG_H - 20,
      size: 10,
      font: bold,
      color: INK,
    });
    page.drawText(signerDetail, {
      x,
      y: y - SIG_H - 33,
      size: 8,
      font: regular,
      color: MUTED,
    });
  };

  await drawSignature(
    delivery.companySignature,
    colLeft,
    delivery.companySignerName,
    `Por ${site.legalName}`,
  );
  await drawSignature(
    delivery.clientSignature,
    colRight,
    delivery.clientSignerName,
    delivery.clientSignerRut
      ? `Recibe · RUT ${delivery.clientSignerRut}`
      : "Recibe",
  );

  y -= SIG_H + 60;

  /* ── Pie ── */
  page.drawText(
    `Documento generado por ${site.name} · ${site.url}`,
    {
      x: MARGIN,
      y: MARGIN - 20,
      size: 7.5,
      font: regular,
      color: MUTED,
    },
  );

  return doc.save();
}

/** Nombre de archivo sugerido para la descarga. */
export function deliveryPdfFilename(delivery: DeliveryWithWork) {
  const folio = String(delivery.folio).padStart(3, "0");
  return `acta-entrega-${folio}.pdf`;
}
