"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createDeliveryAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import type { MaterialItem } from "@/backend/schemas/admin.schema";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { RutInput } from "@/frontend/admin/rut-input";
import { SignaturePad } from "@/frontend/admin/signature-pad";
import {
  CompanySignaturePicker,
  type SavedSigner,
} from "@/frontend/admin/company-signature-picker";
import { cn } from "@/frontend/lib/utils";

type WorkOption = {
  id: string;
  title: string;
  clientName: string;
};

export function DeliveryForm({
  works,
  preselectedWorkId,
  defaultCompanySigner,
  signers,
  defaultSignerId,
}: {
  works: WorkOption[];
  preselectedWorkId?: string;
  defaultCompanySigner: string;
  /** Firmas de la empresa ya guardadas en /admin/firmantes. */
  signers: SavedSigner[];
  defaultSignerId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createDeliveryAction,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  const [type, setType] = useState<"trabajo" | "materiales">("trabajo");
  const [items, setItems] = useState<MaterialItem[]>([
    { descripcion: "", cantidad: "", unidad: "" },
  ]);

  function updateItem(index: number, patch: Partial<MaterialItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { descripcion: "", cantidad: "", unidad: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Solo los materiales con descripción viajan al servidor
  const cleanItems = items.filter((item) => item.descripcion.trim() !== "");

  return (
    <form action={formAction} className="space-y-7">
      {/* Paso 1: qué se entrega */}
      <fieldset className="space-y-5">
        <legend className="font-display text-base font-bold text-carbon-900">
          1. ¿Qué se entrega?
        </legend>

        <AdminField label="Trabajo asociado" name="workId" error={errors.workId} required>
          <select
            id="workId"
            name="workId"
            defaultValue={preselectedWorkId ?? ""}
            className={cn(fieldClass, errors.workId && fieldErrorClass)}
          >
            <option value="" disabled>
              Selecciona el trabajo
            </option>
            {works.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title} — {work.clientName}
              </option>
            ))}
          </select>
        </AdminField>

        <div>
          <span className="mb-2 block text-sm font-semibold text-carbon-800">
            Tipo de entrega
            <span className="ml-1 text-brand-600" aria-hidden="true">
              *
            </span>
          </span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "trabajo", label: "Entrega de trabajo", icon: ClipboardCheck },
                { value: "materiales", label: "Entrega de materiales", icon: Package },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-sm font-bold transition-colors",
                  type === option.value
                    ? "border-brand-500 bg-brand-50 text-carbon-900"
                    : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-400",
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="sr-only"
                />
                <option.icon
                  className={cn(
                    "h-5 w-5",
                    type === option.value ? "text-brand-600" : "text-carbon-400",
                  )}
                  aria-hidden="true"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {type === "materiales" && (
          <div>
            <span className="mb-2 block text-sm font-semibold text-carbon-800">
              Materiales entregados
              <span className="ml-1 text-brand-600" aria-hidden="true">
                *
              </span>
            </span>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) =>
                      updateItem(index, { descripcion: e.target.value })
                    }
                    placeholder="Descripción (ej: Plancha zinc 0.35 × 3 m)"
                    aria-label={`Material ${index + 1}: descripción`}
                    className={cn(fieldClass, "flex-1")}
                  />
                  <input
                    type="text"
                    value={item.cantidad}
                    onChange={(e) =>
                      updateItem(index, { cantidad: e.target.value })
                    }
                    placeholder="Cant."
                    aria-label={`Material ${index + 1}: cantidad`}
                    className={cn(fieldClass, "w-20")}
                  />
                  <input
                    type="text"
                    value={item.unidad ?? ""}
                    onChange={(e) => updateItem(index, { unidad: e.target.value })}
                    placeholder="Unidad"
                    aria-label={`Material ${index + 1}: unidad`}
                    className={cn(fieldClass, "w-24")}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    aria-label={`Quitar material ${index + 1}`}
                    className="shrink-0 rounded-xl border border-carbon-200 px-3 text-carbon-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar material
            </button>

            {errors.items && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.items}
              </p>
            )}
          </div>
        )}

        <AdminField
          label="Observaciones"
          name="notes"
          error={errors.notes}
          hint="Detalles del estado de la entrega, pendientes, acuerdos…"
        >
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={cn(fieldClass, "resize-y", errors.notes && fieldErrorClass)}
          />
        </AdminField>
      </fieldset>

      {/* Paso 2: quiénes firman */}
      <fieldset className="space-y-5 border-t border-carbon-100 pt-6">
        <legend className="font-display float-left mb-4 text-base font-bold text-carbon-900">
          2. ¿Quiénes firman?
        </legend>
        <div className="clear-both" />

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Entrega (representante empresa)"
            name="companySignerName"
            error={errors.companySignerName}
            required
          >
            <input
              id="companySignerName"
              name="companySignerName"
              type="text"
              defaultValue={defaultCompanySigner}
              className={cn(
                fieldClass,
                errors.companySignerName && fieldErrorClass,
              )}
            />
          </AdminField>

          <AdminField
            label="Recibe (cliente o su representante)"
            name="clientSignerName"
            error={errors.clientSignerName}
            required
          >
            <input
              id="clientSignerName"
              name="clientSignerName"
              type="text"
              placeholder="Nombre de quien recibe"
              className={cn(
                fieldClass,
                errors.clientSignerName && fieldErrorClass,
              )}
            />
          </AdminField>
        </div>

        <AdminField
          label="RUT de quien recibe"
          name="clientSignerRut"
          error={errors.clientSignerRut}
          hint="Con puntos y guion; acepta K como dígito verificador"
        >
          <div className="max-w-xs">
            <RutInput
              name="clientSignerRut"
              hasError={Boolean(errors.clientSignerRut)}
            />
          </div>
        </AdminField>

        <div className="grid gap-6 lg:grid-cols-2">
          <CompanySignaturePicker
            signers={signers}
            defaultSignerId={defaultSignerId}
            nameFieldId="companySignerName"
            signatureError={errors.companySignature}
          />
          <SignaturePad
            name="clientSignature"
            label="Firma de quien recibe"
            error={errors.clientSignature}
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-carbon-200 bg-carbon-50 p-4 text-sm text-carbon-800">
          <input
            type="checkbox"
            name="receivedOk"
            defaultChecked
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span>
            <strong>Recibido conforme.</strong> Quien recibe declara que la
            entrega está completa y en buen estado. Si hay observaciones,
            desmarca esta casilla y detállalas arriba.
          </span>
        </label>
      </fieldset>

      {/* Los materiales viajan serializados */}
      <input type="hidden" name="items" value={JSON.stringify(cleanItems)} />

      {state?.error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Guardando acta…
          </>
        ) : (
          <>
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            Guardar acta de entrega
          </>
        )}
      </button>
    </form>
  );
}
