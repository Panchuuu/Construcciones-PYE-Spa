"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import {
  saveWorkAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import { WORK_STATUSES } from "@/backend/schemas/admin.schema";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { cn } from "@/frontend/lib/utils";

type WorkData = {
  clientId: string;
  title: string;
  description: string | null;
  location: string | null;
  status: string;
};

export function WorkForm({
  workId,
  initial,
  clients,
  preselectedClientId,
}: {
  workId: string | null;
  initial?: WorkData;
  clients: { id: string; name: string }[];
  preselectedClientId?: string;
}) {
  const action = saveWorkAction.bind(null, workId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <AdminField label="Cliente" name="clientId" error={errors.clientId} required>
        <select
          id="clientId"
          name="clientId"
          defaultValue={initial?.clientId ?? preselectedClientId ?? ""}
          className={cn(fieldClass, errors.clientId && fieldErrorClass)}
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </AdminField>

      <AdminField label="Título del trabajo" name="title" error={errors.title} required>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={initial?.title ?? ""}
          placeholder="Ej: Cambio de techumbre casa Las Torpederas"
          className={cn(fieldClass, errors.title && fieldErrorClass)}
        />
      </AdminField>

      <AdminField label="Descripción" name="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ""}
          placeholder="Alcance del trabajo, materiales acordados, plazos…"
          className={cn(fieldClass, "resize-y", errors.description && fieldErrorClass)}
        />
      </AdminField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Ubicación" name="location" error={errors.location}>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={initial?.location ?? ""}
            placeholder="Dirección de la obra"
            className={cn(fieldClass, errors.location && fieldErrorClass)}
          />
        </AdminField>

        <AdminField label="Estado" name="status" error={errors.status} required>
          <select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "en_progreso"}
            className={cn(fieldClass, errors.status && fieldErrorClass)}
          >
            {Object.entries(WORK_STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AdminField>
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
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        {workId ? "Guardar cambios" : "Crear trabajo"}
      </button>
    </form>
  );
}
