import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";

import {
  CONTRACT_TYPES,
  EMPLOYEE_STATUSES,
  type ContractType,
} from "@/backend/lib/payroll";
import { cn, formatCLP } from "@/frontend/lib/utils";

/** Piezas visuales del módulo de personal y finanzas (sin estado). */

export function EmployeeStatusBadge({ status }: { status: string }) {
  const active = status === "activo";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        active ? "bg-green-100 text-green-800" : "bg-carbon-100 text-carbon-600",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-green-600" : "bg-carbon-400")}
        aria-hidden="true"
      />
      {EMPLOYEE_STATUSES[status as keyof typeof EMPLOYEE_STATUSES] ?? status}
    </span>
  );
}

export function ContractBadge({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
        type === "dia_hombre" ? "bg-amber-100 text-amber-800" : "bg-brand-50 text-brand-800",
      )}
    >
      {CONTRACT_TYPES[type as ContractType] ?? type}
    </span>
  );
}

export function MovementTypeBadge({ type }: { type: string }) {
  const income = type === "ingreso";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        income ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700",
      )}
    >
      {income ? "Ingreso" : "Gasto"}
    </span>
  );
}

/** Monto con signo y color según sea ingreso o gasto. */
export function SignedAmount({ type, amount }: { type: string; amount: number }) {
  const income = type === "ingreso";
  return (
    <span className={cn("font-bold tabular-nums", income ? "text-green-700" : "text-carbon-900")}>
      {income ? "+" : "−"}
      {formatCLP(amount)}
    </span>
  );
}

/** Tabla de conceptos y montos con su total (haberes, descuentos…). */
export function AmountTable({
  title,
  lines,
  totalLabel,
  total,
  muted,
}: {
  title: string;
  lines: { name: string; amount: number }[];
  totalLabel?: string;
  total?: number;
  muted?: boolean;
}) {
  return (
    <section>
      <h3 className="border-b-2 border-carbon-200 pb-1.5 text-xs font-bold uppercase tracking-wide text-carbon-500">
        {title}
      </h3>
      {lines.length === 0 ? (
        <p className="py-2 text-sm text-carbon-400">Sin conceptos</p>
      ) : (
        <ul className="divide-y divide-carbon-100 text-sm">
          {lines.map((line, index) => (
            <li key={index} className="flex justify-between gap-4 py-2">
              <span className={muted ? "text-carbon-600" : "text-carbon-800"}>{line.name}</span>
              <span className="shrink-0 font-semibold text-carbon-900 tabular-nums">
                {formatCLP(line.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {totalLabel && total !== undefined && (
        <div className="flex justify-between border-t border-carbon-300 pt-2 text-sm">
          <span className="font-bold uppercase tracking-wide text-carbon-700">{totalLabel}</span>
          <span className="font-bold text-carbon-900 tabular-nums">{formatCLP(total)}</span>
        </div>
      )}
    </section>
  );
}

/** Avisos del cálculo (sueldo bajo el mínimo, falta AFP, etc.). */
export function CalcWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
      {warnings.map((warning) => (
        <li key={warning}>⚠ {warning}</li>
      ))}
    </ul>
  );
}

const viewClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-carbon-200 bg-white px-3 py-1.5 text-xs font-bold text-carbon-800 transition-colors";

/** Botón "Ver" para filas de tablas. */
export function ViewLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className={cn(viewClass, "hover:border-carbon-900 hover:text-carbon-950")}>
      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
      Ver
    </Link>
  );
}

/**
 * Botón "Ver" dentro de una fila que ya es un enlace completo
 * (un enlace no puede ir dentro de otro): se ve igual y reacciona
 * al pasar por la fila.
 */
export function ViewChip() {
  return (
    <>
      <span aria-hidden="true" className={cn(viewClass, "max-sm:hidden group-hover:border-carbon-900 group-hover:text-carbon-950")}>
        <Eye className="h-3.5 w-3.5" />
        Ver
      </span>
      {/* En el teléfono toda la fila se toca: basta la flecha. */}
      <ChevronRight className="h-5 w-5 shrink-0 text-carbon-400 sm:hidden" aria-hidden="true" />
    </>
  );
}

/** Opción de filtro en forma de píldora (enlace). */
export const chipClass = (active: boolean) =>
  cn(
    "inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors pointer-coarse:min-h-11 active:scale-[0.97]",
    active
      ? "bg-carbon-900 text-white"
      : "bg-white text-carbon-600 ring-1 ring-carbon-200 hover:text-carbon-900 hover:ring-carbon-400",
  );

/**
 * Teléfono: barra fija abajo con el total del cálculo y el botón de
 * guardar, siempre al alcance del pulgar mientras se llena el
 * formulario. Va dentro del <form>, así el botón lo envía.
 */
export function StickySubmitBar({
  label,
  value,
  submitLabel,
  pending,
  disabled,
  detailsHref,
}: {
  label: string;
  value: string;
  submitLabel: string;
  pending: boolean;
  disabled?: boolean;
  detailsHref: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-carbon-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgb(13_18_32/0.45)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <a href={detailsHref} className="min-w-0 flex-1 rounded-lg py-1 active:opacity-70">
          <span className="block text-xs font-semibold text-carbon-500">{label} · ver detalle</span>
          <span className="font-display block truncate text-xl font-extrabold text-carbon-950 tabular-nums">{value}</span>
        </a>
        <button
          type="submit"
          disabled={pending || disabled}
          className="min-h-12 shrink-0 rounded-xl bg-brand-500 px-5 text-sm font-bold text-carbon-950 transition-transform active:scale-[0.97] disabled:opacity-50"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
