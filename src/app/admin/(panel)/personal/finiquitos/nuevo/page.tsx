import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { hasPayslip } from "@/backend/lib/payroll";
import { listEmployees } from "@/backend/services/employees.service";
import { listPayrollParams, suggestedPayrollParams } from "@/backend/services/payroll.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { SettlementForm } from "@/frontend/admin/settlement-form";
import { toDateInput, todayInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Nuevo finiquito" };

export default async function NuevoFiniquitoPage({
  searchParams,
}: {
  searchParams: Promise<{ empleado?: string }>;
}) {
  await requireAdmin();
  const { empleado } = await searchParams;
  const [all, params, latest] = await Promise.all([
    listEmployees({ status: "activo" }),
    listPayrollParams(),
    suggestedPayrollParams(),
  ]);
  const employees = all.filter((e) => hasPayslip(e.contractType));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal/finiquitos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a finiquitos
      </Link>

      <AdminPageHeader
        title="Nuevo finiquito"
        description="El panel propone indemnizaciones y feriado según la causal; revisa cada monto antes de emitir."
      />

      {employees.length === 0 ? (
        <EmptyState
          title="No hay trabajadores con contrato activos"
          description="Los finiquitos son para contratos a plazo fijo, por obra o indefinidos."
        />
      ) : (
        <SettlementForm
          today={todayInput()}
          initialEmployeeId={employees.some((e) => e.id === empleado) ? empleado! : ""}
          ufByPeriod={Object.fromEntries(params.map((p) => [p.period, p.uf]))}
          fallbackUf={latest.uf}
          minWage={latest.minWage}
          employees={employees.map((e) => ({
            id: e.id,
            name: e.name,
            rut: e.rut,
            contractType: e.contractType,
            startDate: toDateInput(e.startDate),
            contractEndDate: toDateInput(e.contractEndDate),
            baseSalary: e.baseSalary,
            gratification: e.gratification,
            mealAllowance: e.mealAllowance,
            transportAllowance: e.transportAllowance,
          }))}
        />
      )}
    </div>
  );
}
