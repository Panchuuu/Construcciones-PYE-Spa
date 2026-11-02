import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { requireAdmin } from "@/backend/auth/session";
import { CONTRACT_TYPES } from "@/backend/lib/payroll";
import { listEmployees } from "@/backend/services/employees.service";
import { AdminPageHeader, EmptyState } from "@/frontend/admin/ui";
import { ContractBadge, EmployeeStatusBadge, ViewChip, chipClass } from "@/frontend/admin/personal-ui";
import { ScrollStrip } from "@/frontend/admin/scroll-strip";
import { formatCLP } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Personal" };

const STATUS_FILTERS = [
  { value: "activo", label: "Activos" },
  { value: "desvinculado", label: "Desvinculados" },
  { value: "todos", label: "Todos" },
];

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; contrato?: string }>;
}) {
  await requireAdmin();
  const { estado = "activo", contrato = "" } = await searchParams;
  const employees = await listEmployees({
    status: estado === "todos" ? undefined : estado,
    contractType: contrato in CONTRACT_TYPES ? contrato : undefined,
  });

  const href = (params: { estado?: string; contrato?: string }) => {
    const q = new URLSearchParams({ estado, contrato, ...params });
    if (!q.get("contrato")) q.delete("contrato");
    return `/admin/personal?${q}`;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trabajadores"
        description="Ficha de cada trabajador: contrato, previsión, sueldo y su historial de pagos."
        action={
          <Link
            href="/admin/personal/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 active:bg-brand-600"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Nuevo trabajador
          </Link>
        }
      />

      <div className="space-y-2">
        <ScrollStrip label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={href({ estado: f.value })}
              aria-current={estado === f.value ? "page" : undefined}
              className={chipClass(estado === f.value)}
            >
              {f.label}
            </Link>
          ))}
        </ScrollStrip>
        <ScrollStrip label="Filtrar por contrato">
          {[["", "Todos los contratos"], ...Object.entries(CONTRACT_TYPES)].map(([value, label]) => (
            <Link
              key={value}
              href={href({ contrato: value })}
              aria-current={contrato === value ? "page" : undefined}
              className={chipClass(contrato === value)}
            >
              {label}
            </Link>
          ))}
        </ScrollStrip>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          title="No hay trabajadores en esta vista"
          description="Registra a tu equipo para emitir liquidaciones, pagos de día hombre y finiquitos."
          actionHref="/admin/personal/nuevo"
          actionLabel="Registrar trabajador"
        />
      ) : (
        <ul className="divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
          {employees.map((employee) => (
            <li key={employee.id}>
              <Link
                href={`/admin/personal/${employee.id}`}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-carbon-50 active:bg-carbon-50 sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-carbon-900">{employee.name}</p>
                  <p className="truncate text-sm text-carbon-500 sm:text-xs">
                    {employee.position}
                    <span className="max-sm:hidden"> · {employee.rut}</span>
                    {employee.work && <span className="max-sm:hidden"> · {employee.work.title}</span>}
                  </p>
                  {/* En el teléfono las etiquetas van bajo el nombre */}
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                    <ContractBadge type={employee.contractType} />
                    {employee.status !== "activo" && <EmployeeStatusBadge status={employee.status} />}
                  </div>
                </div>
                <span className="hidden sm:contents">
                  <ContractBadge type={employee.contractType} />
                  <EmployeeStatusBadge status={employee.status} />
                </span>
                <span className="shrink-0 text-right font-bold text-carbon-900 tabular-nums sm:w-32 sm:text-sm">
                  {employee.contractType === "dia_hombre" ? (
                    <>
                      {formatCLP(employee.dailyRate)}
                      <span className="font-semibold text-carbon-500">/día</span>
                    </>
                  ) : (
                    formatCLP(employee.baseSalary)
                  )}
                </span>
                <ViewChip />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
