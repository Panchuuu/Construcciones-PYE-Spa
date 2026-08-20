import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { site } from "@/backend/config/site";
import {
  budgetTotals,
  formatBudgetFolio,
  formatCLP,
  formatQuantity,
  itemTotal,
  parseBudgetItems,
  parseConditions,
  type getBudget,
} from "@/backend/services/budgets.service";

type BudgetWithClient = NonNullable<Awaited<ReturnType<typeof getBudget>>>;

/* Paleta del documento (coherente con el sitio y el acta). */
const INK = rgb(0.1, 0.13, 0.2);
const MUTED = rgb(0.42, 0.47, 0.56);
const LINE = rgb(0.83, 0.86, 0.91);
const BRAND = rgb(0.82, 0.2, 0.18);
const DARK = rgb(0.05, 0.07, 0.13); // carbon-950
const PAGE_W = 595.28; // A4 vertical
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
 * Genera el presupuesto como PDF A4: encabezado con folio, antecedentes
 * del cliente y la obra, tabla de partidas, totales con IVA, condiciones
 * comerciales numeradas y líneas de firma.
 */
export async function generateBudgetPdf(
  budget: BudgetWithClient,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  const contentWidth = PAGE_W - MARGIN * 2;
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 20) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const items = parseBudgetItems(budget.itemsJson);
  const { neto, iva, total } = budgetTotals(items);
  const folio = formatBudgetFolio(budget.folio);
  const clientName = budget.clientName || budget.client?.name || "";
  const clientRut = budget.clientRut || budget.client?.rut || "";
  const clientPhone = budget.clientPhone || budget.client?.phone || "";
  const clientEmail = budget.clientEmail || budget.client?.email || "";

  /* ── Encabezado ── */
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 8,
    width: PAGE_W,
    height: 8,
    color: BRAND,
  });

  page.drawText(site.legalName.toUpperCase(), {
    x: MARGIN,
    y: (y -= 24),
    size: 16,
    font: bold,
    color: INK,
  });
  page.drawText(`RUT: ${site.rut}`, {
    x: MARGIN,
    y: (y -= 16),
    size: 9,
    font: regular,
    color: MUTED,
  });
  page.drawText(`Fono: ${site.contact.phoneDisplay} · ${site.contact.email}`, {
    x: MARGIN,
    y: (y -= 13),
    size: 9,
    font: regular,
    color: MUTED,
  });

  const folioText = `PRESUPUESTO ${folio}`;
  page.drawText(folioText, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(folioText, 14),
    y: PAGE_H - MARGIN - 24,
    size: 14,
    font: bold,
    color: BRAND,
  });
  const dateText = `Fecha de emisión: ${formatDate(budget.date)}`;
  page.drawText(dateText, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(dateText, 9),
    y: PAGE_H - MARGIN - 40,
    size: 9,
    font: regular,
    color: MUTED,
  });
  const validityText = `Validez de la oferta: ${budget.validityDays} días corridos`;
  page.drawText(validityText, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(validityText, 9),
    y: PAGE_H - MARGIN - 53,
    size: 9,
    font: regular,
    color: MUTED,
  });

  y -= 18;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: LINE,
  });

  /* ── Antecedentes ── */
  page.drawText("ANTECEDENTES DEL CLIENTE Y DE LA OBRA", {
    x: MARGIN,
    y: (y -= 26),
    size: 9,
    font: bold,
    color: MUTED,
  });

  const half = contentWidth / 2;
  const antecedentes: Array<[string, string, string, string]> = [
    ["Señor(es)", clientName, "RUT", clientRut],
    ["Dirección obra", budget.workAddress ?? "", "Teléfono", clientPhone],
    ["Ubicación", budget.workPlace ?? "", "Correo", clientEmail],
  ];
  for (const [labelA, valueA, labelB, valueB] of antecedentes) {
    y -= 16;
    page.drawText(labelA.toUpperCase(), { x: MARGIN, y, size: 7.5, font: bold, color: MUTED });
    page.drawText(valueA || "—", { x: MARGIN + 78, y, size: 9.5, font: regular, color: INK });
    page.drawText(labelB.toUpperCase(), { x: MARGIN + half, y, size: 7.5, font: bold, color: MUTED });
    page.drawText(valueB || "—", { x: MARGIN + half + 58, y, size: 9.5, font: regular, color: INK });
  }

  /* ── Título de la obra ── */
  y -= 14;
  const obraLines = wrapText(
    `OBRA: ${budget.workTitle.toUpperCase()}`,
    bold,
    10,
    contentWidth - 20,
  );
  const obraBoxH = obraLines.length * 13 + 11;
  page.drawRectangle({
    x: MARGIN,
    y: y - obraBoxH,
    width: contentWidth,
    height: obraBoxH,
    color: DARK,
  });
  let obraY = y - 16;
  for (const line of obraLines) {
    page.drawText(line, {
      x: MARGIN + 10,
      y: obraY,
      size: 10,
      font: bold,
      color: rgb(1, 1, 1),
    });
    obraY -= 13;
  }
  y -= obraBoxH;

  /* ── Tabla de partidas ── */
  const colN = MARGIN;
  const colDesc = MARGIN + 22;
  const colUn = MARGIN + 300;
  const colQty = MARGIN + 330;
  const colPrice = MARGIN + 380;
  const colTotal = PAGE_W - MARGIN;
  const descWidth = colUn - colDesc - 8;

  const drawTableHeader = () => {
    page.drawText("N°", { x: colN, y: (y -= 20), size: 8, font: bold, color: MUTED });
    page.drawText("DESCRIPCIÓN DE LA PARTIDA", { x: colDesc, y, size: 8, font: bold, color: MUTED });
    page.drawText("UN", { x: colUn, y, size: 8, font: bold, color: MUTED });
    page.drawText("CANT.", { x: colQty, y, size: 8, font: bold, color: MUTED });
    page.drawText("P. UNITARIO", { x: colPrice, y, size: 8, font: bold, color: MUTED });
    const totalHeader = "TOTAL";
    page.drawText(totalHeader, {
      x: colTotal - bold.widthOfTextAtSize(totalHeader, 8),
      y,
      size: 8,
      font: bold,
      color: MUTED,
    });
    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: LINE,
    });
  };

  drawTableHeader();

  for (const [index, item] of items.entries()) {
    const descLines = wrapText(item.descripcion, regular, 9, descWidth);
    const rowHeight = descLines.length * 12 + 8;
    if (y - rowHeight < MARGIN + 20) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      drawTableHeader();
    }

    const rowTop = (y -= 14);
    page.drawText(String(index + 1), { x: colN, y: rowTop, size: 9, font: bold, color: MUTED });
    let descY = rowTop;
    for (const line of descLines) {
      page.drawText(line, { x: colDesc, y: descY, size: 9, font: regular, color: INK });
      descY -= 12;
    }
    page.drawText(item.unidad || "—", { x: colUn, y: rowTop, size: 9, font: regular, color: INK });
    const qtyText = formatQuantity(item.cantidad);
    page.drawText(qtyText, {
      x: colPrice - 10 - regular.widthOfTextAtSize(qtyText, 9),
      y: rowTop,
      size: 9,
      font: regular,
      color: INK,
    });
    const priceText = formatCLP(item.precio);
    page.drawText(priceText, {
      x: colTotal - 70 - regular.widthOfTextAtSize(priceText, 9),
      y: rowTop,
      size: 9,
      font: regular,
      color: INK,
    });
    const totalText = formatCLP(itemTotal(item));
    page.drawText(totalText, {
      x: colTotal - bold.widthOfTextAtSize(totalText, 9),
      y: rowTop,
      size: 9,
      font: bold,
      color: INK,
    });

    y = rowTop - (descLines.length - 1) * 12 - 6;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: LINE,
    });
  }

  /* ── Totales ── */
  ensureSpace(80);
  const totalsX = PAGE_W - MARGIN - 200;
  const totalRow = (label: string, value: string, emphasized = false) => {
    y -= 20;
    if (emphasized) {
      page.drawRectangle({
        x: totalsX,
        y: y - 6,
        width: 200,
        height: 20,
        color: DARK,
      });
    }
    page.drawText(label, {
      x: totalsX + 8,
      y,
      size: 9,
      font: bold,
      color: emphasized ? rgb(1, 1, 1) : MUTED,
    });
    page.drawText(value, {
      x: PAGE_W - MARGIN - 8 - bold.widthOfTextAtSize(value, 10),
      y,
      size: 10,
      font: bold,
      color: emphasized ? rgb(1, 1, 1) : INK,
    });
  };
  totalRow("VALOR NETO", formatCLP(neto));
  totalRow("IVA 19%", formatCLP(iva));
  totalRow("TOTAL A PAGAR", formatCLP(total), true);

  /* ── Condiciones comerciales ── */
  const conditions = parseConditions(budget.conditions);
  if (conditions.length > 0) {
    ensureSpace(60);
    page.drawText("CONDICIONES COMERCIALES", {
      x: MARGIN,
      y: (y -= 32),
      size: 9,
      font: bold,
      color: MUTED,
    });
    for (const [index, condition] of conditions.entries()) {
      const lines = wrapText(`${index + 1}. ${condition}`, regular, 8, contentWidth);
      ensureSpace(lines.length * 11 + 6);
      for (const line of lines) {
        page.drawText(line, {
          x: MARGIN,
          y: (y -= 11),
          size: 8,
          font: regular,
          color: INK,
        });
      }
      y -= 4;
    }
  }

  /* ── Firmas de aceptación ── */
  ensureSpace(90);
  y -= 60;
  const SIG_W = 200;
  const colLeft = MARGIN;
  const colRight = PAGE_W - MARGIN - SIG_W;
  for (const [x, name, detail] of [
    [colLeft, site.legalName, `RUT: ${site.rut}`],
    [colRight, "ACEPTA CLIENTE", "Nombre, RUT y fecha"],
  ] as Array<[number, string, string]>) {
    page.drawLine({
      start: { x, y },
      end: { x: x + SIG_W, y },
      thickness: 0.75,
      color: INK,
    });
    page.drawText(name, {
      x: x + (SIG_W - bold.widthOfTextAtSize(name, 9)) / 2,
      y: y - 14,
      size: 9,
      font: bold,
      color: INK,
    });
    page.drawText(detail, {
      x: x + (SIG_W - regular.widthOfTextAtSize(detail, 8)) / 2,
      y: y - 26,
      size: 8,
      font: regular,
      color: MUTED,
    });
  }

  /* ── Pie ── */
  const footer = `${site.legalName} · RUT ${site.rut} · ${site.contact.phoneDisplay} · ${site.contact.email} · Presupuesto ${folio}`;
  page.drawText(footer, {
    x: (PAGE_W - regular.widthOfTextAtSize(footer, 7.5)) / 2,
    y: MARGIN - 20,
    size: 7.5,
    font: regular,
    color: MUTED,
  });

  return doc.save();
}

/** Nombre de archivo sugerido para la descarga. */
export function budgetPdfFilename(budget: BudgetWithClient) {
  return `presupuesto-${budget.folio}-construcciones-pye.pdf`;
}
