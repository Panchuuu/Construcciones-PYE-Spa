import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, Pencil, Printer } from "lucide-react";

import { deletePayslipAction } from "@/backend/actions/personal.actions";
import { requireAdmin } from "@/backend/auth/session";
import { site } from "@/backend/config/site";
import { AFPS, formatPeriod, type AfpCode } from "@/backend/lib/payroll";
import {
  formatDocFolio,
  getPayslip,
  parsePayslipSnapshot,
} from "@/backend/services/payroll.service";
import { AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { PrintButton } from "@/frontend/admin/print-button";
import { AmountTable, CalcWarnings } from "@/frontend/admin/personal-ui";
import { formatCLP, formatDateLong } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Liquidación de sueldo" };

export default async function LiquidacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const payslip = await getPayslip(id);
  if (!payslip) notFound();

  const { employee, params: indicators, result } = parsePayslipSnapshot(payslip.resultJson);
  const folio = formatDocFolio(payslip.folio);

  const facts: [string, string][] = [
    ["Trabajador", employee.name],
    ["RUT", employee.rut],
    ["Cargo", employee.position],
    ["Contrato", employee.contractLabel],
    ["Ingreso", formatDateLong(new Date(employee.startDate))],
    ["Sueldo base", formatCLP(employee.baseSalary)],
    ["AFP", employee.afp ? (AFPS[employee.afp as AfpCode] ?? employee.afp) : "—"],
    ["Salud", employee.healthSystem === "isapre" ? `Isapre ${employee.isapreName ?? ""}` : "Fonasa"],
    ["Obra", payslip.work?.title ?? "Gastos generales"],
    ["Jornada", `${employee.weeklyHours} h semanales`],
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        <Link
          href="/admin/personal/liquidaciones"
          className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a liquidaciones
        </Link>

        <AdminPageHeader
          title={`Liquidación ${folio}`}
          description={`${employee.name} · ${formatPeriod(payslip.period)}`}
          action={
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={`/admin/personal/liquidaciones/${payslip.id}/editar`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Corregir
              </Link>
              <ConfirmDeleteButton
                action={deletePayslipAction.bind(null, payslip.id)}
                label="Eliminar"
                confirmMessage={`¿Eliminar la liquidación ${folio}? También se borrará su gasto en Finanzas.`}
              />
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <a
            href={`/admin/personal/liquidaciones/${payslip.id}/pdf`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-carbon-800"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Descargar PDF
          </a>
          <PrintButton>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir
          </PrintButton>
        </div>

        <CalcWarnings warnings={result.warnings} />
      </div>

      <article className="overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-brand-600 px-7 py-5 print:px-0">
          <div>
            <p className="font-display text-lg font-extrabold text-carbon-950">{site.legalName}</p>
            <p className="text-xs text-carbon-500">RUT {site.rut} · {site.contact.address}</p>
          </div>
          <div className="text-right">
            <p className="font-display font-extrabold text-brand-700">LIQUIDACIÓN DE SUELDO {folio}</p>
            <p className="text-sm font-semibold capitalize text-carbon-900">{formatPeriod(payslip.period)}</p>
            <p className="text-xs text-carbon-500">
              UF {indicators.uf.toLocaleString("es-CL")} · UTM {formatCLP(indicators.utm)}
            </p>
          </div>
        </header>

        <div className="space-y-6 px-7 py-6 print:px-0">
          <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            {facts.map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-carbon-500">{label}</dt>
                <dd className="min-w-0 font-semibold text-carbon-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            <AmountTable title="Haberes imponibles" lines={result.earnings} totalLabel="Total imponible" total={result.taxableTotal} />
            <AmountTable title="Descuentos legales" lines={result.legalDeductions} totalLabel="Total" total={result.legalDeductionsTotal} />
            <AmountTable title="Haberes no imponibles" lines={result.nonTaxable} totalLabel="Total no imponible" total={result.nonTaxableTotal} />
            <AmountTable title="Otros descuentos" lines={result.otherDeductions} totalLabel="Total" total={result.otherDeductionsTotal} />
          </div>

          <dl className="ml-auto w-full max-w-sm space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="font-bold uppercase tracking-wide text-carbon-600">Total haberes</dt>
              <dd className="font-bold text-carbon-900 tabular-nums">{formatCLP(result.grossTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-bold uppercase tracking-wide text-carbon-600">Total descuentos</dt>
              <dd className="font-bold text-carbon-900 tabular-nums">{formatCLP(result.deductionsTotal)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-carbon-950 px-3 py-2 print:rounded-none">
              <dt className="font-display font-bold uppercase tracking-wide text-white">Líquido a pagar</dt>
              <dd className="font-display text-lg font-extrabold text-white tabular-nums">{formatCLP(result.netPay)}</dd>
            </div>
          </dl>

          <section className="rounded-xl bg-carbon-50 p-4 print:hidden">
            <AmountTable
              title="Aportes del empleador (no se descuentan al trabajador)"
              lines={result.employerCosts}
              totalLabel="Costo empresa total"
              total={result.companyCost}
              muted
            />
            <p className="mt-2 text-xs text-carbon-500">
              Base tributable para impuesto único: {formatCLP(result.incomeTaxBase)}. El costo empresa quedó
              registrado como gasto en Finanzas.
            </p>
          </section>

          <p className="text-xs leading-relaxed text-carbon-600">
            Certifico que he recibido de {site.legalName} a mi entera satisfacción el saldo líquido indicado en la
            presente liquidación y no tengo cargo ni cobro posterior que hacer por los conceptos de esta liquidación.
          </p>

          <div className="grid gap-10 pt-10 sm:grid-cols-2">
            {[
              [site.legalName, `RUT ${site.rut}`],
              [employee.name, `RUT ${employee.rut}`],
            ].map(([name, detail]) => (
              <div key={name} className="border-t-2 border-carbon-900 pt-2 text-center">
                <p className="font-bold text-carbon-900">{name}</p>
                <p className="text-xs text-carbon-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
