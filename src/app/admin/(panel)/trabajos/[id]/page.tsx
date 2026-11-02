import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ClipboardPlus,
  MapPin,
  Pencil,
  PlusCircle,
  User,
} from "lucide-react";

import { deleteWorkAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { formatFolio } from "@/backend/services/deliveries.service";
import { workFinance } from "@/backend/services/movements.service";
import { getWork } from "@/backend/services/works.service";
import { SignedAmount } from "@/frontend/admin/personal-ui";
import { cn, formatCLP, formatDateUTC } from "@/frontend/lib/utils";
import {
  AdminCard,
  AdminPageHeader,
  DeliveryTypeBadge,
  EmptyState,
  WorkStatusBadge,
  formatDateShort,
} from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";

export const metadata: Metadata = { title: "Detalle de trabajo" };

export default async function TrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [work, finance] = await Promise.all([getWork(id), workFinance(id)]);
  if (!work) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/trabajos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a trabajos
      </Link>

      <AdminPageHeader
        title={work.title}
        action={
          <div className="flex gap-2">
            <Link
              href={`/admin/trabajos/${work.id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
            <ConfirmDeleteButton
              action={deleteWorkAction.bind(null, work.id)}
              label="Eliminar"
              confirmMessage={`¿Eliminar el trabajo "${work.title}"? Se borrarán también sus actas de entrega.`}
            />
          </div>
        }
      />

      <AdminCard>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-carbon-700">
          <WorkStatusBadge status={work.status} />
          <Link
            href={`/admin/clientes/${work.client.id}`}
            className="flex items-center gap-2 font-semibold text-carbon-900 hover:text-brand-700"
          >
            <User className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {work.client.name}
          </Link>
          {work.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {work.location}
            </span>
          )}
          <span className="text-carbon-500">
            Creado el {formatDateShort(work.createdAt)}
          </span>
        </div>
        {work.description && (
          <p className="mt-4 whitespace-pre-wrap border-t border-carbon-100 pt-4 text-sm text-carbon-600">
            {work.description}
          </p>
        )}
      </AdminCard>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-carbon-900">
            Actas de entrega
          </h2>
          <Link
            href={`/admin/entregas/nueva?trabajo=${work.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
            Registrar entrega
          </Link>
        </div>

        <div className="mt-4">
          {work.deliveries.length === 0 ? (
            <EmptyState
              title="Sin actas todavía"
              description="Cuando entregues trabajo o materiales de esta obra, registra el acta aquí con la firma de ambas partes."
              actionHref={`/admin/entregas/nueva?trabajo=${work.id}`}
              actionLabel="Registrar entrega"
            />
          ) : (
            <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
              {work.deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <Link
                    href={`/admin/entregas/${delivery.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-carbon-50"
                  >
                    <span className="font-display w-16 font-extrabold text-carbon-900">
                      {formatFolio(delivery.folio)}
                    </span>
                    <DeliveryTypeBadge type={delivery.type} />
                    <span className="min-w-0 flex-1 truncate text-sm text-carbon-700">
                      Recibió: {delivery.clientSignerName}
                    </span>
                    <span className="text-xs text-carbon-500">
                      {formatDateShort(delivery.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-carbon-900">
            Finanzas de la obra
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/admin/finanzas/nuevo?obra=${work.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Registrar gasto
            </Link>
            <Link
              href={`/admin/finanzas?mes=todos&obra=${work.id}`}
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-bold text-brand-700 hover:text-brand-600"
            >
              Ver todo
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Ingresos", value: finance.totals.income, tone: "text-green-700" },
            { label: "Gastos", value: finance.totals.expense, tone: "text-carbon-900" },
            {
              label: "Resultado",
              value: finance.totals.balance,
              tone: finance.totals.balance >= 0 ? "text-green-700" : "text-red-700",
            },
          ].map((stat) => (
            <AdminCard key={stat.label} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">{stat.label}</p>
              <p className={cn("font-display mt-1 text-2xl font-extrabold tabular-nums", stat.tone)}>
                {formatCLP(stat.value)}
              </p>
            </AdminCard>
          ))}
        </div>

        {finance.recent.length > 0 && (
          <ul className="mt-4 divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
            {finance.recent.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/finanzas/${m.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-carbon-50"
                >
                  <span className="w-24 text-xs text-carbon-500">{formatDateUTC(m.date)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-carbon-800">
                    {m.description} <span className="text-carbon-500">· {m.category}</span>
                  </span>
                  <SignedAmount type={m.type} amount={m.amount} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
