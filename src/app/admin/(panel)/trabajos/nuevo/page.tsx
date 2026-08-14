import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/backend/auth/session";
import { listClients } from "@/backend/services/clients.service";
import { AdminCard, AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { WorkForm } from "@/frontend/admin/work-form";

export const metadata: Metadata = { title: "Nuevo trabajo" };

export default async function NuevoTrabajoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  await requireAdmin();
  const { cliente } = await searchParams;
  const clients = await listClients();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader
        title="Nuevo trabajo"
        description="Cada trabajo pertenece a un cliente y agrupa sus actas de entrega."
      />

      {clients.length === 0 ? (
        <EmptyState
          title="Primero necesitas un cliente"
          description="Los trabajos se asocian a un cliente. Crea el cliente y vuelve aquí."
          actionHref="/admin/clientes/nuevo"
          actionLabel="Crear cliente"
        />
      ) : (
        <AdminCard>
          <WorkForm
            workId={null}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            preselectedClientId={cliente}
          />
        </AdminCard>
      )}

      <p className="text-center text-xs text-carbon-500">
        ¿Falta el cliente en la lista?{" "}
        <Link
          href="/admin/clientes/nuevo"
          className="font-bold text-brand-700 hover:text-brand-600"
        >
          Regístralo primero
        </Link>
        .
      </p>
    </div>
  );
}
