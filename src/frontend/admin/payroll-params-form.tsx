"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Loader2, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { savePayrollParamsAction } from "@/backend/actions/personal.actions";
import { AFPS, type PayrollParamsData } from "@/backend/lib/payroll";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { cn } from "@/frontend/lib/utils";

/** Número con coma decimal para mostrar en el campo: 39500.12 → "39500,12". */
const dec = (value: number) => String(value).replace(".", ",");

export function PayrollParamsForm({
  period,
  initial,
  exists,
}: {
  period: string;
  initial: PayrollParamsData;
  exists: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    savePayrollParamsAction,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  const field = (name: string, label: string, value: string, hint?: string) => (
    <AdminField key={name} label={label} name={name} error={errors[name]} hint={hint} required>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        defaultValue={value}
        className={cn(fieldClass, "tabular-nums", errors[name] && fieldErrorClass)}
      />
    </AdminField>
  );

  return (
    <form onSubmit={keepValuesOnSubmit(formAction)} className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
        <AdminField label="Mes" name="period" required>
          <input
            id="period"
            name="period"
            type="month"
            defaultValue={period}
            onChange={(e) => {
              if (e.target.value) router.push(`/admin/personal/parametros?periodo=${e.target.value}`);
            }}
            className={fieldClass}
          />
        </AdminField>
        </div>
        <a
          href="https://www.previred.com/indicadores-previsionales/"
          target="_blank"
          rel="noreferrer"
          className="mb-2.5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
        >
          Ver indicadores en Previred
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {!exists && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Este mes aún no tiene indicadores. Lo normal es traerlos de Previred con{" "}
          <strong>«Actualizar ahora»</strong> (arriba); estos valores son solo una sugerencia
          copiada del último mes.
        </p>
      )}

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="mb-3 font-display text-base font-bold text-carbon-900">Valores del mes</legend>
        {field("uf", "UF (último día del mes)", dec(initial.uf))}
        {field("utm", "UTM", String(initial.utm))}
        {field("minWage", "Ingreso mínimo mensual", String(initial.minWage))}
        {field("topeAfpUf", "Tope imponible AFP y salud (UF)", dec(initial.topeAfpUf))}
        {field("topeAfcUf", "Tope imponible cesantía (UF)", dec(initial.topeAfcUf))}
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        <legend className="mb-1 font-display text-base font-bold text-carbon-900">
          Tasa AFP del trabajador (%)
        </legend>
        <p className="col-span-2 -mt-1 text-xs text-carbon-500 sm:col-span-4">
          10% obligatorio + comisión de cada AFP. Ej: Habitat 11,27.
        </p>
        {Object.entries(AFPS).map(([code, label]) =>
          field(`afp_${code}`, label, dec(initial.afpRates[code] ?? 0)),
        )}
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-3">
        <legend className="mb-1 font-display text-base font-bold text-carbon-900">
          Aportes del empleador (%)
        </legend>
        <p className="-mt-1 text-xs text-carbon-500 sm:col-span-3">
          No se descuentan al trabajador: suman al costo empresa de cada liquidación.
        </p>
        {field("sisRate", "SIS", dec(initial.sisRate))}
        {field("mutualRate", "Mutual ley 16.744", dec(initial.mutualRate), "0,93% básica + adicional de la actividad según la mutual")}
        {field("employerPensionRate", "Aporte reforma previsional", dec(initial.employerPensionRate))}
      </fieldset>

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
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        {exists ? "Guardar cambios" : "Guardar parámetros del mes"}
      </button>
      <p className="text-xs text-carbon-500">
        Al guardar a mano, este mes queda fijo: la actualización automática desde Previred ya no lo cambia.
      </p>
    </form>
  );
}
