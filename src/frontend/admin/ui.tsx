import Link from "next/link";

import { cn } from "@/frontend/lib/utils";
import {
  DELIVERY_TYPES,
  QUOTE_STATUSES,
  WORK_STATUSES,
  type DeliveryType,
  type QuoteStatus,
  type WorkStatus,
} from "@/backend/schemas/admin.schema";

/** Estilos base de los campos de formulario del panel. */
export const fieldClass =
  "w-full rounded-xl border border-carbon-200 bg-white px-4 py-2.5 text-sm text-carbon-900 outline-none transition-colors placeholder:text-carbon-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export const fieldErrorClass = "border-red-400";

export function AdminField({
  label,
  name,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-semibold text-carbon-800"
      >
        {label}
        {required && (
          <span className="ml-1 text-brand-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-carbon-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-carbon-200 bg-white p-6 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span
          aria-hidden="true"
          className="mb-3 block h-1 w-10 rounded-full bg-brand-500"
        />
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-carbon-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-carbon-600">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-carbon-300 bg-carbon-50 p-10 text-center">
      <p className="font-display font-bold text-carbon-900">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-carbon-600">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function WorkStatusBadge({ status }: { status: string }) {
  const label = WORK_STATUSES[status as WorkStatus] ?? status;
  const isDone = status === "entregado";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        isDone
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-800",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isDone ? "bg-green-600" : "bg-amber-500",
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function DeliveryTypeBadge({ type }: { type: string }) {
  const label = DELIVERY_TYPES[type as DeliveryType] ?? type;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold",
        type === "materiales"
          ? "bg-carbon-100 text-carbon-800"
          : "bg-brand-50 text-brand-800",
      )}
    >
      {label}
    </span>
  );
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const label = QUOTE_STATUSES[status as QuoteStatus] ?? status;
  const styles =
    status === "nueva"
      ? { pill: "bg-brand-50 text-brand-800", dot: "bg-brand-600" }
      : status === "contactada"
        ? { pill: "bg-amber-100 text-amber-800", dot: "bg-amber-500" }
        : { pill: "bg-green-100 text-green-800", dot: "bg-green-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        styles.pill,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", styles.dot)}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function formatDateShort(date: Date) {
  return date.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "long",
    timeStyle: "short",
  });
}
