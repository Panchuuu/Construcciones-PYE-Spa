"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import {
  saveClientAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

type ClientData = {
  name: string;
  rut: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export function ClientForm({
  clientId,
  initial,
}: {
  clientId: string | null;
  initial?: ClientData;
}) {
  const action = saveClientAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Nombre completo" name="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initial?.name ?? ""}
            placeholder="Juan Pérez Soto"
            className={cn(fieldClass, errors.name && fieldErrorClass)}
          />
        </AdminField>

        <AdminField label="RUT" name="rut" error={errors.rut}>
          <input
            id="rut"
            name="rut"
            type="text"
            defaultValue={initial?.rut ?? ""}
            placeholder="12.345.678-9"
            className={cn(fieldClass, errors.rut && fieldErrorClass)}
          />
        </AdminField>
      </div>

      <AdminField
        label="Empresa"
        name="company"
        error={errors.company}
        hint="Solo si el cliente representa a una empresa"
      >
        <input
          id="company"
          name="company"
          type="text"
          defaultValue={initial?.company ?? ""}
          placeholder="Constructora Ejemplo Ltda."
          className={cn(fieldClass, errors.company && fieldErrorClass)}
        />
      </AdminField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField
          label="Correo"
          name="email"
          error={errors.email}
          hint="Necesario para enviarle las actas por correo"
        >
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
            placeholder="cliente@correo.cl"
            className={cn(fieldClass, errors.email && fieldErrorClass)}
          />
        </AdminField>

        <AdminField
          label="Teléfono"
          name="phone"
          error={errors.phone}
          hint="Con +56 9 para poder enviarle WhatsApp"
        >
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initial?.phone ?? ""}
            placeholder="+56 9 1234 5678"
            className={cn(fieldClass, errors.phone && fieldErrorClass)}
          />
        </AdminField>
      </div>

      <AdminField label="Dirección" name="address" error={errors.address}>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={initial?.address ?? ""}
          placeholder="Calle 123, Comuna"
          className={cn(fieldClass, errors.address && fieldErrorClass)}
        />
      </AdminField>

      <AdminField label="Notas internas" name="notes" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          placeholder="Observaciones que solo ve el equipo"
          className={cn(fieldClass, "resize-y", errors.notes && fieldErrorClass)}
        />
      </AdminField>

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
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-carbon-950 transition-colors hover:bg-brand-400 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        {clientId ? "Guardar cambios" : "Crear cliente"}
      </button>
    </form>
  );
}
