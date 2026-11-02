import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { getMovement, isAutomatic } from "@/backend/services/movements.service";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { MovementForm } from "@/frontend/admin/movement-form";
import { toDateInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Editar movimiento" };

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [movement, works] = await Promise.all([getMovement(id), listWorks()]);
  if (!movement) notFound();
  // Los automáticos se corrigen desde su documento de origen.
  if (isAutomatic(movement)) redirect(`/admin/finanzas/${movement.id}`);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/finanzas/${movement.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al movimiento
      </Link>

      <AdminPageHeader title="Editar movimiento" />

      <AdminCard className="max-w-3xl">
        <MovementForm
          movementId={movement.id}
          works={works.map((w) => ({ id: w.id, title: w.title }))}
          initial={{
            type: movement.type === "ingreso" ? "ingreso" : "gasto",
            date: toDateInput(movement.date),
            amount: String(movement.amount),
            category: movement.category,
            description: movement.description,
            workId: movement.workId ?? "",
            docType: movement.docType ?? "",
            docNumber: movement.docNumber ?? "",
            counterparty: movement.counterparty ?? "",
            counterpartyRut: movement.counterpartyRut ?? "",
            paymentMethod: movement.paymentMethod ?? "",
            notes: movement.notes ?? "",
            attachmentName: movement.attachmentName,
          }}
        />
      </AdminCard>
    </div>
  );
}
