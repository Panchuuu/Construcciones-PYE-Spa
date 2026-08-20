import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/backend/auth/session";
import {
  QUOTE_STATUSES,
  type QuoteStatus,
} from "@/backend/schemas/admin.schema";
import { listQuotes } from "@/backend/services/quotes.service";
import {
  AdminPageHeader,
  EmptyState,
  QuoteStatusBadge,
  formatDateShort,
} from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Cotizaciones" };

const FILTERS = [
  { value: undefined, label: "Todas" },
  ...(Object.keys(QUOTE_STATUSES) as QuoteStatus[]).map((value) => ({
    value,
    label: QUOTE_STATUSES[value],
  })),
];

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireAdmin();
  const { estado } = await searchParams;
  const status =
    estado && estado in QUOTE_STATUSES ? (estado as QuoteStatus) : undefined;
  const quotes = await listQuotes(status);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cotizaciones"
        description="Solicitudes recibidas desde el formulario del sitio web."
      />

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          return (
            <Link
              key={filter.label}
              href={
                filter.value
                  ? `/admin/cotizaciones?estado=${filter.value}`
                  : "/admin/cotizaciones"
              }
              className={cn(
                "rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors",
                active
                  ? "border-carbon-900 bg-carbon-900 text-white"
                  : "border-carbon-200 bg-white text-carbon-700 hover:border-carbon-900",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          title={
            status ? "Sin cotizaciones en este estado" : "Aún no hay cotizaciones"
          }
          description={
            status
              ? "Prueba con otro filtro."
              : "Cuando alguien envíe el formulario de contacto del sitio, su solicitud aparecerá aquí."
          }
        />
      ) : (
        <>
          {/* Lista compacta en teléfonos: toda la fila es un enlace */}
          <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:hidden">
            {quotes.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/admin/cotizaciones/${quote.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-carbon-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-bold text-carbon-900">
                      {quote.name}
                    </p>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-carbon-700">{quote.service}</p>
                  <p className="mt-1 text-xs text-carbon-500">
                    {quote.phone} · {formatDateShort(quote.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card sm:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                <th className="px-5 py-3.5">Nombre</th>
                <th className="px-5 py-3.5">Servicio</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Recibida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-100">
              {quotes.map((quote) => (
                <tr key={quote.id} className="transition-colors hover:bg-carbon-50">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/cotizaciones/${quote.id}`}
                      className="font-bold text-carbon-900 hover:text-brand-700"
                    >
                      {quote.name}
                    </Link>
                    {quote.location && (
                      <p className="text-xs text-carbon-500">{quote.location}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-carbon-700">{quote.service}</td>
                  <td className="px-5 py-4 text-carbon-700">
                    <p>{quote.phone}</p>
                    <p className="text-xs text-carbon-500">{quote.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="px-5 py-4 text-carbon-500">
                    {formatDateShort(quote.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
