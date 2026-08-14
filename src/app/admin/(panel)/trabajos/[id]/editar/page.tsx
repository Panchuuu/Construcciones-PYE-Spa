import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listClients } from "@/backend/services/clients.service";
import { getWork } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { WorkForm } from "@/frontend/admin/work-form";

export const metadata: Metadata = { title: "Editar trabajo" };

export default async function EditarTrabajoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [work, clients] = await Promise.all([getWork(id), listClients()]);
  if (!work) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/admin/trabajos/${work.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al trabajo
      </Link>

      <AdminPageHeader title={`Editar: ${work.title}`} />

      <AdminCard>
        <WorkForm
          workId={work.id}
          initial={work}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        />
      </AdminCard>
    </div>
  );
}
