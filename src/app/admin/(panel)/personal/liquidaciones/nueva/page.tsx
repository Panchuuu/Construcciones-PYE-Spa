import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { currentPeriod } from "@/backend/lib/payroll";
import { payslipFormOptions } from "@/backend/services/payroll.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { PayslipForm } from "@/frontend/admin/payslip-form";

export const metadata: Metadata = { title: "Nueva liquidación" };

export default async function NuevaLiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ empleado?: string }>;
}) {
  await requireAdmin();
  const { empleado } = await searchParams;
  const options = await payslipFormOptions();
  const preselected = options.employees.find((e) => e.id === empleado);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal/liquidaciones"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a liquidaciones
      </Link>

      <AdminPageHeader
        title="Nueva liquidación"
        description="El cálculo usa la ficha del trabajador y los parámetros previsionales del mes elegido."
      />

      {options.employees.length === 0 ? (
        <EmptyState
          title="No hay trabajadores con contrato activos"
          description="Las liquidaciones son para contratos a plazo fijo, por obra o indefinidos. El día hombre se paga desde «Pagos día hombre»."
          actionHref="/admin/personal/nuevo"
          actionLabel="Registrar trabajador"
        />
      ) : (
        <PayslipForm
          payslipId={null}
          {...options}
          initial={{
            employeeId: preselected?.id ?? "",
            period: currentPeriod(),
            workId: preselected?.workId ?? "",
            daysWorked: 30,
            overtimeHours: 0,
            bonuses: [],
            nonTaxable: [],
            advances: 0,
            otherDiscounts: [],
          }}
        />
      )}
    </div>
  );
}
