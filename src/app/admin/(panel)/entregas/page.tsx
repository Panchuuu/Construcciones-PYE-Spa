import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardPlus, Mail } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  formatFolio,
  listDeliveries,
} from "@/backend/services/deliveries.service";
import {
  AdminPageHeader,
  DeliveryTypeBadge,
  EmptyState,
  formatDateShort,
} from "@/frontend/admin/ui";

export const metadata: Metadata = { title: "Entregas" };

export default async function EntregasPage() {
  await requireAdmin();
  const deliveries = await listDeliveries();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Actas de entrega"
        description="Registro de entregas conformes de trabajo y materiales, firmadas por ambas partes."
        action={
          <Link
            href="/admin/entregas/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
            Registrar entrega
          </Link>
        }
      />

      {deliveries.length === 0 ? (
        <EmptyState
          title="Aún no hay actas"
          description="Cada entrega de trabajo o materiales queda registrada aquí con folio, firmas y fecha."
          actionHref="/admin/entregas/nueva"
          actionLabel="Registrar la primera entrega"
        />
      ) : (
        <>
          {/* Lista compacta en teléfonos: toda la fila es un enlace */}
          <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:hidden">
            {deliveries.map((delivery) => (
              <li key={delivery.id}>
                <Link
                  href={`/admin/entregas/${delivery.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-carbon-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-extrabold text-carbon-900">
                      {formatFolio(delivery.folio)}
                    </span>
                    <DeliveryTypeBadge type={delivery.type} />
                    <CheckCircle2
                      className={
                        delivery.receivedOk
                          ? "h-4 w-4 text-green-600"
                          : "h-4 w-4 text-amber-500"
                      }
                      aria-label={
                        delivery.receivedOk
                          ? "Recibida conforme"
                          : "Recibida con observaciones"
                      }
                    />
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-carbon-900">
                    {delivery.work.title}
                  </p>
                  <p className="mt-0.5 text-xs text-carbon-500">
                    {delivery.work.client.name} · recibió{" "}
                    {delivery.clientSignerName} ·{" "}
                    {formatDateShort(delivery.date)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card sm:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                <th className="px-5 py-3.5">Folio</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Trabajo / Cliente</th>
                <th className="px-5 py-3.5">Recibió</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-100">
              {deliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="transition-colors hover:bg-carbon-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/entregas/${delivery.id}`}
                      className="font-display font-extrabold text-carbon-900 hover:text-brand-700"
                    >
                      {formatFolio(delivery.folio)}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <DeliveryTypeBadge type={delivery.type} />
                  </td>
                  <td className="max-w-[220px] px-5 py-4">
                    <p className="truncate font-semibold text-carbon-900">
                      {delivery.work.title}
                    </p>
                    <p className="truncate text-xs text-carbon-500">
                      {delivery.work.client.name}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-carbon-700">
                    {delivery.clientSignerName}
                  </td>
                  <td className="px-5 py-4 text-carbon-500">
                    {formatDateShort(delivery.date)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <CheckCircle2
                        className={
                          delivery.receivedOk
                            ? "h-4 w-4 text-green-600"
                            : "h-4 w-4 text-amber-500"
                        }
                        aria-hidden="true"
                      />
                      {delivery.receivedOk ? "Conforme" : "Con obs."}
                      {delivery.emailSentAt && (
                        <Mail
                          className="h-4 w-4 text-carbon-400"
                          aria-label="Enviada por correo"
                        />
                      )}
                    </span>
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
