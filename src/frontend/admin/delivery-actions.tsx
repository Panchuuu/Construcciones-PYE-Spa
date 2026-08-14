"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mail, Printer, XCircle } from "lucide-react";

import {
  sendDeliveryEmailAction,
  type SendEmailState,
} from "@/backend/actions/admin.actions";

/** Botones de acción del acta: enviar por correo e imprimir/guardar PDF. */
export function DeliveryActions({
  deliveryId,
  hasClientEmail,
}: {
  deliveryId: string;
  hasClientEmail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SendEmailState>(undefined);

  function sendEmail() {
    startTransition(async () => {
      const state = await sendDeliveryEmailAction(deliveryId);
      setResult(state);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={sendEmail}
          disabled={pending || !hasClientEmail}
          title={
            hasClientEmail
              ? undefined
              : "El cliente no tiene correo registrado en su ficha"
          }
          className="inline-flex items-center gap-2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-carbon-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="h-4 w-4" aria-hidden="true" />
          )}
          Enviar por correo
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-carbon-200 bg-white px-4 py-2.5 text-sm font-bold text-carbon-900 transition-colors hover:border-carbon-900"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Imprimir / PDF
        </button>
      </div>

      {result && (
        <p
          role="status"
          className={
            result.ok
              ? "flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
              : "flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          }
        >
          {result.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {result.message}
        </p>
      )}
    </div>
  );
}
