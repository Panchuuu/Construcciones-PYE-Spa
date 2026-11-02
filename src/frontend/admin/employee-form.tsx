"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import type { ActionState } from "@/backend/actions/admin.actions";
import { saveEmployeeAction } from "@/backend/actions/personal.actions";
import { AFPS, CONTRACT_TYPES, HEALTH_SYSTEMS } from "@/backend/lib/payroll";
import { ACCOUNT_TYPES } from "@/backend/schemas/personal.schema";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { RutInput } from "@/frontend/admin/rut-input";
import { keepValuesOnSubmit } from "@/frontend/admin/use-keep-values-submit";
import { cn } from "@/frontend/lib/utils";

export type EmployeeFormData = {
  rut: string;
  name: string;
  birthDate: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  position: string;
  contractType: string;
  startDate: string;
  contractEndDate: string;
  baseSalary: number;
  dailyRate: number;
  weeklyHours: number;
  gratification: boolean;
  afp: string;
  healthSystem: string;
  isapreName: string;
  isapreUf: number | null;
  mealAllowance: number;
  transportAllowance: number;
  bankName: string;
  accountType: string;
  accountNumber: string;
  workId: string;
  notes: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-carbon-100 pt-6 first:border-0 first:pt-0">
      <legend className="font-display text-base font-bold text-carbon-900">{title}</legend>
      {children}
    </fieldset>
  );
}

export function EmployeeForm({
  employeeId,
  initial,
  works,
}: {
  employeeId: string | null;
  initial: EmployeeFormData;
  works: { id: string; title: string }[];
}) {
  const action = saveEmployeeAction.bind(null, employeeId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, undefined);
  const errors = state?.fieldErrors ?? {};

  const [contractType, setContractType] = useState(initial.contractType);
  const [health, setHealth] = useState(initial.healthSystem);
  const dayWorker = contractType === "dia_hombre";

  const input = (
    name: keyof EmployeeFormData,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <input
      id={name}
      name={name}
      type="text"
      defaultValue={String(initial[name] ?? "")}
      {...props}
      className={cn(fieldClass, errors[name] && fieldErrorClass, props.className)}
    />
  );

  return (
    <form onSubmit={keepValuesOnSubmit(formAction)} className="space-y-7">
      <Section title="1. Datos personales">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Nombre completo" name="name" error={errors.name} required>
            {input("name", { placeholder: "Ej: Juan Pérez Soto", autoComplete: "off" })}
          </AdminField>
          <AdminField label="RUT" name="rut" error={errors.rut} required>
            <RutInput name="rut" defaultValue={initial.rut} hasError={Boolean(errors.rut)} />
          </AdminField>
          <AdminField label="Fecha de nacimiento" name="birthDate" error={errors.birthDate}>
            {input("birthDate", { type: "date" })}
          </AdminField>
          <AdminField label="Nacionalidad" name="nationality" error={errors.nationality}>
            {input("nationality", { placeholder: "Chilena" })}
          </AdminField>
          <AdminField label="Teléfono" name="phone" error={errors.phone}>
            {input("phone", { type: "tel", placeholder: "+56 9 1234 5678" })}
          </AdminField>
          <AdminField label="Correo" name="email" error={errors.email}>
            {input("email", { type: "email" })}
          </AdminField>
        </div>
        <AdminField label="Dirección" name="address" error={errors.address}>
          {input("address")}
        </AdminField>
      </Section>

      <Section title="2. Contrato">
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="Tipo de contrato" name="contractType" error={errors.contractType} required>
            <select
              id="contractType"
              name="contractType"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className={cn(fieldClass, errors.contractType && fieldErrorClass)}
            >
              {Object.entries(CONTRACT_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Cargo" name="position" error={errors.position} required>
            {input("position", { placeholder: "Ej: Maestro carpintero", list: "cargos" })}
            <datalist id="cargos">
              {["Jornal", "Ayudante", "Maestro albañil", "Maestro carpintero", "Maestro hojalatero", "Soldador", "Capataz", "Jefe de obra", "Bodeguero", "Administrativo"].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </AdminField>
          <AdminField
            label={dayWorker ? "Fecha de inicio" : "Fecha de ingreso"}
            name="startDate"
            error={errors.startDate}
            required
          >
            {input("startDate", { type: "date" })}
          </AdminField>
          {!dayWorker && (
            <AdminField
              label={contractType === "obra_faena" ? "Término estimado de la obra" : "Término del contrato"}
              name="contractEndDate"
              error={errors.contractEndDate}
              required={contractType === "plazo_fijo"}
              hint={contractType === "indefinido" ? "No aplica a contratos indefinidos" : undefined}
            >
              {input("contractEndDate", { type: "date", disabled: contractType === "indefinido" })}
            </AdminField>
          )}
          <AdminField label="Obra asignada" name="workId" error={errors.workId}>
            <select id="workId" name="workId" defaultValue={initial.workId} className={fieldClass}>
              <option value="">Sin obra asignada</option>
              {works.map((work) => (
                <option key={work.id} value={work.id}>
                  {work.title}
                </option>
              ))}
            </select>
          </AdminField>
        </div>
      </Section>

      <Section title="3. Remuneración">
        {dayWorker ? (
          <AdminField
            label="Valor del día"
            name="dailyRate"
            error={errors.dailyRate}
            required
            hint="Lo que se le paga por cada día trabajado. Se puede ajustar en cada pago."
          >
            {input("dailyRate", { inputMode: "numeric", placeholder: "$45.000" })}
          </AdminField>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <AdminField label="Sueldo base mensual" name="baseSalary" error={errors.baseSalary} required>
                {input("baseSalary", { inputMode: "numeric", placeholder: "$600.000" })}
              </AdminField>
              <AdminField
                label="Jornada semanal (horas)"
                name="weeklyHours"
                error={errors.weeklyHours}
                required
                hint="42 horas desde abril de 2026 (Ley 40 horas)"
              >
                {input("weeklyHours", { type: "number", min: 1, max: 45 })}
              </AdminField>
              <AdminField label="Colación mensual" name="mealAllowance" error={errors.mealAllowance} hint="No imponible">
                {input("mealAllowance", { inputMode: "numeric", placeholder: "$0" })}
              </AdminField>
              <AdminField label="Movilización mensual" name="transportAllowance" error={errors.transportAllowance} hint="No imponible">
                {input("transportAllowance", { inputMode: "numeric", placeholder: "$0" })}
              </AdminField>
            </div>
            <label className="flex items-start gap-3 text-sm text-carbon-800">
              <input
                type="checkbox"
                name="gratification"
                defaultChecked={initial.gratification}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="font-semibold">Pagar gratificación legal mensual (art. 50)</span>
                <span className="block text-xs text-carbon-500">
                  25% de lo imponible con tope de 4,75 ingresos mínimos al año.
                </span>
              </span>
            </label>
            {/* Se envía aunque no sea día hombre, para que el esquema lo reciba. */}
            <input type="hidden" name="dailyRate" value={initial.dailyRate} />
          </>
        )}
        {dayWorker && (
          <>
            <input type="hidden" name="baseSalary" value="0" />
            <input type="hidden" name="weeklyHours" value={initial.weeklyHours} />
            <input type="hidden" name="mealAllowance" value="0" />
            <input type="hidden" name="transportAllowance" value="0" />
          </>
        )}
      </Section>

      {!dayWorker ? (
        <Section title="4. Previsión y salud">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="AFP" name="afp" error={errors.afp} required>
              <select
                id="afp"
                name="afp"
                defaultValue={initial.afp}
                className={cn(fieldClass, errors.afp && fieldErrorClass)}
              >
                <option value="">Selecciona la AFP</option>
                {Object.entries(AFPS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Sistema de salud" name="healthSystem" required>
              <select
                id="healthSystem"
                name="healthSystem"
                value={health}
                onChange={(e) => setHealth(e.target.value)}
                className={fieldClass}
              >
                {Object.entries(HEALTH_SYSTEMS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            {health === "isapre" && (
              <>
                <AdminField label="Isapre" name="isapreName" error={errors.isapreName}>
                  {input("isapreName", { placeholder: "Ej: Banmédica" })}
                </AdminField>
                <AdminField label="Plan pactado (UF)" name="isapreUf" error={errors.isapreUf} required>
                  {input("isapreUf", { inputMode: "decimal", placeholder: "Ej: 3,25" })}
                </AdminField>
              </>
            )}
          </div>
        </Section>
      ) : (
        <>
          <input type="hidden" name="healthSystem" value="fonasa" />
          <input type="hidden" name="isapreUf" value="0" />
        </>
      )}

      <Section title={dayWorker ? "4. Datos de pago" : "5. Datos de pago"}>
        <div className="grid gap-5 sm:grid-cols-3">
          <AdminField label="Banco" name="bankName" error={errors.bankName}>
            {input("bankName", { placeholder: "BancoEstado" })}
          </AdminField>
          <AdminField label="Tipo de cuenta" name="accountType">
            <select id="accountType" name="accountType" defaultValue={initial.accountType} className={fieldClass}>
              <option value="">—</option>
              {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="N° de cuenta" name="accountNumber" error={errors.accountNumber}>
            {input("accountNumber", { inputMode: "numeric" })}
          </AdminField>
        </div>
        <AdminField label="Notas" name="notes" error={errors.notes}>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initial.notes}
            placeholder="Talla de ropa de trabajo, contacto de emergencia, certificaciones…"
            className={cn(fieldClass, "resize-y")}
          />
        </AdminField>
      </Section>

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
        {employeeId ? "Guardar cambios" : "Registrar trabajador"}
      </button>
    </form>
  );
}
