import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { listClients } from "@/backend/services/clients.service";
import {
  AdminPageHeader,
  EmptyState,
  fieldClass,
  formatDateShort,
} from "@/frontend/admin/ui";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const clients = await listClients(q?.trim() || undefined);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clientes"
        description="Personas y empresas para las que se registran trabajos y entregas."
        action={
          <Link
            href="/admin/clientes/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Nuevo cliente
          </Link>
        }
      />

      <form className="relative max-w-md" role="search">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-carbon-400"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o RUT…"
          aria-label="Buscar clientes"
          className={`${fieldClass} pl-11`}
        />
      </form>

      {clients.length === 0 ? (
        <EmptyState
          title={q ? "Sin resultados" : "Aún no hay clientes"}
          description={
            q
              ? `Ningún cliente coincide con "${q}".`
              : "Registra a tu primer cliente para poder asociarle trabajos y entregas."
          }
          actionHref={q ? undefined : "/admin/clientes/nuevo"}
          actionLabel={q ? undefined : "Registrar cliente"}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">RUT</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Trabajos</th>
                <th className="px-5 py-3.5">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-100">
              {clients.map((client) => (
                <tr key={client.id} className="transition-colors hover:bg-carbon-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/clientes/${client.id}`}
                      className="font-bold text-carbon-900 hover:text-brand-700"
                    >
                      {client.name}
                    </Link>
                    {client.company && (
                      <p className="text-xs text-carbon-500">{client.company}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-carbon-700">
                    {client.rut ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-carbon-700">
                    {client.phone ?? client.email ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-carbon-700">
                    {client._count.works}
                  </td>
                  <td className="px-5 py-4 text-carbon-500">
                    {formatDateShort(client.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
