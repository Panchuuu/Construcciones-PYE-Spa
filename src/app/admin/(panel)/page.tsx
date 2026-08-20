import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  ClipboardPlus,
  FilePlus2,
  HardHat,
  Inbox,
  UserPlus,
  Users,
} from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { getDashboard } from "@/backend/services/dashboard.service";
import { formatFolio } from "@/backend/services/deliveries.service";
import {
  AdminCard,
  AdminPageHeader,
  DeliveryTypeBadge,
  EmptyState,
  QuoteStatusBadge,
  formatDateShort,
} from "@/frontend/admin/ui";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const data = await getDashboard();

  const stats = [
    { label: "Cotizaciones nuevas", value: data.newQuotes, icon: Inbox, href: "/admin/cotizaciones?estado=nueva" },
    { label: "Clientes", value: data.clients, icon: Users, href: "/admin/clientes" },
    { label: "Trabajos en progreso", value: data.worksInProgress, icon: HardHat, href: "/admin/trabajos" },
    { label: "Actas de entrega", value: data.deliveries, icon: ClipboardCheck, href: "/admin/entregas" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Hola, ${session.name.split(" ")[0]}`}
        description="Resumen de la actividad registrada en el panel."
      />

      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/entregas/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
        >
          <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
          Registrar entrega
        </Link>
        <Link
          href="/admin/presupuestos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-5 py-3 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Nuevo presupuesto
        </Link>
        <Link
          href="/admin/clientes/nuevo"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-5 py-3 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </Link>
        <Link
          href="/admin/trabajos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-5 py-3 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
        >
          <HardHat className="h-4 w-4" aria-hidden="true" />
          Nuevo trabajo
        </Link>
      </div>

      {/* Cifras */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <AdminCard className="transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <stat.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <p className="font-display mt-3 text-4xl font-extrabold tracking-tight text-carbon-900 tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-carbon-500">
                {stat.label}
              </p>
            </AdminCard>
          </Link>
        ))}
      </div>

      {/* Últimas cotizaciones */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-carbon-900">
            Últimas cotizaciones
          </h2>
          <Link
            href="/admin/cotizaciones"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4">
          {data.recentQuotes.length === 0 ? (
            <EmptyState
              title="Aún no llegan cotizaciones"
              description="Cuando alguien envíe el formulario de contacto del sitio, su solicitud aparecerá aquí."
            />
          ) : (
            <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
              {data.recentQuotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/admin/cotizaciones/${quote.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-carbon-50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-carbon-700">
                      <span className="font-semibold">{quote.name}</span> —{" "}
                      {quote.service}
                    </span>
                    <QuoteStatusBadge status={quote.status} />
                    <span className="text-xs text-carbon-500">
                      {formatDateShort(quote.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Últimas actas */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-carbon-900">
            Últimas actas de entrega
          </h2>
          <Link
            href="/admin/entregas"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-4">
          {data.recentDeliveries.length === 0 ? (
            <EmptyState
              title="Aún no hay entregas registradas"
              description="Cuando registres la primera acta de entrega conforme, aparecerá aquí."
              actionHref="/admin/entregas/nueva"
              actionLabel="Registrar la primera entrega"
            />
          ) : (
            <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
              {data.recentDeliveries.map((delivery) => (
                <li key={delivery.id}>
                  <Link
                    href={`/admin/entregas/${delivery.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-carbon-50"
                  >
                    <span className="font-display w-16 font-extrabold text-carbon-900">
                      {formatFolio(delivery.folio)}
                    </span>
                    <DeliveryTypeBadge type={delivery.type} />
                    <span className="min-w-0 flex-1 truncate text-sm text-carbon-700">
                      {delivery.work.title} —{" "}
                      <span className="font-semibold">
                        {delivery.work.client.name}
                      </span>
                    </span>
                    <span className="text-xs text-carbon-500">
                      {formatDateShort(delivery.date)}
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
