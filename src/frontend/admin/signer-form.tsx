"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, Save } from "lucide-react";

import {
  saveSignerAction,
  type ActionState,
} from "@/backend/actions/admin.actions";
import { AdminField, fieldClass, fieldErrorClass } from "@/frontend/admin/ui";
import { SignatureCapture } from "@/frontend/admin/signature-capture";
import { cn } from "@/frontend/lib/utils";

type SignerData = {
  name: string;
  role: string | null;
  signature: string;
  isDefault: boolean;
};

export function SignerForm({
  signerId,
  initial,
}: {
  signerId: string | null;
  initial?: SignerData;
}) {
  const action = saveSignerAction.bind(null, signerId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField
          label="Nombre completo"
          name="name"
          error={errors.name}
          required
        >
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initial?.name ?? ""}
            placeholder="Patricio Parra"
            className={cn(fieldClass, errors.name && fieldErrorClass)}
          />
        </AdminField>

        <AdminField
          label="Cargo"
          name="role"
          error={errors.role}
          hint="Aparece bajo el nombre en el acta"
        >
          <input
            id="role"
            name="role"
            type="text"
            defaultValue={initial?.role ?? ""}
            placeholder="Constructor Civil"
            className={cn(fieldClass, errors.role && fieldErrorClass)}
          />
        </AdminField>
      </div>

      <SignatureCapture
        name="signature"
        initial={initial?.signature}
        error={errors.signature}
      />

      <label className="flex items-start gap-3 rounded-xl border border-carbon-200 bg-carbon-50 p-4 text-sm text-carbon-800">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initial?.isDefault ?? false}
          className="mt-0.5 h-4 w-4 accent-brand-600"
        />
        <span>
          <strong>Usar por defecto.</strong> Esta firma vendrá
          preseleccionada al crear una nueva acta de entrega.
        </span>
      </label>

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
        {signerId ? "Guardar cambios" : "Guardar firmante"}
      </button>
    </form>
  );
}
