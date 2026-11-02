import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";

import { deleteSettlementAction } from "@/backend/actions/personal.actions";
import { requireAdmin } from "@/backend/auth/session";
import { formatServiceTime } from "@/backend/lib/settlement";
import {
  formatDocFolio,
  getSettlement,
  parseSettlementSnapshot,
} from "@/backend/services/payroll.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { AmountTable, CalcWarnings } from "@/frontend/admin/personal-ui";
import { formatCLP, formatDateLong } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Finiquito" };

export default async function FiniquitoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const settlement = await getSettlement(id);
  if (!settlement) notFound();

  const { employee, causeLabel, result, uf } = parseSettlementSnapshot(settlement.resultJson);
  const folio = formatDocFolio(settlement.folio);

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
        title={`Finiquito ${folio}`}
        description={`${employee.name} · término el ${formatDateLong(settlement.endDate)}`}
        action={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <a
              href={`/admin/personal/finiquitos/${settlement.id}/pdf`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-carbon-800"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Descargar PDF
            </a>
            <ConfirmDeleteButton
              action={deleteSettlementAction.bind(null, settlement.id)}
              label="Anular"
              confirmMessage={`¿Anular el finiquito ${folio}? Se borrará su gasto y ${employee.name} volverá a quedar activo.`}
            />
          </div>
        }
      />

      <CalcWarnings warnings={result.warnings} />

      <AdminCard className="max-w-3xl space-y-6">
        <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          {[
            ["Trabajador", employee.name],
            ["RUT", employee.rut],
            ["Cargo", employee.position],
            ["Contrato", employee.contractLabel],
            ["Ingreso", formatDateLong(new Date(employee.startDate))],
            ["Término", formatDateLong(settlement.endDate)],
            ["Tiempo servido", formatServiceTime(result.service)],
            ["Feriado pendiente", `${result.vacation.pendingWorkingDays.toLocaleString("es-CL")} días hábiles`],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-carbon-500">{label}</dt>
              <dd className="min-w-0 font-semibold text-carbon-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-xl bg-carbon-50 px-4 py-3 text-sm text-carbon-800">
          <strong>Causal:</strong> {causeLabel}
        </p>

        <AmountTable title="Haberes" lines={result.earnings} totalLabel="Total haberes" total={result.earningsTotal} />
        {result.discounts.length > 0 && (
          <AmountTable title="Descuentos" lines={result.discounts} totalLabel="Total descuentos" total={result.discountsTotal} />
        )}
        <div className="flex items-center justify-between rounded-xl bg-carbon-950 px-4 py-3 text-white">
          <span className="font-display font-bold uppercase tracking-wide">Total a pagar</span>
          <span className="font-display text-lg font-extrabold tabular-nums">{formatCLP(result.total)}</span>
        </div>
        <p className="text-xs text-carbon-500">
          Calculado con UF {uf.toLocaleString("es-CL")}. Para su validez, el finiquito se firma ante un ministro de fe
          (notario o inspección del trabajo) o se ratifica en el portal de la Dirección del Trabajo.
        </p>
      </AdminCard>
    </div>
  );
}
