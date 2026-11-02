"use client";

import { useFormStatus } from "react-dom";
import { Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/frontend/lib/utils";

/** Botón de envío con estado de carga (para formularios de acción). */
export function SyncButton({ label, variant = "secondary" }: { label: string; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors active:scale-[0.98] disabled:opacity-60",
        variant === "primary"
          ? "bg-carbon-900 text-white hover:bg-carbon-800"
          : "border-2 border-carbon-200 bg-white text-carbon-900 hover:border-carbon-900",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Consultando Previred…" : label}
    </button>
  );
}
