"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { createSettlementAction } from "@/backend/actions/personal.actions";
import { monthlyGratification } from "@/backend/lib/payroll";
import {
  TERMINATION_CAUSES,
  computeSettlement,
  formatServiceTime,
  type SettlementConcept,
} from "@/backend/lib/settlement";
import { parseDecimal } from "@/backend/schemas/personal.schema";
import {
  AmountLinesEditor,
  cleanLines,
  parseMoney,
  type LineDraft,
} from "@/frontend/admin/amount-lines-editor";
import { CalcWarnings, StickySubmitBar } from "@/frontend/admin/personal-ui";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { useAdoptTypedValues } from "@/frontend/admin/use-adopt-typed-values";
import { cn, formatCLP } from "@/frontend/lib/utils";

export type SettlementEmployeeOption = {
  id: string;
  name: string;
  rut: string;
  contractType: string;
  startDate: string; // YYYY-MM-DD
  contractEndDate: string;
  baseSalary: number;
  gratification: boolean;
  mealAllowance: number;
  transportAllowance: number;
};

/** Sugerencias de base: sueldo + gratificación (+ colación y movilización para indemnizar). */
function suggestedBases(e: SettlementEmployeeOption | undefined, minWage: number) {
  if (!e) return { lastPay: "", vacation: "" };
  const grat = e.gratification ? monthlyGratification(e.baseSalary, minWage) : 0;
  return {
    lastPay: String(e.baseSalary + grat + e.mealAllowance + e.transportAllowance),
    vacation: String(e.baseSalary + grat),
  };
}

function suggestedCause(contractType: string | undefined) {
  if (contractType === "obra_faena") return "159-5";
  if (contractType === "plazo_fijo") return "159-4";
  return "159-2";
}

export function SettlementForm({
  employees,
  initialEmployeeId,
  today,
  ufByPeriod,
  fallbackUf,
  minWage,
}: {
  employees: SettlementEmployeeOption[];
  initialEmployeeId: string;
  today: string;
  /** UF de cada mes cargado (tope de 90 UF), igual que en el servidor. */
  ufByPeriod: Record<string, number>;
  /** UF del último mes cargado, si falta el mes de término. */
  fallbackUf: number;
  minWage: number;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSettlementAction, undefined);
  const errors = state?.fieldErrors ?? {};

  const first = employees.find((e) => e.id === initialEmployeeId);
  const firstBases = suggestedBases(first, minWage);

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [endDate, setEndDate] = useState(today);
  const [cause, setCause] = useState(suggestedCause(first?.contractType));
  const [lastPay, setLastPay] = useState(firstBases.lastPay);
  const [vacationBase, setVacationBase] = useState(firstBases.vacation);
  const [noticeGiven, setNoticeGiven] = useState(false);
  const [vacationTaken, setVacationTaken] = useState("0");
  const [pendingSalary, setPendingSalary] = useState("");
  const [otherEarnings, setOtherEarnings] = useState<LineDraft[]>([]);
  const [discounts, setDiscounts] = useState<LineDraft[]>([]);
  const [overrides, setOverrides] = useState<Partial<Record<SettlementConcept, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  useAdoptTypedValues(formRef, {
    endDate: setEndDate,
    cause: setCause,
    lastMonthlyPay: setLastPay,
    vacationMonthlyBase: setVacationBase,
    vacationDaysTaken: setVacationTaken,
    pendingSalary: setPendingSalary,
  });

  const employee = employees.find((e) => e.id === employeeId);
  const uf = ufByPeriod[endDate.slice(0, 7)] ?? fallbackUf;

  function pick(id: string) {
    setEmployeeId(id);
    const e = employees.find((x) => x.id === id);
    const bases = suggestedBases(e, minWage);
    setLastPay(bases.lastPay);
    setVacationBase(bases.vacation);
    setCause(suggestedCause(e?.contractType));
    setOverrides({});
  }

  const cleanOverrides = Object.fromEntries(
    Object.entries(overrides)
      .filter(([, v]) => v !== undefined && v.trim() !== "")
      .map(([k, v]) => [k, parseMoney(v!)]),
  ) as Partial<Record<SettlementConcept, number>>;

  const preview = useMemo(() => {
    if (!employee || !endDate) return null;
    const end = new Date(`${endDate}T12:00:00Z`);
    const start = new Date(`${employee.startDate}T12:00:00Z`);
    if (Number.isNaN(end.getTime()) || end < start) return null;
    return computeSettlement(
      { contractType: employee.contractType, startDate: start },
      {
        endDate: end,
        cause,
        lastMonthlyPay: parseMoney(lastPay),
        vacationMonthlyBase: parseMoney(vacationBase),
        noticeGiven,
        vacationDaysTaken: parseDecimal(vacationTaken) || 0,
        pendingSalary: parseMoney(pendingSalary),
        otherEarnings: cleanLines(otherEarnings),
        discounts: cleanLines(discounts),
        overrides: cleanOverrides,
      },
      uf,
    );
    // cleanOverrides se deriva de overrides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, endDate, cause, lastPay, vacationBase, noticeGiven, vacationTaken, pendingSalary, otherEarnings, discounts, overrides, uf]);

  const money = (name: string, value: string, set: (v: string) => void, placeholder = "$0") => (
    <input
      id={name}
      name={name}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      className={cn(fieldClass, "tabular-nums", errors[name] && fieldErrorClass)}
    />
  );

  return (
    <form ref={formRef} onSubmit={keepValuesOnSubmit(formAction)} className="grid items-start gap-6 max-lg:pb-24 lg:grid-cols-[1fr_400px]">
      <input type="hidden" name="overrides" value={JSON.stringify(cleanOverrides)} />

      <div className="space-y-6 rounded-2xl border border-carbon-200 bg-white p-5 shadow-card sm:p-6">
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
          <AdminField
            label="Fecha de término"
            name="endDate"
            error={errors.endDate}
            required
            hint={employee?.contractEndDate ? `Término pactado: ${employee.contractEndDate.split("-").reverse().join("-")}` : undefined}
          >
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(fieldClass, errors.endDate && fieldErrorClass)}
            />
          </AdminField>
        </div>

        <AdminField label="Causal de término" name="cause" error={errors.cause} required>
          <select
            id="cause"
            name="cause"
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            className={cn(fieldClass, errors.cause && fieldErrorClass)}
          >
            {Object.entries(TERMINATION_CAUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AdminField>

        {cause === "161-1" && (
          <label className="flex items-start gap-3 text-sm text-carbon-800">
            <input
              type="checkbox"
              name="noticeGiven"
              checked={noticeGiven}
              onChange={(e) => setNoticeGiven(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="font-semibold">Se avisó con 30 días de anticipación</span>
              <span className="block text-xs text-carbon-500">Si no, corresponde un mes de indemnización sustitutiva del aviso previo.</span>
            </span>
          </label>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Última remuneración mensual"
            name="lastMonthlyPay"
            error={errors.lastMonthlyPay}
            required
            hint="Base de indemnizaciones: sueldo + gratificación + colación y movilización"
          >
            {money("lastMonthlyPay", lastPay, setLastPay)}
          </AdminField>
          <AdminField
            label="Remuneración para el feriado"
            name="vacationMonthlyBase"
            error={errors.vacationMonthlyBase}
            hint="Sueldo + gratificación (sin colación ni movilización)"
          >
            {money("vacationMonthlyBase", vacationBase, setVacationBase)}
          </AdminField>
          <AdminField
            label="Vacaciones ya tomadas (días hábiles)"
            name="vacationDaysTaken"
            error={errors.vacationDaysTaken}
            hint="En toda la relación laboral"
          >
            <input
              id="vacationDaysTaken"
              name="vacationDaysTaken"
              type="text"
              inputMode="decimal"
              value={vacationTaken}
              onChange={(e) => setVacationTaken(e.target.value)}
              className={cn(fieldClass, errors.vacationDaysTaken && fieldErrorClass)}
            />
          </AdminField>
          <AdminField
            label="Remuneración pendiente del último mes"
            name="pendingSalary"
            error={errors.pendingSalary}
            hint="Si los días trabajados del mes no se pagaron en una liquidación"
          >
            {money("pendingSalary", pendingSalary, setPendingSalary)}
          </AdminField>
        </div>

        <AmountLinesEditor
          name="otherEarnings"
          label="Otros haberes"
          lines={otherEarnings}
          onChange={setOtherEarnings}
          placeholder="Ej: Bono pendiente"
        />
        <AmountLinesEditor
          name="discounts"
          label="Descuentos"
          hint="Préstamos o anticipos pendientes"
          lines={discounts}
          onChange={setDiscounts}
          placeholder="Ej: Saldo préstamo"
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
          disabled={pending || !preview}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60 max-lg:hidden"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Emitir finiquito
        </button>
        <p className="text-xs text-carbon-500">
          Al emitirlo, el trabajador queda desvinculado y el total se registra como gasto.
        </p>
      </div>

      <aside id="detalle-calculo" className="scroll-mt-6 space-y-4 rounded-2xl border border-carbon-200 bg-carbon-50 p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-base font-bold text-carbon-900">Propuesta de finiquito</h2>
        {!preview ? (
          <p className="text-sm text-carbon-500">Elige al trabajador y una fecha de término posterior a su ingreso.</p>
        ) : (
          <>
            <p className="text-sm text-carbon-700">
              Tiempo servido: <strong>{formatServiceTime(preview.service)}</strong>
              <br />
              Feriado: {preview.vacation.accruedDays.toLocaleString("es-CL")} días hábiles devengados,{" "}
              {preview.vacation.pendingWorkingDays.toLocaleString("es-CL")} pendientes.
            </p>
            <CalcWarnings warnings={preview.warnings} />

            <ul className="divide-y divide-carbon-200 text-sm">
              {preview.earnings.map((line, i) => (
                <li key={i} className="py-2.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-carbon-800">{line.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatCLP(line.amount)}</span>
                  </div>
                  {line.concept && (
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Ajustar: ${line.name}`}
                      value={overrides[line.concept] ?? ""}
                      onChange={(e) => setOverrides((o) => ({ ...o, [line.concept!]: e.target.value }))}
                      placeholder="Ajustar monto (opcional)"
                      className={cn(fieldClass, "mt-1.5 py-1.5 text-xs")}
                    />
                  )}
                </li>
              ))}
              {preview.discounts.map((line, i) => (
                <li key={`d${i}`} className="flex justify-between gap-3 py-2.5 text-red-700">
                  <span>− {line.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatCLP(line.amount)}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between rounded-xl bg-carbon-950 px-4 py-3 text-white">
              <span className="font-display font-bold uppercase tracking-wide">Total a pagar</span>
              <span className="font-display text-lg font-extrabold tabular-nums">{formatCLP(preview.total)}</span>
            </div>
            <p className="text-xs text-carbon-500">
              Tope de indemnizaciones con UF {uf.toLocaleString("es-CL")}. Los feriados legales no se
              descuentan al pasar a días corridos: si cae alguno, ajusta el monto.
            </p>
          </>
        )}
      </aside>

      <StickySubmitBar
        label="Total a pagar"
        value={preview ? formatCLP(preview.total) : "—"}
        submitLabel={"Emitir"}
        pending={pending}
        disabled={!preview}
        detailsHref="#detalle-calculo"
      />
    </form>
  );
}
