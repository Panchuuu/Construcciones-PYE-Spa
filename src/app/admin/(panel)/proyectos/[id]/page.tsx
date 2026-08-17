import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
/* eslint-disable @next/next/no-img-element -- la foto sale de la BD */
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Ruler,
} from "lucide-react";

import { deleteProjectAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import {
  getProject,
  parseScope,
  projectImageUrl,
} from "@/backend/services/projects.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";

export const metadata: Metadata = { title: "Proyecto" };

export default async function ProyectoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const scope = parseScope(project.scopeJson);
  const facts = [
    { icon: MapPin, label: "Ubicación", value: project.location },
    { icon: Ruler, label: "Superficie", value: project.surface },
    { icon: Clock, label: "Duración", value: project.duration },
    { icon: CalendarDays, label: "Año", value: String(project.year) },
    { icon: Building2, label: "Mandante", value: project.client },
  ];

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
        title={project.title}
        description={`${project.category} · ${project.year}`}
        action={
          <div className="flex gap-2">
            <Link
              href={`/admin/proyectos/${project.id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
            <ConfirmDeleteButton
              action={deleteProjectAction.bind(null, project.id)}
              label="Eliminar"
              confirmMessage={`¿Eliminar el proyecto "${project.title}"? Dejará de aparecer en el sitio web.`}
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-carbon-200 bg-carbon-100 shadow-card">
          <img
            src={projectImageUrl(project)}
            alt={`Obra ${project.title}`}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>

        <div className="space-y-6">
          <AdminCard>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
              Ficha técnica
            </h2>
            <ul className="mt-4 space-y-3">
              {facts.map((fact) => (
                <li key={fact.label} className="flex items-start gap-3 text-sm">
                  <fact.icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
                      {fact.label}
                    </p>
                    <p className="text-carbon-800">{fact.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminCard>
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
              En el sitio web
            </h2>
            <Link
              href={`/proyectos/${project.slug}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 break-all text-sm font-semibold text-brand-700 hover:text-brand-600"
            >
              /proyectos/{project.slug}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          </AdminCard>
        </div>
      </div>

      <AdminCard>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-carbon-500">
          Descripción
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-carbon-800">
          {project.summary}
        </p>

        {scope.length > 0 && (
          <>
            <h2 className="font-display mt-6 text-sm font-bold uppercase tracking-wide text-carbon-500">
              Alcance de la obra
            </h2>
            <ul className="mt-3 space-y-2">
              {scope.map((item) => (
                <li
                  key={item}
                  className="border-b border-carbon-100 pb-2 text-sm text-carbon-800"
                >
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
