import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";

import { deleteDayPaymentAction } from "@/backend/actions/personal.actions";
import { requireAdmin } from "@/backend/auth/session";
import { formatDocFolio, getDayPayment } from "@/backend/services/payroll.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { formatCLP, formatDateLong } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Pago día hombre" };

export default async function PagoDiaHombrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const payment = await getDayPayment(id);
  if (!payment) notFound();

  const folio = formatDocFolio(payment.folio);
  const rows: [string, string][] = [
    ["Trabajador", `${payment.employee.name} · ${payment.employee.rut}`],
    ["Fecha de pago", formatDateLong(payment.date)],
    ["Obra", payment.work?.title ?? "Gastos generales"],
    ["Periodo", payment.periodText ?? "—"],
    [
      "Días × valor",
      `${payment.days.toLocaleString("es-CL")} × ${formatCLP(payment.dailyRate)} = ${formatCLP(Math.round(payment.days * payment.dailyRate))}`,
    ],
    ["Bonos / extras", formatCLP(payment.extras)],
    ["Descuentos", formatCLP(payment.discounts)],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal/dia-hombre"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a pagos día hombre
      </Link>

      <AdminPageHeader
        title={`Comprobante ${folio}`}
        action={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <a
              href={`/admin/personal/dia-hombre/${payment.id}/pdf`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-carbon-800"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Descargar PDF
            </a>
            <ConfirmDeleteButton
              action={deleteDayPaymentAction.bind(null, payment.id)}
              label="Eliminar"
              confirmMessage={`¿Eliminar el pago ${folio}? También se borrará su gasto en Finanzas.`}
            />
          </div>
        }
      />

      <AdminCard className="max-w-2xl">
        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-36 shrink-0 text-xs font-bold uppercase tracking-wide text-carbon-500">{label}</dt>
              <dd className="font-semibold text-carbon-900">{value}</dd>
            </div>
          ))}
        </dl>
        {payment.notes && (
          <p className="mt-4 whitespace-pre-wrap border-t border-carbon-100 pt-4 text-sm text-carbon-700">{payment.notes}</p>
        )}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-carbon-950 px-4 py-3 text-white">
          <span className="font-display font-bold uppercase tracking-wide">Total pagado</span>
          <span className="font-display text-lg font-extrabold tabular-nums">{formatCLP(payment.total)}</span>
        </div>
      </AdminCard>
    </div>
  );
}
