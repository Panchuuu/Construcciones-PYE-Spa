"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { createDayPaymentAction } from "@/backend/actions/personal.actions";
import { parseDecimal } from "@/backend/schemas/personal.schema";
import { parseMoney } from "@/frontend/admin/amount-lines-editor";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { useAdoptTypedValues } from "@/frontend/admin/use-adopt-typed-values";
import { cn, formatCLP } from "@/frontend/lib/utils";

export type DayWorkerOption = {
  id: string;
  name: string;
  rut: string;
  dailyRate: number;
  workId: string | null;
};

export function DayPaymentForm({
  employees,
  works,
  initialEmployeeId,
  today,
}: {
  employees: DayWorkerOption[];
  works: { id: string; title: string }[];
  initialEmployeeId: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createDayPaymentAction, undefined);
  const errors = state?.fieldErrors ?? {};

  const initial = employees.find((e) => e.id === initialEmployeeId);
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [workId, setWorkId] = useState(initial?.workId ?? "");
  const [days, setDays] = useState("");
  const [rate, setRate] = useState(initial ? String(initial.dailyRate) : "");
  const [extras, setExtras] = useState("");
  const [discounts, setDiscounts] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  useAdoptTypedValues(formRef, {
    days: setDays,
    dailyRate: setRate,
    extras: setExtras,
    discounts: setDiscounts,
  });

  function pick(id: string) {
    setEmployeeId(id);
    const e = employees.find((x) => x.id === id);
    if (e) {
      setRate(String(e.dailyRate));
      setWorkId(e.workId ?? "");
    }
  }

  const base = Math.round((parseDecimal(days) || 0) * parseMoney(rate));
  const total = base + parseMoney(extras) - parseMoney(discounts);

  const text = (
    name: string,
    value: string,
    set: (v: string) => void,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <input
      id={name}
      name={name}
      type="text"
      value={value}
      onChange={(e) => set(e.target.value)}
      {...props}
      className={cn(fieldClass, "tabular-nums", errors[name] && fieldErrorClass)}
    />
  );

  return (
    <form ref={formRef} onSubmit={keepValuesOnSubmit(formAction)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Trabajador" name="employeeId" error={errors.employeeId} required>
          <select
            id="employeeId"
            name="employeeId"
            value={employeeId}
            onChange={(e) => pick(e.target.value)}
            className={cn(fieldClass, errors.employeeId && fieldErrorClass)}
          >
            <option value="">Selecciona un trabajador</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.rut}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Fecha de pago" name="date" error={errors.date} required>
          <input id="date" name="date" type="date" defaultValue={today} className={cn(fieldClass, errors.date && fieldErrorClass)} />
        </AdminField>
        <AdminField label="Obra" name="workId" hint="El gasto quedará cargado a esta obra">
          <select id="workId" name="workId" value={workId} onChange={(e) => setWorkId(e.target.value)} className={fieldClass}>
            <option value="">Gastos generales (sin obra)</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Periodo trabajado" name="periodText" error={errors.periodText} hint="Texto libre, aparece en el comprobante">
          <input
            id="periodText"
            name="periodText"
            type="text"
            placeholder="Ej: 3 al 7 de noviembre"
            className={fieldClass}
          />
        </AdminField>
        <AdminField label="Días trabajados" name="days" error={errors.days} required hint="Acepta medios días: 4,5">
          {text("days", days, setDays, { inputMode: "decimal", placeholder: "5" })}
        </AdminField>
        <AdminField label="Valor del día" name="dailyRate" error={errors.dailyRate} required>
          {text("dailyRate", rate, setRate, { inputMode: "numeric", placeholder: "$45.000" })}
        </AdminField>
        <AdminField label="Bonos / extras" name="extras" error={errors.extras}>
          {text("extras", extras, setExtras, { inputMode: "numeric", placeholder: "$0" })}
        </AdminField>
        <AdminField label="Descuentos / anticipos" name="discounts" error={errors.discounts}>
          {text("discounts", discounts, setDiscounts, { inputMode: "numeric", placeholder: "$0" })}
        </AdminField>
      </div>

      <AdminField label="Observaciones" name="notes">
        <textarea id="notes" name="notes" rows={2} className={cn(fieldClass, "resize-y")} />
      </AdminField>

      <div className="flex items-center justify-between rounded-xl bg-carbon-950 px-4 py-3 text-white">
        <span className="font-display font-bold uppercase tracking-wide">Total a pagar</span>
        <span className="font-display text-lg font-extrabold tabular-nums">{formatCLP(total)}</span>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="anim-rise flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        Registrar pago
      </button>
    </form>
  );
}
