import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  formatBudgetFolio,
  getBudget,
  parseBudgetItems,
} from "@/backend/services/budgets.service";
import { listClients } from "@/backend/services/clients.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { BudgetForm } from "@/frontend/admin/budget-form";

export const metadata: Metadata = { title: "Editar presupuesto" };

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [budget, clients] = await Promise.all([getBudget(id), listClients()]);
  if (!budget) notFound();

  const items = parseBudgetItems(budget.itemsJson);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/presupuestos/${budget.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al presupuesto
      </Link>

      <AdminPageHeader
        title={`Editar presupuesto ${formatBudgetFolio(budget.folio)}`}
        description="El número correlativo no cambia al editar."
      />

      <AdminCard className="max-w-3xl">
        <BudgetForm
          budgetId={budget.id}
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
            rut: client.rut,
            phone: client.phone,
            email: client.email,
            address: client.address,
          }))}
          initial={{
            clientId: budget.clientId,
            clientName: budget.clientName,
            clientRut: budget.clientRut,
            clientPhone: budget.clientPhone,
            clientEmail: budget.clientEmail,
            workAddress: budget.workAddress,
            workPlace: budget.workPlace,
            workTitle: budget.workTitle,
            date: budget.date.toISOString().slice(0, 10),
            validityDays: budget.validityDays,
            items: items.map((item) => ({
              descripcion: item.descripcion,
              unidad: item.unidad ?? "",
              cantidad: String(item.cantidad).replace(".", ","),
              precio: String(item.precio),
            })),
            conditions: budget.conditions ?? "",
          }}
        />
      </AdminCard>
    </div>
  );
}
