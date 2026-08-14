import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { getClient } from "@/backend/services/clients.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ClientForm } from "@/frontend/admin/client-form";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/admin/clientes/${client.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a la ficha
      </Link>

      <AdminPageHeader title={`Editar: ${client.name}`} />

      <AdminCard>
        <ClientForm clientId={client.id} initial={client} />
      </AdminCard>
    </div>
  );
}
