import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  HardHat,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";

import { deleteClientAction } from "@/backend/actions/admin.actions";
import { requireAdmin } from "@/backend/auth/session";
import { getClient } from "@/backend/services/clients.service";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  WorkStatusBadge,
  formatDateShort,
} from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";

export const metadata: Metadata = { title: "Ficha de cliente" };

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const facts = [
    { icon: Mail, value: client.email },
    { icon: Phone, value: client.phone },
    { icon: MapPin, value: client.address },
  ].filter((fact) => fact.value);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a clientes
      </Link>

      <AdminPageHeader
        title={client.name}
        description={
          [client.company, client.rut && `RUT ${client.rut}`]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        action={
          <div className="flex gap-2">
            <Link
              href={`/admin/clientes/${client.id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
            <ConfirmDeleteButton
              action={deleteClientAction.bind(null, client.id)}
              label="Eliminar"
              confirmMessage={`¿Eliminar a ${client.name}? Se borrarán también sus trabajos y actas de entrega. Esta acción no se puede deshacer.`}
            />
          </div>
        }
      />

      {(facts.length > 0 || client.notes) && (
        <AdminCard>
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-carbon-700">
            {facts.map((fact, index) => (
              <li key={index} className="flex items-center gap-2">
                <fact.icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {fact.value}
              </li>
            ))}
          </ul>
          {client.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-carbon-100 pt-4 text-sm text-carbon-600">
              {client.notes}
            </p>
          )}
        </AdminCard>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-carbon-900">
            Trabajos de este cliente
          </h2>
          <Link
            href={`/admin/trabajos/nuevo?cliente=${client.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-carbon-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-carbon-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo trabajo
          </Link>
        </div>

        <div className="mt-4">
          {client.works.length === 0 ? (
            <EmptyState
              title="Sin trabajos registrados"
              description="Registra un trabajo para poder generar actas de entrega para este cliente."
              actionHref={`/admin/trabajos/nuevo?cliente=${client.id}`}
              actionLabel="Registrar trabajo"
            />
          ) : (
            <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
              {client.works.map((work) => (
                <li key={work.id}>
                  <Link
                    href={`/admin/trabajos/${work.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-carbon-50"
                  >
                    <HardHat
                      className="h-4 w-4 shrink-0 text-brand-600"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate font-semibold text-carbon-900">
                      {work.title}
                    </span>
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
      </section>
    </div>
  );
}
