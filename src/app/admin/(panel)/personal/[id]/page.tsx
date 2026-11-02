import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, FileMinus, FileSpreadsheet, Pencil } from "lucide-react";

import { deleteEmployeeAction } from "@/backend/actions/personal.actions";
import { requireAdmin } from "@/backend/auth/session";
import { AFPS, formatPeriod, type AfpCode } from "@/backend/lib/payroll";
import { TERMINATION_CAUSES, type TerminationCause } from "@/backend/lib/settlement";
import { ACCOUNT_TYPES } from "@/backend/schemas/personal.schema";
import { getEmployee } from "@/backend/services/employees.service";
import { formatDocFolio } from "@/backend/services/payroll.service";
import { AdminCard, AdminPageHeader } from "@/frontend/admin/ui";
import { ConfirmDeleteButton } from "@/frontend/admin/confirm-delete-button";
import { ContractBadge, EmployeeStatusBadge, ViewChip } from "@/frontend/admin/personal-ui";
import { formatCLP, formatDateUTC } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Ficha de trabajador" };

const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400";
const secondaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900";

function History({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { id: string; href: string; label: string; detail: string; amount: number }[];
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-carbon-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-carbon-500">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-carbon-100 overflow-hidden rounded-2xl border border-carbon-200 bg-white shadow-card">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-carbon-50 active:bg-carbon-50 sm:gap-4 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-display block font-extrabold text-carbon-900 sm:inline sm:w-20">{row.label}</span>
                  <span className="block truncate text-sm text-carbon-600 sm:ml-4 sm:inline">{row.detail}</span>
                </span>
                <span className="shrink-0 font-bold text-carbon-900 tabular-nums">{formatCLP(row.amount)}</span>
                <ViewChip />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function TrabajadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const dayWorker = employee.contractType === "dia_hombre";
  const active = employee.status === "activo";

  const facts: [string, string][] = [
    ["RUT", employee.rut],
    ["Cargo", employee.position],
    [dayWorker ? "Inicio" : "Ingreso", formatDateUTC(employee.startDate)],
    ...(employee.contractEndDate && !dayWorker
      ? [["Término pactado", formatDateUTC(employee.contractEndDate)] as [string, string]]
      : []),
    ...(employee.terminationDate
      ? [["Desvinculado el", formatDateUTC(employee.terminationDate)] as [string, string]]
      : []),
    ["Obra", employee.work?.title ?? "Sin obra asignada"],
    ...(dayWorker
      ? [["Valor del día", formatCLP(employee.dailyRate)] as [string, string]]
      : ([
          ["Sueldo base", formatCLP(employee.baseSalary)],
          ["Jornada", `${employee.weeklyHours} horas semanales`],
          ["Gratificación", employee.gratification ? "Sí, mensual (art. 50)" : "No"],
          ["Colación / Movilización", `${formatCLP(employee.mealAllowance)} / ${formatCLP(employee.transportAllowance)}`],
          ["AFP", employee.afp ? (AFPS[employee.afp as AfpCode] ?? employee.afp) : "—"],
          [
            "Salud",
            employee.healthSystem === "isapre"
              ? `Isapre ${employee.isapreName ?? ""} (${employee.isapreUf ?? 0} UF)`
              : "Fonasa",
          ],
        ] as [string, string][])),
    ["Teléfono", employee.phone ?? "—"],
    ["Correo", employee.email ?? "—"],
    ["Dirección", employee.address ?? "—"],
    [
      "Cuenta",
      employee.accountNumber
        ? `${employee.bankName ?? ""} · ${ACCOUNT_TYPES[employee.accountType as keyof typeof ACCOUNT_TYPES] ?? ""} · ${employee.accountNumber}`
        : "—",
    ],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/personal"
        className="inline-flex items-center gap-2 text-sm font-semibold text-carbon-600 hover:text-carbon-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a trabajadores
      </Link>

      <AdminPageHeader
        title={employee.name}
        action={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link href={`/admin/personal/${employee.id}/editar`} className={secondaryBtn}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Link>
            <ConfirmDeleteButton
              action={deleteEmployeeAction.bind(null, employee.id)}
              label="Eliminar"
              confirmMessage={`¿Eliminar a ${employee.name}? Solo es posible si no tiene documentos emitidos.`}
            />
          </div>
        }
      />

      {error === "documentos" && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No se puede eliminar: el trabajador tiene liquidaciones, pagos o finiquitos emitidos.
          Para darlo de baja, emite su finiquito.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <ContractBadge type={employee.contractType} />
        <EmployeeStatusBadge status={employee.status} />
      </div>

      {active && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {dayWorker ? (
            <Link href={`/admin/personal/dia-hombre/nuevo?empleado=${employee.id}`} className={primaryBtn}>
              <Banknote className="h-4 w-4" aria-hidden="true" />
              Registrar pago
            </Link>
          ) : (
            <>
              <Link href={`/admin/personal/liquidaciones/nueva?empleado=${employee.id}`} className={primaryBtn}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Nueva liquidación
              </Link>
              <Link href={`/admin/personal/finiquitos/nuevo?empleado=${employee.id}`} className={secondaryBtn}>
                <FileMinus className="h-4 w-4" aria-hidden="true" />
                Finiquitar
              </Link>
            </>
          )}
        </div>
      )}

      <AdminCard>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:gap-x-8 sm:gap-y-3">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-carbon-500 sm:w-40 sm:shrink-0">{label}</dt>
              <dd className="min-w-0 font-semibold text-carbon-900">{value}</dd>
            </div>
          ))}
        </dl>
        {employee.notes && (
          <p className="mt-5 whitespace-pre-wrap border-t border-carbon-100 pt-4 text-sm text-carbon-700">
            {employee.notes}
          </p>
        )}
      </AdminCard>

      {dayWorker ? (
        <History
          title="Pagos día hombre"
          empty="Aún no hay pagos registrados."
          rows={employee.dayPayments.map((p) => ({
            id: p.id,
            href: `/admin/personal/dia-hombre/${p.id}`,
            label: formatDocFolio(p.folio),
            detail: `${formatDateUTC(p.date)} · ${p.days.toLocaleString("es-CL")} días${p.work ? ` · ${p.work.title}` : ""}`,
            amount: p.total,
          }))}
        />
      ) : (
        <>
          <History
            title="Liquidaciones de sueldo"
            empty="Aún no hay liquidaciones emitidas."
            rows={employee.payslips.map((p) => ({
              id: p.id,
              href: `/admin/personal/liquidaciones/${p.id}`,
              label: formatDocFolio(p.folio),
              detail: `${formatPeriod(p.period)} · líquido a pagar`,
              amount: p.netPay,
            }))}
          />
          {employee.settlements.length > 0 && (
            <History
              title="Finiquitos"
              empty=""
              rows={employee.settlements.map((s) => ({
                id: s.id,
                href: `/admin/personal/finiquitos/${s.id}`,
                label: formatDocFolio(s.folio),
                detail: `${formatDateUTC(s.endDate)} · ${TERMINATION_CAUSES[s.cause as TerminationCause] ?? s.cause}`,
                amount: s.total,
              }))}
            />
          )}
        </>
      )}
    </div>
  );
}
