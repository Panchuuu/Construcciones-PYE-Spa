import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  formatDocFolio,
  getPayslip,
  parsePayslipInput,
  payslipFormOptions,
} from "@/backend/services/payroll.service";
import { AdminPageHeader } from "@/frontend/admin/ui";
import { PayslipForm } from "@/frontend/admin/payslip-form";

export const metadata: Metadata = { title: "Corregir liquidación" };

export default async function EditarLiquidacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [payslip, options] = await Promise.all([getPayslip(id), payslipFormOptions()]);
  if (!payslip) notFound();

  const input = parsePayslipInput(payslip.inputJson);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/personal/liquidaciones/${payslip.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a la liquidación
      </Link>

      <AdminPageHeader
        title={`Corregir liquidación ${formatDocFolio(payslip.folio)}`}
        description="Al guardar se recalcula con la ficha actual del trabajador y los parámetros del mes, y se actualiza su gasto."
      />

      {options.employees.some((e) => e.id === payslip.employeeId) ? (
        <PayslipForm
          payslipId={payslip.id}
          {...options}
          initial={{
            employeeId: payslip.employeeId,
            period: payslip.period,
            workId: payslip.workId ?? "",
            daysWorked: input.daysWorked,
            overtimeHours: input.overtimeHours,
            bonuses: input.bonuses,
            nonTaxable: input.nonTaxable,
            advances: input.advances,
            otherDiscounts: input.otherDiscounts,
          }}
        />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {payslip.employee.name} ya no está activo (tiene finiquito), así que su liquidación no se
          puede recalcular. Si necesitas corregirla, anula primero el finiquito: el trabajador vuelve
          a quedar activo.
        </p>
      )}
    </div>
  );
}
