import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { DEFAULT_BUDGET_CONDITIONS } from "@/backend/schemas/admin.schema";
import { listClients } from "@/backend/services/clients.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { BudgetForm } from "@/frontend/admin/budget-form";

export const metadata: Metadata = { title: "Nuevo presupuesto" };

export default async function NuevoPresupuestoPage() {
  await requireAdmin();
  const clients = await listClients();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/presupuestos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a presupuestos
      </Link>

      <AdminPageHeader
        title="Nuevo presupuesto"
        description="El número correlativo se asigna solo al guardar."
      />

      <AdminCard className="max-w-3xl">
        <BudgetForm
          budgetId={null}
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
            rut: client.rut,
            phone: client.phone,
            email: client.email,
            address: client.address,
          }))}
          initial={{
            clientId: null,
            clientName: null,
            clientRut: null,
            clientPhone: null,
            clientEmail: null,
            workAddress: null,
            workPlace: null,
            workTitle: "",
            date: new Date().toISOString().slice(0, 10),
            validityDays: 30,
            items: [],
            conditions: DEFAULT_BUDGET_CONDITIONS,
          }}
        />
      </AdminCard>
    </div>
  );
}
