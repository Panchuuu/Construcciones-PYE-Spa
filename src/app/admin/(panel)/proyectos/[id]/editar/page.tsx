import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  getProject,
  parseScope,
  projectImageUrl,
} from "@/backend/services/projects.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ProjectForm } from "@/frontend/admin/project-form";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/proyectos/${project.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al proyecto
      </Link>

      <AdminPageHeader
        title="Editar proyecto"
        description={project.title}
      />

      <AdminCard>
        <ProjectForm
          projectId={project.id}
          initial={{
            slug: project.slug,
            title: project.title,
            category: project.category,
            location: project.location,
            year: project.year,
            surface: project.surface,
            duration: project.duration,
            client: project.client,
            summary: project.summary,
            scope: parseScope(project.scopeJson),
            imageUrl: projectImageUrl(project),
          }}
        />
      </AdminCard>
    </div>
  );
}
