import type { Metadata } from "next";

import { requireAdmin } from "@/backend/auth/session";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { DeliveryForm } from "@/frontend/admin/delivery-form";

export const metadata: Metadata = { title: "Registrar entrega" };

export default async function NuevaEntregaPage({
  searchParams,
}: {
  searchParams: Promise<{ trabajo?: string }>;
}) {
  const session = await requireAdmin();
  const { trabajo } = await searchParams;
  const works = await listWorks();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHeader
        title="Registrar entrega"
        description="Completa el acta con el cliente presente: ambos firman en esta misma pantalla."
      />

      {works.length === 0 ? (
        <EmptyState
          title="Primero necesitas un trabajo"
          description="Las actas de entrega se asocian a un trabajo de un cliente. Crea el trabajo y vuelve aquí."
          actionHref="/admin/trabajos/nuevo"
          actionLabel="Crear trabajo"
        />
      ) : (
        <AdminCard className="p-7">
          <DeliveryForm
            works={works.map((work) => ({
              id: work.id,
              title: work.title,
              clientName: work.client.name,
            }))}
            preselectedWorkId={trabajo}
            defaultCompanySigner={session.name}
          />
        </AdminCard>
      )}
    </div>
  );
}
