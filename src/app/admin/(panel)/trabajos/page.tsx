import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listWorks } from "@/backend/services/works.service";
import { WORK_STATUSES } from "@/backend/schemas/admin.schema";
import {
  AdminPageHeader,
  EmptyState,
  WorkStatusBadge,
  formatDateShort,
} from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Trabajos" };

const FILTERS = [
  { value: "", label: "Todos" },
  ...Object.entries(WORK_STATUSES).map(([value, label]) => ({ value, label })),
];

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireAdmin();
  const { estado } = await searchParams;
  const works = await listWorks(estado || undefined);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trabajos"
        description="Obras y servicios en ejecución o entregados."
        action={
          <Link
            href="/admin/trabajos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo trabajo
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (estado ?? "") === filter.value;
          return (
            <Link
              key={filter.value}
              href={
                filter.value
                  ? `/admin/trabajos?estado=${filter.value}`
                  : "/admin/trabajos"
              }
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "border-carbon-900 bg-carbon-900 text-white"
                  : "border-carbon-200 bg-white text-carbon-700 hover:border-carbon-400",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {works.length === 0 ? (
        <EmptyState
          title="No hay trabajos aquí"
          description="Registra un trabajo y asócialo a un cliente para empezar a generar actas de entrega."
          actionHref="/admin/trabajos/nuevo"
          actionLabel="Registrar trabajo"
        />
      ) : (
        <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
          {works.map((work) => (
            <li key={work.id}>
              <Link
                href={`/admin/trabajos/${work.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors hover:bg-carbon-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-carbon-900">
                    {work.title}
                  </p>
                  <p className="text-xs text-carbon-500">
                    {work.client.name}
                    {work.location ? ` · ${work.location}` : ""}
                  </p>
                </div>
                <WorkStatusBadge status={work.status} />
                <span className="text-xs text-carbon-500">
                  {work._count.deliveries} acta(s) ·{" "}
                  {formatDateShort(work.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
