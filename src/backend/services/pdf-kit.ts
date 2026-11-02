import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { site } from "@/backend/config/site";

/* Paleta y medidas comunes a todos los documentos (igual que el presupuesto). */
export const INK = rgb(0.1, 0.13, 0.2);
export const MUTED = rgb(0.42, 0.47, 0.56);
export const LINE = rgb(0.83, 0.86, 0.91);
export const BRAND = rgb(0.82, 0.2, 0.18);
export const DARK = rgb(0.05, 0.07, 0.13);
export const WHITE = rgb(1, 1, 1);
const PAGE_W = 595.28; // A4 vertical
const PAGE_H = 841.89;
const MARGIN = 48;

export function formatCLP(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("es-CL")}`;
}

/** Fechas guardadas a mediodía UTC. */
export function formatDateLong(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
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

type Line = { name: string; amount: number };

/**
 * Escritor de documentos A4 que avanza hacia abajo y agrega páginas solo.
 * Cada método dibuja un bloque y mueve el cursor.
 */
export class PdfWriter {
  private constructor(
    private doc: PDFDocument,
    private bold: PDFFont,
    private regular: PDFFont,
    private footerText: string,
  ) {}

  private page!: PDFPage;
  private y = 0;
  readonly width = PAGE_W - MARGIN * 2;

  static async create(footerText: string) {
    const doc = await PDFDocument.create();
    const writer = new PdfWriter(
      doc,
      await doc.embedFont(StandardFonts.HelveticaBold),
      await doc.embedFont(StandardFonts.Helvetica),
      footerText,
    );
    writer.newPage();
    return writer;
  }

  private newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: BRAND });
    const footer = `${this.footerText}`;
    this.page.drawText(footer, {
      x: (PAGE_W - this.regular.widthOfTextAtSize(footer, 7.5)) / 2,
      y: MARGIN - 20,
      size: 7.5,
      font: this.regular,
      color: MUTED,
    });
    this.y = PAGE_H - MARGIN;
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN + 10) this.newPage();
  }

  private textRight(text: string, xRight: number, y: number, size: number, font: PDFFont, color = INK) {
    this.page.drawText(text, { x: xRight - font.widthOfTextAtSize(text, size), y, size, font, color });
  }

  space(height: number) {
    this.y -= height;
  }

  /** Encabezado: empresa a la izquierda; título, folio y fecha a la derecha. */
  header(title: string, folio: string, rightLines: string[]) {
    const top = this.y;
    this.page.drawText(site.legalName.toUpperCase(), { x: MARGIN, y: top - 24, size: 15, font: this.bold, color: INK });
    this.page.drawText(`RUT: ${site.rut}`, { x: MARGIN, y: top - 40, size: 9, font: this.regular, color: MUTED });
    this.page.drawText(`${site.contact.address}, ${site.contact.city}`, { x: MARGIN, y: top - 53, size: 9, font: this.regular, color: MUTED });

    const right = PAGE_W - MARGIN;
    this.textRight(title, right, top - 22, 12, this.bold, BRAND);
    this.textRight(folio, right, top - 37, 10, this.bold, INK);
    rightLines.forEach((line, i) => this.textRight(line, right, top - 51 - i * 12, 8.5, this.regular, MUTED));

    this.y = top - 62 - Math.max(0, rightLines.length - 1) * 12;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 1, color: LINE });
    this.y -= 8;
  }

  /** Título de sección en mayúsculas. */
  heading(text: string) {
    this.ensure(30);
    this.y -= 18;
    this.page.drawText(text.toUpperCase(), { x: MARGIN, y: this.y, size: 8.5, font: this.bold, color: MUTED });
    this.y -= 4;
  }

  /** Datos en dos columnas: [etiqueta, valor] × 2 por fila. */
  facts(pairs: [string, string][]) {
    const half = this.width / 2;
    for (let i = 0; i < pairs.length; i += 2) {
      this.ensure(16);
      this.y -= 14;
      pairs.slice(i, i + 2).forEach(([label, value], col) => {
        const x = MARGIN + col * half;
        this.page.drawText(label.toUpperCase(), { x, y: this.y, size: 7, font: this.bold, color: MUTED });
        const maxW = half - 92;
        let text = value || "—";
        while (this.regular.widthOfTextAtSize(text, 9) > maxW && text.length > 4) text = `${text.slice(0, -2)}…`;
        this.page.drawText(text, { x: x + 88, y: this.y, size: 9, font: this.regular, color: INK });
      });
    }
  }

  /** Tabla de conceptos con montos y total, a lo ancho o en una columna. */
  private amountsAt(x: number, width: number, title: string, lines: Line[], totalLabel?: string, total?: number) {
    let y = this.y - 16;
    this.page.drawText(title.toUpperCase(), { x, y, size: 8, font: this.bold, color: MUTED });
    y -= 6;
    this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.75, color: LINE });
    for (const line of lines) {
      const nameLines = wrapText(line.name, this.regular, 8.5, width - 80);
      y -= 13;
      nameLines.forEach((text, i) =>
        this.page.drawText(text, { x, y: y - i * 11, size: 8.5, font: this.regular, color: INK }),
      );
      this.textRight(formatCLP(line.amount), x + width, y, 8.5, this.regular);
      y -= (nameLines.length - 1) * 11;
    }
    if (lines.length === 0) {
      y -= 13;
      this.page.drawText("Sin conceptos", { x, y, size: 8.5, font: this.regular, color: MUTED });
    }
    if (totalLabel && total !== undefined) {
      y -= 8;
      this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.75, color: LINE });
      y -= 12;
      this.page.drawText(totalLabel.toUpperCase(), { x, y, size: 8, font: this.bold, color: INK });
      this.textRight(formatCLP(total), x + width, y, 9, this.bold);
    }
    return y;
  }

  private estimate(lines: Line[], width: number) {
    return 40 + lines.reduce((h, l) => h + 13 + (wrapText(l.name, this.regular, 8.5, width - 80).length - 1) * 11, 0);
  }

  amounts(title: string, lines: Line[], totalLabel?: string, total?: number) {
    this.ensure(this.estimate(lines, this.width));
    this.y = this.amountsAt(MARGIN, this.width, title, lines, totalLabel, total) - 4;
  }

  /** Dos tablas lado a lado (p. ej. haberes | descuentos). */
  amountsSideBySide(
    left: [string, Line[], string, number],
    right: [string, Line[], string, number],
  ) {
    const gap = 24;
    const colW = (this.width - gap) / 2;
    this.ensure(Math.max(this.estimate(left[1], colW), this.estimate(right[1], colW)));
    const yLeft = this.amountsAt(MARGIN, colW, ...left);
    const yRight = this.amountsAt(MARGIN + colW + gap, colW, ...right);
    this.y = Math.min(yLeft, yRight) - 4;
  }

  /** Recuadro oscuro con el total destacado. */
  highlight(label: string, value: string) {
    this.ensure(36);
    this.y -= 26;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 8, width: this.width, height: 26, color: DARK });
    this.page.drawText(label.toUpperCase(), { x: MARGIN + 10, y: this.y, size: 10, font: this.bold, color: WHITE });
    this.textRight(value, PAGE_W - MARGIN - 10, this.y, 12, this.bold, WHITE);
    this.y -= 10;
  }

  /** Párrafo con salto de línea automático. */
  paragraph(text: string, size = 8.5, color = INK) {
    const lines = wrapText(text, this.regular, size, this.width);
    for (const line of lines) {
      this.ensure(size + 4);
      this.y -= size + 3.5;
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.regular, color });
    }
  }

  /** Líneas de firma centradas en columnas. */
  signatures(signers: [string, string][]) {
    this.ensure(90);
    this.y -= 70;
    const n = signers.length;
    const sigW = Math.min(200, (this.width - (n - 1) * 30) / n);
    const totalW = n * sigW + (n - 1) * 30;
    let x = MARGIN + (this.width - totalW) / 2;
    for (const [name, detail] of signers) {
      this.page.drawLine({ start: { x, y: this.y }, end: { x: x + sigW, y: this.y }, thickness: 0.75, color: INK });
      this.page.drawText(name, { x: x + (sigW - this.bold.widthOfTextAtSize(name, 8.5)) / 2, y: this.y - 13, size: 8.5, font: this.bold, color: INK });
      this.page.drawText(detail, { x: x + (sigW - this.regular.widthOfTextAtSize(detail, 7.5)) / 2, y: this.y - 24, size: 7.5, font: this.regular, color: MUTED });
      x += sigW + 30;
    }
    this.y -= 30;
  }

  save() {
    return this.doc.save();
  }
}
