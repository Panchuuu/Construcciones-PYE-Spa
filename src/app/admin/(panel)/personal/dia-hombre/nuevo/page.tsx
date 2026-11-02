import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listEmployees } from "@/backend/services/employees.service";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { DayPaymentForm } from "@/frontend/admin/day-payment-form";
import { todayInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Registrar pago día hombre" };

export default async function NuevoPagoDiaHombrePage({
  searchParams,
}: {
  searchParams: Promise<{ empleado?: string }>;
}) {
  await requireAdmin();
  const { empleado } = await searchParams;
  const [employees, works] = await Promise.all([
    listEmployees({ status: "activo", contractType: "dia_hombre" }),
    listWorks(),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal/dia-hombre"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a pagos día hombre
      </Link>

      <AdminPageHeader title="Registrar pago día hombre" />

      {employees.length === 0 ? (
        <EmptyState
          title="No hay trabajadores de día hombre activos"
          description="Regístralo con el tipo de contrato «Día hombre» y su valor del día."
          actionHref="/admin/personal/nuevo?tipo=dia_hombre"
          actionLabel="Registrar trabajador"
        />
      ) : (
        <AdminCard className="max-w-3xl">
          <DayPaymentForm
            today={todayInput()}
            initialEmployeeId={employees.some((e) => e.id === empleado) ? empleado! : ""}
            employees={employees.map((e) => ({
              id: e.id,
              name: e.name,
              rut: e.rut,
              dailyRate: e.dailyRate,
              workId: e.workId,
            }))}
            works={works.map((w) => ({ id: w.id, title: w.title }))}
          />
        </AdminCard>
      )}
    </div>
  );
}
