import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Paperclip, Pencil, Zap } from "lucide-react";

import { deleteMovementAction } from "@/backend/actions/finanzas.actions";
import { requireAdmin } from "@/backend/auth/session";
import { DOC_TYPES, PAYMENT_METHODS } from "@/backend/schemas/finanzas.schema";
import {
  automaticSourceHref,
  getMovement,
  isAutomatic,
} from "@/backend/services/movements.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { MovementTypeBadge, SignedAmount } from "@/frontend/admin/personal-ui";
import { formatDateLong } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Movimiento" };

export default async function MovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const movement = await getMovement(id);
  if (!movement) notFound();

  const auto = isAutomatic(movement);
  const source = automaticSourceHref(movement);
  const rows: [string, React.ReactNode][] = [
    ["Fecha", formatDateLong(movement.date)],
    ["Categoría", movement.category],
    [
      "Obra",
      movement.work ? (
        <Link href={`/admin/trabajos/${movement.work.id}`} className="hover:text-brand-700">
          {movement.work.title}
        </Link>
      ) : (
        "Gastos generales"
      ),
    ],
    [movement.type === "gasto" ? "Proveedor" : "Cliente", movement.counterparty ?? "—"],
    ["RUT", movement.counterpartyRut ?? "—"],
    [
      "Documento",
      movement.docType
        ? `${DOC_TYPES[movement.docType as keyof typeof DOC_TYPES] ?? movement.docType}${movement.docNumber ? ` N° ${movement.docNumber}` : ""}`
        : "—",
    ],
    ["Medio de pago", PAYMENT_METHODS[movement.paymentMethod as keyof typeof PAYMENT_METHODS] ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/finanzas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a finanzas
      </Link>

      <AdminPageHeader
        title={movement.description}
        action={
          !auto && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                href={`/admin/finanzas/${movement.id}/editar`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Link>
              <ConfirmDeleteButton
                action={deleteMovementAction.bind(null, movement.id)}
                label="Eliminar"
                confirmMessage="¿Eliminar este movimiento? Esta acción no se puede deshacer."
              />
            </div>
          )
        }
      />

      {auto && source && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Zap className="h-4 w-4" aria-hidden="true" />
          Generado automáticamente. Para corregirlo o borrarlo, hazlo desde su documento de origen.
          <Link href={source} className="inline-flex items-center gap-1 font-bold underline">
            Ver documento
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </p>
      )}

      <AdminCard className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <MovementTypeBadge type={movement.type} />
          <span className="font-display text-2xl">
            <SignedAmount type={movement.type} amount={movement.amount} />
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-carbon-500">{label}</dt>
              <dd className="font-semibold text-carbon-900">{value}</dd>
            </div>
          ))}
        </dl>

        {movement.notes && (
          <p className="whitespace-pre-wrap border-t border-carbon-100 pt-4 text-sm text-carbon-700">{movement.notes}</p>
        )}

        {movement.attachmentName && (
          <a
            href={`/admin/finanzas/${movement.id}/respaldo`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-carbon-200 px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Ver respaldo: {movement.attachmentName}
          </a>
        )}
      </AdminCard>
    </div>
  );
}
