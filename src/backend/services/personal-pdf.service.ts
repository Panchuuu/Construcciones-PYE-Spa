import "server-only";

import { site } from "@/backend/config/site";
import { AFPS, formatPeriod, type AfpCode } from "@/backend/lib/payroll";
import { formatServiceTime } from "@/backend/lib/settlement";
import {
  formatDocFolio,
  parsePayslipSnapshot,
  parseSettlementSnapshot,
  type getDayPayment,
  type getPayslip,
  type getSettlement,
} from "@/backend/services/payroll.service";
import { PdfWriter, formatCLP, formatDateLong } from "@/backend/services/pdf-kit";

type PayslipRow = NonNullable<Awaited<ReturnType<typeof getPayslip>>>;
type SettlementRow = NonNullable<Awaited<ReturnType<typeof getSettlement>>>;
type DayPaymentRow = NonNullable<Awaited<ReturnType<typeof getDayPayment>>>;

const footer = (doc: string) =>
  `${site.legalName} · RUT ${site.rut} · ${site.contact.phoneDisplay} · ${doc}`;

/* ── Liquidación de sueldo ─────────────────────────────────── */

export async function generatePayslipPdf(payslip: PayslipRow) {
  const { employee, params, result } = parsePayslipSnapshot(payslip.resultJson);
  const folio = formatDocFolio(payslip.folio);
  const pdf = await PdfWriter.create(footer(`Liquidación ${folio}`));

  pdf.header("LIQUIDACIÓN DE SUELDO", folio, [
    `Periodo: ${formatPeriod(payslip.period)}`,
    `UF ${params.uf.toLocaleString("es-CL")} · UTM ${formatCLP(params.utm)}`,
  ]);

  pdf.heading("Antecedentes del trabajador");
  pdf.facts([
    ["Nombre", employee.name],
    ["RUT", employee.rut],
    ["Cargo", employee.position],
    ["Contrato", employee.contractLabel],
    ["Fecha ingreso", formatDateLong(new Date(employee.startDate))],
    ["Sueldo base", formatCLP(employee.baseSalary)],
    ["AFP", employee.afp ? (AFPS[employee.afp as AfpCode] ?? employee.afp) : "—"],
    ["Salud", employee.healthSystem === "isapre" ? `Isapre ${employee.isapreName ?? ""}` : "Fonasa"],
    ["Obra", payslip.work?.title ?? "—"],
    ["Jornada", `${employee.weeklyHours} horas semanales`],
  ]);

  pdf.space(6);
  pdf.amountsSideBySide(
    ["Haberes imponibles", result.earnings, "Total imponible", result.taxableTotal],
    ["Descuentos legales", result.legalDeductions, "Total descuentos legales", result.legalDeductionsTotal],
  );
  pdf.amountsSideBySide(
    ["Haberes no imponibles", result.nonTaxable, "Total no imponible", result.nonTaxableTotal],
    ["Otros descuentos", result.otherDeductions, "Total otros descuentos", result.otherDeductionsTotal],
  );

  pdf.space(4);
  pdf.facts([
    ["Total haberes", formatCLP(result.grossTotal)],
    ["Total descuentos", formatCLP(result.deductionsTotal)],
  ]);
  pdf.highlight("Líquido a pagar", formatCLP(result.netPay));

  pdf.space(10);
  pdf.paragraph(
    `Certifico que he recibido de ${site.legalName} a mi entera satisfacción el saldo líquido indicado en la presente liquidación y no tengo cargo ni cobro posterior que hacer por los conceptos de esta liquidación.`,
    8,
  );
  pdf.signatures([
    [site.legalName, `RUT ${site.rut}`],
    [employee.name, `RUT ${employee.rut}`],
  ]);

  return pdf.save();
}

export const payslipPdfFilename = (payslip: PayslipRow) =>
  `liquidacion-${payslip.period}-${payslip.folio}.pdf`;

/* ── Finiquito ─────────────────────────────────────────────── */

export async function generateSettlementPdf(settlement: SettlementRow) {
  const { employee, causeLabel, result, uf } = parseSettlementSnapshot(settlement.resultJson);
  const folio = formatDocFolio(settlement.folio);
  const pdf = await PdfWriter.create(footer(`Finiquito ${folio}`));

  pdf.header("FINIQUITO DE CONTRATO DE TRABAJO", folio, [
    `Fecha de término: ${formatDateLong(settlement.endDate)}`,
  ]);

  pdf.space(6);
  pdf.paragraph(
    `En ${site.contact.city}, a ${formatDateLong(new Date())}, entre ${site.legalName}, RUT ${site.rut}, domiciliada en ${site.contact.address}, en adelante "el empleador", y don(ña) ${employee.name}, RUT ${employee.rut}, en adelante "el trabajador", se deja constancia de lo siguiente:`,
  );

  pdf.heading("Primero: término de la relación laboral");
  pdf.paragraph(
    `El trabajador prestó servicios como ${employee.position} desde el ${formatDateLong(new Date(employee.startDate))} hasta el ${formatDateLong(settlement.endDate)} (${formatServiceTime(result.service)}), bajo contrato ${employee.contractLabel.toLowerCase()}. La relación laboral terminó por la causal: ${causeLabel}.`,
  );

  pdf.heading("Segundo: liquidación de haberes");
  pdf.amounts("Haberes", result.earnings, "Total haberes", result.earningsTotal);
  if (result.discounts.length > 0) {
    pdf.amounts("Descuentos", result.discounts, "Total descuentos", result.discountsTotal);
  }
  pdf.highlight("Total a pagar", formatCLP(result.total));

  pdf.heading("Tercero: declaración");
  pdf.paragraph(
    `El trabajador declara recibir en este acto, a su entera satisfacción, la suma de ${formatCLP(result.total)}, y que ${site.legalName} nada le adeuda por concepto de remuneraciones, feriados, indemnizaciones ni por ningún otro concepto derivado de la relación laboral o de su terminación, otorgándole el más amplio y total finiquito. Asimismo declara que sus cotizaciones previsionales se encuentran íntegramente pagadas a la fecha de término.`,
  );
  pdf.space(4);
  pdf.paragraph(
    `Cálculo con UF de ${uf.toLocaleString("es-CL")} (tope de indemnizaciones: 90 UF). Para su validez, el finiquito debe ser firmado ante un ministro de fe (notario, inspector del trabajo) o ratificado en el portal de la Dirección del Trabajo.`,
    7.5,
  );

  pdf.signatures([
    [site.legalName, `RUT ${site.rut}`],
    [employee.name, `RUT ${employee.rut}`],
    ["Ministro de fe", "Nombre, firma y timbre"],
  ]);

  return pdf.save();
}

export const settlementPdfFilename = (settlement: SettlementRow) =>
  `finiquito-${settlement.folio}.pdf`;

/* ── Comprobante de pago día hombre ────────────────────────── */

export async function generateDayPaymentPdf(payment: DayPaymentRow) {
  const folio = formatDocFolio(payment.folio);
  const pdf = await PdfWriter.create(footer(`Comprobante ${folio}`));

  pdf.header("COMPROBANTE DE PAGO", folio, [`Fecha de pago: ${formatDateLong(payment.date)}`]);

  pdf.heading("Trabajador");
  pdf.facts([
    ["Nombre", payment.employee.name],
    ["RUT", payment.employee.rut],
    ["Labor", payment.employee.position],
    ["Obra", payment.work?.title ?? "—"],
    ["Periodo", payment.periodText ?? "—"],
    ["Valor día", formatCLP(payment.dailyRate)],
  ]);

  pdf.space(6);
  const lines = [
    {
      name: `Días trabajados: ${payment.days.toLocaleString("es-CL")} × ${formatCLP(payment.dailyRate)}`,
      amount: Math.round(payment.days * payment.dailyRate),
    },
  ];
  if (payment.extras > 0) lines.push({ name: "Bonos / extras", amount: payment.extras });
  pdf.amounts("Detalle del pago", lines);
  if (payment.discounts > 0) {
    pdf.amounts("Descuentos", [{ name: "Descuentos / anticipos", amount: payment.discounts }]);
  }
  pdf.highlight("Total pagado", formatCLP(payment.total));

  if (payment.notes) {
    pdf.heading("Observaciones");
    pdf.paragraph(payment.notes);
  }

  pdf.space(8);
  pdf.paragraph(
    `Declaro haber recibido de ${site.legalName} la suma de ${formatCLP(payment.total)} por los días trabajados indicados.`,
    8,
  );
  pdf.signatures([
    [site.legalName, `RUT ${site.rut}`],
    [payment.employee.name, `RUT ${payment.employee.rut}`],
  ]);

  return pdf.save();
}

export const dayPaymentPdfFilename = (payment: DayPaymentRow) =>
  `comprobante-dia-hombre-${payment.folio}.pdf`;
