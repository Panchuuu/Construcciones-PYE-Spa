import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { MovementForm } from "@/frontend/admin/movement-form";
import { todayInput } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Registrar movimiento" };

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; obra?: string }>;
}) {
  await requireAdmin();
  const { tipo, obra } = await searchParams;
  const works = await listWorks();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/finanzas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a finanzas
      </Link>

      <AdminPageHeader title="Registrar movimiento" />

      <AdminCard className="max-w-3xl">
        <MovementForm
          movementId={null}
          works={works.map((w) => ({ id: w.id, title: w.title }))}
          initial={{
            type: tipo === "ingreso" ? "ingreso" : "gasto",
            date: todayInput(),
            amount: "",
            category: "",
            description: "",
            workId: works.some((w) => w.id === obra) ? obra! : "",
            docType: "",
            docNumber: "",
            counterparty: "",
            counterpartyRut: "",
            paymentMethod: "",
            notes: "",
            attachmentName: null,
          }}
        />
      </AdminCard>
    </div>
  );
}
