"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2, Paperclip, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { saveMovementAction } from "@/backend/actions/finanzas.actions";
import {
  AUTOMATIC_CATEGORIES,
  DOC_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "@/backend/schemas/finanzas.schema";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { RutInput } from "@/frontend/admin/rut-input";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { cn } from "@/frontend/lib/utils";

export type MovementFormData = {
  type: "ingreso" | "gasto";
  date: string;
  amount: string;
  category: string;
  description: string;
  workId: string;
  docType: string;
  docNumber: string;
  counterparty: string;
  counterpartyRut: string;
  paymentMethod: string;
  notes: string;
  attachmentName: string | null;
};

/** Las categorías automáticas no se ofrecen al registrar a mano. */
const automatic = new Set<string>(Object.values(AUTOMATIC_CATEGORIES));
const manualExpenseCategories = EXPENSE_CATEGORIES.filter((c) => !automatic.has(c));

export function MovementForm({
  movementId,
  initial,
  works,
}: {
  movementId: string | null;
  initial: MovementFormData;
  works: { id: string; title: string }[];
}) {
  const action = saveMovementAction.bind(null, movementId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const errors = state?.fieldErrors ?? {};

  const [type, setType] = useState(initial.type);
  const [category, setCategory] = useState(initial.category);
  const categories: readonly string[] = type === "gasto" ? manualExpenseCategories : INCOME_CATEGORIES;

  const text = (name: keyof MovementFormData, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={name}
      name={name}
      type="text"
      defaultValue={String(initial[name] ?? "")}
      {...props}
      className={cn(fieldClass, errors[name] && fieldErrorClass)}
    />
  );

  return (
    <form onSubmit={keepValuesOnSubmit(formAction)} className="space-y-5">
      <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2 sm:max-w-sm">
        {(["gasto", "ingreso"] as const).map((value) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors",
              type === value
                ? value === "gasto"
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-green-600 bg-green-50 text-green-800"
                : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-400",
            )}
          >
            <input
              type="radio"
              name="type"
              value={value}
              checked={type === value}
              onChange={() => {
                setType(value);
                setCategory("");
              }}
              className="sr-only"
            />
            {value === "gasto" ? "Gasto" : "Ingreso"}
          </label>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Fecha" name="date" error={errors.date} required>
          {text("date", { type: "date" })}
        </AdminField>
        <AdminField label="Monto total" name="amount" error={errors.amount} required hint="En pesos, IVA incluido si corresponde">
          {text("amount", { inputMode: "numeric", placeholder: "$0", className: "tabular-nums" })}
        </AdminField>
        <AdminField label="Categoría" name="category" error={errors.category} required>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(fieldClass, errors.category && fieldErrorClass)}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Obra" name="workId" hint="Para ver la rentabilidad de cada obra">
          <select id="workId" name="workId" defaultValue={initial.workId} className={fieldClass}>
            <option value="">Gastos generales (sin obra)</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </AdminField>
      </div>

      <AdminField label="Descripción" name="description" error={errors.description} required>
        {text("description", {
          placeholder: type === "gasto" ? "Ej: 40 planchas de zinc 0,35 mm" : "Ej: Estado de pago N°2 obra Lampa",
        })}
      </AdminField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label={type === "gasto" ? "Proveedor" : "Cliente"} name="counterparty" error={errors.counterparty}>
          {text("counterparty", { placeholder: type === "gasto" ? "Ej: Sodimac, MTS…" : "Nombre del cliente" })}
        </AdminField>
        <AdminField label="RUT" name="counterpartyRut" error={errors.counterpartyRut}>
          <RutInput name="counterpartyRut" defaultValue={initial.counterpartyRut} hasError={Boolean(errors.counterpartyRut)} />
        </AdminField>
        <AdminField label="Tipo de documento" name="docType">
          <select id="docType" name="docType" defaultValue={initial.docType} className={fieldClass}>
            <option value="">Sin documento</option>
            {Object.entries(DOC_TYPES)
              .filter(([value]) => value !== "liquidacion" && value !== "finiquito")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </AdminField>
        <AdminField label="N° de documento" name="docNumber" error={errors.docNumber}>
          {text("docNumber", { placeholder: "Ej: 004512" })}
        </AdminField>
        <AdminField label="Medio de pago" name="paymentMethod">
          <select id="paymentMethod" name="paymentMethod" defaultValue={initial.paymentMethod} className={fieldClass}>
            <option value="">—</option>
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField
          label="Respaldo (foto o PDF)"
          name="attachment"
          error={errors.attachment}
          hint={initial.attachmentName ? `Actual: ${initial.attachmentName}. Sube otro para reemplazarlo.` : "JPG, PNG, WebP o PDF de hasta 5 MB"}
        >
          <input
            id="attachment"
            name="attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className={cn(
              fieldClass,
              "file:mr-3 file:rounded-lg file:border-0 file:bg-carbon-100 file:px-3 file:py-1 file:text-sm file:font-semibold",
              errors.attachment && fieldErrorClass,
            )}
          />
        </AdminField>
      </div>

      {initial.attachmentName && (
        <label className="flex items-center gap-2 text-sm text-carbon-700">
          <input type="checkbox" name="removeAttachment" className="h-4 w-4 accent-brand-600" />
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          Quitar el respaldo actual
        </label>
      )}

      <AdminField label="Notas" name="notes">
        <textarea id="notes" name="notes" rows={2} defaultValue={initial.notes} className={cn(fieldClass, "resize-y")} />
      </AdminField>

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
        {movementId ? "Guardar cambios" : "Registrar movimiento"}
      </button>
    </form>
  );
}
