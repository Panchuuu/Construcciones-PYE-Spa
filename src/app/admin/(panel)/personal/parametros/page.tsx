import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CloudDownload, Hand, Info, TriangleAlert } from "lucide-react";

import { syncPayrollParamsAction } from "@/backend/actions/personal.actions";
import { requireAdmin } from "@/backend/auth/session";
import { currentPeriod, formatPeriod, isValidPeriod } from "@/backend/lib/payroll";
import {
  listPayrollParams,
  suggestedPayrollParams,
  toParamsData,
} from "@/backend/services/payroll.service";
import { AdminCard, AdminPageHeader, formatDateTime } from "@/frontend/admin/ui";
import { PayrollParamsForm } from "@/frontend/admin/payroll-params-form";
import { SyncButton } from "@/frontend/admin/sync-button";
import { cn, formatCLP } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Parámetros previsionales" };

const SYNC_MESSAGES: Record<string, { tone: "ok" | "warn"; text: (month: string) => string }> = {
  creado: { tone: "ok", text: (m) => `Se trajeron los indicadores de ${m} desde Previred.` },
  actualizado: { tone: "ok", text: (m) => `Se actualizaron los indicadores de ${m} con los de Previred.` },
  "sin cambios": { tone: "ok", text: (m) => `Los indicadores de ${m} ya estaban al día.` },
  manual: { tone: "warn", text: (m) => `${m} está editado a mano, así que no se tocó.` },
  "no publicado": { tone: "warn", text: (m) => `Previred aún no publica los indicadores de ${m}.` },
  error: { tone: "warn", text: () => "No se pudo consultar Previred. Intenta de nuevo en unos minutos." },
};

function lastDayLabel(period: string) {
  const [y, m] = period.split("-").map(Number);
  return `${new Date(Date.UTC(y, m, 0)).getUTCDate()} de ${formatPeriod(period).split(" ")[0]}`;
}

export default async function ParametrosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; guardado?: string; sync?: string }>;
}) {
  await requireAdmin();
  const { periodo, guardado, sync } = await searchParams;
  const period = periodo && isValidPeriod(periodo) ? periodo : currentPeriod();

  const all = await listPayrollParams();
  const existing = all.find((row) => row.period === period);
  const initial = existing ? toParamsData(existing) : await suggestedPayrollParams();
  const month = formatPeriod(period);
  const syncMessage = sync ? SYNC_MESSAGES[sync] : undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Parámetros previsionales"
        description="UF, UTM, sueldo mínimo, topes y tasas de cada mes. Se traen solos desde Previred cada 2 días; puedes corregirlos a mano."
      />

      {guardado && (
        <p className="anim-rise flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Parámetros de {formatPeriod(guardado)} guardados a mano. La actualización automática ya no los cambiará.
        </p>
      )}
      {syncMessage && (
        <p
          className={cn(
            "anim-rise flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
            syncMessage.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {syncMessage.tone === "ok" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {syncMessage.text(month)}
        </p>
      )}

      {/* Estado del mes elegido */}
      <section className="flex flex-col gap-4 rounded-2xl border border-carbon-200 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          {!existing ? (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-carbon-400" aria-hidden="true" />
          ) : existing.source === "manual" ? (
            <Hand className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          ) : (
            <CloudDownload className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
          )}
          <div className="text-sm">
            <p className="font-bold text-carbon-900 first-letter:uppercase">
              {!existing
                ? `${month}: sin indicadores todavía`
                : existing.source === "manual"
                  ? `${month}: editado a mano`
                  : `${month}: al día con Previred`}
            </p>
            <p className="mt-0.5 text-carbon-600">
              {!existing
                ? "Se traerán solos la próxima vez que alguien use el panel, o ahora con el botón."
                : existing.source === "manual"
                  ? "La actualización automática no toca este mes. Si quieres los valores oficiales, vuelve a los de Previred."
                  : `Última consulta: ${existing.syncedAt ? formatDateTime(existing.syncedAt) : "—"} · se vuelve a consultar cada 2 días`}
            </p>
            {existing?.ufProvisional && (
              <p className="mt-1.5 flex items-start gap-1.5 font-medium text-amber-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                UF provisoria: aún no se publica la del {lastDayLabel(period)}. Se corregirá sola apenas salga.
              </p>
            )}
          </div>
        </div>
        <form action={syncPayrollParamsAction.bind(null, existing?.source === "manual" ? period : null)} className="shrink-0">
          <SyncButton
            label={existing?.source === "manual" ? "Volver a los de Previred" : "Actualizar ahora"}
            variant={existing ? "secondary" : "primary"}
          />
        </form>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <AdminCard>
          {/* key: al cambiar de mes el formulario se vuelve a montar con sus valores */}
          <PayrollParamsForm key={period} period={period} initial={initial} exists={Boolean(existing)} />
        </AdminCard>

        <aside>
          <h2 className="text-xs font-bold uppercase tracking-wide text-carbon-500">Meses cargados</h2>
          {all.length === 0 ? (
            <p className="mt-2 text-sm text-carbon-500">Ninguno todavía.</p>
          ) : (
            <ul className="mt-2 divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white">
              {all.map((row) => (
                <li key={row.period}>
                  <Link
                    href={`/admin/personal/parametros?periodo=${row.period}`}
                    aria-current={row.period === period ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-carbon-50 active:bg-carbon-50",
                      row.period === period && "bg-brand-50",
                    )}
                  >
                    <span>
                      <span className="block font-semibold text-carbon-900 first-letter:uppercase">
                        {formatPeriod(row.period)}
                      </span>
                      <span className="block text-xs text-carbon-500 tabular-nums">
                        UF ${row.uf.toLocaleString("es-CL")} · UTM {formatCLP(row.utm)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        row.source === "manual"
                          ? "bg-amber-100 text-amber-800"
                          : row.ufProvisional
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-100 text-green-800",
                      )}
                    >
                      {row.source === "manual" ? "A mano" : row.ufProvisional ? "UF provisoria" : "Previred"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
