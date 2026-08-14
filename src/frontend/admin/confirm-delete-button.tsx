"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";

/**
 * Botón de borrado con confirmación nativa.
 * Recibe la acción de servidor ya enlazada al id correspondiente.
 */
export function ConfirmDeleteButton({
  action,
  label,
  confirmMessage,
}: {
  action: () => Promise<void>;
  label: string;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(async () => {
            await action();
          });
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
