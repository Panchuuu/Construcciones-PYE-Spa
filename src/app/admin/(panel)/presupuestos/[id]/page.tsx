import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, Pencil, Printer } from "lucide-react";

import { deleteBudgetAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { site } from "@/backend/config/site";
import {
  budgetTotals,
  formatBudgetFolio,
  formatCLP,
  formatQuantity,
  getBudget,
  itemTotal,
  parseBudgetItems,
  parseConditions,
} from "@/backend/services/budgets.service";
import { AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { PrintButton } from "@/frontend/admin/print-button";
import { Logo } from "@/frontend/components/logo";

export const metadata: Metadata = { title: "Presupuesto" };

function formatLongDate(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function PresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const budget = await getBudget(id);
  if (!budget) notFound();

  const items = parseBudgetItems(budget.itemsJson);
  const { neto, iva, total } = budgetTotals(items);
  const conditions = parseConditions(budget.conditions);
  const folio = formatBudgetFolio(budget.folio);
  const clientName = budget.clientName || budget.client?.name || "";
  const clientRut = budget.clientRut || budget.client?.rut || "";
  const clientPhone = budget.clientPhone || budget.client?.phone || "";
  const clientEmail = budget.clientEmail || budget.client?.email || "";

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href="/admin/presupuestos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a presupuestos
        </Link>
      </div>

      <div className="print:hidden">
        <AdminPageHeader
          title={`Presupuesto ${folio}`}
          description={`Emitido el ${formatLongDate(budget.date)} · Validez ${budget.validityDays} días corridos`}
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/presupuestos/${budget.id}/editar`}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Link>
              <ConfirmDeleteButton
                action={deleteBudgetAction.bind(null, budget.id)}
                label="Eliminar"
                confirmMessage={`¿Eliminar el presupuesto ${folio}? Esta acción no se puede deshacer.`}
              />
            </div>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <a
          href={`/admin/presupuestos/${budget.id}/pdf`}
          className="inline-flex items-center gap-2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-carbon-800"
        >
          <FileDown className="h-4 w-4" aria-hidden="true" />
          Descargar PDF
        </a>
        <PrintButton>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimir
        </PrintButton>
      </div>

      {/* ── El documento (también es la vista de impresión) ────── */}
      <article className="overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-brand-600 bg-carbon-950 px-7 py-5 print:bg-white print:px-0">
          <div>
            <div className="print:hidden">
              <Logo variant="light" />
            </div>
            <div className="hidden print:block">
              <Logo variant="dark" />
            </div>
            <p className="mt-2 text-xs text-carbon-400 print:text-carbon-600">
              RUT {site.rut} · {site.contact.phoneDisplay} ·{" "}
              {site.contact.email}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-extrabold text-white print:text-carbon-950">
              PRESUPUESTO {folio}
            </p>
            <p className="text-xs text-carbon-400 print:text-carbon-600">
              Fecha de emisión: {formatLongDate(budget.date)}
            </p>
            <p className="text-xs text-carbon-400 print:text-carbon-600">
              Validez de la oferta: {budget.validityDays} días corridos
            </p>
          </div>
        </header>

        <div className="space-y-6 px-7 py-6 print:px-0">
          {/* Antecedentes */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-carbon-500">
              Antecedentes del cliente y de la obra
            </h2>
            <dl className="mt-2 grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              {[
                ["Señor(es)", clientName],
                ["RUT", clientRut],
                ["Dirección obra", budget.workAddress ?? ""],
                ["Teléfono", clientPhone],
                ["Ubicación", budget.workPlace ?? ""],
                ["Correo", clientEmail],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-carbon-500">
                    {label}
                  </dt>
                  <dd className="min-w-0 font-semibold text-carbon-900">
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Obra + partidas */}
          <section>
            <h2 className="rounded-lg bg-carbon-950 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white print:rounded-none">
              Obra: {budget.workTitle}
            </h2>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-carbon-200 text-xs font-bold uppercase text-carbon-600">
                    <th className="w-8 py-2 pr-3">N°</th>
                    <th className="py-2 pr-3">Descripción de la partida</th>
                    <th className="w-12 py-2 pr-3">Un</th>
                    <th className="w-16 py-2 pr-3 text-right">Cant.</th>
                    <th className="w-24 py-2 pr-3 text-right">P. unitario</th>
                    <th className="w-24 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-100">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2.5 pr-3 align-top font-bold text-carbon-500">
                        {index + 1}
                      </td>
                      <td className="whitespace-pre-wrap py-2.5 pr-3 align-top text-carbon-900">
                        {item.descripcion}
                      </td>
                      <td className="py-2.5 pr-3 align-top text-carbon-700">
                        {item.unidad || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-right align-top text-carbon-700 tabular-nums">
                        {formatQuantity(item.cantidad)}
                      </td>
                      <td className="py-2.5 pr-3 text-right align-top text-carbon-700 tabular-nums">
                        {formatCLP(item.precio)}
                      </td>
                      <td className="py-2.5 text-right align-top font-semibold text-carbon-900 tabular-nums">
                        {formatCLP(itemTotal(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <dl className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between border-t border-carbon-200 pt-2">
                <dt className="font-bold uppercase tracking-wide text-carbon-600">
                  Valor neto
                </dt>
                <dd className="font-bold text-carbon-900 tabular-nums">
                  {formatCLP(neto)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-bold uppercase tracking-wide text-carbon-600">
                  IVA 19%
                </dt>
                <dd className="font-bold text-carbon-900 tabular-nums">
                  {formatCLP(iva)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-carbon-950 px-3 py-2 print:rounded-none">
                <dt className="font-display font-bold uppercase tracking-wide text-white">
                  Total a pagar
                </dt>
                <dd className="font-display font-extrabold text-white tabular-nums">
                  {formatCLP(total)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Condiciones */}
          {conditions.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-carbon-500">
                Condiciones comerciales
              </h2>
              <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-carbon-700">
                {conditions.map((condition, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-bold text-carbon-900">
                      {index + 1}.
                    </span>
                    <span className="whitespace-pre-wrap">{condition}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Firmas de aceptación */}
          <div className="grid gap-10 pt-10 sm:grid-cols-2">
            <div className="text-center">
              <div className="border-t-2 border-carbon-900 pt-2">
                <p className="font-bold text-carbon-900">{site.legalName}</p>
                <p className="text-xs text-carbon-600">RUT {site.rut}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t-2 border-carbon-900 pt-2">
                <p className="font-bold text-carbon-900">Acepta cliente</p>
                <p className="text-xs text-carbon-600">Nombre, RUT y fecha</p>
              </div>
            </div>
          </div>

          <p className="border-t border-carbon-100 pt-4 text-center text-xs text-carbon-500">
            {site.legalName} · RUT {site.rut} · {site.contact.phoneDisplay} ·{" "}
            {site.contact.email} · Presupuesto {folio}
          </p>
        </div>
      </article>
    </div>
  );
}
