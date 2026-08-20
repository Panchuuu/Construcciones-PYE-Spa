import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  budgetTotals,
  formatBudgetFolio,
  formatCLP,
  listBudgets,
  parseBudgetItems,
} from "@/backend/services/budgets.service";
import {
  AdminPageHeader,
  EmptyState,
  formatDateShort,
} from "@/frontend/admin/ui";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PresupuestosPage() {
  await requireAdmin();
  const budgets = await listBudgets();

  const rows = budgets.map((budget) => {
    const { total } = budgetTotals(parseBudgetItems(budget.itemsJson));
    return { ...budget, total };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Presupuestos"
        description="Ofertas de obra numeradas, con partidas, IVA y condiciones comerciales."
        action={
          <Link
            href="/admin/presupuestos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Nuevo presupuesto
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Aún no hay presupuestos"
          description="Crea el primero: partidas con precio unitario, IVA calculado solo y PDF listo para enviar."
          actionHref="/admin/presupuestos/nuevo"
          actionLabel="Crear el primer presupuesto"
        />
      ) : (
        <>
          {/* Lista compacta en teléfonos: toda la fila es un enlace */}
          <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:hidden">
            {rows.map((budget) => (
              <li key={budget.id}>
                <Link
                  href={`/admin/presupuestos/${budget.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-carbon-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-extrabold text-carbon-900">
                      {formatBudgetFolio(budget.folio)}
                    </span>
                    <span className="font-bold text-carbon-900 tabular-nums">
                      {formatCLP(budget.total)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-carbon-900">
                    {budget.workTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-carbon-500">
                    {budget.clientName || budget.client?.name || "Sin cliente"} ·{" "}
                    {formatDateShort(budget.date)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5">Obra</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Emitido</th>
                  <th className="px-5 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-100">
                {rows.map((budget) => (
                  <tr
                    key={budget.id}
                    className="transition-colors hover:bg-carbon-50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/presupuestos/${budget.id}`}
                        className="font-display font-extrabold text-carbon-900 hover:text-brand-700"
                      >
                        {formatBudgetFolio(budget.folio)}
                      </Link>
                    </td>
                    <td className="max-w-[280px] px-5 py-4">
                      <p className="truncate font-semibold text-carbon-900">
                        {budget.workTitle}
                      </p>
                      {budget.workAddress && (
                        <p className="truncate text-xs text-carbon-500">
                          {budget.workAddress}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-carbon-700">
                      {budget.clientName || budget.client?.name || "—"}
                    </td>
                    <td className="px-5 py-4 text-carbon-500">
                      {formatDateShort(budget.date)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-carbon-900 tabular-nums">
                      {formatCLP(budget.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
