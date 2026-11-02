import type { Metadata } from "next";
import Link from "next/link";
import { FileMinus } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { TERMINATION_CAUSES, type TerminationCause } from "@/backend/lib/settlement";
import { formatDocFolio, listSettlements } from "@/backend/services/payroll.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { ViewChip } from "@/frontend/admin/personal-ui";
import { formatCLP, formatDateUTC } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Finiquitos" };

export default async function FiniquitosPage() {
  await requireAdmin();
  const settlements = await listSettlements();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Finiquitos"
        description="Término de contrato con indemnizaciones, feriado proporcional y documento listo para firmar ante ministro de fe."
        action={
          <Link
            href="/admin/personal/finiquitos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 active:bg-brand-600"
          >
            <FileMinus className="h-4 w-4" aria-hidden="true" />
            Nuevo finiquito
          </Link>
        }
      />

      {settlements.length === 0 ? (
        <EmptyState title="Aún no hay finiquitos" description="Cuando termine un contrato, emite aquí su finiquito." />
      ) : (
        <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
          {settlements.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/personal/finiquitos/${s.id}`}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-carbon-50 active:bg-carbon-50 sm:gap-4 sm:px-5 sm:py-4"
              >
                <span className="font-display hidden w-20 shrink-0 font-extrabold text-carbon-900 sm:block">
                  {formatDocFolio(s.folio)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-carbon-900">{s.employee.name}</p>
                  <p className="truncate text-sm text-carbon-500 sm:text-xs">
                    <span className="sm:hidden">{formatDocFolio(s.folio)} · </span>
                    {formatDateUTC(s.endDate)} · {TERMINATION_CAUSES[s.cause as TerminationCause] ?? s.cause}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-carbon-900 tabular-nums">{formatCLP(s.total)}</span>
                <ViewChip />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
