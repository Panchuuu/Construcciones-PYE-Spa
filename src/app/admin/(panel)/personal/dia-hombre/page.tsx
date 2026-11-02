import type { Metadata } from "next";
import Link from "next/link";
import { Banknote } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { formatDocFolio, listDayPayments } from "@/backend/services/payroll.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { ViewChip, ViewLink } from "@/frontend/admin/personal-ui";
import { formatCLP, formatDateUTC } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Pagos día hombre" };

export default async function DiaHombrePage() {
  await requireAdmin();
  const payments = await listDayPayments();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pagos día hombre"
        description="Pagos por días trabajados, sin descuentos previsionales. Cada pago genera su comprobante y queda como gasto de la obra."
        action={
          <Link
            href="/admin/personal/dia-hombre/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 active:bg-brand-600"
          >
            <Banknote className="h-4 w-4" aria-hidden="true" />
            Registrar pago
          </Link>
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          title="Aún no hay pagos de día hombre"
          description="Registra primero al trabajador con contrato «Día hombre» y su valor del día."
          actionHref="/admin/personal/dia-hombre/nuevo"
          actionLabel="Registrar el primer pago"
        />
      ) : (
        <>
        {/* Teléfono: filas táctiles */}
        <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:hidden">
          {payments.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/personal/dia-hombre/${p.id}`}
                className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-carbon-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-carbon-900">{p.employee.name}</p>
                  <p className="truncate text-sm text-carbon-500">
                    {formatDateUTC(p.date)} · {p.days.toLocaleString("es-CL")} {p.days === 1 ? "día" : "días"}
                    {p.work && ` · ${p.work.title}`}
                  </p>
                </div>
                <span className="font-bold text-carbon-900 tabular-nums">{formatCLP(p.total)}</span>
                <ViewChip />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card sm:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                <th className="px-5 py-3.5">N°</th>
                <th className="px-5 py-3.5">Trabajador</th>
                <th className="px-5 py-3.5">Obra</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5 text-right">Días</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-100">
              {payments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-carbon-50">
                  <td className="whitespace-nowrap px-5 py-4">
                    <Link
                      href={`/admin/personal/dia-hombre/${p.id}`}
                      className="font-display font-extrabold text-carbon-900 hover:text-brand-700"
                    >
                      {formatDocFolio(p.folio)}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-semibold text-carbon-900">{p.employee.name}</td>
                  <td className="max-w-[220px] truncate px-5 py-4 text-carbon-700">{p.work?.title ?? "—"}</td>
                  <td className="px-5 py-4 text-carbon-500">{formatDateUTC(p.date)}</td>
                  <td className="px-5 py-4 text-right text-carbon-700 tabular-nums">{p.days.toLocaleString("es-CL")}</td>
                  <td className="px-5 py-4 text-right font-bold text-carbon-900 tabular-nums">{formatCLP(p.total)}</td>
                  <td className="px-5 py-4 text-right">
                    <ViewLink href={`/admin/personal/dia-hombre/${p.id}`} label={`Ver comprobante ${formatDocFolio(p.folio)}`} />
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
