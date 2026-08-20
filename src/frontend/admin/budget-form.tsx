"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  saveBudgetAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { RutInput } from "@/frontend/admin/rut-input";
import { cn } from "@/frontend/lib/utils";

/** Partida tal como se edita (cantidad y precio como texto). */
type ItemDraft = {
  descripcion: string;
  unidad: string;
  cantidad: string;
  precio: string;
};

export type ClientOption = {
  id: string;
  name: string;
  rut: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type BudgetFormData = {
  clientId: string | null;
  clientName: string | null;
  clientRut: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  workAddress: string | null;
  workPlace: string | null;
  workTitle: string;
  date: string; // YYYY-MM-DD
  validityDays: number;
  items: ItemDraft[];
  conditions: string;
};

const emptyItem: ItemDraft = {
  descripcion: "",
  unidad: "",
  cantidad: "1",
  precio: "",
};

/** "13,5" o "13.5" a número; NaN si no se puede. */
function parseQuantity(value: string) {
  return Number(value.trim().replace(/\./g, "").replace(",", "."));
}

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

export function BudgetForm({
  budgetId,
  initial,
  clients,
}: {
  budgetId: string | null;
  initial?: BudgetFormData;
  clients: ClientOption[];
}) {
  const action = saveBudgetAction.bind(null, budgetId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [workAddress, setWorkAddress] = useState(initial?.workAddress ?? "");
  // El RUT vive en RutInput; con key se reinicia al elegir otro cliente.
  const [clientRut, setClientRut] = useState(initial?.clientRut ?? "");

  const [items, setItems] = useState<ItemDraft[]>(
    initial?.items.length ? initial.items : [{ ...emptyItem }],
  );

  function pickClient(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setClientName(client.name);
    setClientRut(client.rut ?? "");
    setClientPhone(client.phone ?? "");
    setClientEmail(client.email ?? "");
    if (client.address) setWorkAddress(client.address);
  }

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  // Solo las partidas con descripción viajan al servidor.
  const cleanItems = items.filter((item) => item.descripcion.trim() !== "");

  const rowTotal = (item: ItemDraft) => {
    const qty = parseQuantity(item.cantidad);
    const price = Number(item.precio);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return Math.round(qty * price);
  };
  const neto = cleanItems.reduce((sum, item) => sum + rowTotal(item), 0);
  const iva = Math.round(neto * 0.19);

  return (
    <form action={formAction} className="space-y-7">
      {/* Paso 1: cliente y obra */}
      <fieldset className="space-y-5">
        <legend className="font-display text-base font-bold text-carbon-900">
          1. Cliente y obra
        </legend>

        <AdminField
          label="Cliente registrado"
          name="clientId"
          hint="Opcional: al elegirlo se rellenan sus datos; puedes editarlos"
        >
          <select
            id="clientId"
            name="clientId"
            value={clientId}
            onChange={(e) => pickClient(e.target.value)}
            className={fieldClass}
          >
            <option value="">Sin vincular — datos escritos a mano</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </AdminField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Señor(es)"
            name="clientName"
            error={errors.clientName}
          >
            <input
              id="clientName"
              name="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente o empresa"
              className={cn(fieldClass, errors.clientName && fieldErrorClass)}
            />
          </AdminField>

          <AdminField label="RUT" name="clientRut" error={errors.clientRut}>
            <RutInput
              key={`${clientId}-${clientRut}`}
              name="clientRut"
              defaultValue={clientRut}
              hasError={Boolean(errors.clientRut)}
            />
          </AdminField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Teléfono"
            name="clientPhone"
            error={errors.clientPhone}
          >
            <input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className={cn(fieldClass, errors.clientPhone && fieldErrorClass)}
            />
          </AdminField>

          <AdminField
            label="Correo"
            name="clientEmail"
            error={errors.clientEmail}
          >
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="cliente@correo.cl"
              className={cn(fieldClass, errors.clientEmail && fieldErrorClass)}
            />
          </AdminField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Dirección obra"
            name="workAddress"
            error={errors.workAddress}
          >
            <input
              id="workAddress"
              name="workAddress"
              type="text"
              value={workAddress}
              onChange={(e) => setWorkAddress(e.target.value)}
              placeholder="Cerro Colorado 5030"
              className={cn(fieldClass, errors.workAddress && fieldErrorClass)}
            />
          </AdminField>

          <AdminField
            label="Ubicación"
            name="workPlace"
            error={errors.workPlace}
            hint="Piso, oficina o sector dentro del recinto"
          >
            <input
              id="workPlace"
              name="workPlace"
              type="text"
              defaultValue={initial?.workPlace ?? ""}
              placeholder="Oficinas 303 y 305"
              className={cn(fieldClass, errors.workPlace && fieldErrorClass)}
            />
          </AdminField>
        </div>

        <AdminField
          label="Título de la obra"
          name="workTitle"
          error={errors.workTitle}
          required
          hint='Se imprime como "OBRA: …" en el documento'
        >
          <input
            id="workTitle"
            name="workTitle"
            type="text"
            defaultValue={initial?.workTitle ?? ""}
            placeholder="Habilitación y modificación de oficinas 303 y 305"
            className={cn(fieldClass, errors.workTitle && fieldErrorClass)}
          />
        </AdminField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Fecha de emisión"
            name="date"
            error={errors.date}
            required
          >
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)}
              className={cn(fieldClass, errors.date && fieldErrorClass)}
            />
          </AdminField>

          <AdminField
            label="Validez de la oferta (días corridos)"
            name="validityDays"
            error={errors.validityDays}
            required
          >
            <input
              id="validityDays"
              name="validityDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              defaultValue={initial?.validityDays ?? 30}
              className={cn(fieldClass, errors.validityDays && fieldErrorClass)}
            />
          </AdminField>
        </div>
      </fieldset>

      {/* Paso 2: partidas */}
      <fieldset className="space-y-4 border-t border-carbon-100 pt-6">
        <legend className="font-display float-left mb-4 text-base font-bold text-carbon-900">
          2. Partidas
        </legend>
        <div className="clear-both" />

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-carbon-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-sm font-extrabold text-carbon-400">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => prev.filter((_, i) => i !== index))
                  }
                  disabled={items.length === 1}
                  aria-label={`Quitar partida ${index + 1}`}
                  className="rounded-xl border border-carbon-200 p-2 text-carbon-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <textarea
                value={item.descripcion}
                onChange={(e) =>
                  updateItem(index, { descripcion: e.target.value })
                }
                rows={2}
                placeholder="Descripción de la partida (qué incluye, materiales, terminaciones…)"
                aria-label={`Partida ${index + 1}: descripción`}
                className={cn(fieldClass, "mt-2 resize-y")}
              />

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={item.unidad}
                  onChange={(e) => updateItem(index, { unidad: e.target.value })}
                  placeholder="Unidad (m², gl, un)"
                  aria-label={`Partida ${index + 1}: unidad`}
                  className={cn(fieldClass, "min-w-0 flex-1 sm:w-32 sm:flex-none")}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={item.cantidad}
                  onChange={(e) =>
                    updateItem(index, { cantidad: e.target.value })
                  }
                  placeholder="Cant."
                  aria-label={`Partida ${index + 1}: cantidad`}
                  className={cn(fieldClass, "min-w-0 flex-1 sm:w-24 sm:flex-none")}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={item.precio}
                  onChange={(e) => updateItem(index, { precio: e.target.value })}
                  placeholder="P. unitario $"
                  aria-label={`Partida ${index + 1}: precio unitario`}
                  className={cn(fieldClass, "min-w-0 flex-1 sm:w-36 sm:flex-none")}
                />
                <span className="ml-auto text-sm font-bold text-carbon-900 tabular-nums">
                  {formatCLP(rowTotal(item))}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar partida
        </button>

        {errors.items && (
          <p className="text-xs font-medium text-red-600">{errors.items}</p>
        )}

        {/* Totales en vivo */}
        <dl className="ml-auto w-full max-w-xs space-y-1.5 rounded-2xl border border-carbon-200 bg-carbon-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="font-semibold text-carbon-600">Valor neto</dt>
            <dd className="font-bold text-carbon-900 tabular-nums">
              {formatCLP(neto)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-semibold text-carbon-600">IVA 19%</dt>
            <dd className="font-bold text-carbon-900 tabular-nums">
              {formatCLP(iva)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-carbon-200 pt-1.5">
            <dt className="font-display font-bold text-carbon-900">
              Total a pagar
            </dt>
            <dd className="font-display font-extrabold text-brand-700 tabular-nums">
              {formatCLP(neto + iva)}
            </dd>
          </div>
        </dl>
      </fieldset>

      {/* Paso 3: condiciones */}
      <fieldset className="space-y-4 border-t border-carbon-100 pt-6">
        <legend className="font-display float-left mb-4 text-base font-bold text-carbon-900">
          3. Condiciones comerciales
        </legend>
        <div className="clear-both" />

        <AdminField
          label="Condiciones"
          name="conditions"
          error={errors.conditions}
          hint="Una condición por línea; se numeran solas en el documento"
        >
          <textarea
            id="conditions"
            name="conditions"
            rows={8}
            defaultValue={initial?.conditions ?? ""}
            className={cn(
              fieldClass,
              "resize-y",
              errors.conditions && fieldErrorClass,
            )}
          />
        </AdminField>
      </fieldset>

      {/* Las partidas viajan serializadas */}
      <input type="hidden" name="items" value={JSON.stringify(cleanItems)} />

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
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60 sm:w-auto"
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : (
          <>
            <FileText className="h-5 w-5" aria-hidden="true" />
            {budgetId ? "Guardar cambios" : "Crear presupuesto"}
          </>
        )}
      </button>
    </form>
  );
}
