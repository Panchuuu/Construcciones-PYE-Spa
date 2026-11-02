"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { savePayslipAction } from "@/backend/actions/personal.actions";
import {
  computePayslip,
  formatPeriod,
  type AmountLine,
  type PayrollEmployee,
  type PayrollParamsData,
} from "@/backend/lib/payroll";
import { parseDecimal } from "@/backend/schemas/personal.schema";
import {
  AmountLinesEditor,
  cleanLines,
  parseMoney,
  toDrafts,
  type LineDraft,
} from "@/frontend/admin/amount-lines-editor";
import { AmountTable, CalcWarnings, StickySubmitBar } from "@/frontend/admin/personal-ui";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { useAdoptTypedValues } from "@/frontend/admin/use-adopt-typed-values";
import { cn, formatCLP } from "@/frontend/lib/utils";

export type PayslipEmployeeOption = PayrollEmployee & {
  id: string;
  name: string;
  rut: string;
  workId: string | null;
  mealAllowance: number;
  transportAllowance: number;
};

export type PayslipFormData = {
  employeeId: string;
  period: string;
  workId: string;
  daysWorked: number;
  overtimeHours: number;
  bonuses: AmountLine[];
  nonTaxable: AmountLine[];
  advances: number;
  otherDiscounts: AmountLine[];
};

/** Colación y movilización pactadas en la ficha del trabajador. */
function defaultNonTaxable(employee: PayslipEmployeeOption | undefined): LineDraft[] {
  if (!employee) return [];
  const lines: LineDraft[] = [];
  if (employee.mealAllowance > 0) lines.push({ name: "Colación", amount: String(employee.mealAllowance) });
  if (employee.transportAllowance > 0) lines.push({ name: "Movilización", amount: String(employee.transportAllowance) });
  return lines;
}

export function PayslipForm({
  payslipId,
  initial,
  employees,
  paramsByPeriod,
  works,
}: {
  payslipId: string | null;
  initial: PayslipFormData;
  employees: PayslipEmployeeOption[];
  paramsByPeriod: Record<string, PayrollParamsData>;
  works: { id: string; title: string }[];
}) {
  const action = savePayslipAction.bind(null, payslipId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const errors = state?.fieldErrors ?? {};

  const [employeeId, setEmployeeId] = useState(initial.employeeId);
  const [period, setPeriod] = useState(initial.period);
  const [workId, setWorkId] = useState(initial.workId);
  const [days, setDays] = useState(String(initial.daysWorked));
  const [overtime, setOvertime] = useState(String(initial.overtimeHours || ""));
  const [advances, setAdvances] = useState(initial.advances ? String(initial.advances) : "");
  const [bonuses, setBonuses] = useState<LineDraft[]>(toDrafts(initial.bonuses));
  const [nonTaxable, setNonTaxable] = useState<LineDraft[]>(
    payslipId ? toDrafts(initial.nonTaxable) : defaultNonTaxable(employees.find((e) => e.id === initial.employeeId)),
  );
  const [discounts, setDiscounts] = useState<LineDraft[]>(toDrafts(initial.otherDiscounts));
  const formRef = useRef<HTMLFormElement>(null);
  useAdoptTypedValues(formRef, {
    period: setPeriod,
    daysWorked: setDays,
    overtimeHours: setOvertime,
    advances: setAdvances,
    workId: setWorkId,
  });

  const employee = employees.find((e) => e.id === employeeId);
  const params = paramsByPeriod[period];

  function pickEmployee(id: string) {
    setEmployeeId(id);
    const picked = employees.find((e) => e.id === id);
    setNonTaxable(defaultNonTaxable(picked));
    setWorkId(picked?.workId ?? "");
  }

  const preview = useMemo(() => {
    if (!employee || !params) return null;
    return computePayslip(
      employee,
      {
        daysWorked: parseDecimal(days) || 0,
        overtimeHours: parseDecimal(overtime) || 0,
        bonuses: cleanLines(bonuses),
        nonTaxable: cleanLines(nonTaxable),
        advances: parseMoney(advances),
        otherDiscounts: cleanLines(discounts),
      },
      params,
    );
  }, [employee, params, days, overtime, bonuses, nonTaxable, advances, discounts]);

  return (
    <form ref={formRef} onSubmit={keepValuesOnSubmit(formAction)} className="grid items-start gap-6 max-lg:pb-24 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6 rounded-2xl border border-carbon-200 bg-white p-5 shadow-card sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Trabajador" name="employeeId" error={errors.employeeId} required>
            <select
              id="employeeId"
              name="employeeId"
              value={employeeId}
              onChange={(e) => pickEmployee(e.target.value)}
              disabled={Boolean(payslipId)}
              className={cn(fieldClass, errors.employeeId && fieldErrorClass)}
            >
              <option value="">Selecciona un trabajador</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.rut}
                </option>
              ))}
            </select>
            {/* Un select deshabilitado no se envía: */}
            {payslipId && <input type="hidden" name="employeeId" value={employeeId} />}
          </AdminField>

          <AdminField label="Mes" name="period" error={errors.period} required>
            <input
              id="period"
              name="period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={cn(fieldClass, errors.period && fieldErrorClass)}
            />
          </AdminField>

          <AdminField label="Días trabajados" name="daysWorked" error={errors.daysWorked} required hint="30 = mes completo">
            <input
              id="daysWorked"
              name="daysWorked"
              type="text"
              inputMode="decimal"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={cn(fieldClass, errors.daysWorked && fieldErrorClass)}
            />
          </AdminField>

          <AdminField label="Horas extra" name="overtimeHours" error={errors.overtimeHours} hint="Se pagan con 50% de recargo">
            <input
              id="overtimeHours"
              name="overtimeHours"
              type="text"
              inputMode="decimal"
              value={overtime}
              onChange={(e) => setOvertime(e.target.value)}
              placeholder="0"
              className={cn(fieldClass, errors.overtimeHours && fieldErrorClass)}
            />
          </AdminField>

          <AdminField label="Obra a la que se carga el costo" name="workId" hint="El gasto quedará asociado a esta obra en Finanzas">
            <select id="workId" name="workId" value={workId} onChange={(e) => setWorkId(e.target.value)} className={fieldClass}>
              <option value="">Gastos generales (sin obra)</option>
              {works.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="Anticipo ya pagado" name="advances" error={errors.advances}>
            <input
              id="advances"
              name="advances"
              type="text"
              inputMode="numeric"
              value={advances}
              onChange={(e) => setAdvances(e.target.value)}
              placeholder="$0"
              className={cn(fieldClass, errors.advances && fieldErrorClass)}
            />
          </AdminField>
        </div>

        <AmountLinesEditor
          name="bonuses"
          label="Bonos y haberes imponibles"
          hint="Bono de producción, de asistencia, tratos… (suman a la gratificación y a las cotizaciones)"
          lines={bonuses}
          onChange={setBonuses}
          placeholder="Ej: Bono de producción"
          suggestions={["Bono de producción", "Bono de asistencia", "Bono de responsabilidad", "Trato", "Comisión"]}
          error={errors.bonuses}
        />
        <AmountLinesEditor
          name="nonTaxable"
          label="Haberes no imponibles"
          hint="Colación, movilización, viáticos, desgaste de herramientas"
          lines={nonTaxable}
          onChange={setNonTaxable}
          placeholder="Ej: Colación"
          suggestions={["Colación", "Movilización", "Viático", "Desgaste de herramientas", "Asignación de pérdida de caja"]}
          error={errors.nonTaxable}
        />
        <AmountLinesEditor
          name="otherDiscounts"
          label="Otros descuentos"
          hint="Préstamos de la empresa, cuotas de caja de compensación, etc."
          lines={discounts}
          onChange={setDiscounts}
          placeholder="Ej: Cuota préstamo"
          suggestions={["Cuota préstamo empresa", "Caja de compensación", "Descuento por atraso"]}
          error={errors.otherDiscounts}
        />

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
          disabled={pending || !params}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60 max-lg:hidden"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {payslipId ? "Recalcular y guardar" : "Emitir liquidación"}
        </button>
      </div>

      {/* Vista previa en vivo */}
      <aside id="detalle-calculo" className="scroll-mt-6 space-y-4 rounded-2xl border border-carbon-200 bg-carbon-50 p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-base font-bold text-carbon-900">Vista previa</h2>
        {!params ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Faltan los indicadores de <strong>{period ? formatPeriod(period) : "este mes"}</strong>.{" "}
            <Link href={`/admin/personal/parametros?periodo=${period}`} className="font-bold underline">
              Cárgalos aquí
            </Link>{" "}
            para poder calcular.
          </p>
        ) : !preview ? (
          <p className="text-sm text-carbon-500">Elige un trabajador para ver el cálculo.</p>
        ) : (
          <>
            <CalcWarnings warnings={preview.warnings} />
            <AmountTable title="Haberes imponibles" lines={preview.earnings} totalLabel="Total imponible" total={preview.taxableTotal} />
            {preview.nonTaxable.length > 0 && (
              <AmountTable title="No imponibles" lines={preview.nonTaxable} totalLabel="Total no imponible" total={preview.nonTaxableTotal} />
            )}
            <AmountTable title="Descuentos legales" lines={preview.legalDeductions} totalLabel="Total" total={preview.legalDeductionsTotal} />
            {preview.otherDeductions.length > 0 && (
              <AmountTable title="Otros descuentos" lines={preview.otherDeductions} totalLabel="Total" total={preview.otherDeductionsTotal} />
            )}
            <div className="flex items-center justify-between rounded-xl bg-carbon-950 px-4 py-3 text-white">
              <span className="font-display font-bold uppercase tracking-wide">Líquido a pagar</span>
              <span className="font-display text-lg font-extrabold tabular-nums">{formatCLP(preview.netPay)}</span>
            </div>
            <p className="text-xs text-carbon-500">
              Costo empresa (con aportes del empleador):{" "}
              <strong className="text-carbon-800 tabular-nums">{formatCLP(preview.companyCost)}</strong>
            </p>
          </>
        )}
      </aside>

      <StickySubmitBar
        label="Líquido a pagar"
        value={preview ? formatCLP(preview.netPay) : "—"}
        submitLabel={payslipId ? "Recalcular" : "Emitir"}
        pending={pending}
        disabled={!params || !preview}
        detailsHref="#detalle-calculo"
      />
    </form>
  );
}
