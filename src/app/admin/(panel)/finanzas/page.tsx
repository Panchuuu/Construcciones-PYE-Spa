import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Paperclip, PlusCircle, Zap } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import {
  currentPeriod,
  formatPeriod,
  isValidPeriod,
} from "@/backend/lib/payroll";
import {
  isAutomatic,
  listMovements,
  movementPeriods,
  movementTotals,
  totalsByCategory,
  totalsByWork,
  type MovementFilter,
} from "@/backend/services/movements.service";
import { listWorks } from "@/backend/services/works.service";
import { AdminCard, AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { SignedAmount, ViewChip } from "@/frontend/admin/personal-ui";
import { cn, formatCLP, formatDateUTC } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Finanzas" };

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string; obra?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  // Por defecto el mes actual; "todos" muestra el histórico completo.
  const mes =
    sp.mes === "todos"
      ? "todos"
      : sp.mes && isValidPeriod(sp.mes)
        ? sp.mes
        : currentPeriod();
  const tipo = sp.tipo === "ingreso" || sp.tipo === "gasto" ? sp.tipo : "";
  const obra = sp.obra ?? "";

  const filter: MovementFilter = {
    period: mes === "todos" ? undefined : mes,
    type: tipo,
    workId: obra,
  };

  const [movements, totals, expenseCats, byWork, periods, works] =
    await Promise.all([
      listMovements(filter),
      movementTotals(filter),
      totalsByCategory(filter, "gasto"),
      obra ? Promise.resolve([]) : totalsByWork({ period: filter.period }),
      movementPeriods(),
      listWorks(),
    ]);

  const periodOptions = [...new Set([currentPeriod(), ...periods])]
    .sort()
    .reverse();
  const maxCat = Math.max(1, ...expenseCats.map((c) => c.amount));
  const scope = mes === "todos" ? "Histórico" : formatPeriod(mes);

  const selectClass =
    "mt-1.5 block min-h-12 w-full rounded-xl border border-carbon-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-carbon-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 sm:min-h-10";
  const stats = [
    { label: "Ingresos", value: totals.income, tone: "text-green-700" },
    { label: "Gastos", value: totals.expense, tone: "text-carbon-900" },
    {
      label: "Resultado",
      value: totals.balance,
      tone: totals.balance >= 0 ? "text-green-700" : "text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Finanzas"
        description="Ingresos y gastos de la empresa y de cada obra. Las liquidaciones, finiquitos y pagos día hombre se registran solos."
        action={
          <Link
            href="/admin/finanzas/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 active:bg-brand-600"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Registrar movimiento
          </Link>
        }
      />

      {/* Filtros: formulario GET, funciona sin JavaScript */}
      <form className="grid grid-cols-2 gap-3 rounded-2xl border border-carbon-200 bg-white p-4 shadow-card sm:flex sm:items-end">
        <label className="text-xs font-bold uppercase tracking-wide text-carbon-500">
          Mes
          <select name="mes" defaultValue={mes} className={selectClass}>
            <option value="todos">Todos los meses</option>
            {periodOptions.map((p) => (
              <option key={p} value={p}>
                {formatPeriod(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-carbon-500">
          Tipo
          <select name="tipo" defaultValue={tipo} className={selectClass}>
            <option value="">Todos</option>
            <option value="ingreso">Solo ingresos</option>
            <option value="gasto">Solo gastos</option>
          </select>
        </label>
        <label className="col-span-2 min-w-0 text-xs font-bold uppercase tracking-wide text-carbon-500 sm:flex-1">
          Obra
          <select name="obra" defaultValue={obra} className={selectClass}>
            <option value="">Todas las obras</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="col-span-2 min-h-12 rounded-xl bg-carbon-900 px-5 text-sm font-bold text-white transition-colors hover:bg-carbon-800 active:bg-carbon-950 sm:min-h-10"
        >
          Filtrar
        </button>
      </form>

      {/* Totales: un solo bloque segmentado */}
      <section aria-label="Totales">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-carbon-500">{scope}</p>
        <dl className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-4 px-5 py-4 sm:block sm:py-5">
              <dt className="text-sm font-semibold text-carbon-600 sm:text-xs sm:uppercase sm:tracking-wide sm:text-carbon-500">
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "font-display text-2xl font-extrabold tracking-tight tabular-nums sm:mt-2 sm:text-3xl",
                  stat.tone,
                )}
              >
                {formatCLP(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Gastos por categoría */}
        <AdminCard className="min-w-0 max-sm:p-5">
          <h2 className="font-display text-base font-bold text-carbon-900">Gastos por categoría</h2>
          {expenseCats.length === 0 ? (
            <p className="mt-3 text-sm text-carbon-500">Sin gastos en este periodo.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {expenseCats.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-carbon-800">{c.category}</span>
                    <span className="font-semibold tabular-nums">{formatCLP(c.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-carbon-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(c.amount / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Resultado por obra */}
        {!obra && (
          <AdminCard className="min-w-0 max-sm:p-0">
            <h2 className="font-display text-base font-bold text-carbon-900 max-sm:px-5 max-sm:pt-5">
              Resultado por obra
            </h2>
            {byWork.length === 0 ? (
              <p className="mt-3 text-sm text-carbon-500 max-sm:px-5 max-sm:pb-5">
                Ningún movimiento asociado a obras en este periodo.
              </p>
            ) : (
              <>
                {/* Teléfono: una fila por obra */}
                <ul className="mt-2 divide-y divide-carbon-100 sm:hidden">
                  {byWork.map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/admin/finanzas?mes=${mes}&obra=${w.id}`}
                        className="flex min-h-16 items-center gap-3 px-5 py-3 active:bg-carbon-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-carbon-900">{w.title}</p>
                          <p className="truncate text-sm text-carbon-500 tabular-nums">
                            <span className="text-green-700">+{formatCLP(w.income)}</span> · −{formatCLP(w.expense)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 font-bold tabular-nums",
                            w.balance >= 0 ? "text-green-700" : "text-red-700",
                          )}
                        >
                          {formatCLP(w.balance)}
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-carbon-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>

                <table className="mt-3 hidden w-full text-sm sm:table">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-carbon-500">
                      <th className="py-2">Obra</th>
                      <th className="py-2 text-right">Ingresos</th>
                      <th className="py-2 text-right">Gastos</th>
                      <th className="py-2 text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-carbon-100">
                    {byWork.map((w) => (
                      <tr key={w.id}>
                        <td className="max-w-[160px] py-2.5 pr-2">
                          <Link
                            href={`/admin/finanzas?mes=${mes}&obra=${w.id}`}
                            className="block truncate font-semibold text-carbon-900 hover:text-brand-700"
                          >
                            {w.title}
                          </Link>
                        </td>
                        <td className="py-2.5 text-right text-green-700 tabular-nums">{formatCLP(w.income)}</td>
                        <td className="py-2.5 text-right tabular-nums">{formatCLP(w.expense)}</td>
                        <td
                          className={cn(
                            "py-2.5 text-right font-bold tabular-nums",
                            w.balance >= 0 ? "text-green-700" : "text-red-700",
                          )}
                        >
                          {formatCLP(w.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </AdminCard>
        )}
      </div>

      {/* Movimientos */}
      <section>
        <h2 className="font-display text-lg font-bold text-carbon-900">
          Movimientos <span className="font-semibold text-carbon-400">{movements.length}</span>
        </h2>
        <div className="mt-3">
          {movements.length === 0 ? (
            <EmptyState
              title="Sin movimientos con estos filtros"
              description="Registra facturas de materiales, arriendos, estados de pago de clientes y más."
              actionHref="/admin/finanzas/nuevo"
              actionLabel="Registrar movimiento"
            />
          ) : (
            <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
              {movements.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/admin/finanzas/${m.id}`}
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-carbon-50 active:bg-carbon-50 sm:gap-4 sm:px-5"
                  >
                    <span className="hidden w-24 shrink-0 text-xs text-carbon-500 sm:block">
                      {formatDateUTC(m.date)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-start gap-1.5 font-semibold leading-snug text-carbon-900 sm:items-center">
                        <span className="line-clamp-2 sm:truncate">{m.description}</span>
                        {m.attachmentName && (
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-carbon-400" aria-label="Con respaldo" />
                        )}
                        {isAutomatic(m) && (
                          <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Generado automáticamente" />
                        )}
                      </p>
                      <p className="truncate text-sm text-carbon-500 sm:text-xs">
                        <span className="sm:hidden">{formatDateUTC(m.date)} · </span>
                        {m.category}
                        {m.work && <span className="max-sm:hidden"> · {m.work.title}</span>}
                        {m.counterparty && <span className="max-sm:hidden"> · {m.counterparty}</span>}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <SignedAmount type={m.type} amount={m.amount} />
                    </span>
                    <ViewChip />
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
