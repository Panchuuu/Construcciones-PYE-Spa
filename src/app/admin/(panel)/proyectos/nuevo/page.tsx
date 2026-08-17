import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ProjectForm } from "@/frontend/admin/project-form";

export const metadata: Metadata = { title: "Nuevo proyecto" };

export default async function NuevoProyectoPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/proyectos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a proyectos
      </Link>

      <AdminPageHeader
        title="Nuevo proyecto"
        description="Se publicará en la sección Proyectos del sitio web."
      />

      <AdminCard>
        <ProjectForm projectId={null} />
      </AdminCard>
    </div>
  );
}
