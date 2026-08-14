"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { QUOTE_STATUSES, type QuoteStatus } from "@/backend/schemas/admin.schema";
import { setQuoteStatusAction } from "@/backend/actions/admin.actions";
import { cn } from "@/frontend/lib/utils";

/** Botonera para mover una cotización entre estados (nueva → contactada → cerrada). */
export function QuoteStatusButtons({
  quoteId,
  status,
}: {
  quoteId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(QUOTE_STATUSES) as QuoteStatus[]).map((value) => {
        const active = value === status;
        return (
          <button
            key={value}
            type="button"
            disabled={pending || active}
            onClick={() =>
              startTransition(async () => {
                await setQuoteStatusAction(quoteId, value);
              })
            }
            className={cn(
              "rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors disabled:cursor-default",
              active
                ? "border-carbon-900 bg-carbon-900 text-white"
                : "border-carbon-200 bg-white text-carbon-700 hover:border-carbon-900 disabled:opacity-60",
            )}
          >
            {QUOTE_STATUSES[value]}
          </button>
        );
      })}
      {pending && (
        <Loader2
          className="h-4 w-4 animate-spin text-carbon-500"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
