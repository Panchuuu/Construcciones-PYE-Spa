import type { Metadata } from "next";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- las fotos salen de la BD */
import { ExternalLink, Plus } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  listProjects,
  projectImageUrl,
} from "@/backend/services/projects.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProyectosAdminPage() {
  await requireAdmin();
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Proyectos"
        description="Obras que se muestran en la sección pública del sitio."
        action={
          <Link
            href="/admin/proyectos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo proyecto
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos publicados"
          description="Publica tu primera obra para que aparezca en la sección Proyectos del sitio."
          actionHref="/admin/proyectos/nuevo"
          actionLabel="Publicar primer proyecto"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/admin/proyectos/${project.id}`}
                className="group block overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-carbon-100">
                  <img
                    src={projectImageUrl(project)}
                    alt={`Obra ${project.title}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-carbon-950/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-500 backdrop-blur-sm">
                    {project.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
                    {project.year} · {project.location}
                  </p>
                  <h2 className="font-display mt-1.5 font-bold leading-snug text-carbon-900">
                    {project.title}
                  </h2>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {projects.length > 0 && (
        <p className="text-sm text-carbon-600">
          <Link
            href="/proyectos"
            target="_blank"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-600"
          >
            Ver la página pública de proyectos
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      )}
    </div>
  );
}
