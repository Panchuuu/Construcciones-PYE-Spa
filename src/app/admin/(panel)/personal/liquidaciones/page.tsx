import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { formatPeriod, isValidPeriod } from "@/backend/lib/payroll";
import { formatDocFolio, listPayslips } from "@/backend/services/payroll.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { ViewChip, ViewLink, chipClass } from "@/frontend/admin/personal-ui";
import { ScrollStrip } from "@/frontend/admin/scroll-strip";
import { formatCLP } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Liquidaciones de sueldo" };

export default async function LiquidacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireAdmin();
  const { mes } = await searchParams;
  const all = await listPayslips();
  const periods = [...new Set(all.map((p) => p.period))];
  const selected = mes && isValidPeriod(mes) ? mes : "";
  const payslips = selected ? all.filter((p) => p.period === selected) : all;

  const totalNet = payslips.reduce((s, p) => s + p.netPay, 0);
  const totalCost = payslips.reduce((s, p) => s + p.companyCost, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Liquidaciones de sueldo"
        description="Cálculo mensual con gratificación, AFP, salud, cesantía e impuesto único. Cada una queda registrada como gasto."
        action={
          <Link
            href="/admin/personal/liquidaciones/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 active:bg-brand-600"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Nueva liquidación
          </Link>
        }
      />

      {periods.length > 0 && (
        <ScrollStrip label="Filtrar por mes">
          {[["", "Todos los meses"], ...periods.map((p) => [p, formatPeriod(p)])].map(([value, label]) => (
            <Link
              key={value}
              href={value ? `/admin/personal/liquidaciones?mes=${value}` : "/admin/personal/liquidaciones"}
              aria-current={selected === value ? "page" : undefined}
              className={chipClass(selected === value)}
            >
              <span className="inline-block first-letter:uppercase">{label}</span>
            </Link>
          ))}
        </ScrollStrip>
      )}

      {payslips.length === 0 ? (
        <EmptyState
          title="Aún no hay liquidaciones"
          description="Antes de la primera, carga los parámetros previsionales del mes (UF, UTM, sueldo mínimo y tasas)."
          actionHref="/admin/personal/liquidaciones/nueva"
          actionLabel="Emitir la primera liquidación"
        />
      ) : (
        <>
          {/* Teléfono: resumen y filas táctiles */}
          <div className="overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card sm:hidden">
            <dl className="grid grid-cols-2 divide-x divide-carbon-100 border-b border-carbon-100 bg-carbon-50">
              <div className="px-4 py-3">
                <dt className="text-xs font-semibold text-carbon-500">Líquido total</dt>
                <dd className="font-display text-lg font-extrabold text-carbon-900 tabular-nums">{formatCLP(totalNet)}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-semibold text-carbon-500">Costo empresa</dt>
                <dd className="font-display text-lg font-extrabold text-carbon-900 tabular-nums">{formatCLP(totalCost)}</dd>
              </div>
            </dl>
            <ul className="divide-y divide-carbon-100">
              {payslips.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/personal/liquidaciones/${p.id}`}
                    className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors active:bg-carbon-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-carbon-900">{p.employee.name}</p>
                      <p className="truncate text-sm text-carbon-500">
                        <span className="first-letter:uppercase inline-block">{formatPeriod(p.period)}</span> · {formatDocFolio(p.folio)}
                      </p>
                    </div>
                    <span className="text-right">
                      <span className="block font-bold text-carbon-900 tabular-nums">{formatCLP(p.netPay)}</span>
                      <span className="block text-xs text-carbon-500">líquido</span>
                    </span>
                    <ViewChip />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Desde tablet: tabla */}
          <div className="hidden overflow-x-auto rounded-2xl border border-carbon-200 bg-white shadow-card sm:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-carbon-200 bg-carbon-50 text-xs font-bold uppercase tracking-wide text-carbon-600">
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5">Trabajador</th>
                  <th className="px-5 py-3.5">Mes</th>
                  <th className="px-5 py-3.5 text-right">Líquido</th>
                  <th className="px-5 py-3.5 text-right">Costo empresa</th>
                  <th className="px-5 py-3.5">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-100">
                {payslips.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-carbon-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/admin/personal/liquidaciones/${p.id}`}
                        className="font-display font-extrabold text-carbon-900 hover:text-brand-700"
                      >
                        {formatDocFolio(p.folio)}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-carbon-900">{p.employee.name}</p>
                      <p className="text-xs text-carbon-500">{p.employee.rut}</p>
                    </td>
                    <td className="px-5 py-4 text-carbon-700 first-letter:uppercase">{formatPeriod(p.period)}</td>
                    <td className="px-5 py-4 text-right font-bold text-carbon-900 tabular-nums">{formatCLP(p.netPay)}</td>
                    <td className="px-5 py-4 text-right text-carbon-600 tabular-nums">{formatCLP(p.companyCost)}</td>
                    <td className="px-5 py-4 text-right">
                      <ViewLink
                        href={`/admin/personal/liquidaciones/${p.id}`}
                        label={`Ver liquidación ${formatDocFolio(p.folio)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-carbon-200 bg-carbon-50 font-bold">
                  <td className="px-5 py-3.5 text-xs uppercase tracking-wide text-carbon-600" colSpan={3}>
                    Total ({payslips.length})
                  </td>
                  <td className="px-5 py-3.5 text-right text-carbon-900 tabular-nums">{formatCLP(totalNet)}</td>
                  <td className="px-5 py-3.5 text-right text-carbon-900 tabular-nums">{formatCLP(totalCost)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
